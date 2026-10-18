import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  recommendationResourceAuditQuery, parseRecommendationResourceAudit,
} from "../server/repositories/recommendation-resource-audit";

// Deliberately do not import server/db or bootstrap the application:
// no background jobs, notifications, application logs, or implicit execution.
async function main() {
  if (process.argv.slice(2).join(" ") !== "--run-read-only") {
    console.error("Usage: npm run audit:recommendation-resources -- --run-read-only");
    process.exitCode = 1;
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.error("Audit not run: DATABASE_URL must be configured for the explicitly approved target.");
    process.exitCode = 1;
    return;
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 30_000,
    application_name: "recommendation-resource-audit",
  });
  // Never print database errors: they can include connection or query details.
  pool.on("error", () => {
    console.error("Integrity audit database connection failed.");
    process.exitCode = 1;
  });
  try {
    const report = await drizzle(pool).transaction(async tx => {
      const result = await tx.execute(recommendationResourceAuditQuery);
      return parseRecommendationResourceAudit(result.rows[0]);
    }, { accessMode: "read only" });
    console.log(JSON.stringify(report, null, 2));
  } catch {
    console.error("Integrity audit failed; no report was produced. No repairs were attempted.");
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await main();
