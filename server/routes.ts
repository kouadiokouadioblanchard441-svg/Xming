import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { registerSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import ConnectPgSimple from "connect-pg-simple";
import { db, pool } from "./db";
import QRCode from "qrcode";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { verifyWebhookSignature } from "@nowpaymentsio/nowpayments-sdk-nodejs";

/**
 * Résout les paramètres WestPay.
 * Le secret du webhook utilise TOUJOURS la variable d'environnement en priorité
 * (Plesk), avec la valeur DB uniquement comme fallback de développement.
 * Les autres paramètres restent configurables via le panel admin puis les env vars.
 */
function resolveWestpay(settings: Record<string, string>) {
  const db_  = (key: string) => settings[key] || "";
  const env_ = (key: string) => process.env[key] || "";
  const pick = (dbKey: string, envKey: string) => db_(dbKey) || env_(envKey);
  const pickSecret = (dbKey: string, envKey: string) => env_(envKey) || db_(dbKey);

  return {
    slug:        pick("westpayMerchantSlug",  "WESTPAY_MERCHANT_SLUG"),
    secret:      pickSecret("westpayWebhookSecret", "WESTPAY_WEBHOOK_SECRET"),
    apiKey: {
      CI: pick("westpayApiKey_CI", "WESTPAY_API_KEY_CI"),
      BF: pick("westpayApiKey_BF", "WESTPAY_API_KEY_BF"),
      BJ: pick("westpayApiKey_BJ", "WESTPAY_API_KEY_BJ"),
      TG: pick("westpayApiKey_TG", "WESTPAY_API_KEY_TG"),
      CM: pick("westpayApiKey_CM", "WESTPAY_API_KEY_CM"),
      ML: pick("westpayApiKey_ML", "WESTPAY_API_KEY_ML"),
    } as Record<string, string>,
  };
}
import { getSDK, getNowPaymentsCallbackUrl, createPayout, verifyPayout } from "./nowpayments";
import {
  DEFAULT_SPIN_WHEEL_SEGMENTS,
  parseSpinWheelSegments,
  pickWinningSegment,
  SPIN_WHEEL_SETTING_KEY,
  type SpinWheelSegment,
} from "@shared/spin-wheel";

// --- Brute-force protection (in-memory) ---
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientKey(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress || "unknown";
  return ip;
}

function checkBruteForce(req: Request, res: Response): boolean {
  const key = getClientKey(req);
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (record && record.blockedUntil > now) {
    const minutesLeft = Math.ceil((record.blockedUntil - now) / 60000);
    res.status(429).json({ message: `Trop de tentatives. Réessayez dans ${minutesLeft} minute(s).` });
    return true;
  }
  return false;
}

function recordFailedAttempt(req: Request) {
  const key = getClientKey(req);
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, blockedUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    record.count = 0;
  }
  loginAttempts.set(key, record);
}

function clearFailedAttempts(req: Request) {
  loginAttempts.delete(getClientKey(req));
}
// --- end brute-force protection ---

function getNowPaymentsPayoutPayload(body: Record<string, unknown>) {
  const batchId =
    typeof body.batch_withdrawal_id === "string"
      ? body.batch_withdrawal_id
      : typeof body.batchWithdrawalId === "string"
        ? body.batchWithdrawalId
        : null;
  const payoutId =
    typeof body.id === "string"
      ? body.id
      : typeof body.payout_id === "string"
        ? body.payout_id
        : null;
  const status = typeof body.status === "string" ? body.status.toLowerCase() : null;
  const hash =
    typeof body.hash === "string"
      ? body.hash
      : typeof body.payout_hash === "string"
        ? body.payout_hash
        : null;
  const error = typeof body.error === "string" ? body.error : null;

  return { batchId, payoutId, status, hash, error };
}

function isNowPaymentsPayout(body: Record<string, unknown>) {
  return Boolean(
    body.batch_withdrawal_id ||
    body.batchWithdrawalId ||
    body.payout_id ||
    (body.type === "payout" && body.status),
  );
}

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const PgSession = ConnectPgSimple(session);

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  next();
}

