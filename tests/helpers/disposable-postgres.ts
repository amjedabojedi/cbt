import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Pool } from "pg";

// Never accepts a database URL. Owns a new cluster, with no TCP listener.
// Child processes inherit no application secrets or PostgreSQL settings.
export async function disposablePostgres() {
  const root = await mkdtemp(path.join(tmpdir(), "resource-integrity-"));
  const env = Object.fromEntries(["PATH", "HOME", "LANG", "LC_ALL"]
    .filter(key => process.env[key]).map(key => [key, process.env[key]!]));
  const run = (cmd: string, args: string[]) => {
    const result = spawnSync(cmd, args, { env, encoding: "utf8", timeout: 20_000 });
    if (result.error || result.status !== 0) {
      throw new Error(`${cmd} failed: ${result.error?.message ?? result.stderr}`);
    }
  };
  let started = false;
  let pool: Pool | undefined;
  const close = async () => {
    await pool?.end();
    if (started) run("pg_ctl", ["-D", path.join(root, "pg"), "-m", "immediate", "-w", "stop"]);
    await rm(root, { recursive: true, force: true });
  };
  try {
    run("initdb", ["-D", path.join(root, "pg"), "-A", "trust", "-U", "synthetic", "--no-locale", "--encoding=UTF8"]);
    run("pg_ctl", ["-D", path.join(root, "pg"), "-l", path.join(root, "postgres.log"),
      "-o", `-h '' -k ${root}`, "-w", "start"]);
    started = true;
    pool = new Pool({
      host: root, port: 5432, user: "synthetic", password: "synthetic",
      database: "postgres", ssl: false, max: 6,
      statement_timeout: 10_000, application_name: "synthetic-resource-integrity",
    });
    return { pool, close };
  } catch (error) {
    await close();
    throw error;
  }
}
