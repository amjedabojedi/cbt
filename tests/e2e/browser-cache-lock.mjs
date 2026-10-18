// Linux flock locks belong to the open file description, not a PID or lockfile's
// age. Never unlink this file: waiters must all lock the same inode.
import { spawn } from "node:child_process";
import { mkdir, open } from "node:fs/promises";
import path from "node:path";

export async function withBrowserCacheLock(cache, env, operation) {
  await mkdir(cache, { recursive: true });
  const handle = await open(path.join(cache, ".runtime.lock"), "a+", 0o600);
  try {
    await new Promise((resolve, reject) => {
      // fd 3 shares handle's open file description. flock may exit after
      // acquiring it; handle keeps the kernel lock until our work finishes.
      const child = spawn("flock", ["--exclusive", "3"], {
        env, stdio: ["ignore", "ignore", "pipe", handle.fd],
      });
      let stderr = "";
      child.stderr.on("data", data => { stderr += data; });
      child.once("error", reject);
      child.once("close", code => code === 0 ? resolve() :
        reject(new Error(`Cannot lock browser cache (flock exited ${code}): ${stderr.trim()}`)));
    });
    // Pass this fd to children touching the runtime. If the owner is killed
    // mid-command, that command retains the lock until it exits too.
    return await operation(handle.fd);
  } finally {
    await handle.close();
  }
}
