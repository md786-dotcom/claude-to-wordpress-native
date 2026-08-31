#!/usr/bin/env node
/**
 * prepare hook for npx/git installs: use committed bundle when present,
 * otherwise build it (local monorepo / CI).
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = join(root, "dist", "ctw.mjs");
const force = process.argv.includes("--force");

if (!force && existsSync(bundle)) {
  console.log(`Using committed CLI bundle at ${bundle}`);
  process.exit(0);
}

const result = spawnSync(process.execPath, [join(root, "scripts/bundle-cli.mjs")], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
