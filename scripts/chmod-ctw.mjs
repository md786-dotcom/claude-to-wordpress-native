import { chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
chmodSync(join(root, "packages/generate/dist/bin/ctw.js"), 0o755);
