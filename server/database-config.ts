export type DatabaseConfig = {
  connectionString: string;
  ssl?: { rejectUnauthorized: false };
};

export function getDatabaseConfig(
  env: NodeJS.ProcessEnv = process.env,
): DatabaseConfig {
  const supabaseUrl = env.SUPABASE_DATABASE_URL;
  const databaseUrl = supabaseUrl || env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "No database URL configured. Set SUPABASE_DATABASE_URL (preferred) or DATABASE_URL.",
    );
  }

  return {
    connectionString: databaseUrl,
    ...(supabaseUrl ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}