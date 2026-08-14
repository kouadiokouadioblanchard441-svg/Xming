import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { products } from "../shared/schema.ts";
import { asc, eq } from "drizzle-orm";
import { getDatabaseConfig } from "../server/database-config.ts";

async function main() {
  const config = getDatabaseConfig(process.env);
  const pool = new pg.Pool({ connectionString: config.connectionString, ssl: config.ssl });
  const db = drizzle(pool);

  // Update all existing products: 360 days + unique images
  const updates: { sortOrder: number; cycleDays: number; totalReturn: number; imageUrl: string }[] = [
    { sortOrder: 1, cycleDays: 360, totalReturn: 108000,   imageUrl: '/powerbank-1.jpg' },
    { sortOrder: 2, cycleDays: 360, totalReturn: 288000,   imageUrl: '/powerbank-2.jpg' },
    { sortOrder: 3, cycleDays: 360, totalReturn: 540000,   imageUrl: '/powerbank-3.jpg' },
    { sortOrder: 4, cycleDays: 360, totalReturn: 720000,   imageUrl: '/powerbank-4.jpg' },
    { sortOrder: 5, cycleDays: 360, totalReturn: 1260000,  imageUrl: '/powerbank-5.jpg' },
    { sortOrder: 6, cycleDays: 360, totalReturn: 3600000,  imageUrl: '/powerbank-6.jpg' },
    { sortOrder: 7, cycleDays: 360, totalReturn: 10800000, imageUrl: '/powerbank-7.jpg' },
  ];

  const all = await db
    .select({ id: products.id, name: products.name, sortOrder: products.sortOrder })
    .from(products)
    .orderBy(asc(products.sortOrder));

  for (const p of all) {
    const u = updates.find(x => x.sortOrder === p.sortOrder);
    if (u) {
      await db.update(products)
        .set({ cycleDays: u.cycleDays, totalReturn: u.totalReturn, imageUrl: u.imageUrl })
        .where(eq(products.id, p.id));
      console.log(`${p.name} → 360 jours, totalReturn mis à jour, ${u.imageUrl}`);
    }
  }

  // Add VIP 8 and VIP 9 if they don't exist
  const existing = await db.select({ name: products.name }).from(products);
  const names = existing.map(p => p.name);

  if (!names.includes("VIP 8")) {
    await db.insert(products).values({
      name: "VIP 8", price: 600, dailyEarnings: 60, cycleDays: 360,
      totalReturn: 21600, imageUrl: '/powerbank-8.jpg', sortOrder: 8, isFree: false,
    });
    console.log("VIP 8 ajouté → 600, 60/jour, 360 jours");
  } else {
    console.log("VIP 8 déjà existant");
  }

  if (!names.includes("VIP 9")) {
    await db.insert(products).values({
      name: "VIP 9", price: 1000, dailyEarnings: 120, cycleDays: 360,
      totalReturn: 43200, imageUrl: '/powerbank-9.jpg', sortOrder: 9, isFree: false,
    });
    console.log("VIP 9 ajouté → 1000, 120/jour, 360 jours");
  } else {
    console.log("VIP 9 déjà existant");
  }

  await pool.end();
  console.log("✓ Terminé");
}

main().catch(console.error);
