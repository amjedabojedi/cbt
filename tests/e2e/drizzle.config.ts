import { defineConfig } from "drizzle-kit";

if (!process.env.E2E_ISOLATED || !/^postgresql:\/\/e2e@127\.0\.0\.1:\d+\/resilience_e2e$/.test(process.env.DATABASE_URL || "")) {
  throw new Error("Only the disposable E2E database is permitted");
}
export default defineConfig({
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
