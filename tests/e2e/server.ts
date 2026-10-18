// This entrypoint is never imported by the real app.
import express from "express";
import path from "node:path";
import bcrypt from "bcrypt";
import { db } from "../../server/db";
import { users } from "../../shared/schema";
import { registerRoutes } from "../../server/routes";
import { setupVite } from "../../server/vite";

if (!process.env.E2E_ISOLATED || !/^postgresql:\/\/e2e@127\.0\.0\.1:\d+\/resilience_e2e$/.test(process.env.DATABASE_URL || "")) {
  throw new Error("Refusing to seed anything except the disposable E2E database");
}
// SDK constructors have already loaded; no save may invoke an AI provider.
delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const password = await bcrypt.hash("Synthetic-test-password-42", 4);
const fixture: Record<string, number> = {};
for (const [key, role] of [["assigned", "therapist"], ["unrelated", "therapist"], ["admin", "admin"], ["client", "client"], ["otherClient", "client"]] as const) {
  const [user] = await db.insert(users).values({
    username: `e2e-${key}`,
    email: `${key}@example.invalid`,
    password,
    name: `Synthetic ${key}`,
    role,
    therapistId: key === "client" ? fixture.assigned : key === "otherClient" ? fixture.unrelated : null,
  }).returning();
  fixture[key] = user.id;
}
const app = express();
app.use(express.json());
const server = await registerRoutes(app);
app.get("/__e2e/ready", (_req, res) => res.json(fixture));
// No scheduler, reminders, welcome email or registration runs in this harness.
// Never share optimized dependencies with the concurrently running preview.
await setupVite(app, server, path.join(process.env.E2E_ISOLATED, "vite-cache"));
server.listen(Number(process.env.PORT), "127.0.0.1");
