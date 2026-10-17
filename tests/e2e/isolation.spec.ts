import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { Pool } from "pg";

test("harness contains only synthetic accounts and cannot inherit delivery credentials", async () => {
  expect(process.env.DATABASE_URL).toMatch(/^postgresql:\/\/e2e@127\.0\.0\.1:\d+\/resilience_e2e$/);
  expect(process.env.AI_INTEGRATIONS_OPENAI_API_KEY).toBe("synthetic-not-a-real-key");
  expect(process.env.OPENAI_API_KEY).toBe("synthetic-not-a-real-key");
  for (const key of ["SPARKPOST_API_KEY", "SENDGRID_API_KEY", "SMTP_PASSWORD", "STRIPE_SECRET_KEY", "DEEPGRAM_API_KEY", "PGPASSWORD"]) {
    expect(process.env[key], `${key} must not enter the harness`).toBeUndefined();
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query("select username, email from users");
    expect(rows).toHaveLength(5);
    for (const user of rows) {
      expect(user.username).toMatch(/^e2e-/);
      expect(user.email).toMatch(/@example\.invalid$/);
    }
  } finally { await pool.end(); }
});

test("server outbound firewall rejects external sockets before connecting", () => {
  const result = spawnSync(process.execPath, [
    "--import", "./tests/e2e/network-guard.mjs", "--input-type=module", "-e",
    `import net from 'node:net';
     try { net.connect({host: 'smtp.example.invalid', port: 587}); process.exit(2); }
     catch (error) { if (!error.message.includes('E2E blocked outbound')) process.exit(3); }`,
  ], { env: process.env, encoding: "utf8" });
  expect(result.status).toBe(0);
});
