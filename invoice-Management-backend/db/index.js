import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("⚠️  DATABASE_URL is not set. DB queries will fail until DATABASE_URL is configured.");
}

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool);
