import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { getDatabaseConfig } from "./database-config";

const { Pool } = pg;
export const pool = new Pool(getDatabaseConfig());
export const db = drizzle(pool, { schema });
