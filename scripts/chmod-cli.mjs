import { chmodSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = join(root, "packages", "cli", "dist", "bin", "ctw.js");
if (existsSync(bin)) {
  chmodSync(bin, 0o755);
}
