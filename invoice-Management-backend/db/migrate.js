import { migrate } from "drizzle-orm/postgres-js/migrator";
import db from "better-sqlite3";
async function runMigrations() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully.");
  process.exit(0);
}
migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});