// Test-process-only outbound firewall. No production imports or bypass flags.
import net from "node:net";
import { syncBuiltinESMExports } from "node:module";

const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  const options = typeof first === "object" ? first : { host: typeof args[1] === "string" ? args[1] : "localhost" };
  const host = options.host || options.hostname || "localhost";
  if (!["127.0.0.1", "::1", "localhost"].includes(host)) {
    throw new Error(`E2E blocked outbound connection to ${host}`);
  }
  return connect.apply(this, args);
};
syncBuiltinESMExports();