async function requireBanker(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin && !user?.isBanker) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Trust proxy for production HTTPS (Replit deployment)
  app.set("trust proxy", 1);

  // Health check — verifies DB connectivity without exposing sensitive data
  app.get("/api/health", async (_req, res) => {
    try {
      const result = await pool.query("SELECT current_database() AS db, version() AS pg_version");
      res.json({ status: "ok", db: result.rows[0].db, pg_version: result.rows[0].pg_version });
    } catch (err: any) {
      res.status(503).json({ status: "error", message: err.message });
    }
  });

  const sessionDbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  app.use(
    session({
      store: new PgSession({
        conString: sessionDbUrl,
        conObject: process.env.SUPABASE_DATABASE_URL
          ? { connectionString: sessionDbUrl, ssl: { rejectUnauthorized: false } }
          : undefined,
        tableName: "session",
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 60,
      }),
      secret: (() => {
        const s = process.env.SESSION_SECRET;
        if (!s) throw new Error("SESSION_SECRET environment variable is required but not set");
        return s;
      })(),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  // ── Mode Maintenance ─────────────────────────────────────────────────────
  // Logique :
  //   - Routes /api/admin et /api/auth → toujours accessibles
  //   - Admin connecté (isAdmin=true en DB) → laissé passer
  //   - Tout le reste (visiteurs + membres normaux) → page blanche si maintenance ON
  let _maintenanceCache: { value: boolean; expiry: number } = { value: false, expiry: 0 };
  // Cache du statut admin par userId (TTL 30 s) pour éviter une requête DB à chaque hit
  const _adminCache = new Map<number, { isAdmin: boolean; expiry: number }>();

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    // 1. Routes admin et auth → toujours libres
    if (req.path.startsWith("/api/admin") || req.path.startsWith("/api/auth")) {
      return next();
    }

    // 2. Vérifier d'abord si la maintenance est active (cache 5 s)
    let maintenanceOn = false;
    try {
      const now = Date.now();
      if (now > _maintenanceCache.expiry) {
        const val = await storage.getSetting("maintenanceMode");
        _maintenanceCache = { value: val === "true", expiry: now + 5000 };
      }
      maintenanceOn = _maintenanceCache.value;
    } catch {
      // Erreur DB → fail-open (ne pas bloquer le site)
    }

    if (!maintenanceOn) return next();

    // 3. Maintenance active — vérifier si c'est un admin connecté
    const userId = req.session?.userId;
    if (userId) {
      try {
        const now = Date.now();
        const cached = _adminCache.get(userId);
        let isAdmin: boolean;
        if (cached && now < cached.expiry) {
          isAdmin = cached.isAdmin;
        } else {
          const user = await storage.getUser(userId);
          isAdmin = !!(user?.isAdmin);
          _adminCache.set(userId, { isAdmin, expiry: now + 30_000 });
        }
        if (isAdmin) return next(); // admin → laissé passer
      } catch {
        // Erreur DB → bloquer par sécurité
      }
    }

    // 4. Pas admin → page blanche
    return res.status(200).send("");
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      const existing = await storage.getUserByPhone(data.phone, data.country);
      if (existing) {
        return res.status(400).json({ message: "Ce numéro est déjà utilisé" });
      }

      let referredBy: string | undefined;
      if (data.invitationCode && data.invitationCode.trim()) {
        const cleanCode = data.invitationCode.trim().toUpperCase();
        const referrer = await storage.getUserByReferralCode(cleanCode);
        if (!referrer) {
          return res.status(400).json({ message: "Code d'invitation invalide" });
        }
        referredBy = cleanCode;
      }

      const user = await storage.createUser({
        fullName: data.fullName,
        phone: data.phone,
        country: data.country,
        password: data.password,
        referredBy,
        transactionPassword: data.transactionPassword || undefined,
        telegram: data.telegram || undefined,
      });

      // Bonus d'inscription → crédité sur le solde de dépôt (balance), pas sur les gains
      const settings = await storage.getSettings();
      if (settings.signupBonusEnabled !== "false") {
        const signupBonus = parseFloat(settings.signupBonusAmount || "500");
        if (signupBonus > 0) {
          const freshUser = await storage.getUser(user.id);
          const currentBalance = parseFloat(freshUser?.balance || "0");
          await storage.updateUser(user.id, {
            balance: (currentBalance + signupBonus).toFixed(2),
          });
          await storage.createTransaction({
            userId: user.id,
            type: "deposit",
            amount: signupBonus.toFixed(2),
            description: "Bonus d'inscription",
          });
        }
      }

      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Impossible de créer le compte pour le moment" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    if (checkBruteForce(req, res)) return;
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByPhone(data.phone, data.country);
      if (!user) {
        recordFailedAttempt(req);
        return res.status(400).json({ message: "Identifiants incorrects" });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        recordFailedAttempt(req);
        return res.status(400).json({ message: "Identifiants incorrects" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Compte suspendu" });
      }

      clearFailedAttempts(req);
      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Connexion momentanément indisponible. Réessayez plus tard." });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Non authentifié" });
      }
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      console.error("Auth/me error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.post("/api/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Veuillez remplir tous les champs" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caracteres" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouve" });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Mot de passe actuel incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword });

      res.json({ success: true, message: "Mot de passe modifie avec succes" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Products
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      const userProductsList = await storage.getUserProducts(req.session.userId!);
      const user = await storage.getUser(req.session.userId!);
      
      const productCounts = new Map<number, number>();
      userProductsList.forEach(up => {
        if (up.isActive) {
          productCounts.set(up.productId, (productCounts.get(up.productId) || 0) + 1);
        }
      });
      
      const productsWithOwnership = products.map(p => ({
        ...p,
        isOwned: productCounts.has(p.id),
        ownedCount: productCounts.get(p.id) || 0,
      }));

      res.json(productsWithOwnership);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Public — series list (used by products page tabs)
  // Collect final payout for a collectAtEnd product (cycle must be complete)
  app.post("/api/user/collect-final/:userProductId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const userProductId = parseInt(req.params.userProductId as string);
      const userProductsList = await storage.getAllUserProducts(userId);
      const entry = userProductsList.find(e => e.userProduct.id === userProductId);

      if (!entry) return res.status(404).json({ message: "Produit introuvable" });
      const { userProduct, product } = entry;

      if (!product.collectAtEnd) {
        return res.status(400).json({ message: "Ce produit ne nécessite pas de collecte manuelle finale" });
      }
      if (userProduct.daysRemaining > 0) {
        return res.status(400).json({ message: `Cycle non terminé — encore ${userProduct.daysRemaining} jour(s) restant(s)` });
      }

      const amount = parseFloat(userProduct.totalEarned || "0");
      if (amount <= 0) return res.status(400).json({ message: "Aucun gain à collecter" });

      // Check if already collected (totalEarned stays but we mark it)
      // We use a convention: after collect, set totalEarned to negative or use a dedicated flag.
      // Simpler: check if userProduct is already inactive with daysRemaining=0 AND was already processed.
      // We'll use a "collected" marker via the existing isActive field: after final collect, we update
      // totalEarned to 0 so a second collect returns 0.
      // Actually safest: mark with a sentinel by setting totalEarned to "0" after payout.
      // The UI will not show collect button when totalEarned is 0.

      const freshUser = await storage.getUser(userId);
      if (!freshUser) return res.status(401).json({ message: "Utilisateur introuvable" });

      const newBalance = parseFloat(freshUser.balance || "0") + amount;
      const newTotalEarnings = parseFloat(freshUser.totalEarnings || "0") + amount;

      await storage.updateUser(userId, {
        balance: newBalance.toFixed(2),
        totalEarnings: newTotalEarnings.toFixed(2),
      });

      // Mark as collected by zeroing totalEarned
      await storage.updateUserProduct(userProductId, { totalEarned: "0" });

      await storage.createTransaction({
        userId,
        type: "earning",
        amount: amount.toFixed(2),
        description: `Collecte finale — ${product.name}`,
      });

      await storage.logAdminAction(userId, "collect_final", null, `Collecte finale ${product.name} : ${amount} FCFA`);

      const updatedUser = await storage.getUser(userId);
      res.json({ success: true, collected: amount, newBalance: updatedUser?.balance || "0" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/products/:id/purchase", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id as string);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }
      
      if (product.isFree) {
        return res.status(400).json({ message: "Ce produit n'est pas disponible à l'achat" });
      }
      if (product.isUnavailable) {
        return res.status(400).json({ message: "Ce produit n'est pas encore disponible" });
      }
      if ((product.stockPercentage ?? 0) >= 100) {
        return res.status(400).json({ message: "Ce produit est épuisé — stock complet" });
      }

      const userId = req.session.userId!;

      // Check invite condition
      const minInvite = Number(product.minInviteCount) || 0;
      if (minInvite > 0) {
        const inviteCount = await storage.getProductInviteCount(userId);
        if (inviteCount < minInvite) {
          return res.status(400).json({
            message: `Vous devez inviter au moins ${minInvite} personne(s) avant d'acheter ce produit (actuellement : ${inviteCount}).`,
          });
        }
      }

      // Check max-owned condition
      const maxOwned = Number(product.maxOwned) || 0;
      if (maxOwned > 0) {
        const userProds = await storage.getUserProducts(userId);
        const owned = userProds.filter(up => up.productId === productId && up.isActive).length;
        if (owned >= maxOwned) {
          return res.status(400).json({
            message: `Vous avez atteint la limite d'achat pour ce produit (max ${maxOwned}).`,
          });
        }
      }

      const userProduct = await storage.purchaseProduct(userId, productId);
      res.json(userProduct);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get user's purchased products
  app.get("/api/user/products", requireAuth, async (req, res) => {
    try {
      const userProductsList = await storage.getAllUserProducts(req.session.userId!);
      
      const formattedProducts = userProductsList.map(up => ({
        id: up.userProduct.id,
        productId: up.userProduct.productId,
        purchasedAt: up.userProduct.purchaseDate,
        lastEarningDate: up.userProduct.lastEarningDate,
        daysRemaining: up.userProduct.daysRemaining,
        totalEarned: up.userProduct.totalEarned,
        status: up.userProduct.isActive ? 'active' : 'completed',
        product: up.product
      }));
      
      res.json(formattedProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Collect earnings for user (manual trigger)
  app.post("/api/user/collect-earnings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Non authentifie" });
      }

      const userProductsList = await storage.getAllUserProducts(userId);
      const now = new Date();
      let totalCollected = 0;
      let productsCollected = 0;

      for (const { userProduct, product } of userProductsList) {
        try {
          // collectAtEnd products are collected via /api/user/collect-final/:id
          if (product.collectAtEnd) continue;
          if (!userProduct.isActive || userProduct.daysRemaining <= 0) continue;

          const purchaseDate = userProduct.purchaseDate ? new Date(userProduct.purchaseDate) : null;
          if (!purchaseDate) continue;

          const lastEarning = userProduct.lastEarningDate ? new Date(userProduct.lastEarningDate) : purchaseDate;

          const msSincePurchase = now.getTime() - purchaseDate.getTime();
          const daysSincePurchase = Math.floor(msSincePurchase / (24 * 60 * 60 * 1000));

          const msSinceLastEarning = now.getTime() - lastEarning.getTime();
          const cyclesSinceLastEarning = Math.floor(msSinceLastEarning / (24 * 60 * 60 * 1000));

          if (cyclesSinceLastEarning >= 1 && daysSincePurchase >= 1) {
            const cyclesToCredit = Math.min(cyclesSinceLastEarning, userProduct.daysRemaining);
            const earningsPerCycle = parseFloat(String(product.dailyEarnings));
            const totalEarningsForProduct = earningsPerCycle * cyclesToCredit;

            // La nouvelle référence = moment exact de la collecte (secondes comprises)
            // Si collecte en retard, c'est cette heure qui devient le prochain point de départ
            const newLastEarningDate = new Date(now);

            totalCollected += totalEarningsForProduct;
            productsCollected++;

            const newDaysRemaining = userProduct.daysRemaining - cyclesToCredit;
            const updateData: any = {
              lastEarningDate: newLastEarningDate,
              daysRemaining: newDaysRemaining,
              totalEarned: (parseFloat(userProduct.totalEarned || "0") + totalEarningsForProduct).toFixed(2),
            };
            
            if (newDaysRemaining <= 0) {
              updateData.isActive = false;
            }

            await storage.updateUserProduct(userProduct.id, updateData);

            for (let i = 0; i < cyclesToCredit; i++) {
              await storage.createTransaction({
                userId,
                type: "earning",
                amount: earningsPerCycle.toString(),
                description: `Gains ${product.name}`,
              });
            }
          }
        } catch (productError) {
          console.error(`Error processing product ${userProduct.id}:`, productError);
        }
      }

      if (totalCollected > 0) {
        const freshUser = await storage.getUser(userId);
        if (freshUser) {
          const newBalance = parseFloat(freshUser.balance || "0") + totalCollected;
          const newTodayEarnings = parseFloat(freshUser.todayEarnings || "0") + totalCollected;
          const newTotalEarnings = parseFloat(freshUser.totalEarnings || "0") + totalCollected;

          await storage.updateUser(userId, {
            balance: newBalance.toFixed(2),
            todayEarnings: newTodayEarnings.toFixed(2),
            totalEarnings: newTotalEarnings.toFixed(2),
          });
        }
      }

      const updatedUser = await storage.getUser(userId);
      res.json({ 
        success: true, 
        collected: totalCollected,
        productsCollected,
        newBalance: updatedUser?.balance || "0"
      });
    } catch (error: any) {
      console.error("Collect earnings error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Payment Channels
  app.get("/api/payment-channels", requireAuth, async (req, res) => {
    try {
      const [channels, settings] = await Promise.all([
        storage.getPaymentChannels(),
        storage.getSettings(),
      ]);

      // Manual channels created by admin
      const manualChannels = channels.map((ch) => ({ ...ch, gateway: null }));

      res.json(manualChannels);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Staking Products (public)
  app.get("/api/staking/products", requireAuth, async (req, res) => {
    try {
      const all = await storage.getActiveStakingProducts();
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/staking/purchase/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const staking = await storage.purchaseStaking(req.session.userId!, id);
      res.json(staking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/staking/my", requireAuth, async (req, res) => {
    try {
      const stakings = await storage.getUserStakings(req.session.userId!);
      res.json(stakings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin Staking
  app.get("/api/admin/staking/products", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getStakingProducts();
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/staking/products", requireAdmin, async (req, res) => {
    try {
      const { name, description, price, returnAmount, lockDays, launchDate, imageUrl, isActive } = req.body;
      if (!name || !price || !returnAmount || !lockDays) {
        return res.status(400).json({ message: "Champs requis : nom, prix, retour, durée" });
      }
      const sp = await storage.createStakingProduct({
        name, description: description || null,
        price: parseInt(price),
        returnAmount: parseInt(returnAmount),
        lockDays: parseInt(lockDays),
        launchDate: launchDate ? new Date(launchDate) : null,
        imageUrl: imageUrl || null,
        isActive: isActive !== false,
        createdBy: req.session.userId,
      });
      res.json(sp);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/staking/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { name, description, price, returnAmount, lockDays, launchDate, imageUrl, isActive } = req.body;
      const sp = await storage.updateStakingProduct(id, {
        name, description,
        price: price !== undefined ? parseInt(price) : undefined,
        returnAmount: returnAmount !== undefined ? parseInt(returnAmount) : undefined,
        lockDays: lockDays !== undefined ? parseInt(lockDays) : undefined,
        launchDate: launchDate ? new Date(launchDate) : (launchDate === null ? null : undefined),
        imageUrl, isActive,
      });
      res.json(sp);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/staking/products/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteStakingProduct(parseInt(req.params.id as string));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/staking/stakings", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getAllUserStakings();
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── Deposit Channels (public) ──────────────────────────────────────
  app.get("/api/deposit-channels", requireAuth, async (req, res) => {
    try {
      const country = req.query.country as string | undefined;
      const channels = country
        ? await storage.getDepositChannelsByCountry(country)
        : await storage.getDepositChannels().then(all => all.filter(c => c.isActive));
      res.json(channels);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deposit-channels/:id/operators", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const operators = await storage.getPaymentNumbersByChannel(id);
      res.json(operators);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── Deposit Channels (admin CRUD) ───────────────────────────────────
  app.get("/api/admin/deposit-channels", requireAdmin, async (req, res) => {
    try {
      res.json(await storage.getDepositChannels());
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposit-channels", requireAdmin, async (req, res) => {
    try {
      const { name, description, country, isActive, sortOrder } = req.body;
      if (!name || !country) return res.status(400).json({ message: "name et country sont requis" });
      const ch = await storage.createDepositChannel({
        name, description: description || null, country,
        isActive: isActive !== false,
        sortOrder: sortOrder ?? 0,
        createdBy: req.session.userId,
      });
      res.json(ch);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/deposit-channels/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { name, description, country, isActive, sortOrder } = req.body;
      const ch = await storage.updateDepositChannel(id, { name, description, country, isActive, sortOrder });
      res.json(ch);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/deposit-channels/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteDepositChannel(parseInt(req.params.id as string));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Payment Numbers (public — filtered by country)
  app.get("/api/payment-numbers", requireAuth, async (req, res) => {
    try {
      const country = req.query.country as string;
      if (country) {
        const nums = await storage.getPaymentNumbersByCountry(country);
        return res.json(nums);
      }
      const nums = await storage.getPaymentNumbers();
      res.json(nums.filter(n => n.isActive));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin Payment Numbers CRUD
  app.get("/api/admin/payment-numbers", requireAdmin, async (req, res) => {
    try {
      const nums = await storage.getPaymentNumbers();
      res.json(nums);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/payment-numbers", requireAdmin, async (req, res) => {
    try {
      const { ownerName, phone, operatorName, country, channelId, logoUrl, isActive } = req.body;
      if (!ownerName || !phone || !operatorName || !country) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
      }
      const num = await storage.createPaymentNumber({
        ownerName, phone, operatorName, country,
        channelId: channelId ? parseInt(channelId) : null,
        logoUrl: logoUrl || null,
        isActive: isActive !== false,
        createdBy: req.session.userId,
      });
      res.json(num);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/payment-numbers/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { ownerName, phone, operatorName, country, channelId, logoUrl, isActive } = req.body;
      const num = await storage.updatePaymentNumber(id, {
        ownerName, phone, operatorName, country,
        channelId: channelId ? parseInt(channelId) : null,
        logoUrl, isActive,
      });
      res.json(num);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/payment-numbers/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePaymentNumber(parseInt(req.params.id as string));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // NOWPayments crypto deposits — uses official SDK for payment creation.
  app.post("/api/crypto-deposits", requireAuth, async (req, res) => {
    try {
      const { amount, payCurrency } = req.body as {
        amount?: number;
        payCurrency?: string;
      };
      const user = await storage.getUser(req.session.userId!);
      const apiKey = process.env.NOWPAYMENTS_API_KEY;

      const allowedCurrencies = new Set([
        "usdtbsc", "usdtmatic", "usdttrc20", "usdterc20",
        "usdc", "usdcbsc", "usdcerc20", "usdcsol",
        "trx", "bnbbsc", "eth", "matic", "pyusd",
      ]);

      if (!user) return res.status(401).json({ message: "Non authentifié" });
      if (!apiKey) {
        return res.status(503).json({ message: "Le service de paiement crypto n'est pas encore configuré" });
      }
      if (!Number.isFinite(amount) || Number(amount) <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
      }
      if (!payCurrency || !allowedCurrencies.has(payCurrency.toLowerCase())) {
        return res.status(400).json({ message: "Réseau de paiement non disponible" });
      }

      const settings = await storage.getSettings();
      const minDeposit = parseInt(settings.minDeposit || "3500", 10);
      if (Number(amount) < minDeposit) {
        return res.status(400).json({ message: `Montant minimum: ${minDeposit.toLocaleString()} USDT` });
      }

      const orderId = `xpeng-${user.id}-${Date.now()}`;
      const ipnCallbackUrl = getNowPaymentsCallbackUrl();

      // Stablecoins whose value is pegged 1:1 to USD.
      // For these, we set price_currency = pay_currency so NOWPayments charges
      // the exact amount requested (e.g. 16 USDT TRC20 → exactly 16, not ~15.9).
      // For non-stable currencies (TRX, BNB, ETH, MATIC…) we keep price_currency
      // as "usd" so NOWPayments auto-converts the USD value to the right quantity.
      const USD_STABLE_CURRENCIES = new Set([
        "usdtbsc", "usdtmatic", "usdttrc20", "usdterc20",
        "usdc", "usdcbsc", "usdcerc20", "usdcsol", "pyusd",
      ]);
      const payCurrencyLower = payCurrency.toLowerCase();
      const priceCurrency = USD_STABLE_CURRENCIES.has(payCurrencyLower)
        ? payCurrencyLower
        : "usd";

      const nowpaymentsBase =
        process.env.NOWPAYMENTS_SANDBOX === "true"
          ? "https://api-sandbox.nowpayments.io/v1"
          : "https://api.nowpayments.io/v1";

      const npRes = await fetch(`${nowpaymentsBase}/payment`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: Number(amount),
          pay_currency: payCurrencyLower,
          price_currency: priceCurrency,
          order_id: orderId,
          ...(ipnCallbackUrl && { ipn_callback_url: ipnCallbackUrl }),
        }),
      });

      const payment = await npRes.json() as Record<string, any>;

      if (!npRes.ok) {
        const msg = payment?.message || payment?.error || `NOWPayments HTTP ${npRes.status}`;
        console.error("NOWPayments deposit error:", payment);
        return res.status(502).json({ message: msg });
      }

      if (!payment.pay_address || !payment.payment_id) {
        console.error("NOWPayments: missing pay_address or payment_id in response", payment);
        return res.status(502).json({ message: "Impossible de générer l'adresse de dépôt" });
      }

      const deposit = await storage.createDeposit({
        userId: user.id,
        amount: Math.round(Number(amount)),
        accountName: user.fullName,
        accountNumber: payment.pay_address,
        country: user.country,
        paymentMethod: "NOWPayments",
        channelName: payCurrency.toUpperCase(),
        reference: String(payment.payment_id),
        status: "pending",
      });

      const qrCode = await QRCode.toDataURL(payment.pay_address, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 320,
      });

      return res.json({
        depositId: deposit.id,
        paymentId: String(payment.payment_id),
        payAddress: payment.pay_address,
        payAmount: payment.pay_amount ?? Number(amount),
        payCurrency: payment.pay_currency || payCurrency.toLowerCase(),
        qrCode,
      });
    } catch (error: any) {
      console.error("NOWPayments deposit error:", error);
      const message = error?.details?.message || error?.message || "Une erreur est survenue lors de la création du dépôt";
      return res.status(500).json({ message });
    }
  });

  // NOWPayments IPN webhook — called automatically by NOWPayments when payment status changes.
  // Uses SDK's verifyWebhookSignature (recursive key sort + timingSafeEqual HMAC-SHA512).
  app.post("/api/nowpayments/ipn", async (req, res) => {
    try {
      const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;

      const sig = req.headers["x-nowpayments-sig"] as string | undefined;

      if (ipnSecret) {
        if (!sig) {
          return res.status(401).json({ message: "Missing signature" });
        }
        const valid = verifyWebhookSignature(req.body, sig, ipnSecret);
        if (!valid) {
          console.warn("NOWPayments IPN: invalid signature");
          return res.status(401).json({ message: "Invalid signature" });
        }
      } else {
        console.warn("NOWPayments IPN: NOWPAYMENTS_IPN_SECRET not set — skipping signature verification");
      }

      if (isNowPaymentsPayout(req.body)) {
        const payout = getNowPaymentsPayoutPayload(req.body);
        const withdrawal =
          (payout.payoutId
            ? await storage.getWithdrawalByNowPaymentsPayoutId(payout.payoutId)
            : undefined) ||
          (payout.batchId
            ? await storage.getWithdrawalByNowPaymentsBatchId(payout.batchId)
            : undefined);

        if (!withdrawal) {
          console.warn(
            `NOWPayments payout IPN: no withdrawal found for payout=${payout.payoutId || "unknown"} batch=${payout.batchId || "unknown"}`,
          );
          return res.status(200).json({ received: true });
        }

        const status = payout.status || "unknown";
        const statusUpdate = {
          nowPaymentsStatus: status.toUpperCase(),
          ...(payout.hash ? { nowPaymentsHash: payout.hash } : {}),
          ...(payout.error ? { nowPaymentsError: payout.error } : {}),
        };

        if (["failed", "rejected"].includes(status)) {
          const refunded = await storage.refundWithdrawal(
            withdrawal.id,
            status === "failed" ? "failed" : "rejected",
            payout.error || `NOWPayments payout ${status}`,
          );
          return res.status(200).json({
            received: true,
            status,
            refunded: Boolean(refunded),
          });
        }

        if (status === "finished") {
          await storage.updateWithdrawal(withdrawal.id, {
            ...statusUpdate,
            status: "approved",
            processedAt: new Date(),
          });
          return res.status(200).json({ received: true, status: "approved" });
        }

        await storage.updateWithdrawal(withdrawal.id, {
          ...statusUpdate,
          status: "processing",
        });
        return res.status(200).json({ received: true, status: "processing" });
      }

      // Signature already verified above with verifyWebhookSignature().
      // parseWebhook({ verify: false }) skips the redundant second check and
      // avoids a crash when NOWPAYMENTS_IPN_SECRET is not set in the SDK instance.
      const sdk = getSDK();
      const webhook = sdk.parseWebhook(req.body, sig ?? "", { verify: false });
      if (webhook.type !== "payment.status_changed") {
        return res.status(200).json({ received: true, type: webhook.type });
      }
      const { payment } = webhook;

      // SDK status 'paid' = API 'finished' (funds received and confirmed)
      // 'processing' = confirming/sending — wait for next IPN
      if (payment.status !== "paid") {
        return res.status(200).json({ received: true, status: payment.status });
      }

      const deposit = await storage.getDepositByReference(String(payment.payment_id));
      if (!deposit) {
        console.warn(`NOWPayments IPN: no deposit found for payment_id=${payment.payment_id}`);
        return res.status(200).json({ received: true }); // 200 to stop NowPayments retries
      }
      if (deposit.status === "approved") {
        return res.status(200).json({ received: true, already: "approved" });
      }

      // Auto-approve: credit user balance
      await storage.updateDeposit(deposit.id, { status: "approved", processedAt: new Date() });

      const user = await storage.getUser(deposit.userId);
      if (user) {
        const newBalance = parseFloat(user.balance) + deposit.amount;
        await storage.updateUser(user.id, { balance: newBalance.toFixed(2), hasDeposited: true });
        await storage.createTransaction({
          userId: user.id,
          type: "deposit",
          amount: deposit.amount.toString(),
          description: `Dépôt crypto confirmé — ${deposit.channelName}`,
        });
      }

      console.log(`NOWPayments IPN: deposit ${deposit.id} auto-approved (payment_id=${payment.payment_id}, actually_paid=${payment.actually_paid})`);
      return res.status(200).json({ received: true, approved: true });
    } catch (error: any) {
      console.error("NOWPayments IPN error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  });

  // Deposits
  app.post("/api/deposits", requireAuth, async (req, res) => {
    try {
      const { amount, accountName, accountNumber, paymentMethod, country, paymentChannelId,
        paymentNumberId, channelName, screenshot, paymentMessage, reference } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        return res.status(401).json({ message: "Non authentifie" });
      }

      const settings = await storage.getSettings();
      const minDeposit = parseInt(settings.minDeposit || "3500");
      if (amount < minDeposit) {
        return res.status(400).json({ message: `Montant minimum: ${minDeposit.toLocaleString()} USDT` });
      }

      if (!accountName || !accountNumber || !paymentMethod || !country) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
      }

      const deposit = await storage.createDeposit({
        userId: req.session.userId!,
        amount,
        accountName,
        accountNumber,
        country,
        paymentMethod,
        paymentChannelId: paymentChannelId && paymentChannelId > 0 ? paymentChannelId : null,
        paymentNumberId: paymentNumberId || null,
        channelName: channelName || null,
        screenshot: screenshot || null,
        paymentMessage: paymentMessage || null,
        reference: reference || null,
        status: "pending",
      });

      res.json({ deposit });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ── WestPay : initiate hosted payment ──────────────────────────────────
  app.post("/api/deposits/westpay/initiate", requireAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || Number(amount) <= 0)
        return res.status(400).json({ message: "Montant invalide" });

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      const settings = await storage.getSettings();
      const minDeposit = parseInt(settings.minDeposit || "3500");
      if (Number(amount) < minDeposit)
        return res.status(400).json({
          message: `Montant minimum : ${minDeposit.toLocaleString()} FCFA`,
        });

      // Résolution DB → env var pour tous les paramètres WestPay
      const wp = resolveWestpay(settings);
      if (!wp.slug)
        return res.status(500).json({
          message: "WestPay non configuré. Ajoutez le slug marchand dans les paramètres admin.",
        });

      // Map internal country code → WestPay country name
      const countryMap: Record<string, string> = {
        CI: "Cote d'Ivoire",
        BF: "Burkina Faso",
        ML: "Mali",
        BJ: "Benin",
        SN: "Senegal",
        TG: "Togo",
        CM: "Cameroun",
        GN: "Guinée",
        NE: "Niger",
        CG: "Congo Brazzaville",
        CD: "Congo RDC",
        GA: "Gabon",
        KE: "Kenya",
        GH: "Ghana",
        NG: "Nigeria",
      };
      const wpCountry = countryMap[user.country || "CI"] ?? "Cote d'Ivoire";

      // Create a processing deposit record to track this payment
      const deposit = await storage.createDeposit({
        userId: user.id,
        amount: Number(amount),
        accountName: user.fullName || user.phone,
        accountNumber: user.phone,
        country: user.country || "CI",
        paymentMethod: "WestPay",
        status: "processing",
        reference: null,
      });

      // Build the WestPay hosted-payment URL
      const forwardedProto = req.headers["x-forwarded-proto"] as string | undefined;
      const forwardedHost  = req.headers["x-forwarded-host"]  as string | undefined;
      const protocol = forwardedProto || (req.secure ? "https" : "http");
      const host     = forwardedHost  || req.headers.host || "";
      const appBase  = process.env.APP_URL || `${protocol}://${host}`;
      const redirectUrl = `${appBase}/deposit?wp_deposit=${deposit.id}&wp_return=1`;

      const payUrl = new URL("https://westpay.cfd/pay");
      payUrl.searchParams.set("merchant", wp.slug);
      payUrl.searchParams.set("amount",   String(Math.round(Number(amount))));
      payUrl.searchParams.set("country",  wpCountry);
      payUrl.searchParams.set("redirect", redirectUrl);
      // Clé API par pays (DB → env var) — ajoutée si disponible
      const apiKey = wp.apiKey[user.country || "CI"];
      if (apiKey) payUrl.searchParams.set("api_key", apiKey);

      res.json({ depositId: deposit.id, payUrl: payUrl.toString() });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Verify deposit status
  app.get("/api/deposits/:id/verify", requireAuth, async (req, res) => {
    try {
      const depositId = parseInt(req.params.id as string);
      const deposit = await storage.getDeposit(depositId);
      if (!deposit) return res.status(404).json({ message: "Depot non trouve" });
      if (deposit.userId !== req.session.userId) return res.status(403).json({ message: "Acces refuse" });
      return res.json({ status: deposit.status });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deposits/history", requireAuth, async (req, res) => {
    try {
      const deposits = await storage.getUserDeposits(req.session.userId!);
      res.json(deposits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Unified history: deposits + withdrawals + all transactions merged & sorted
  app.get("/api/history/all", requireAuth, async (req, res) => {
    try {
      const uid = req.session.userId!;
      const [deposits, withdrawals, txs] = await Promise.all([
        storage.getUserDeposits(uid),
        storage.getUserWithdrawals(uid),
        storage.getUserTransactions(uid),
      ]);

      const items: any[] = [
        ...deposits.map((d: any) => ({
          id: `dep-${d.id}`,
          category: "deposit",
          amount: d.amount,
          status: d.status,
          description: d.paymentMethod || "Dépôt",
          createdAt: d.createdAt,
          extra: { fees: null, netAmount: null, paymentMethod: d.paymentMethod },
        })),
        ...withdrawals.map((w: any) => ({
          id: `wd-${w.id}`,
          category: "withdrawal",
          amount: w.amount,
          status: w.status,
          description: w.paymentMethod || "Retrait",
          createdAt: w.createdAt,
          extra: { fees: w.fees, netAmount: w.netAmount, paymentMethod: w.paymentMethod },
        })),
        ...txs.map((t: any) => ({
          id: `tx-${t.id}`,
          category: t.type,
          amount: t.amount,
          status: "completed",
          description: t.description,
          createdAt: t.createdAt,
          extra: {},
        })),
      ];

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });


  // Withdrawals
  app.post("/api/withdrawals", requireAuth, async (req, res) => {
    try {
      const amount = Number(req.body.amount);
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        return res.status(401).json({ message: "Non authentifié" });
      }
      if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
        return res.status(400).json({ message: "Montant de retrait invalide" });
      }

      // Les deux derniers chiffres doivent être 0 (multiple de 100)
      if (amount % 100 !== 0) {
        return res.status(400).json({ message: "Le montant doit se terminer par 00 (ex : 1000, 5500, 12000)" });
      }

      const settingsForWithdrawal = await storage.getSettings();
      if (settingsForWithdrawal.withdrawalEnabled === "false") {
        return res.status(400).json({ message: "Les retraits sont temporairement désactivés par l'administration" });
      }

      // ── Vérification jour + heure (fuseau Côte d'Ivoire = UTC+0) ──
      {
        const nowCI = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Abidjan" }));
        const currentDay = nowCI.getDay();   // 0=Dim, 1=Lun … 6=Sam
        const currentHour = nowCI.getHours();
        const allowedDays = (settingsForWithdrawal.withdrawalDays || "1,2,3,4,5")
          .split(",").map((d: string) => parseInt(d.trim())).filter((n: number) => !isNaN(n));
        const startHour = parseInt(settingsForWithdrawal.withdrawalStartHour || "10");
        const endHour   = parseInt(settingsForWithdrawal.withdrawalEndHour   || "16");

        const DAY_NAMES: Record<number, string> = {
          0: "Dimanche", 1: "Lundi", 2: "Mardi", 3: "Mercredi",
          4: "Jeudi", 5: "Vendredi", 6: "Samedi",
        };
        if (!allowedDays.includes(currentDay)) {
          const dayLabels = allowedDays.map((d: number) => DAY_NAMES[d] || d).join(", ");
          return res.status(400).json({ message: `Les retraits sont disponibles uniquement : ${dayLabels}` });
        }
        if (currentHour < startHour || currentHour >= endHour) {
          return res.status(400).json({ message: `Les retraits sont disponibles de ${startHour}h à ${endHour}h` });
        }
      }
      const minWithdrawal = parseInt(settingsForWithdrawal.minWithdrawal || "1000");
      if (amount < minWithdrawal) {
        return res.status(400).json({ message: `Montant minimum : ${minWithdrawal.toLocaleString()} FCFA` });
      }
      const maxWithdrawal = parseInt(settingsForWithdrawal.maxWithdrawal || "1000000");
      if (amount > maxWithdrawal) {
        return res.status(400).json({ message: `Montant maximum : ${maxWithdrawal.toLocaleString()} FCFA` });
      }

      if (user.isWithdrawalBlocked) {
        return res.status(400).json({ message: "Retraits bloqués sur ce compte" });
      }

      if (user.mustInviteToWithdraw) {
        const stats = await storage.getTeamStats(user.id);
        if (stats.level1Invested < 1) {
          return res.status(400).json({ message: "Invitez quelqu'un qui investit" });
        }
      }

      const balance = parseFloat(user.totalEarnings || "0");
      if (amount > balance) {
        return res.status(400).json({ message: "Solde insuffisant" });
      }

      // Récupérer le wallet via walletId (Mobile Money)
      const walletId = Number(req.body.walletId);
      let wallet: any = null;
      if (walletId) {
        const wallets = await storage.getWallets(user.id);
        wallet = wallets.find((w: any) => w.id === walletId) || null;
      }
      if (!wallet) {
        wallet = await storage.getDefaultWallet(user.id);
      }
      if (!wallet) {
        return res.status(400).json({ message: "Veuillez lier un compte Mobile Money avant de retirer" });
      }

      const todayCount = await storage.getUserWithdrawalCountToday(user.id);
      const maxPerDay = parseInt(settingsForWithdrawal.maxWithdrawalsPerDay || "1");
      if (todayCount >= maxPerDay) {
        return res.status(400).json({ message: `Maximum ${maxPerDay} retrait${maxPerDay > 1 ? 's' : ''} par jour` });
      }

      const settings = await storage.getSettings();
      const fees = parseFloat(settings.withdrawalFees || "10");
      const feeAmount = Math.round(amount * fees / 100);
      const netAmount = amount - feeAmount;

      // Deduct from totalEarnings (solde des revenus)
      await storage.updateUser(user.id, {
        totalEarnings: (balance - amount).toFixed(2),
      });

      const withdrawalMode = settings.withdrawalMode || "manual";

      if (withdrawalMode === "manual") {
        // ── Mode Manuel ── le retrait reste en pending, l'admin valide manuellement
        const withdrawal = await storage.createWithdrawal({
          userId: user.id,
          amount,
          netAmount,
          fees: feeAmount,
          accountName: wallet.accountName,
          accountNumber: wallet.accountNumber,
          country: user.country,
          paymentMethod: wallet.paymentMethod || "Mobile Money",
          status: "pending",
        });
        return res.json({ ...withdrawal, payoutRequiresVerification: false });
      }

      // ── Mode Auto (NOWPayments) ──
      const withdrawal = await storage.createWithdrawal({
        userId: user.id,
        amount,
        netAmount,
        fees: feeAmount,
        accountName: wallet.accountName,
        accountNumber: wallet.accountNumber,
        country: user.country,
        paymentMethod: "USDT BEP20",
        status: "processing",
        nowPaymentsStatus: "CREATING",
      });

      try {
        const payout = await createPayout({
          address: wallet.accountNumber,
          currency: "usdtbsc",
          amount: netAmount,
          uniqueExternalId: `xpeng-withdrawal-${withdrawal.id}`,
          description: `XPENG withdrawal ${withdrawal.id}`,
        });
        const payoutItem = payout.withdrawals?.[0];
        const batchId = payout.id || payoutItem?.batchWithdrawalId || payoutItem?.batch_withdrawal_id;
        const payoutId = payoutItem?.id;
        if (!batchId || !payoutId) {
          throw new Error("NOWPayments payout response is missing payout identifiers");
        }

        const updatedWithdrawal = await storage.updateWithdrawal(withdrawal.id, {
          status: "pending_2fa",
          nowPaymentsPayoutId: String(payoutId),
          nowPaymentsBatchId: String(batchId),
          nowPaymentsStatus: String(payoutItem.status || "WAITING").toUpperCase(),
        });
        return res.json({
          ...updatedWithdrawal,
          payoutRequiresVerification: true,
        });
      } catch (payoutError: any) {
        await storage.refundWithdrawal(
          withdrawal.id,
          "failed",
          payoutError?.message || "NOWPayments payout creation failed",
        );
        return res.status(502).json({
          message: `Le retrait n'a pas pu être envoyé à NOWPayments : ${payoutError?.message || "erreur inconnue"}`,
        });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/withdrawals/history", requireAuth, async (req, res) => {
    try {
      const withdrawals = await storage.getUserWithdrawals(req.session.userId!);
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/verify-nowpayments", requireAdmin, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id as string, 10);
      const verificationCode = String(req.body.verificationCode || "").trim();
      if (!/^\d{6}$/.test(verificationCode)) {
        return res.status(400).json({ message: "Le code 2FA NOWPayments doit contenir 6 chiffres" });
      }

      const withdrawals = await storage.getWithdrawals();
      const withdrawal = withdrawals.find((item) => item.id === withdrawalId);
      if (!withdrawal) return res.status(404).json({ message: "Retrait non trouvé" });
      if (!withdrawal.nowPaymentsBatchId) {
        return res.status(400).json({ message: "Ce retrait n'a pas de payout NOWPayments à vérifier" });
      }
      if (withdrawal.status !== "pending_2fa") {
        return res.status(400).json({ message: "Ce retrait n'est plus en attente de validation 2FA" });
      }

      await verifyPayout(withdrawal.nowPaymentsBatchId, verificationCode);
      const updated = await storage.updateWithdrawal(withdrawal.id, {
        status: "processing",
        nowPaymentsStatus: "PROCESSING",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });
      await storage.logAdminAction(
        req.session.userId!,
        "verify_nowpayments_withdrawal",
        withdrawal.userId,
        `Payout NOWPayments vérifié pour le retrait ${withdrawal.id}`,
      );
      return res.json(updated);
    } catch (error: any) {
      return res.status(400).json({
        message: error?.message || "La validation du payout NOWPayments a échoué",
      });
    }
  });

  // Wallets
  app.get("/api/wallets", requireAuth, async (req, res) => {
    try {
      const wallets = await storage.getWallets(req.session.userId!);
      res.json(wallets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wallets", requireAuth, async (req, res) => {
    try {
      const { accountName, accountNumber, paymentMethod, country } = req.body;

      if (!accountName || !accountName.trim()) {
        return res.status(400).json({ message: "Le nom du titulaire est requis" });
      }
      const digits = (accountNumber || "").replace(/\D/g, "");
      if (!digits) {
        return res.status(400).json({ message: "Le numéro Mobile Money est requis" });
      }

      // Longueurs valides par pays
      const PHONE_LENGTHS: Record<string, number> = { CI: 10, BF: 8, ML: 8, BJ: 9 };
      const userCountry = country || req.body.country || "CI";
      const expectedLength = PHONE_LENGTHS[userCountry] ?? 8;
      if (digits.length !== expectedLength) {
        return res.status(400).json({
          message: `Numéro invalide — ${expectedLength} chiffres requis pour ce pays`,
        });
      }

      const wallet = await storage.createWallet({
        userId: req.session.userId!,
        accountName: accountName.trim(),
        accountNumber: digits,
        paymentMethod: paymentMethod || "Mobile Money",
        country: userCountry,
      });
      res.json(wallet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/wallets/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteWallet(parseInt(req.params.id as string));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/wallets/:id/default", requireAuth, async (req, res) => {
    try {
      await storage.setDefaultWallet(req.session.userId!, parseInt(req.params.id as string));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Team
  app.get("/api/team/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getTeamStats(req.session.userId!);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/team/details", requireAuth, async (req, res) => {
    try {
      const team = await storage.getDetailedTeam(req.session.userId!);
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Tasks
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasksWithStatus(req.session.userId!);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tasks/:id/claim", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id as string);
      const userId = req.session.userId!;

      // Récupérer la récompense avant le claim pour les commissions
      const tasksStatus = await storage.getTasksWithStatus(userId);
      const taskStatus = tasksStatus.find((t: any) => t.id === taskId);
      const taskReward = taskStatus?.reward ?? 0;

      await storage.claimTask(userId, taskId);

      // Distribuer les commissions de parrainage sur les gains de tâche
      if (taskReward > 0) {
        storage.processTaskReferralCommissions(userId, taskReward).catch((err: any) =>
          console.error("Erreur commission tâche:", err)
        );
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Daily bonus claim
  app.post("/api/claim-daily-bonus", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();

      // Vérifier si le bonus quotidien est activé
      if (settings.dailyBonusEnabled === "false") {
        return res.status(400).json({ message: "Le bonus quotidien est désactivé" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouve" });
      }

      const now = new Date();
      const lastClaim = user.lastDailyBonusClaim ? new Date(user.lastDailyBonusClaim) : null;
      
      if (lastClaim) {
        const hoursSinceClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        if (hoursSinceClaim < 24) {
          const hoursRemaining = Math.ceil(24 - hoursSinceClaim);
          return res.status(400).json({ 
            message: `Vous pouvez reclamer dans ${hoursRemaining}h`,
            canClaim: false,
            nextClaimIn: hoursRemaining
          });
        }
      }

      // Montant configurable depuis l'admin
      const bonusAmount = parseFloat(settings.dailyBonusAmount || "25");
      const newTotalEarnings = parseFloat(user.totalEarnings || "0") + bonusAmount;
      await storage.updateUser(user.id, { 
        totalEarnings: newTotalEarnings.toFixed(2),
        lastDailyBonusClaim: now
      });

      // Create transaction record
      await storage.createTransaction({
        userId: user.id,
        type: "bonus",
        amount: bonusAmount.toFixed(2),
        description: "Bonus quotidien"
      });

      res.json({ success: true, message: "Bonus quotidien ajouté!" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/daily-bonus-status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouve" });
      }

      const now = new Date();
      const lastClaim = user.lastDailyBonusClaim ? new Date(user.lastDailyBonusClaim) : null;
      
      let canClaim = true;
      let hoursRemaining = 0;

      if (lastClaim) {
        const hoursSinceClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        if (hoursSinceClaim < 24) {
          canClaim = false;
          hoursRemaining = Math.ceil(24 - hoursSinceClaim);
        }
      }

      const allTransactions = await storage.getUserTransactions(req.session.userId!);
      const bonusTransactions = allTransactions.filter(
        (t: any) => t.type === "bonus" && t.description === "Bonus quotidien"
      );
      const totalBonusClaimed = bonusTransactions.reduce(
        (sum: number, t: any) => sum + parseFloat(t.amount || "0"), 0
      );
      const daysPointed = bonusTransactions.length;

      res.json({ canClaim, hoursRemaining, totalBonusClaimed, daysPointed });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Transactions
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.session.userId!);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      // Never expose secret keys via this public (unauthenticated) endpoint
      const {
        omnipayCallbackKey, soleaspayEnabled, soleaspayChannelName, soleaspayCountries,
        westpayWebhookSecret, westpayMerchantSlug,
        westpayApiKey_CI, westpayApiKey_BF, westpayApiKey_BJ,
        westpayApiKey_TG, westpayApiKey_CM, westpayApiKey_ML,
        ...publicSettings
      } = settings;
      res.json(publicSettings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Company page content
  app.get("/api/company-content", requireAuth, async (_req, res) => {
    try {
      res.json(await storage.getCompanyContent(true));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/settings/links", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({
        supportLink: settings.supportLink || "https://t.me/intelappgroup",
        support2Link: settings.support2Link || "https://t.me/intelappgroup",
        channelLink: settings.channelLink || "https://t.me/intelappgroup",
        groupLink: settings.groupLink || "https://t.me/intelappgroup",
        supportType: settings.supportType || "telegram",
        support2Type: settings.support2Type || "telegram",
        channelType: settings.channelType || "telegram",
        groupType: settings.groupType || "telegram",
        supportLabel: settings.supportLabel || "客服",
        support2Label: settings.support2Label || "客服 2",
        channelLabel: settings.channelLabel || "官方频道",
        groupLabel: settings.groupLabel || "讨论群",
        supportEnabled: settings.supportEnabled ?? "true",
        support2Enabled: settings.support2Enabled ?? "true",
        channelEnabled: settings.channelEnabled ?? "true",
        groupEnabled: settings.groupEnabled ?? "true",
        withdrawalStartHour: settings.withdrawalStartHour || "9",
        withdrawalEndHour: settings.withdrawalEndHour || "17",
        floatingSupportTarget: settings.floatingSupportTarget || "support1",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/settings/withdrawal", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({
        withdrawalEnabled: settings.withdrawalEnabled !== "false",
        withdrawalFees: parseFloat(settings.withdrawalFees || "10"),
        withdrawalStartHour: parseInt(settings.withdrawalStartHour || "10"),
        withdrawalEndHour: parseInt(settings.withdrawalEndHour || "16"),
        withdrawalDays: settings.withdrawalDays || "1,2,3,4,5",
        maxWithdrawalsPerDay: parseInt(settings.maxWithdrawalsPerDay || "1"),
        minWithdrawal: parseInt(settings.minWithdrawal || "1000"),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // The wheel configuration is public to authenticated users so every prize
  // is visible. The actual winning section is always selected on the server.
  app.get("/api/spin-wheel/config", requireAuth, async (_req, res) => {
    try {
      const value = await storage.getSetting(SPIN_WHEEL_SETTING_KEY);
      res.json(parseSpinWheelSegments(value));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/spin-wheel/spin", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Utilisateur introuvable" });

      if ((user.spinTokens || 0) <= 0) {
        return res.status(400).json({ message: "Aucun tour disponible. Achetez un produit pour obtenir des tours." });
      }

      const value = await storage.getSetting(SPIN_WHEEL_SETTING_KEY);
      const segments = parseSpinWheelSegments(value);

      if (!segments.some((s) => s.canWin)) {
        return res.status(400).json({ message: "Aucun gain n'est actuellement disponible." });
      }

      const winner = pickWinningSegment(segments);
      const newTokens = Math.max(0, (user.spinTokens || 0) - 1);
      const newEarnings = (parseFloat(user.totalEarnings) + winner.amount).toFixed(2);
      await storage.updateUser(req.session.userId!, {
        totalEarnings: newEarnings,
        spinTokens: newTokens,
      });
      await storage.createTransaction({
        userId: req.session.userId!,
        type: "spin_reward",
        amount: winner.amount.toFixed(2),
        description: `Gain roue : ${winner.label}`,
      });

      res.json({ segmentId: winner.id, amount: winner.amount, label: winner.label, spinTokens: newTokens });
    } catch (error: any) {
      console.error("Spin wheel error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/spin-wheel/history", requireAuth, async (req, res) => {
    try {
      const all = await storage.getUserTransactions(req.session.userId!);
      const history = all.filter((tx) => tx.type === "spin_reward");
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Recent global spin activity (all users, masked phones) – for social-proof list on the wheel page
  app.get("/api/spin-wheel/recent", requireAuth, async (_req, res) => {
    try {
      const rows = await pool.query<{ phone: string; amount: string; description: string; created_at: string }>(
        `SELECT u.phone, t.amount, t.description, t.created_at
           FROM transactions t
           JOIN users u ON u.id = t.user_id
          WHERE t.type = 'spin_reward'
          ORDER BY t.created_at DESC
          LIMIT 30`,
      );
      const result = rows.rows.map((r) => {
        const p = r.phone ?? "";
        const masked = p.length >= 6
          ? `+${p.slice(0, 2)}****${p.slice(-6)}`
          : `+${p}`;
        return { phone: masked, amount: r.amount, description: r.description };
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stats = await storage.getStats(startDate, endDate);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/deposits", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string || "pending";
      const deposits = await storage.getDeposits(status === "pending" ? "pending" : undefined);
      const filtered = status === "all" ? deposits : deposits.filter(d => d.status === status);
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposits/:id/approve", requireAdmin, async (req, res) => {
    try {
      const deposit = await storage.updateDeposit(parseInt(req.params.id as string), {
        status: "approved",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });

      const user = await storage.getUser(deposit.userId);
      if (user) {
        const newBalance = parseFloat(user.balance) + deposit.amount;
        await storage.updateUser(user.id, { 
          balance: newBalance.toFixed(2),
          hasDeposited: true,
        });
        
        await storage.createTransaction({
          userId: user.id,
          type: "deposit",
          amount: deposit.amount.toString(),
          description: "Dépôt validé",
        });
      }

      await storage.logAdminAction(req.session.userId!, "approve_deposit", deposit.userId, `Dépôt ${deposit.id} approuvé: ${deposit.amount} USDT`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposits/:id/reject", requireAdmin, async (req, res) => {
    try {
      const { ban } = req.body;
      const deposit = await storage.updateDeposit(parseInt(req.params.id as string), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
        screenshot: null,
      });

      if (ban) {
        await storage.updateUser(deposit.userId, { isBanned: true });
        await storage.logAdminAction(req.session.userId!, "ban_user", deposit.userId, `Utilisateur banni pour fraude`);
      }

      await storage.logAdminAction(req.session.userId!, "reject_deposit", deposit.userId, `Dépôt ${deposit.id} rejeté`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/verify-pin", requireAuth, async (req, res) => {
    try {
      const { pin } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Acces refuse" });
      }
      
      // If password is not required for this admin, auto-verify
      if (user.isAdminPasswordRequired === false) {
        return res.json({ success: true });
      }

      if (!user.adminPin) {
        return res.status(400).json({ message: "Code PIN non configure" });
      }
      
      if (user.adminPin !== pin) {
        return res.status(401).json({ message: "Code PIN incorrect" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/withdrawals", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string || "pending";
      const withdrawals = await storage.getWithdrawals(status === "pending" ? "pending" : undefined);
      const filtered = status === "all" ? withdrawals : withdrawals.filter(w => w.status === status);
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/approve", requireAdmin, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id as string);
      const existingWithdrawal = await storage.getWithdrawals();
      const withdrawalData = existingWithdrawal.find(w => w.id === withdrawalId);
      
      if (!withdrawalData) {
        return res.status(404).json({ message: "Retrait non trouve" });
      }

      const withdrawal = await storage.updateWithdrawal(withdrawalId, {
        status: "approved",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });

      await storage.logAdminAction(req.session.userId!, "approve_withdrawal", withdrawalData.userId, `Retrait ${withdrawal.id} approuvé: ${withdrawalData.netAmount} USDT`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/reject", requireAdmin, async (req, res) => {
    try {
      const withdrawal = await storage.updateWithdrawal(parseInt(req.params.id as string), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });

      // Refund the user — withdrawals are deducted from totalEarnings, so refund there
      const user = await storage.getUser(withdrawal.userId);
      if (user) {
        const newEarnings = parseFloat(user.totalEarnings || "0") + withdrawal.amount;
        await storage.updateUser(user.id, { totalEarnings: newEarnings.toFixed(2) });
      }

      await storage.logAdminAction(req.session.userId!, "reject_withdrawal", withdrawal.userId, `Retrait ${withdrawal.id} rejeté et remboursé`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const search = (req.query.search as string) || "";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const { users: allUsers, total } = await storage.getAllUsers(search, limit, offset);
      const usersWithTeam = await Promise.all(allUsers.map(async (user) => {
        const teamStats = await storage.getTeamStatsSimple(user.id);
        return { ...user, password: undefined, ...teamStats, referrerName: null };
      }));
      res.json({ users: usersWithTeam, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id as string);
      const adminUser = await storage.getUser(req.session.userId!);
      const targetUser = await storage.getUser(userId);

      if (!targetUser) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }
      if (userId === req.session.userId) {
        return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte" });
      }
      if ((targetUser.isAdmin || targetUser.isSuperAdmin) && !adminUser?.isSuperAdmin) {
        return res.status(403).json({ message: "Seul un super admin peut supprimer un administrateur" });
      }
      if (targetUser.isSuperAdmin) {
        return res.status(403).json({ message: "Impossible de supprimer un super administrateur" });
      }

      await storage.deleteUser(userId);
      await storage.logAdminAction(req.session.userId!, "delete_user", userId, `Utilisateur ${targetUser.phone} supprimé définitivement`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/users/:id/team", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id as string);
      const team = await storage.getDetailedTeam(userId);
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/:action", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id as string);
      const action = req.params.action;
      const { value } = req.body;
      const adminUser = await storage.getUser(req.session.userId!);

      switch (action) {
        case "balance":
          await storage.updateUser(userId, { balance: value.toFixed(2) });
          await storage.logAdminAction(req.session.userId!, "update_balance", userId, `Solde modifié: ${value} USDT`);
          break;
        case "password":
          await storage.updateUser(userId, { password: value });
          await storage.logAdminAction(req.session.userId!, "reset_password", userId, `Mot de passe réinitialisé`);
          break;
        case "toggle-ban":
          const user1 = await storage.getUser(userId);
          await storage.updateUser(userId, { isBanned: !user1?.isBanned });
          await storage.logAdminAction(req.session.userId!, "toggle_ban", userId, `Statut banni: ${!user1?.isBanned}`);
          break;
        case "toggle-withdrawal":
          const user2 = await storage.getUser(userId);
          await storage.updateUser(userId, { isWithdrawalBlocked: !user2?.isWithdrawalBlocked });
          await storage.logAdminAction(req.session.userId!, "toggle_withdrawal", userId, `Retrait bloqué: ${!user2?.isWithdrawalBlocked}`);
          break;
        case "toggle-promoter":
          const user3 = await storage.getUser(userId);
          await storage.updateUser(userId, { isPromoter: !user3?.isPromoter, promoterSetBy: req.session.userId });
          await storage.logAdminAction(req.session.userId!, "toggle_promoter", userId, `Promoteur: ${!user3?.isPromoter}`);
          break;
        case "toggle-must-invite":
          const user4 = await storage.getUser(userId);
          await storage.updateUser(userId, { mustInviteToWithdraw: !user4?.mustInviteToWithdraw });
          await storage.logAdminAction(req.session.userId!, "toggle_must_invite", userId, `Doit inviter: ${!user4?.mustInviteToWithdraw}`);
          break;
        case "toggle-admin":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          const user5 = await storage.getUser(userId);
          const newAdminStatus = !user5?.isAdmin;
          await storage.updateUser(userId, { 
            isAdmin: newAdminStatus,
            adminSetBy: req.session.userId,
            adminSetAt: new Date(),
            adminPin: newAdminStatus && value ? value : null,
          });
          await storage.logAdminAction(req.session.userId!, "toggle_admin", userId, `Admin: ${newAdminStatus}`);
          break;
        case "update-admin-pin":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          await storage.updateUser(userId, { adminPin: value });
          await storage.logAdminAction(req.session.userId!, "update_admin_pin", userId, `PIN admin mis à jour`);
          break;
        case "toggle-password-required":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          await storage.updateUser(userId, { isAdminPasswordRequired: value });
          await storage.logAdminAction(req.session.userId!, "toggle_password_required", userId, `Mot de passe admin requis: ${value}`);
          break;
        case "assign-product":
          await storage.purchaseProduct(userId, value, true);
          await storage.logAdminAction(req.session.userId!, "assign_product", userId, `Produit ${value} attribué`);
          break;
        case "revoke-product":
          await storage.removeUserProduct(userId, value);
          await storage.logAdminAction(req.session.userId!, "revoke_product", userId, `Produit ${value} révoqué`);
          break;
        case "toggle-super-admin":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          const userSA = await storage.getUser(userId);
          const newSuperAdminStatus = !userSA?.isSuperAdmin;
          await storage.updateUser(userId, {
            isSuperAdmin: newSuperAdminStatus,
            isAdmin: newSuperAdminStatus ? true : userSA?.isAdmin,
          });
          await storage.logAdminAction(req.session.userId!, "toggle_super_admin", userId, `Super Admin: ${newSuperAdminStatus}`);
          break;
        case "toggle-banker":
          if (!adminUser?.isSuperAdmin && !adminUser?.isAdmin) {
            return res.status(403).json({ message: "Action réservée aux admins" });
          }
          const userBanker = await storage.getUser(userId);
          const newBankerStatus = !userBanker?.isBanker;
          await storage.updateUser(userId, { 
            isBanker: newBankerStatus,
            bankerSetBy: newBankerStatus ? req.session.userId : null,
          });
          await storage.logAdminAction(req.session.userId!, "toggle_banker", userId, `Bankier: ${newBankerStatus}`);
          break;
        case "total-earnings":
          await storage.updateUser(userId, { totalEarnings: Number(value).toFixed(2) });
          await storage.logAdminAction(req.session.userId!, "update_total_earnings", userId, `Solde des gains modifié: ${value} USDT`);
          break;
        default:
          return res.status(400).json({ message: "Action invalide" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/products/all", requireAdmin, async (req, res) => {
    try {
      const allProducts = await storage.getAllProductsAdmin();
      res.json(allProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users/:id/products", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id as string);
      const userProductsList = await storage.getAllUserProducts(userId);
      res.json(userProductsList.map(up => ({
        id: up.userProduct.id,
        productId: up.userProduct.productId,
        productName: up.product.name,
        productPrice: up.product.price,
        dailyEarnings: up.product.dailyEarnings,
        isActive: up.userProduct.isActive,
        purchaseDate: up.userProduct.purchaseDate,
        daysClaimed: up.product.cycleDays - up.userProduct.daysRemaining,
        totalCycle: up.product.cycleDays,
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const { name, price, dailyEarnings, cycleDays, imageUrl, minInviteCount, maxOwned, collectAtEnd, stockPercentage } = req.body;
      if (!name || !price || !dailyEarnings || !cycleDays) {
        return res.status(400).json({ message: "Champs requis manquants" });
      }
      const priceNum = parseFloat(price);
      const dailyNum = parseFloat(dailyEarnings);
      const cycleInt = parseInt(cycleDays);
      const product = await storage.createProduct({
        name,
        price: String(priceNum),
        dailyEarnings: String(dailyNum),
        cycleDays: cycleInt,
        totalReturn: String((dailyNum * cycleInt).toFixed(2)),
        imageUrl: imageUrl || null,
        isFree: false,
        isActive: true,
        sortOrder: 0,
        seriesId: null,
        minInviteCount: parseInt(minInviteCount) || 0,
        maxOwned: parseInt(maxOwned) || 0,
        collectAtEnd: !!collectAtEnd,
        stockPercentage: Math.min(100, Math.max(0, parseInt(stockPercentage) || 0)),
      });
      await storage.logAdminAction(req.session.userId!, "create_product", null, `Produit ${product.name} créé`);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const body = { ...req.body };
      // Normalize numeric fields when present
      if (body.minInviteCount !== undefined) body.minInviteCount = parseInt(body.minInviteCount) || 0;
      if (body.maxOwned !== undefined) body.maxOwned = parseInt(body.maxOwned) || 0;
      if (body.stockPercentage !== undefined) body.stockPercentage = Math.min(100, Math.max(0, parseInt(body.stockPercentage) || 0));
      const product = await storage.updateProduct(parseInt(req.params.id as string), body);
      await storage.logAdminAction(req.session.userId!, "update_product", null, `Produit ${product.id} modifié`);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteProduct(id);
      await storage.logAdminAction(req.session.userId!, "delete_product", null, `Produit ${id} supprimé`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ─── Admin Tasks CRUD ───────────────────────────────────────────────────────
  app.get("/api/admin/tasks", requireAdmin, async (req, res) => {
    try {
      const allTasks = await storage.getAllTasksAdmin();
      res.json(allTasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/tasks", requireAdmin, async (req, res) => {
    try {
      const { name, description, requiredInvites, reward, sortOrder } = req.body;
      if (!name || !description || requiredInvites == null || reward == null) {
        return res.status(400).json({ message: "Champs requis manquants" });
      }
      const task = await storage.createTask({
        name,
        description,
        requiredInvites: parseInt(requiredInvites),
        reward: parseInt(reward),
        sortOrder: parseInt(sortOrder ?? 0),
        isActive: true,
      });
      await storage.logAdminAction(req.session.userId!, "create_task", null, `Tâche "${name}" créée`);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/tasks/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const data = req.body;
      if (data.requiredInvites != null) data.requiredInvites = parseInt(data.requiredInvites);
      if (data.reward != null) data.reward = parseInt(data.reward);
      if (data.sortOrder != null) data.sortOrder = parseInt(data.sortOrder);
      const task = await storage.updateTask(id, data);
      await storage.logAdminAction(req.session.userId!, "update_task", null, `Tâche ${id} modifiée`);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/tasks/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteTask(id);
      await storage.logAdminAction(req.session.userId!, "delete_task", null, `Tâche ${id} supprimée`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/channels", requireAdmin, async (req, res) => {
    try {
      const channels = await storage.getPaymentChannels();
      res.json(channels);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/channels", requireAdmin, async (req, res) => {
    try {
      const channel = await storage.createPaymentChannel({
        ...req.body,
        modifiedBy: req.session.userId,
      });
      await storage.logAdminAction(req.session.userId!, "create_channel", null, `Canal ${channel.name} créé`);
      res.json(channel);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/channels/:id", requireAdmin, async (req, res) => {
    try {
      const channel = await storage.updatePaymentChannel(parseInt(req.params.id as string), {
        ...req.body,
        modifiedBy: req.session.userId,
      });
      await storage.logAdminAction(req.session.userId!, "update_channel", null, `Canal ${channel.name} modifié`);
      res.json(channel);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/channels/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePaymentChannel(parseInt(req.params.id as string));
      await storage.logAdminAction(req.session.userId!, "delete_channel", null, `Canal supprimé`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/spin-wheel/config", requireAdmin, async (_req, res) => {
    try {
      const value = await storage.getSetting(SPIN_WHEEL_SETTING_KEY);
      res.json(parseSpinWheelSegments(value));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/spin-wheel/config", requireAdmin, async (req, res) => {
    try {
      const input = req.body?.segments;
      if (!Array.isArray(input) || input.length !== DEFAULT_SPIN_WHEEL_SEGMENTS.length) {
        return res.status(400).json({ message: "La roue doit contenir exactement 8 sections." });
      }

      const segments: SpinWheelSegment[] = input.map((segment: any, index: number) => {
        const amount = Number(segment.amount);
        if (!Number.isFinite(amount) || amount < 0) {
          throw new Error(`Montant invalide pour la section ${index + 1}`);
        }
        if (typeof segment.label !== "string" || !segment.label.trim()) {
          throw new Error(`Nom obligatoire pour la section ${index + 1}`);
        }
        if (typeof segment.color !== "string" || !/^#[0-9a-f]{6}$/i.test(segment.color)) {
          throw new Error(`Couleur invalide pour la section ${index + 1}`);
        }
        const weight = Number(segment.weight);
        return {
          ...DEFAULT_SPIN_WHEEL_SEGMENTS[index],
          id: index + 1,
          label: segment.label.trim().slice(0, 40),
          amount,
          color: segment.color,
          dark: typeof segment.dark === "string" && /^#[0-9a-f]{6}$/i.test(segment.dark)
            ? segment.dark
            : DEFAULT_SPIN_WHEEL_SEGMENTS[index].dark,
          canWin: Boolean(segment.canWin),
          imageUrl: typeof segment.imageUrl === "string" && segment.imageUrl.trim()
            ? segment.imageUrl.trim()
            : undefined,
          weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
        };
      });

      if (!segments.some((segment) => segment.canWin)) {
        return res.status(400).json({ message: "Au moins une section doit être gagnable." });
      }

      await storage.setSetting(SPIN_WHEEL_SETTING_KEY, JSON.stringify(segments), req.session.userId);
      await storage.logAdminAction(req.session.userId!, "update_spin_wheel", null, "Configuration de la roue modifiée");
      res.json(segments);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const entries = Object.entries(req.body);
      for (const [key, value] of entries) {
        await storage.setSetting(key, value as string, req.session.userId);
      }
      await storage.logAdminAction(req.session.userId!, "update_settings", null, `Paramètres modifiés`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ─── Admin Company Content CRUD ───────────────────────────────────────────
  app.get("/api/admin/company-content", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getCompanyContent(false));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/company-content", requireAdmin, async (req, res) => {
    try {
      const { title, body, imageUrl, sortOrder, isActive } = req.body;
      if (!title || !String(title).trim()) {
        return res.status(400).json({ message: "Le titre est requis" });
      }
      const content = await storage.createCompanyContent({
        title: String(title).trim(),
        body: String(body || ""),
        imageUrl: imageUrl || null,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        isActive: isActive !== false,
      });
      await storage.logAdminAction(req.session.userId!, "create_company_content", null, `Bloc compagnie "${content.title}" créé`);
      res.json(content);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/company-content/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const data = { ...req.body };
      if (data.title !== undefined && !String(data.title).trim()) {
        return res.status(400).json({ message: "Le titre est requis" });
      }
      if (data.title !== undefined) data.title = String(data.title).trim();
      if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
      const content = await storage.updateCompanyContent(id, data);
      await storage.logAdminAction(req.session.userId!, "update_company_content", null, `Bloc compagnie "${content.title}" modifié`);
      res.json(content);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/company-content/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteCompanyContent(id);
      await storage.logAdminAction(req.session.userId!, "delete_company_content", null, `Bloc compagnie ${id} supprimé`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Reset stats route (Super Admin only)
  app.post("/api/admin/reset-stats", requireAdmin, async (req, res) => {
    try {
      const adminUser = await storage.getUser(req.session.userId!);
      if (!adminUser?.isSuperAdmin) {
        return res.status(403).json({ message: "Action réservée au super admin" });
      }

      await storage.resetStats();
      await storage.logAdminAction(req.session.userId!, "reset_stats", null, "Réinitialisation des statistiques de la plateforme");
      res.json({ success: true, message: "Statistiques réinitialisées" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Gift Codes Routes
  app.get("/api/admin/gift-codes", requireAdmin, async (req, res) => {
    try {
      const codes = await storage.getAllGiftCodes();
      res.json(codes);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const createGiftCodeSchema = z.object({
    code: z.string().min(1, "Le code est requis"),
    amount: z.number().positive("Le montant doit etre positif").or(z.string().transform(Number)),
    maxUses: z.number().int().positive("Le nombre d'utilisations doit etre positif"),
    expiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Date d'expiration invalide"),
  });

  app.post("/api/admin/gift-codes", requireAdmin, async (req, res) => {
    try {
      const parseResult = createGiftCodeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Donnees invalides" });
      }

      const { code, amount, maxUses, expiresAt } = parseResult.data;

      const existingCode = await storage.getGiftCodeByCode(code);
      if (existingCode) {
        return res.status(400).json({ message: "Ce code existe deja" });
      }

      const giftCode = await storage.createGiftCode({
        code,
        amount: amount.toString(),
        maxUses,
        expiresAt: new Date(expiresAt),
        createdBy: req.session.userId!,
      });

      await storage.logAdminAction(req.session.userId!, "create_gift_code", null, `Code cadeau cree: ${code} - ${amount} USDT`);
      res.json(giftCode);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/gift-codes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteGiftCode(id);
      await storage.logAdminAction(req.session.userId!, "delete_gift_code", null, `Code cadeau supprimé: #${id}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const claimGiftCodeSchema = z.object({
    code: z.string().min(1, "Le code est requis"),
  });

  app.post("/api/gift-codes/claim", requireAuth, async (req, res) => {
    try {
      const parseResult = claimGiftCodeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Le code est requis" });
      }

      const code = parseResult.data.code.trim().toUpperCase();
      const userId = req.session.userId!;

      const giftCode = await storage.getGiftCodeByCode(code);
      if (!giftCode) {
        return res.status(404).json({ message: "Code invalide" });
      }

      if (!giftCode.isActive) {
        return res.status(400).json({ message: "Ce code n'est plus actif" });
      }

      if (new Date() > new Date(giftCode.expiresAt)) {
        return res.status(400).json({ message: "Ce code a expiré" });
      }

      if (giftCode.currentUses >= giftCode.maxUses) {
        return res.status(400).json({ message: "Ce code a atteint sa limite d'utilisation" });
      }

      const hasClaimed = await storage.hasUserClaimedGiftCode(userId, giftCode.id);
      if (hasClaimed) {
        return res.status(400).json({ message: "Vous avez déjà utilisé ce code" });
      }

      await storage.claimGiftCode(userId, giftCode.id, parseFloat(giftCode.amount));
      
      res.json({ 
        success: true, 
        message: `Félicitations! Vous avez reçu ${parseFloat(giftCode.amount).toLocaleString()} USDT`,
        amount: parseFloat(giftCode.amount)
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Countries routes (public)
  app.get("/api/countries", async (req, res) => {
    try {
      const activeCountries = await storage.getActiveCountries();
      res.json(activeCountries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Retourne les opérateurs Mobile Money disponibles pour un pays donné
  app.get("/api/countries/:code/operators", requireAuth, async (req, res) => {
    try {
      const codeParam = req.params.code;
      const code = (Array.isArray(codeParam) ? codeParam[0] : codeParam).toUpperCase();
      const allCountries = await storage.getActiveCountries();
      const country = allCountries.find((c: any) => c.code === code);
      if (!country) return res.json([]);
      let ops: string[] = [];
      try { ops = JSON.parse(country.operators || "[]"); } catch {}
      res.json(ops);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin country routes
  app.get("/api/admin/countries", requireAdmin, async (req, res) => {
    try {
      const allCountries = await storage.getCountries();
      res.json(allCountries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/countries", requireAdmin, async (req, res) => {
    try {
      const { code, name, currency, phonePrefix, operators, isActive, autoPaymentEnabled } = req.body;
      if (!code || !name || !currency || !phonePrefix) {
        return res.status(400).json({ message: "Code, nom, devise et indicatif sont requis" });
      }
      const country = await storage.createCountry({
        code: code.toUpperCase(),
        name,
        currency,
        phonePrefix,
        operators: operators || "[]",
        isActive: isActive !== undefined ? isActive : true,
        autoPaymentEnabled: autoPaymentEnabled !== undefined ? autoPaymentEnabled : false,
      });
      res.json(country);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/countries/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { name, currency, phonePrefix, operators, isActive, autoPaymentEnabled } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (currency !== undefined) updateData.currency = currency;
      if (phonePrefix !== undefined) updateData.phonePrefix = phonePrefix;
      if (operators !== undefined) updateData.operators = operators;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (autoPaymentEnabled !== undefined) updateData.autoPaymentEnabled = autoPaymentEnabled;
      const country = await storage.updateCountry(id, updateData);
      res.json(country);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/countries/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteCountry(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ==================== FILE UPLOAD ====================
  const uploadsDir = path.join(process.cwd(), "client", "public", "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadsDir),
      filename: (_req, file, cb) => {
        const ext  = path.extname(file.originalname).toLowerCase() || ".jpg";
        const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        cb(null, name);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Seules les images sont acceptées"));
    },
  });

  app.post("/api/admin/upload", requireAdmin, upload.single("file"), (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });
      const url = `/uploads/${req.file.filename}`;
      res.json({ url });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ==================== BANKER ROUTES ====================
  // Accessible to both admins and bankers

  app.get("/api/banker/deposits", requireBanker, async (req, res) => {
    try {
      const deposits = await storage.getDeposits();
      res.json(deposits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/banker/withdrawals", requireBanker, async (req, res) => {
    try {
      const withdrawals = await storage.getWithdrawals();
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/banker/deposits/:id/approve", requireBanker, async (req, res) => {
    try {
      const deposit = await storage.updateDeposit(parseInt(req.params.id as string), {
        status: "approved",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });
      const user = await storage.getUser(deposit.userId);
      if (user) {
        const newBalance = parseFloat(user.balance) + deposit.amount;
        await storage.updateUser(user.id, { balance: newBalance.toFixed(2), hasDeposited: true });
        await storage.createTransaction({ userId: user.id, type: "deposit", amount: deposit.amount.toString(), description: "Dépôt validé par bankier" });
      }
      await storage.logAdminAction(req.session.userId!, "approve_deposit", deposit.userId, `Dépôt ${deposit.id} approuvé par bankier: ${deposit.amount} USDT`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/banker/deposits/:id/reject", requireBanker, async (req, res) => {
    try {
      const deposit = await storage.updateDeposit(parseInt(req.params.id as string), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
        screenshot: null,
      });
      await storage.logAdminAction(req.session.userId!, "reject_deposit", deposit.userId, `Dépôt ${deposit.id} rejeté par bankier`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/banker/withdrawals/:id/approve", requireBanker, async (req, res) => {
    try {
      const allWithdrawals = await storage.getWithdrawals();
      const withdrawalData = allWithdrawals.find(w => w.id === parseInt(req.params.id as string));
      if (!withdrawalData) return res.status(404).json({ message: "Retrait non trouvé" });
      const withdrawal = await storage.updateWithdrawal(parseInt(req.params.id as string), {
        status: "approved",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });
      await storage.logAdminAction(req.session.userId!, "approve_withdrawal", withdrawalData.userId, `Retrait ${withdrawal.id} approuvé par bankier: ${withdrawalData.netAmount} USDT`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/banker/withdrawals/:id/reject", requireBanker, async (req, res) => {
    try {
      const withdrawal = await storage.updateWithdrawal(parseInt(req.params.id as string), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });
      const user = await storage.getUser(withdrawal.userId);
      if (user) {
        const newEarnings = parseFloat(user.totalEarnings || "0") + withdrawal.amount;
        await storage.updateUser(user.id, { totalEarnings: newEarnings.toFixed(2) });
      }
      await storage.logAdminAction(req.session.userId!, "reject_withdrawal", withdrawal.userId, `Retrait ${withdrawal.id} rejeté par bankier et remboursé`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ── WestPay webhook ────────────────────────────────────────────────────
  // Must be declared BEFORE the static-file catch-all.
  // WestPay sends: POST with X-RobotPay-Signature + X-RobotPay-Event headers.
  app.post("/api/webhook/westpay", async (req, res) => {
    try {
      const signature = (req.headers["x-robotpay-signature"] as string) || "";
      const event     = (req.headers["x-robotpay-event"]     as string) || "";

      const settings = await storage.getSettings();
      const wp = resolveWestpay(settings);
      const secret = wp.secret;

      if (!secret) {
        console.error("[WestPay webhook] Secret non configuré — requête ignorée");
        return res.status(200).json({ received: true }); // 200 so WestPay doesn't retry endlessly
      }

      // Verify HMAC-SHA256 over the raw JSON body
      const rawBody: Buffer | undefined = (req as any).rawBody;
      const bodyStr = rawBody ? rawBody.toString("utf8") : JSON.stringify(req.body);
      const expected = crypto.createHmac("sha256", secret).update(bodyStr).digest("hex");

      let sigValid = false;
      try {
        sigValid =
          signature.length === expected.length &&
          crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
      } catch {
        sigValid = false;
      }

      if (!sigValid) {
        console.error("[WestPay webhook] Signature invalide");
        return res.status(401).json({ error: "Signature invalide" });
      }

      if (event === "payment.confirmed") {
        const { txId, amount, payer, country } = req.body;
        const numAmount  = Number(amount);
        const payerPhone = payer ? String(payer).replace(/^\+/, "") : null;

        const deposit = await storage.findProcessingWestpayDeposit(numAmount, payerPhone, country || "");
        if (deposit) {
          await storage.approveWestpayDeposit(deposit.id, txId, payer || null);
          console.log(
            `[WestPay webhook] Dépôt #${deposit.id} approuvé — ${numAmount} FCFA (txId: ${txId})`,
          );
        } else {
          console.warn(
            `[WestPay webhook] Aucun dépôt en attente pour amount=${numAmount} country=${country}`,
          );
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("[WestPay webhook] Erreur:", error.message);
      res.status(500).json({ message: "Internal error" });
    }
  });

  return httpServer;
}
