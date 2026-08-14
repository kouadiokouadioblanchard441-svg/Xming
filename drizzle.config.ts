import { defineConfig } from "drizzle-kit";
import { getDatabaseConfig } from "./server/database-config";

const database = getDatabaseConfig();

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  // The session store is managed by connect-pg-simple and intentionally
  // has no matching table in shared/schema.ts.
  tablesFilter: ["*", "!session"],
  dbCredentials: {
    url: database.connectionString,
    ssl: database.ssl,
  },
});
