import { db } from "./db";
import { users, products, tasks, paymentChannels, platformSettings, companyContent, countries, stakingProducts, productSeries } from "@shared/schema";
import { RDC_COUNTRY, SUPPORTED_COUNTRY_CODE } from "@shared/country-config";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";

export async function seed() {
  console.log("Seeding database...");
  const rdcOnlyMode = process.env.RDC_ONLY_MODE === "true";
  if (!rdcOnlyMode) {
    console.log("Database seed skipped: set RDC_ONLY_MODE=true only after configuring the new RDC database.");
    return;
  }
  const adminCountry = SUPPORTED_COUNTRY_CODE;

  // ─── Schema migrations (run FIRST, before any table access) ─────────────────
  // Product series table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "product_series" (
      "id" serial PRIMARY KEY,
      "name" text NOT NULL,
      "sort_order" integer NOT NULL DEFAULT 0,
      "is_active" boolean NOT NULL DEFAULT true,
      "created_at" timestamp NOT NULL DEFAULT now()
    )
  `);
  // New columns on products
  await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "series_id" integer REFERENCES "product_series"("id")`);
  await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "min_invite_count" integer NOT NULL DEFAULT 0`);
  await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "max_owned" integer NOT NULL DEFAULT 0`);
  await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "collect_at_end" boolean NOT NULL DEFAULT false`);
  await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stock_percentage" integer NOT NULL DEFAULT 0`);

  // Create session table for connect-pg-simple (if not exists)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
    ) WITH (OIDS=FALSE)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
  `);

  // Company page content blocks (admin-editable)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "company_content" (
      "id" serial PRIMARY KEY,
      "title" text NOT NULL,
      "body" text NOT NULL DEFAULT '',
      "image_url" text,
      "sort_order" integer NOT NULL DEFAULT 0,
      "is_active" boolean NOT NULL DEFAULT true,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp
    )
  `);
  const existingCompanyContent = await db.select({ id: companyContent.id }).from(companyContent).limit(1);
  if (existingCompanyContent.length === 0) {
    await db.insert(companyContent).values([
      {
        title: "我们是谁？",
        body: "了解我们的公司、愿景以及为客户提供的解决方案。",
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "投资计划",
        body: "这里提供投资计划、相关条件以及平台机会的详细信息。",
        sortOrder: 2,
        isActive: true,
      },
      {
        title: "我们的承诺",
        body: "我们重视透明度、服务质量，并为每一位会员提供支持。",
        sortOrder: 3,
        isActive: true,
      },
    ]);
    console.log("Company content initialized");
  }

  // Ensure countries table exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "countries" (
      "id" serial PRIMARY KEY,
      "code" text NOT NULL UNIQUE,
      "name" text NOT NULL,
      "currency" text NOT NULL,
      "phone_prefix" text NOT NULL,
      "operators" text NOT NULL DEFAULT '[]',
      "is_active" boolean NOT NULL DEFAULT true
    )
  `);

  // Check if admin already exists
  const adminPhone = "0501682811";
  const existingAdmin = await db.select().from(users).where(eq(users.phone, adminPhone));
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPassword || !adminPin) {
    throw new Error("ADMIN_PASSWORD and ADMIN_PIN must be configured before initializing the RDC database.");
  }

  if (existingAdmin.length === 0) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await db.insert(users).values({
      fullName: "Super Admin",
      phone: adminPhone,
      country: adminCountry,
      password: hashedPassword,
      referralCode: "ADMIN1",
      balance: "0",
      isAdmin: true,
      isSuperAdmin: true,
      adminPin,
    });
    console.log("Super admin created");
  } else {
    // Always ensure correct country, password and PIN are up-to-date
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await db.update(users)
      .set({ country: adminCountry, password: hashedPassword, isAdmin: true, isSuperAdmin: true, adminPin })
      .where(eq(users.phone, adminPhone));
    console.log("Super admin updated");
  }

  // Seed only the RDC after explicitly switching to the new database.
  // Existing country rows are never deleted during this transition.
  const requiredCountries = rdcOnlyMode
    ? [{
        code: RDC_COUNTRY.code,
        name: RDC_COUNTRY.name,
        currency: RDC_COUNTRY.currency,
        phonePrefix: RDC_COUNTRY.phonePrefix,
        operators: JSON.stringify([...RDC_COUNTRY.operators]),
        isActive: true,
        autoPaymentEnabled: RDC_COUNTRY.autoPaymentEnabled,
      }]
    : [];

  for (const countryData of requiredCountries) {
    const existing = await db.select().from(countries).where(eq(countries.code, countryData.code));
    if (existing.length === 0) {
      await db.insert(countries).values(countryData);
      console.log(`Country added: ${countryData.name}`);
    } else {
      await db.update(countries).set({
        name: countryData.name,
        currency: countryData.currency,
        phonePrefix: countryData.phonePrefix,
      }).where(eq(countries.code, countryData.code));
      console.log(`Country identity checked; admin-managed settings preserved: ${countryData.name}`);
    }
  }

  // Seed products only if table is empty (first install only — never overwrite admin changes)
  const existingProducts = await db.select().from(products);
  if (existingProducts.filter(p => !p.isFree).length === 0) {
    const defaultProducts = [
      { name: "VIP 1", price: "20000",   dailyEarnings: "3600",   cycleDays: 30, totalReturn: "108000",   imageUrl: "/xpeng-product-1.jpg", sortOrder: 1 },
      { name: "VIP 2", price: "45000",   dailyEarnings: "8100",   cycleDays: 30, totalReturn: "243000",   imageUrl: "/xpeng-product-2.jpg", sortOrder: 2 },
      { name: "VIP 3", price: "75000",   dailyEarnings: "13500",  cycleDays: 30, totalReturn: "405000",   imageUrl: "/xpeng-product-4.jpg", sortOrder: 3 },
      { name: "VIP 4", price: "100000",  dailyEarnings: "18000",  cycleDays: 30, totalReturn: "540000",   imageUrl: "/xpeng-product-5.jpg", sortOrder: 4 },
      { name: "VIP 5", price: "245000",  dailyEarnings: "45000",  cycleDays: 30, totalReturn: "1350000",  imageUrl: "/xpeng-product-6.jpg", sortOrder: 5 },
      { name: "VIP 6", price: "500000",  dailyEarnings: "93000",  cycleDays: 30, totalReturn: "2790000",  imageUrl: "/xpeng-product-7.jpg", sortOrder: 6 },
    ];
    await db.insert(products).values(defaultProducts);
    console.log("Products seeded (first install)");
  } else {
    console.log(`Products skipped — ${existingProducts.length} existing products preserved`);
  }

  // Seed tasks — migrate to new 4-reward parrainage structure if needed
  const existingTasks = await db.select().from(tasks);
  const newRewardTasks = [
    { name: "🎁 Récompense 1", description: "3 membres actifs requis",  requiredInvites: 3,  reward: 1000,  sortOrder: 1 },
    { name: "🎁 Récompense 2", description: "10 membres actifs requis", requiredInvites: 10, reward: 3000,  sortOrder: 2 },
    { name: "🎁 Récompense 3", description: "30 membres actifs requis", requiredInvites: 30, reward: 5000,  sortOrder: 3 },
    { name: "🎁 Récompense 4", description: "50 membres actifs requis", requiredInvites: 50, reward: 10000, sortOrder: 4 },
  ];
  // Detect old structure (legacy task names like "Parrain Bronze")
  const hasLegacyTasks = existingTasks.some(t => t.name.startsWith("Parrain "));
  if (existingTasks.length === 0 || hasLegacyTasks) {
    if (hasLegacyTasks) {
      // Remove old tasks (user_tasks FK rows are preserved; only tasks without claims are removed cleanly)
      await db.delete(tasks);
    }
    await db.insert(tasks).values(newRewardTasks);
    console.log("Reward tasks seeded (new 4-reward structure)");
  } else {
    console.log(`Tasks skipped — ${existingTasks.length} existing tasks preserved`);
  }

  // Check if payment channels exist
  const existingChannels = await db.select().from(paymentChannels);
  if (existingChannels.length === 0) {
    await db.insert(paymentChannels).values([
      { name: "LeekPay", redirectUrl: "https://leekpay.com/pay", isApi: false },
      { name: "FedaPay", redirectUrl: "https://fedapay.com/payment", isApi: false },
    ]);
    console.log("Payment channels seeded");
  }

  // Check if settings exist - apply new values for new keys or update existing
  const existingSettings = await db.select().from(platformSettings);
  const requiredSettings = [
    { key: "supportLink", value: "https://t.me/vestasgroup" },
    { key: "supportType", value: "telegram" },
    { key: "supportLabel", value: "Support client" },
    { key: "support2Link", value: "https://t.me/vestasgroup" },
    { key: "support2Type", value: "telegram" },
    { key: "support2Label", value: "Support client 2" },
    { key: "channelLink", value: "https://t.me/vestasgroup" },
    { key: "channelType", value: "telegram" },
    { key: "channelLabel", value: "Chaîne officielle" },
    { key: "groupLink", value: "https://t.me/vestasgroup" },
    { key: "groupType", value: "telegram" },
    { key: "groupLabel", value: "Groupe de discussion" },
    { key: "popupButtonLabel", value: "Rejoindre le groupe Telegram" },
    { key: "floatingSupportTarget", value: "support1" },
    { key: "supportEnabled", value: "true" },
    { key: "support2Enabled", value: "true" },
    { key: "channelEnabled", value: "true" },
    { key: "groupEnabled", value: "true" },
    { key: "minDeposit", value: "20000" },
    { key: "depositPresetAmounts", value: "20000,45000,75000,100000,245000,500000,1000000" },
    { key: "minWithdrawal", value: "5000" },
    { key: "withdrawalEnabled", value: "true" },
    { key: "withdrawalMode", value: "manual" },
    { key: "withdrawalFees", value: "15" },
    { key: "withdrawalDays", value: "0,1,2,3,4,5,6" },
    { key: "withdrawalStartHour", value: "8" },
    { key: "withdrawalEndHour", value: "18" },
    { key: "withdrawalMinDelayMinutes", value: "30" },
    { key: "withdrawalMaxDelayHours", value: "6" },
    { key: "maxWithdrawalsPerDay", value: "1" },
    { key: "level1Commission", value: "10" },
    { key: "level2Commission", value: "2" },
    { key: "level3Commission", value: "1" },
    { key: "taskLevel1Commission", value: "3" },
    { key: "taskLevel2Commission", value: "2" },
    { key: "taskLevel3Commission", value: "1" },
    { key: "dailyBonusEnabled", value: "true" },
    { key: "dailyBonusAmount", value: "25" },
    { key: "signupBonusEnabled", value: "true" },
    { key: "signupBonusAmount", value: "1000" },
    { key: "soleaspayEnabled", value: "false" },
    { key: "soleaspayCountries", value: "" },
    { key: "soleaspayChannelName", value: "Soleaspay" },
    { key: "omnipayEnabled", value: "false" },
    { key: "omnipayChannelName", value: "OmniPay" },
    { key: "omnipayCallbackKey", value: "" },
    { key: "westpayMerchantSlug", value: "" },
    { key: "westpayWebhookSecret", value: "" },
    // Clés API WestPay par pays
    { key: "westpayApiKey_CD", value: "" },
    // VIP descriptions & advantages (insert only — never force-update)
    { key: "vip0Description", value: "Membre inscrit n'ayant pas encore investi." },
    { key: "vip0Advantages", value: "Accès à la plateforme. Possibilité de déposer et d'investir." },
    { key: "vip1Description", value: "Nouveau membre ayant réalisé son premier investissement." },
    { key: "vip1Advantages", value: "Accès complet à la plateforme. Gains quotidiens. Commissions de parrainage actives." },
    { key: "vip2Description", value: "Membre actif avec 3 filleuls directs (niveau A)." },
    { key: "vip2Advantages", value: "Statut VIP 2. Reconnaissance de votre activité de recrutement." },
    { key: "vip3Description", value: "Minimum 3 membres directs (A) ayant commencé à construire leur propre réseau (niveau B)." },
    { key: "vip3Advantages", value: "Statut VIP 3. Équipe structurée sur 2 niveaux." },
    { key: "vip4Description", value: "Minimum 100 membres dans l'équipe totale (niveaux A + B + C)." },
    { key: "vip4Advantages", value: "Statut VIP 4. Leader d'équipe confirmé." },
    { key: "vip5Description", value: "Minimum 300 membres dans l'équipe totale." },
    { key: "vip5Advantages", value: "Statut VIP 5. Ambassadeur de la plateforme." },
    { key: "vip6Description", value: "Minimum 600 membres dans l'équipe totale." },
    { key: "vip6Advantages", value: "Statut VIP 6. Partenaire élite." },
    { key: "vip7Description", value: "Minimum 1 000 membres dans l'équipe totale." },
    { key: "vip7Advantages", value: "Statut VIP 7. Rang suprême. Reconnaissance maximale." },
    // VIP labels (insert only)
    { key: "vip0Label", value: "VIP 0" }, { key: "vip1Label", value: "VIP 1" },
    { key: "vip2Label", value: "VIP 2" }, { key: "vip3Label", value: "VIP 3" },
    { key: "vip4Label", value: "VIP 4" }, { key: "vip5Label", value: "VIP 5" },
    { key: "vip6Label", value: "VIP 6" }, { key: "vip7Label", value: "VIP 7" },
    // VIP conditions (insert only — admin can override)
    { key: "vip2MinDirectA",   value: "3"    },
    { key: "vip3MinDirectA",   value: "3"    },
    { key: "vip3MinLevelB",    value: "1"    },
    { key: "vip4MinTotalTeam", value: "100"  },
    { key: "vip5MinTotalTeam", value: "300"  },
    { key: "vip6MinTotalTeam", value: "600"  },
    { key: "vip7MinTotalTeam", value: "1000" },
    // VIP rewards (insert only — admin can override)
    { key: "vip2Reward", value: "500"  },
    { key: "vip3Reward", value: "1000" },
    { key: "vip4Reward", value: "2000" },
    { key: "vip5Reward", value: "3500" },
    { key: "vip6Reward", value: "5000" },
    { key: "vip7Reward", value: "7500" },
    // Spin wheel popup texts (insert only — admin can override)
    { key: "spinWheelInviteText", value: "Invitez vos amis à s'inscrire et vous aurez plus de chances de gagner des prix, jusqu'à 50 fois par jour." },
    { key: "spinWheelInviteHighlight", value: "50" },
    { key: "spinWheelRulesText", value: "Achetez un produit pour obtenir des tours gratuits. Chaque tour vous donne une chance de remporter un gain en CDF crédité directement sur votre solde." },
    { key: "spinWheelRulesHighlight", value: "" },
    { key: "banner1Images", value: JSON.stringify(["/banner/meeting-1.jpg", "/banner/meeting-2.jpg", "/banner/meeting-3.jpg"]) },
    { key: "banner2Images", value: JSON.stringify(["/banner/meeting-4.jpg", "/banner/meeting-5.jpg", "/banner/meeting-6.jpg"]) },
  ];

  // Aucune clé n'est écrasée au redémarrage : toute valeur déjà en base est conservée
  // (les modifications admin persistent entre redémarrages)
  const FORCE_UPDATE_KEYS = new Set<string>();

  for (const settingData of requiredSettings) {
    const existing = existingSettings.find(s => s.key === settingData.key);
    if (!existing) {
      await db.insert(platformSettings).values(settingData);
      console.log(`Setting added: ${settingData.key}`);
    } else if (FORCE_UPDATE_KEYS.has(settingData.key)) {
      await db.update(platformSettings)
        .set({ value: settingData.value })
        .where(eq(platformSettings.key, settingData.key));
      console.log(`Setting updated: ${settingData.key}`);
    } else {
      console.log(`Setting preserved: ${settingData.key}`);
    }
  }
  console.log("Settings check complete");

  // Seed staking products only if table is empty (first install only — never overwrite admin changes)
  const existingStakingProducts = await db.select().from(stakingProducts);
  if (existingStakingProducts.length === 0) {
    await db.insert(stakingProducts).values([
      { name: "Produit 1", description: "5% par jour pendant 3 jours. Capital récupérable à la fin.", price: 2000, returnAmount: 2300, lockDays: 3, isActive: true },
      { name: "Produit 2", description: "5% par jour pendant 7 jours. Capital récupérable à la fin.", price: 5000, returnAmount: 6750, lockDays: 7, isActive: true },
      { name: "Produit 3", description: "5% par jour pendant 12 jours. Capital récupérable à la fin.", price: 10000, returnAmount: 16000, lockDays: 12, isActive: true },
      { name: "Produit 4", description: "5% par jour pendant 16 jours. Capital récupérable à la fin.", price: 20000, returnAmount: 36000, lockDays: 16, isActive: true },
      { name: "Produit 5", description: "5% par jour pendant 20 jours. Capital récupérable à la fin.", price: 50000, returnAmount: 100000, lockDays: 20, isActive: true },
    ]);
    console.log("Staking products seeded (first install)");
  } else {
    console.log(`Staking products skipped — ${existingStakingProducts.length} existing staking products preserved`);
  }

  // ─── Product Series seed data ────────────────────────────────────────────────
  // Seed default series (Série A & Série B) if none exist
  const existingSeries = await db.select({ id: productSeries.id }).from(productSeries).limit(1);
  if (existingSeries.length === 0) {
    const [serieA] = await db.insert(productSeries).values([
      { name: "Série A", sortOrder: 1, isActive: true },
      { name: "Série B", sortOrder: 2, isActive: true },
    ]).returning();
    // Assign all existing products to Série A by default
    await db.execute(sql`UPDATE "products" SET "series_id" = ${serieA.id} WHERE "series_id" IS NULL AND "is_free" = false`);
    console.log("Product series seeded (Série A, Série B) — existing products assigned to Série A");
  } else {
    console.log("Product series skipped — already exists");
  }

  console.log("Database seeding complete!");
}
