import { 
  users, products, userProducts, deposits, withdrawals, withdrawalWallets,
  paymentChannels, paymentNumbers, depositChannels, stakingProducts, userStakings, referralCommissions, tasks, userTasks, transactions, platformSettings, companyContent, adminAuditLog,
  giftCodes, giftCodeClaims, countries,
  type User, type Product, type UserProduct, type Deposit, type Withdrawal, type WithdrawalWallet,
  type PaymentChannel, type PaymentNumber, type DepositChannel, type StakingProduct, type UserStaking, type ReferralCommission, type Task, type UserTask, type Transaction, type PlatformSetting, type CompanyContent,
  type GiftCode, type GiftCodeClaim, type Country
} from "@shared/schema";
import { db } from "./db";
import { eq, and, asc, desc, sql, gte, lte, or, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Compares phone numbers regardless of local vs international MSISDN format
// (e.g. "0150839909" vs "+22990150839909") by matching on the last 8 digits.
function normalizePhoneSuffix(phone: string | null | undefined): string {
  return (phone || "").replace(/\D/g, "").slice(-8);
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string, country: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(data: Partial<User>): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(filter?: string, limit?: number, offset?: number): Promise<{ users: User[], total: number }>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(data: Partial<Product>): Promise<Product>;
  updateProduct(id: number, data: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // User Products
  getUserProducts(userId: number): Promise<(UserProduct & { product: Product })[]>;
  getAllUserProducts(userId: number): Promise<{ userProduct: UserProduct; product: Product }[]>;
  purchaseProduct(userId: number, productId: number, assignedByAdmin?: boolean): Promise<UserProduct>;
  removeUserProduct(userId: number, productId: number): Promise<void>;
  updateUserProduct(id: number, data: Partial<UserProduct>): Promise<UserProduct>;
  processEarnings(): Promise<void>;
  
  // Deposits
  createDeposit(data: Partial<Deposit>): Promise<Deposit>;
  getDeposit(id: number): Promise<Deposit | undefined>;
  getDeposits(status?: string): Promise<(Deposit & { user: User })[]>;
  getUserDeposits(userId: number): Promise<Deposit[]>;
  updateDeposit(id: number, data: Partial<Deposit>): Promise<Deposit>;
  getDepositByReference(reference: string): Promise<Deposit | undefined>;
  cleanupDepositScreenshots(): Promise<void>;
  
  // Withdrawals
  createWithdrawal(data: Partial<Withdrawal>): Promise<Withdrawal>;
  getWithdrawals(status?: string): Promise<(Withdrawal & { user: User })[]>;
  getUserWithdrawals(userId: number): Promise<Withdrawal[]>;
  updateWithdrawal(id: number, data: Partial<Withdrawal>): Promise<Withdrawal>;
  getWithdrawalByNowPaymentsPayoutId(payoutId: string): Promise<Withdrawal | undefined>;
  getWithdrawalByNowPaymentsBatchId(batchId: string): Promise<Withdrawal | undefined>;
  refundWithdrawal(id: number, status: "rejected" | "failed", reason: string): Promise<Withdrawal | undefined>;
  getUserWithdrawalCountToday(userId: number): Promise<number>;
  
  // Wallets
  getWallets(userId: number): Promise<WithdrawalWallet[]>;
  createWallet(data: Partial<WithdrawalWallet>): Promise<WithdrawalWallet>;
  deleteWallet(id: number): Promise<void>;
  setDefaultWallet(userId: number, walletId: number): Promise<void>;
  getDefaultWallet(userId: number): Promise<WithdrawalWallet | undefined>;
  
  // Payment Channels
  getPaymentChannels(): Promise<PaymentChannel[]>;
  getActivePaymentChannels(): Promise<PaymentChannel[]>;
  getPaymentChannel(id: number): Promise<PaymentChannel | undefined>;
  createPaymentChannel(data: Partial<PaymentChannel>): Promise<PaymentChannel>;
  updatePaymentChannel(id: number, data: Partial<PaymentChannel>): Promise<PaymentChannel>;
  deletePaymentChannel(id: number): Promise<void>;
  
  // Referrals
  getReferrals(userId: number, level: number): Promise<User[]>;
  createReferralCommission(data: Partial<ReferralCommission>): Promise<ReferralCommission>;
  getUserCommissions(userId: number): Promise<number>;
  getTeamStats(userId: number): Promise<{ level1Count: number; level2Count: number; level3Count: number; totalCommission: number; level1Commission: number; level2Commission: number; level3Commission: number; level1Invested: number; level2Invested: number; level3Invested: number; level1Recharged: number; teamTotalDeposits: number; teamTotalWithdrawals: number }>;
  getTeamStatsSimple(userId: number): Promise<{ level1Count: number; level2Count: number; level3Count: number; totalCommission: number }>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getAllTasksAdmin(): Promise<Task[]>;
  getTasksWithStatus(userId: number): Promise<(Task & { isCompleted: boolean; canClaim: boolean; currentInvites: number })[]>;
  claimTask(userId: number, taskId: number): Promise<void>;
  createTask(data: Partial<Task>): Promise<Task>;
  updateTask(id: number, data: Partial<Task>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  
  // Transactions
  createTransaction(data: Partial<Transaction>): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // Settings
  getSetting(key: string): Promise<string | null>;
  getSettings(): Promise<Record<string, string>>;
  setSetting(key: string, value: string, modifiedBy?: number): Promise<void>;

  // Company page content
  getCompanyContent(activeOnly?: boolean): Promise<CompanyContent[]>;
  createCompanyContent(data: Partial<CompanyContent>): Promise<CompanyContent>;
  updateCompanyContent(id: number, data: Partial<CompanyContent>): Promise<CompanyContent>;
  deleteCompanyContent(id: number): Promise<void>;
  
  // Admin
  getStats(): Promise<any>;
  logAdminAction(adminId: number, action: string, targetUserId: number | null, details: string): Promise<void>;
  resetStats(): Promise<void>;
  
  // Gift Codes
  getAllGiftCodes(): Promise<GiftCode[]>;
  getGiftCodeByCode(code: string): Promise<GiftCode | undefined>;
  createGiftCode(data: { code: string; amount: string; maxUses: number; expiresAt: Date; createdBy: number }): Promise<GiftCode>;
  deleteGiftCode(id: number): Promise<void>;
  hasUserClaimedGiftCode(userId: number, giftCodeId: number): Promise<boolean>;
  claimGiftCode(userId: number, giftCodeId: number, amount: number): Promise<void>;

  // Countries
  getCountries(): Promise<Country[]>;
  getActiveCountries(): Promise<Country[]>;
  getCountry(id: number): Promise<Country | undefined>;
  createCountry(data: Partial<Country>): Promise<Country>;
  updateCountry(id: number, data: Partial<Country>): Promise<Country>;
  deleteCountry(id: number): Promise<void>;

  // Deposit Channels
  getDepositChannels(): Promise<DepositChannel[]>;
  getDepositChannelsByCountry(country: string): Promise<DepositChannel[]>;
  getDepositChannel(id: number): Promise<DepositChannel | undefined>;
  createDepositChannel(data: Partial<DepositChannel>): Promise<DepositChannel>;
  updateDepositChannel(id: number, data: Partial<DepositChannel>): Promise<DepositChannel>;
  deleteDepositChannel(id: number): Promise<void>;

  // Payment Numbers
  getPaymentNumbers(): Promise<PaymentNumber[]>;
  getPaymentNumbersByCountry(country: string): Promise<PaymentNumber[]>;
  getPaymentNumbersByChannel(channelId: number): Promise<PaymentNumber[]>;
  createPaymentNumber(data: Partial<PaymentNumber>): Promise<PaymentNumber>;
  updatePaymentNumber(id: number, data: Partial<PaymentNumber>): Promise<PaymentNumber>;
  deletePaymentNumber(id: number): Promise<void>;

  // Staking
  getStakingProducts(): Promise<StakingProduct[]>;
  getActiveStakingProducts(): Promise<StakingProduct[]>;
  getStakingProduct(id: number): Promise<StakingProduct | undefined>;
  createStakingProduct(data: Partial<StakingProduct>): Promise<StakingProduct>;
  updateStakingProduct(id: number, data: Partial<StakingProduct>): Promise<StakingProduct>;
  deleteStakingProduct(id: number): Promise<void>;
  purchaseStaking(userId: number, stakingProductId: number): Promise<UserStaking>;
  getUserStakings(userId: number): Promise<(UserStaking & { product: StakingProduct })[]>;
  getAllUserStakings(): Promise<(UserStaking & { product: StakingProduct; user: User })[]>;
  releaseMaturedStakings(): Promise<void>;

  getAllProductsAdmin(): Promise<Product[]>;
  getProductInviteCount(userId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phone: string, country: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.phone, phone), eq(users.country, country)));
    return user || undefined;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      sql`UPPER(${users.referralCode}) = UPPER(${code})`
    );
    return user || undefined;
  }

  async createUser(data: Partial<User>): Promise<User> {
    const referralCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(data.password!, 10);

    const [user] = await db.insert(users).values({
      ...data,
      password: hashedPassword,
      referralCode,
      balance: "0",
      totalEarnings: "0",
    } as any).returning();
    
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Gift codes created by this user (createdBy is NOT NULL FK) must be
      // removed along with their claims before the user row can go.
      const createdCodes = await tx.select({ id: giftCodes.id }).from(giftCodes).where(eq(giftCodes.createdBy, id));
      for (const code of createdCodes) {
        await tx.delete(giftCodeClaims).where(eq(giftCodeClaims.giftCodeId, code.id));
      }
      await tx.delete(giftCodes).where(eq(giftCodes.createdBy, id));

      await tx.delete(giftCodeClaims).where(eq(giftCodeClaims.userId, id));
      await tx.delete(userTasks).where(eq(userTasks.userId, id));
      await tx.delete(referralCommissions).where(or(eq(referralCommissions.userId, id), eq(referralCommissions.fromUserId, id)));
      await tx.delete(userStakings).where(eq(userStakings.userId, id));
      await tx.delete(withdrawals).where(eq(withdrawals.userId, id));
      await tx.delete(deposits).where(eq(deposits.userId, id));
      await tx.delete(userProducts).where(eq(userProducts.userId, id));
      await tx.delete(withdrawalWallets).where(eq(withdrawalWallets.userId, id));
      await tx.delete(transactions).where(eq(transactions.userId, id));
      // Admin action history performed BY this user (adminId is a NOT NULL FK).
      // Actions performed ON this user (targetUserId, not a FK) are left intact.
      await tx.delete(adminAuditLog).where(eq(adminAuditLog.adminId, id));

      await tx.delete(users).where(eq(users.id, id));
    });
  }

  async getAllUsers(filter?: string, limit: number = 50, offset: number = 0): Promise<{ users: User[], total: number }> {
    let conditions: any[] = [];
    
    if (filter && filter.trim()) {
      const searchTerm = `%${filter.trim().toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${users.phone}) LIKE ${searchTerm}`,
          sql`LOWER(${users.fullName}) LIKE ${searchTerm}`,
          sql`LOWER(${users.referralCode}) LIKE ${searchTerm}`
        )
      );
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);
    
    const userList = await db.select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
    
    return { users: userList, total: Number(countResult.count) };
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(products.sortOrder);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const [product] = await db.insert(products).values(data as any).returning();
    return product;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // User Products
  async getUserProducts(userId: number): Promise<(UserProduct & { product: Product })[]> {
    const result = await db.select({
      userProduct: userProducts,
      product: products,
    }).from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .where(and(eq(userProducts.userId, userId), eq(userProducts.isActive, true)));
    
    return result.map(r => ({ ...r.userProduct, product: r.product }));
  }

  async getAllUserProducts(userId: number): Promise<{ userProduct: UserProduct; product: Product }[]> {
    const result = await db.select({
      userProduct: userProducts,
      product: products,
    }).from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .where(eq(userProducts.userId, userId));
    
    return result.sort((a, b) => {
      const dateA = a.userProduct.purchaseDate ? new Date(a.userProduct.purchaseDate).getTime() : 0;
      const dateB = b.userProduct.purchaseDate ? new Date(b.userProduct.purchaseDate).getTime() : 0;
      return dateB - dateA;
    });
  }

  async purchaseProduct(userId: number, productId: number, assignedByAdmin = false): Promise<UserProduct> {
    const product = await this.getProduct(productId);
    if (!product) throw new Error("Produit non trouvé");

    const user = await this.getUser(userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    if (!product.isFree && !assignedByAdmin) {
      const balance = parseFloat(user.balance);
      const productPrice = parseFloat(product.price as string);
      if (balance < productPrice) throw new Error("Solde insuffisant");
      
      // Check if this is user's first paid investment
      const existingPaidProducts = await db.select()
        .from(userProducts)
        .innerJoin(products, eq(userProducts.productId, products.id))
        .where(and(
          eq(userProducts.userId, userId),
          eq(products.isFree, false),
          eq(userProducts.assignedByAdmin, false)
        ));
      
      const isFirstInvestment = existingPaidProducts.length === 0;
      
      await this.updateUser(userId, { 
        balance: (balance - productPrice).toFixed(2),
        hasActiveProduct: true,
      });

      await this.createTransaction({
        userId,
        type: "purchase",
        amount: (-productPrice).toString(),
        description: `Achat ${product.name}`,
      });

      // Process referral commissions ONLY on first investment
      if (isFirstInvestment) {
        await this.processReferralCommissions(userId, productPrice, productId);
      }

      // Grant spin token to buyer for every paid purchase
      await this.updateUser(userId, {
        spinTokens: (user.spinTokens || 0) + 1,
      });

      // Grant spin token to level-1 sponsor on every referral investment
      if (user.referredBy) {
        const sponsor = await this.getUserByReferralCode(user.referredBy);
        if (sponsor) {
          await this.updateUser(sponsor.id, {
            spinTokens: (sponsor.spinTokens || 0) + 1,
          });
        }
      }
    } else {
      await this.updateUser(userId, { hasActiveProduct: true });
    }

    // Set lastEarningDate to now - first earnings will be credited 24h after purchase
    const [userProduct] = await db.insert(userProducts).values({
      userId,
      productId,
      daysRemaining: product.cycleDays,
      assignedByAdmin,
      lastEarningDate: new Date(),
    }).returning();

    return userProduct;
  }

  async updateUserProduct(id: number, data: Partial<UserProduct>): Promise<UserProduct> {
    const [updated] = await db.update(userProducts)
      .set(data as any)
      .where(eq(userProducts.id, id))
      .returning();
    return updated;
  }

  async removeUserProduct(userId: number, productId: number): Promise<void> {
    await db.update(userProducts)
      .set({ isActive: false })
      .where(and(eq(userProducts.userId, userId), eq(userProducts.productId, productId)));
  }

  async processReferralCommissions(userId: number, amount: number, productId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user || !user.referredBy) return;

    const settings = await this.getSettings();
    const level1Rate = parseFloat(settings.level1Commission || "25") / 100;
    const level2Rate = parseFloat(settings.level2Commission || "1") / 100;
    const level3Rate = parseFloat(settings.level3Commission || "1") / 100;

    // Level 1
    const level1User = await this.getUserByReferralCode(user.referredBy);
    if (level1User) {
      const commission = amount * level1Rate;
      await this.updateUser(level1User.id, {
        totalEarnings: (parseFloat(level1User.totalEarnings) + commission).toFixed(2),
      });
      await this.createReferralCommission({
        userId: level1User.id,
        fromUserId: userId,
        level: 1,
        amount: commission.toFixed(2),
        productId,
      });
      await this.createTransaction({
        userId: level1User.id,
        type: "commission",
        amount: commission.toFixed(2),
        description: `Commission niveau 1 de ${user.fullName}`,
      });

      // Level 2
      if (level1User.referredBy) {
        const level2User = await this.getUserByReferralCode(level1User.referredBy);
        if (level2User) {
          const commission2 = amount * level2Rate;
          await this.updateUser(level2User.id, {
            totalEarnings: (parseFloat(level2User.totalEarnings) + commission2).toFixed(2),
          });
          await this.createReferralCommission({
            userId: level2User.id,
            fromUserId: userId,
            level: 2,
            amount: commission2.toFixed(2),
            productId,
          });
          await this.createTransaction({
            userId: level2User.id,
            type: "commission",
            amount: commission2.toFixed(2),
            description: `Commission niveau 2`,
          });

          // Level 3
          if (level2User.referredBy) {
            const level3User = await this.getUserByReferralCode(level2User.referredBy);
            if (level3User) {
              const commission3 = amount * level3Rate;
              await this.updateUser(level3User.id, {
                totalEarnings: (parseFloat(level3User.totalEarnings) + commission3).toFixed(2),
              });
              await this.createReferralCommission({
                userId: level3User.id,
                fromUserId: userId,
                level: 3,
                amount: commission3.toFixed(2),
                productId,
              });
              await this.createTransaction({
                userId: level3User.id,
                type: "commission",
                amount: commission3.toFixed(2),
                description: `Commission niveau 3`,
              });
            }
          }
        }
      }
    }
  }

  async processTaskReferralCommissions(userId: number, taskReward: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user || !user.referredBy) return;

    const settings = await this.getSettings();
    const level1Rate = parseFloat(settings.taskLevel1Commission || "3") / 100;
    const level2Rate = parseFloat(settings.taskLevel2Commission || "2") / 100;
    const level3Rate = parseFloat(settings.taskLevel3Commission || "1") / 100;

    // Niveau 1 — parrain direct
    const level1User = await this.getUserByReferralCode(user.referredBy);
    if (level1User) {
      const commission1 = taskReward * level1Rate;
      await this.updateUser(level1User.id, {
        totalEarnings: (parseFloat(level1User.totalEarnings || "0") + commission1).toFixed(2),
      });
      await this.createTransaction({
        userId: level1User.id,
        type: "commission",
        amount: commission1.toFixed(2),
        description: `Commission tâche niv.1 de ${user.fullName}`,
      });

      // Niveau 2
      if (level1User.referredBy) {
        const level2User = await this.getUserByReferralCode(level1User.referredBy);
        if (level2User) {
          const commission2 = taskReward * level2Rate;
          await this.updateUser(level2User.id, {
            totalEarnings: (parseFloat(level2User.totalEarnings || "0") + commission2).toFixed(2),
          });
          await this.createTransaction({
            userId: level2User.id,
            type: "commission",
            amount: commission2.toFixed(2),
            description: `Commission tâche niv.2 de ${user.fullName}`,
          });

          // Niveau 3
          if (level2User.referredBy) {
            const level3User = await this.getUserByReferralCode(level2User.referredBy);
            if (level3User) {
              const commission3 = taskReward * level3Rate;
              await this.updateUser(level3User.id, {
                totalEarnings: (parseFloat(level3User.totalEarnings || "0") + commission3).toFixed(2),
              });
              await this.createTransaction({
                userId: level3User.id,
                type: "commission",
                amount: commission3.toFixed(2),
                description: `Commission tâche niv.3 de ${user.fullName}`,
              });
            }
          }
        }
      }
    }
  }

  async processEarnings(): Promise<void> {
    const activeProducts = await db.select({
      userProduct: userProducts,
      product: products,
      user: users,
    }).from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .innerJoin(users, eq(userProducts.userId, users.id))
      .where(and(eq(userProducts.isActive, true), sql`${userProducts.daysRemaining} > 0`));

    const now = new Date();
    
    const userEarnings = new Map<number, number>();
    
    for (const { userProduct, product, user } of activeProducts) {
      try {
        const purchaseDate = userProduct.purchaseDate ? new Date(userProduct.purchaseDate) : null;
        if (!purchaseDate) continue;

        const lastEarning = userProduct.lastEarningDate ? new Date(userProduct.lastEarningDate) : purchaseDate;

        const msSincePurchase = now.getTime() - purchaseDate.getTime();
        const daysSincePurchase = Math.floor(msSincePurchase / (24 * 60 * 60 * 1000));

        const msSinceLastEarning = now.getTime() - lastEarning.getTime();
        const cyclesSinceLastEarning = Math.floor(msSinceLastEarning / (24 * 60 * 60 * 1000));

        if (cyclesSinceLastEarning >= 1 && daysSincePurchase >= 1) {
          const cyclesToCredit = Math.min(cyclesSinceLastEarning, userProduct.daysRemaining);
          const earningsPerCycle = parseFloat(product.dailyEarnings as string);
          const totalEarningsForProduct = parseFloat((earningsPerCycle * cyclesToCredit).toFixed(2));

          const newLastEarningDate = new Date(now);
          const newDaysRemaining = userProduct.daysRemaining - cyclesToCredit;
          const updateData: any = {
            lastEarningDate: newLastEarningDate,
            daysRemaining: newDaysRemaining,
            totalEarned: (parseFloat(userProduct.totalEarned || "0") + totalEarningsForProduct).toFixed(2),
          };

          if (newDaysRemaining <= 0) {
            updateData.isActive = false;
          }

          await db.update(userProducts).set(updateData).where(eq(userProducts.id, userProduct.id));

          // collectAtEnd: gains accumulés, pas crédités avant la fin du cycle
          // On ne met PAS à jour todayEarnings/totalEarnings de l'utilisateur ici.
          if (!product.collectAtEnd) {
            const currentTotal = userEarnings.get(user.id) || 0;
            userEarnings.set(user.id, currentTotal + totalEarningsForProduct);

            for (let i = 0; i < cyclesToCredit; i++) {
              await this.createTransaction({
                userId: user.id,
                type: "earning",
                amount: earningsPerCycle.toString(),
                description: `Gains ${product.name}`,
              });
            }
          }
          // Note: for collectAtEnd, the transaction & balance update happen when user
          // manually collects via POST /api/user/collect-final/:userProductId
        }
      } catch (productError) {
        console.error(`processEarnings error for product ${userProduct.id}:`, productError);
      }
    }

    for (const [userId, totalEarnings] of Array.from(userEarnings.entries())) {
      try {
        const freshUser = await this.getUser(userId);
        if (freshUser) {
          const newTodayEarnings = parseFloat(freshUser.todayEarnings || "0") + totalEarnings;
          const newTotalEarnings = parseFloat(freshUser.totalEarnings || "0") + totalEarnings;
          
          await this.updateUser(userId, {
            todayEarnings: newTodayEarnings.toFixed(2),
            totalEarnings: newTotalEarnings.toFixed(2),
          });
        }
      } catch (userError) {
        console.error(`processEarnings user update error for user ${userId}:`, userError);
      }
    }
  }

  // Deposits
  async createDeposit(data: Partial<Deposit>): Promise<Deposit> {
    const [deposit] = await db.insert(deposits).values(data as any).returning();
    return deposit;
  }

  async getDeposit(id: number): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.id, id));
    return deposit;
  }

  async getDepositByReference(reference: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.reference, reference));
    return deposit;
  }

  async getDeposits(status?: string): Promise<(Deposit & { user: User })[]> {
    let query = db.select({
      deposit: deposits,
      user: users,
    }).from(deposits)
      .innerJoin(users, eq(deposits.userId, users.id))
      .orderBy(desc(deposits.createdAt));
    
    if (status && status !== "all") {
      query = query.where(eq(deposits.status, status)) as any;
    }
    
    const result = await query;
    return result.map(r => ({ ...r.deposit, user: r.user }));
  }

  async getUserDeposits(userId: number): Promise<Deposit[]> {
    return await db.select().from(deposits).where(eq(deposits.userId, userId)).orderBy(desc(deposits.createdAt));
  }

  async updateDeposit(id: number, data: Partial<Deposit>): Promise<Deposit> {
    const [deposit] = await db.update(deposits).set(data).where(eq(deposits.id, id)).returning();
    return deposit;
  }

  async cleanupDepositScreenshots(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.update(deposits)
      .set({ screenshot: null })
      .where(
        and(
          sql`${deposits.screenshot} IS NOT NULL`,
          or(
            and(eq(deposits.status, "approved"), lte(deposits.processedAt, cutoff)),
            and(eq(deposits.status, "rejected"), lte(deposits.processedAt, cutoff)),
          )
        )
      );
  }


  // Withdrawals
  async createWithdrawal(data: Partial<Withdrawal>): Promise<Withdrawal> {
    const [withdrawal] = await db.insert(withdrawals).values(data as any).returning();
    return withdrawal;
  }

  async getWithdrawals(status?: string): Promise<(Withdrawal & { user: User })[]> {
    let query = db.select({
      withdrawal: withdrawals,
      user: users,
    }).from(withdrawals)
      .innerJoin(users, eq(withdrawals.userId, users.id))
      .orderBy(desc(withdrawals.createdAt));
    
    if (status && status !== "all") {
      query = query.where(eq(withdrawals.status, status)) as any;
    }
    
    const result = await query;
    return result.map(r => ({ ...r.withdrawal, user: r.user }));
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return await db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt));
  }

  async updateWithdrawal(id: number, data: Partial<Withdrawal>): Promise<Withdrawal> {
    const [withdrawal] = await db.update(withdrawals).set(data).where(eq(withdrawals.id, id)).returning();
    return withdrawal;
  }

  async getWithdrawalByNowPaymentsPayoutId(payoutId: string): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.nowPaymentsPayoutId, payoutId));
    return withdrawal || undefined;
  }

  async getWithdrawalByNowPaymentsBatchId(batchId: string): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.nowPaymentsBatchId, batchId));
    return withdrawal || undefined;
  }

  async refundWithdrawal(
    id: number,
    status: "rejected" | "failed",
    reason: string,
  ): Promise<Withdrawal | undefined> {
    return db.transaction(async (tx) => {
      const [withdrawal] = await tx
        .update(withdrawals)
        .set({
          status,
          processedAt: new Date(),
          nowPaymentsStatus: status.toUpperCase(),
          nowPaymentsError: reason,
        })
        .where(and(
          eq(withdrawals.id, id),
          sql`${withdrawals.status} NOT IN ('approved', 'rejected', 'failed')`,
        ))
        .returning();

      if (!withdrawal) return undefined;

      const [user] = await tx.select().from(users).where(eq(users.id, withdrawal.userId));
      if (user) {
        const refundedEarnings = parseFloat(user.totalEarnings || "0") + withdrawal.amount;
        await tx
          .update(users)
          .set({ totalEarnings: refundedEarnings.toFixed(2) })
          .where(eq(users.id, user.id));
        await tx.insert(transactions).values({
          userId: user.id,
          type: "withdrawal_refund",
          amount: withdrawal.amount.toString(),
          description: `Remboursement du retrait ${withdrawal.id}: ${reason}`,
        });
      }

      return withdrawal;
    });
  }

  async getUserWithdrawalCountToday(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(withdrawals)
      .where(and(
        eq(withdrawals.userId, userId),
        gte(withdrawals.createdAt, today)
      ));
    
    return result[0]?.count || 0;
  }

  // Wallets
  async getWallets(userId: number): Promise<WithdrawalWallet[]> {
    return await db.select().from(withdrawalWallets).where(eq(withdrawalWallets.userId, userId));
  }

  async createWallet(data: Partial<WithdrawalWallet>): Promise<WithdrawalWallet> {
    // Set other wallets as non-default
    await db.update(withdrawalWallets).set({ isDefault: false }).where(eq(withdrawalWallets.userId, data.userId!));
    
    const [wallet] = await db.insert(withdrawalWallets).values({ ...data, isDefault: true } as any).returning();
    return wallet;
  }

  async deleteWallet(id: number): Promise<void> {
    await db.delete(withdrawalWallets).where(eq(withdrawalWallets.id, id));
  }

  async setDefaultWallet(userId: number, walletId: number): Promise<void> {
    await db.update(withdrawalWallets).set({ isDefault: false }).where(eq(withdrawalWallets.userId, userId));
    await db.update(withdrawalWallets).set({ isDefault: true }).where(eq(withdrawalWallets.id, walletId));
  }

  async getDefaultWallet(userId: number): Promise<WithdrawalWallet | undefined> {
    const [wallet] = await db.select().from(withdrawalWallets)
      .where(and(eq(withdrawalWallets.userId, userId), eq(withdrawalWallets.isDefault, true)));
    return wallet || undefined;
  }

  // Payment Channels
  async getPaymentChannels(): Promise<PaymentChannel[]> {
    return await db.select().from(paymentChannels);
  }

  async getActivePaymentChannels(): Promise<PaymentChannel[]> {
    return await db.select().from(paymentChannels).where(eq(paymentChannels.isActive, true));
  }

  async getPaymentChannel(id: number): Promise<PaymentChannel | undefined> {
    const [channel] = await db.select().from(paymentChannels).where(eq(paymentChannels.id, id));
    return channel || undefined;
  }

  async createPaymentChannel(data: Partial<PaymentChannel>): Promise<PaymentChannel> {
    const [channel] = await db.insert(paymentChannels).values(data as any).returning();
    return channel;
  }

  async updatePaymentChannel(id: number, data: Partial<PaymentChannel>): Promise<PaymentChannel> {
    const [channel] = await db.update(paymentChannels).set({ ...data, modifiedAt: new Date() }).where(eq(paymentChannels.id, id)).returning();
    return channel;
  }

  async deletePaymentChannel(id: number): Promise<void> {
    await db.delete(paymentChannels).where(eq(paymentChannels.id, id));
  }

  // Referrals
  async getReferrals(userId: number, level: number): Promise<User[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    if (level === 1) {
      return await db.select().from(users).where(eq(users.referredBy, user.referralCode));
    }
    
    // For level 2 and 3, we need recursive queries
    const level1 = await this.getReferrals(userId, 1);
    if (level === 2) {
      const level2: User[] = [];
      for (const l1 of level1) {
        const refs = await db.select().from(users).where(eq(users.referredBy, l1.referralCode));
        level2.push(...refs);
      }
      return level2;
    }
    
    if (level === 3) {
      const level2 = await this.getReferrals(userId, 2);
      const level3: User[] = [];
      for (const l2 of level2) {
        const refs = await db.select().from(users).where(eq(users.referredBy, l2.referralCode));
        level3.push(...refs);
      }
      return level3;
    }
    
    return [];
  }

  async createReferralCommission(data: Partial<ReferralCommission>): Promise<ReferralCommission> {
    const [commission] = await db.insert(referralCommissions).values(data as any).returning();
    return commission;
  }

  async getUserCommissions(userId: number): Promise<number> {
    const result = await db.select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
      .from(referralCommissions)
      .where(eq(referralCommissions.userId, userId));
    return parseFloat(result[0]?.total || "0");
  }

  async getTeamStatsSimple(userId: number): Promise<{ level1Count: number; level2Count: number; level3Count: number; totalCommission: number }> {
    const user = await this.getUser(userId);
    if (!user) return { level1Count: 0, level2Count: 0, level3Count: 0, totalCommission: 0 };

    const level1Result = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.referredBy, user.referralCode));
    const level1Count = Number(level1Result[0]?.count || 0);

    let level2Count = 0;
    let level3Count = 0;
    
    if (level1Count > 0) {
      const level1Codes = await db.select({ code: users.referralCode })
        .from(users)
        .where(eq(users.referredBy, user.referralCode));
      
      if (level1Codes.length > 0) {
        const level2Result = await db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(sql`${users.referredBy} IN (${sql.join(level1Codes.map(u => sql`${u.code}`), sql`, `)})`);
        level2Count = Number(level2Result[0]?.count || 0);
        
        if (level2Count > 0) {
          const level2Codes = await db.select({ code: users.referralCode })
            .from(users)
            .where(sql`${users.referredBy} IN (${sql.join(level1Codes.map(u => sql`${u.code}`), sql`, `)})`);
          
          if (level2Codes.length > 0) {
            const level3Result = await db.select({ count: sql<number>`count(*)` })
              .from(users)
              .where(sql`${users.referredBy} IN (${sql.join(level2Codes.map(u => sql`${u.code}`), sql`, `)})`);
            level3Count = Number(level3Result[0]?.count || 0);
          }
        }
      }
    }

    const commResult = await db.select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
      .from(referralCommissions)
      .where(eq(referralCommissions.userId, userId));
    const totalCommission = parseFloat(commResult[0]?.total || "0");

    return { level1Count, level2Count, level3Count, totalCommission };
  }

  async getTeamStats(userId: number): Promise<{ level1Count: number; level2Count: number; level3Count: number; totalCommission: number; level1Commission: number; level2Commission: number; level3Commission: number; level1Invested: number; level2Invested: number; level3Invested: number; level1Recharged: number; teamTotalDeposits: number; teamTotalWithdrawals: number }> {
    const level1 = await this.getReferrals(userId, 1);
    const level2 = await this.getReferrals(userId, 2);
    const level3 = await this.getReferrals(userId, 3);
    const totalCommission = await this.getUserCommissions(userId);

    const getCommissionByLevel = async (level: number) => {
      const result = await db.select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
        .from(referralCommissions)
        .where(and(eq(referralCommissions.userId, userId), eq(referralCommissions.level, level)));
      return parseFloat(result[0]?.total || "0");
    };

    const countInvested = async (userList: User[]) => {
      let count = 0;
      for (const u of userList) {
        if (u.hasActiveProduct) count++;
      }
      return count;
    };

    const countRecharged = async (userList: User[]) => {
      let count = 0;
      for (const u of userList) {
        const userDeposits = await db.select().from(deposits)
          .where(and(eq(deposits.userId, u.id), eq(deposits.status, "approved")));
        if (userDeposits.length > 0) count++;
      }
      return count;
    };

    // Total deposits and withdrawals by all filleuls (levels 1+2+3)
    const allMembers = [...level1, ...level2, ...level3];
    const allMemberIds = allMembers.map(u => u.id);

    let teamTotalDeposits = 0;
    let teamTotalWithdrawals = 0;

    if (allMemberIds.length > 0) {
      for (const memberId of allMemberIds) {
        const [dep] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
          .from(deposits)
          .where(and(eq(deposits.userId, memberId), eq(deposits.status, "approved")));
        teamTotalDeposits += parseFloat(dep?.total || "0");

        const [wd] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
          .from(withdrawals)
          .where(and(eq(withdrawals.userId, memberId), eq(withdrawals.status, "approved")));
        teamTotalWithdrawals += parseFloat(wd?.total || "0");
      }
    }

    return {
      level1Count: level1.length,
      level2Count: level2.length,
      level3Count: level3.length,
      totalCommission,
      level1Commission: await getCommissionByLevel(1),
      level2Commission: await getCommissionByLevel(2),
      level3Commission: await getCommissionByLevel(3),
      level1Invested: await countInvested(level1),
      level2Invested: await countInvested(level2),
      level3Invested: await countInvested(level3),
      level1Recharged: await countRecharged(level1),
      teamTotalDeposits,
      teamTotalWithdrawals,
    };
  }

  async getDetailedTeam(userId: number): Promise<any> {
    const level1 = await this.getReferrals(userId, 1);
    const level2 = await this.getReferrals(userId, 2);
    const level3 = await this.getReferrals(userId, 3);

    const enrichUser = async (user: User, vipLevel: number) => {
      const userProductsList = await db.select({ 
        productName: products.name,
        productPrice: products.price,
        purchaseDate: userProducts.purchaseDate,
        isActive: userProducts.isActive,
      })
      .from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .where(eq(userProducts.userId, user.id));
      
      const totalInvested = userProductsList
        .reduce((sum, p) => sum + parseFloat(String(p.productPrice)), 0);

      // Bonus earned by current user FROM this specific member
      const bonusResult = await db
        .select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
        .from(referralCommissions)
        .where(and(
          eq(referralCommissions.userId, userId),
          eq(referralCommissions.fromUserId, user.id),
        ));
      const bonusFromMember = parseFloat(bonusResult[0]?.total || "0");

      return {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        country: user.country,
        balance: user.balance,
        hasActiveProduct: user.hasActiveProduct,
        hasDeposited: user.hasDeposited,
        createdAt: user.createdAt,
        totalInvested,
        vipLevel,
        bonusFromMember,
        products: userProductsList,
      };
    };

    const level1Details = await Promise.all(level1.map(u => enrichUser(u, 1)));
    const level2Details = await Promise.all(level2.map(u => enrichUser(u, 2)));
    const level3Details = await Promise.all(level3.map(u => enrichUser(u, 3)));

    return {
      level1: level1Details,
      level2: level2Details,
      level3: level3Details,
      totalLevel1Invested: level1Details.reduce((sum, u) => sum + u.totalInvested, 0),
      totalLevel2Invested: level2Details.reduce((sum, u) => sum + u.totalInvested, 0),
      totalLevel3Invested: level3Details.reduce((sum, u) => sum + u.totalInvested, 0),
    };
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.isActive, true)).orderBy(tasks.sortOrder);
  }

  async getAllTasksAdmin(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(tasks.sortOrder);
  }

  async createTask(data: Partial<Task>): Promise<Task> {
    const [task] = await db.insert(tasks).values(data as any).returning();
    return task;
  }

  async updateTask(id: number, data: Partial<Task>): Promise<Task> {
    const [task] = await db.update(tasks).set(data as any).where(eq(tasks.id, id)).returning();
    return task;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTasksWithStatus(userId: number): Promise<(Task & { isCompleted: boolean; canClaim: boolean; currentInvites: number })[]> {
    const allTasks = await this.getTasks();
    const user = await this.getUser(userId);
    if (!user) return [];

    const level1Refs = await this.getReferrals(userId, 1);
    // Active member = direct referral not banned who has at least one active
    // purchase of a non-free product (VIP 1 or higher).
    // We do NOT use hasActiveProduct because it is also set for free products.
    let currentInvites = 0;
    if (level1Refs.length > 0) {
      const eligibleIds = level1Refs
        .filter(r => !r.isBanned)
        .map(r => r.id);
      if (eligibleIds.length > 0) {
        const rows = await db
          .selectDistinct({ userId: userProducts.userId })
          .from(userProducts)
          .innerJoin(products, eq(userProducts.productId, products.id))
          .where(and(
            inArray(userProducts.userId, eligibleIds),
            eq(products.isFree, false),
            eq(userProducts.isActive, true),
          ));
        currentInvites = rows.length;
      }
    }

    const completedTasks = await db.select().from(userTasks).where(eq(userTasks.userId, userId));
    const completedIds = new Set(completedTasks.map(t => t.taskId));

    return allTasks.map(task => ({
      ...task,
      isCompleted: completedIds.has(task.id),
      canClaim: !completedIds.has(task.id) && currentInvites >= task.requiredInvites,
      currentInvites: currentInvites,
    }));
  }

  async claimTask(userId: number, taskId: number): Promise<void> {
    const tasksStatus = await this.getTasksWithStatus(userId);
    const taskStatus = tasksStatus.find(t => t.id === taskId);

    if (!taskStatus) throw new Error("Tâche non trouvée");
    if (taskStatus.isCompleted) throw new Error("Tâche déjà réclamée");
    if (!taskStatus.canClaim) {
      throw new Error(`Invitations insuffisantes (${taskStatus.currentInvites}/${taskStatus.requiredInvites})`);
    }

    const user = await this.getUser(userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    await db.transaction(async (tx) => {
      const existingClaim = await tx.select({ id: userTasks.id })
        .from(userTasks)
        .where(and(eq(userTasks.userId, userId), eq(userTasks.taskId, taskId)))
        .limit(1);

      if (existingClaim.length > 0) {
        throw new Error("Tâche déjà réclamée");
      }

      await tx.insert(userTasks).values({
        userId,
        taskId,
        rewardClaimed: true,
      });

      const newBalance = parseFloat(user.balance) + taskStatus.reward;
      await tx.update(users)
        .set({ balance: newBalance.toFixed(2) })
        .where(eq(users.id, userId));

      await tx.insert(transactions).values({
        userId,
        type: "task_reward",
        amount: taskStatus.reward.toString(),
        description: `Récompense: ${taskStatus.name}`,
      });
    });
  }

  // Transactions
  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(data as any).returning();
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  // Settings
  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    return setting?.value || null;
  }

  async getSettings(): Promise<Record<string, string>> {
    const allSettings = await db.select().from(platformSettings);
    const result: Record<string, string> = {};
    for (const s of allSettings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async setSetting(key: string, value: string, modifiedBy?: number): Promise<void> {
    const existing = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    if (existing.length > 0) {
      await db.update(platformSettings).set({ value, modifiedBy, modifiedAt: new Date() }).where(eq(platformSettings.key, key));
    } else {
      await db.insert(platformSettings).values({ key, value, modifiedBy, modifiedAt: new Date() });
    }
  }

  // Company page content
  async getCompanyContent(activeOnly = false): Promise<CompanyContent[]> {
    const query = db.select().from(companyContent);
    return activeOnly
      ? await query.where(eq(companyContent.isActive, true)).orderBy(asc(companyContent.sortOrder), asc(companyContent.id))
      : await query.orderBy(asc(companyContent.sortOrder), asc(companyContent.id));
  }

  async createCompanyContent(data: Partial<CompanyContent>): Promise<CompanyContent> {
    const [content] = await db.insert(companyContent).values({
      title: data.title || "Nouveau bloc",
      body: data.body || "",
      imageUrl: data.imageUrl || null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      updatedAt: new Date(),
    }).returning();
    return content;
  }

  async updateCompanyContent(id: number, data: Partial<CompanyContent>): Promise<CompanyContent> {
    const [content] = await db.update(companyContent)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companyContent.id, id))
      .returning();
    if (!content) throw new Error("Bloc de contenu introuvable");
    return content;
  }

  async deleteCompanyContent(id: number): Promise<void> {
    await db.delete(companyContent).where(eq(companyContent.id, id));
  }

  // Admin
  async getStats(startDate?: Date, endDate?: Date): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Récupérer la date de réinitialisation des stats
    const statsResetDateStr = await this.getSetting("statsResetDate");
    const statsResetDate = statsResetDateStr ? new Date(statsResetDateStr) : new Date(0);
    
    const filterStart = startDate || new Date(0);
    const filterEnd = endDate || new Date();
    filterEnd.setHours(23, 59, 59, 999);

    const [totalUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, statsResetDate));
    const [todayUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, today));
    const [periodUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users)
      .where(and(gte(users.createdAt, filterStart), lte(users.createdAt, filterEnd)));
    
    const [totalDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits).where(and(eq(deposits.status, "approved"), gte(deposits.createdAt, statsResetDate)));
    const [todayDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits).where(and(eq(deposits.status, "approved"), gte(deposits.createdAt, today)));
    const [periodDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits).where(and(eq(deposits.status, "approved"), gte(deposits.createdAt, filterStart), lte(deposits.createdAt, filterEnd)));
    const [pendingDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)`, count: sql<number>`count(*)` })
      .from(deposits).where(eq(deposits.status, "pending"));
    
    const [totalWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals).where(and(eq(withdrawals.status, "approved"), gte(withdrawals.createdAt, statsResetDate)));
    const [todayWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals).where(and(eq(withdrawals.status, "approved"), gte(withdrawals.createdAt, today)));
    const [periodWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals).where(and(eq(withdrawals.status, "approved"), gte(withdrawals.createdAt, filterStart), lte(withdrawals.createdAt, filterEnd)));
    const [pendingWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)`, count: sql<number>`count(*)` })
      .from(withdrawals).where(eq(withdrawals.status, "pending"));
    
    const [usersWithProductsResult] = await db.select({ count: sql<number>`count(DISTINCT ${userProducts.userId})` })
      .from(userProducts).where(and(eq(userProducts.isActive, true), gte(userProducts.purchaseDate, statsResetDate)));
    
    // Récupérer les valeurs baseline pour les compteurs cumulatifs
    const baselineBalance = parseFloat(await this.getSetting("baselineTotalBalance") || "0");
    const baselineEarnings = parseFloat(await this.getSetting("baselineTotalEarnings") || "0");
    const baselineCommissions = parseFloat(await this.getSetting("baselineTotalCommissions") || "0");
    
    const [totalBalanceResult] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.balance} AS DECIMAL)), 0)` })
      .from(users);
    
    const [totalEarningsResult] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.totalEarnings} AS DECIMAL)), 0)` })
      .from(users);
    
    const [totalProductsResult] = await db.select({ count: sql<number>`count(*)` })
      .from(userProducts).where(and(eq(userProducts.isActive, true), gte(userProducts.purchaseDate, statsResetDate)));
    
    const [totalCommissionsResult] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
      .from(transactions).where(eq(transactions.type, "commission"));

    // Soustraire les valeurs baseline pour obtenir les stats depuis la réinitialisation
    const adjustedBalance = Math.max(0, parseFloat(totalBalanceResult?.total || "0") - baselineBalance);
    const adjustedEarnings = Math.max(0, parseFloat(totalEarningsResult?.total || "0") - baselineEarnings);
    const adjustedCommissions = Math.max(0, parseFloat(totalCommissionsResult?.total || "0") - baselineCommissions);

    return {
      totalUsers: totalUsersResult?.count || 0,
      todayUsers: todayUsersResult?.count || 0,
      periodUsers: periodUsersResult?.count || 0,
      totalDeposits: parseFloat(totalDepositsResult?.total || "0"),
      todayDeposits: parseFloat(todayDepositsResult?.total || "0"),
      periodDeposits: parseFloat(periodDepositsResult?.total || "0"),
      pendingDeposits: parseFloat(pendingDepositsResult?.total || "0"),
      pendingDepositsCount: pendingDepositsResult?.count || 0,
      totalWithdrawals: parseFloat(totalWithdrawalsResult?.total || "0"),
      todayWithdrawals: parseFloat(todayWithdrawalsResult?.total || "0"),
      periodWithdrawals: parseFloat(periodWithdrawalsResult?.total || "0"),
      pendingWithdrawals: parseFloat(pendingWithdrawalsResult?.total || "0"),
      pendingWithdrawalsCount: pendingWithdrawalsResult?.count || 0,
      usersWithProducts: usersWithProductsResult?.count || 0,
      totalBalance: adjustedBalance,
      totalEarnings: adjustedEarnings,
      totalActiveProducts: totalProductsResult?.count || 0,
      totalCommissions: adjustedCommissions,
    };
  }

  async logAdminAction(adminId: number, action: string, targetUserId: number | null, details: string): Promise<void> {
    await db.insert(adminAuditLog).values({ adminId, action, targetUserId, details });
  }

  async resetStats(): Promise<void> {
    // Stocke la date de réinitialisation - les stats ne comptent que les données après cette date
    await this.setSetting("statsResetDate", new Date().toISOString());
    
    // Stocker les valeurs baseline pour les compteurs cumulatifs (solde et gains)
    const [currentBalance] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.balance} AS DECIMAL)), 0)` }).from(users);
    const [currentEarnings] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.totalEarnings} AS DECIMAL)), 0)` }).from(users);
    const [currentCommissions] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` }).from(transactions).where(eq(transactions.type, "commission"));
    
    await this.setSetting("baselineTotalBalance", currentBalance?.total || "0");
    await this.setSetting("baselineTotalEarnings", currentEarnings?.total || "0");
    await this.setSetting("baselineTotalCommissions", currentCommissions?.total || "0");
  }

  // Gift Codes
  async getAllGiftCodes(): Promise<GiftCode[]> {
    return await db.select().from(giftCodes).orderBy(desc(giftCodes.createdAt));
  }

  async getGiftCodeByCode(code: string): Promise<GiftCode | undefined> {
    const [giftCode] = await db.select().from(giftCodes).where(
      sql`UPPER(${giftCodes.code}) = UPPER(${code})`
    );
    return giftCode || undefined;
  }

  async createGiftCode(data: { code: string; amount: string; maxUses: number; expiresAt: Date; createdBy: number }): Promise<GiftCode> {
    const [giftCode] = await db.insert(giftCodes).values(data).returning();
    return giftCode;
  }

  async deleteGiftCode(id: number): Promise<void> {
    await db.delete(giftCodes).where(eq(giftCodes.id, id));
  }

  async hasUserClaimedGiftCode(userId: number, giftCodeId: number): Promise<boolean> {
    const [claim] = await db.select().from(giftCodeClaims).where(
      and(eq(giftCodeClaims.userId, userId), eq(giftCodeClaims.giftCodeId, giftCodeId))
    );
    return !!claim;
  }

  async claimGiftCode(userId: number, giftCodeId: number, amount: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.insert(giftCodeClaims).values({ userId, giftCodeId });
      await tx.update(giftCodes).set({
        currentUses: sql`${giftCodes.currentUses} + 1`
      }).where(eq(giftCodes.id, giftCodeId));
      await tx.update(users).set({
        balance: sql`${users.balance} + ${amount}`
      }).where(eq(users.id, userId));
      await tx.insert(transactions).values({
        userId,
        type: "gift_code",
        amount: amount.toString(),
        description: `Bonus code cadeau`
      });
    });
  }

  // Countries
  async getCountries(): Promise<Country[]> {
    return await db.select().from(countries);
  }

  async getActiveCountries(): Promise<Country[]> {
    return await db.select().from(countries).where(eq(countries.isActive, true));
  }

  async getCountry(id: number): Promise<Country | undefined> {
    const [country] = await db.select().from(countries).where(eq(countries.id, id));
    return country || undefined;
  }

  async createCountry(data: Partial<Country>): Promise<Country> {
    const [country] = await db.insert(countries).values(data as any).returning();
    return country;
  }

  async updateCountry(id: number, data: Partial<Country>): Promise<Country> {
    const [country] = await db.update(countries).set(data as any).where(eq(countries.id, id)).returning();
    return country;
  }

  async deleteCountry(id: number): Promise<void> {
    await db.delete(countries).where(eq(countries.id, id));
  }

  // Deposit Channels
  async getDepositChannels(): Promise<DepositChannel[]> {
    return await db.select().from(depositChannels)
      .orderBy(depositChannels.sortOrder, depositChannels.createdAt);
  }

  async getDepositChannelsByCountry(country: string): Promise<DepositChannel[]> {
    return await db.select().from(depositChannels)
      .where(and(eq(depositChannels.country, country), eq(depositChannels.isActive, true)))
      .orderBy(depositChannels.sortOrder);
  }

  async getDepositChannel(id: number): Promise<DepositChannel | undefined> {
    const [ch] = await db.select().from(depositChannels).where(eq(depositChannels.id, id));
    return ch || undefined;
  }

  async createDepositChannel(data: Partial<DepositChannel>): Promise<DepositChannel> {
    const [ch] = await db.insert(depositChannels).values(data as any).returning();
    return ch;
  }

  async updateDepositChannel(id: number, data: Partial<DepositChannel>): Promise<DepositChannel> {
    const [ch] = await db.update(depositChannels).set(data as any).where(eq(depositChannels.id, id)).returning();
    return ch;
  }

  async deleteDepositChannel(id: number): Promise<void> {
    await db.delete(depositChannels).where(eq(depositChannels.id, id));
  }

  // Payment Numbers
  async getPaymentNumbers(): Promise<PaymentNumber[]> {
    return await db.select().from(paymentNumbers).orderBy(desc(paymentNumbers.createdAt));
  }

  async getPaymentNumbersByCountry(country: string): Promise<PaymentNumber[]> {
    return await db.select().from(paymentNumbers)
      .where(and(eq(paymentNumbers.country, country), eq(paymentNumbers.isActive, true)))
      .orderBy(paymentNumbers.operatorName);
  }

  async getPaymentNumbersByChannel(channelId: number): Promise<PaymentNumber[]> {
    return await db.select().from(paymentNumbers)
      .where(and(eq(paymentNumbers.channelId, channelId), eq(paymentNumbers.isActive, true)))
      .orderBy(paymentNumbers.operatorName);
  }

  async createPaymentNumber(data: Partial<PaymentNumber>): Promise<PaymentNumber> {
    const [num] = await db.insert(paymentNumbers).values(data as any).returning();
    return num;
  }

  async updatePaymentNumber(id: number, data: Partial<PaymentNumber>): Promise<PaymentNumber> {
    const [num] = await db.update(paymentNumbers).set(data as any).where(eq(paymentNumbers.id, id)).returning();
    return num;
  }

  async deletePaymentNumber(id: number): Promise<void> {
    await db.delete(paymentNumbers).where(eq(paymentNumbers.id, id));
  }

  // Staking Products
  async getStakingProducts(): Promise<StakingProduct[]> {
    return await db.select().from(stakingProducts).orderBy(stakingProducts.createdAt);
  }

  async getActiveStakingProducts(): Promise<StakingProduct[]> {
    return await db.select().from(stakingProducts)
      .where(eq(stakingProducts.isActive, true))
      .orderBy(stakingProducts.launchDate);
  }

  async getStakingProduct(id: number): Promise<StakingProduct | undefined> {
    const [sp] = await db.select().from(stakingProducts).where(eq(stakingProducts.id, id));
    return sp || undefined;
  }

  async createStakingProduct(data: Partial<StakingProduct>): Promise<StakingProduct> {
    const [sp] = await db.insert(stakingProducts).values(data as any).returning();
    return sp;
  }

  async updateStakingProduct(id: number, data: Partial<StakingProduct>): Promise<StakingProduct> {
    const [sp] = await db.update(stakingProducts).set(data as any).where(eq(stakingProducts.id, id)).returning();
    return sp;
  }

  async deleteStakingProduct(id: number): Promise<void> {
    await db.delete(stakingProducts).where(eq(stakingProducts.id, id));
  }

  async purchaseStaking(userId: number, stakingProductId: number): Promise<UserStaking> {
    const sp = await this.getStakingProduct(stakingProductId);
    if (!sp) throw new Error("Produit de staking introuvable");
    if (!sp.isActive) throw new Error("Produit de staking inactif");

    const now = new Date();
    if (sp.launchDate && new Date(sp.launchDate) > now) {
      throw new Error("Ce produit n'est pas encore disponible à l'achat");
    }

    const user = await this.getUser(userId);
    if (!user) throw new Error("Utilisateur introuvable");
    if (parseFloat(user.balance) < sp.price) {
      throw new Error(`Solde insuffisant. Il vous manque ${(sp.price - parseFloat(user.balance)).toLocaleString()} USDT`);
    }

    // Check user has at least one active regular product
    const activeProds = await db.select().from(userProducts)
      .where(and(eq(userProducts.userId, userId), eq(userProducts.isActive, true)));
    if (activeProds.length === 0) {
      throw new Error("Vous devez posséder un produit actif avant d'accéder au Staking");
    }

    const releaseDate = new Date(now.getTime() + sp.lockDays * 24 * 60 * 60 * 1000);

    const [staking] = await db.insert(userStakings).values({
      userId,
      stakingProductId,
      amountPaid: sp.price,
      returnAmount: sp.returnAmount,
      purchasedAt: now,
      releaseDate,
      status: "active",
    }).returning();

    // Deduct balance
    const newBalance = (parseFloat(user.balance) - sp.price).toFixed(2);
    await this.updateUser(userId, { balance: newBalance });

    await this.createTransaction({
      userId,
      type: "staking",
      amount: (-sp.price).toString(),
      description: `Staking: ${sp.name}`,
    });

    return staking;
  }

  async getUserStakings(userId: number): Promise<(UserStaking & { product: StakingProduct })[]> {
    const result = await db.select({ staking: userStakings, product: stakingProducts })
      .from(userStakings)
      .innerJoin(stakingProducts, eq(userStakings.stakingProductId, stakingProducts.id))
      .where(eq(userStakings.userId, userId))
      .orderBy(desc(userStakings.purchasedAt));
    return result.map(r => ({ ...r.staking, product: r.product }));
  }

  async getAllUserStakings(): Promise<(UserStaking & { product: StakingProduct; user: User })[]> {
    const result = await db.select({ staking: userStakings, product: stakingProducts, user: users })
      .from(userStakings)
      .innerJoin(stakingProducts, eq(userStakings.stakingProductId, stakingProducts.id))
      .innerJoin(users, eq(userStakings.userId, users.id))
      .orderBy(desc(userStakings.purchasedAt));
    return result.map(r => ({ ...r.staking, product: r.product, user: r.user }));
  }

  async releaseMaturedStakings(): Promise<void> {
    const now = new Date();
    const matured = await db.select().from(userStakings)
      .where(and(eq(userStakings.status, "active"), lte(userStakings.releaseDate, now)));

    for (const staking of matured) {
      try {
        const user = await this.getUser(staking.userId);
        if (!user) continue;
        const newBalance = (parseFloat(user.balance) + staking.returnAmount).toFixed(2);
        await this.updateUser(staking.userId, { balance: newBalance });
        await db.update(userStakings)
          .set({ status: "released", releasedAt: now })
          .where(eq(userStakings.id, staking.id));
        await this.createTransaction({
          userId: staking.userId,
          type: "staking_release",
          amount: staking.returnAmount.toString(),
          description: `Déblocage staking #${staking.id}`,
        });
      } catch (e) {
        console.error("Error releasing staking:", staking.id, e);
      }
    }
  }

  // ── Product Series ──────────────────────────────────────────────────────────
  async getAllProductsAdmin(): Promise<Product[]> {
    return db.select().from(products).orderBy(products.sortOrder);
  }

  async getProductInviteCount(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;
    const refs = await this.getReferrals(userId, 1);
    return refs.length;
  }
}

export const storage = new DatabaseStorage();
