#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "skills", "ctw-native");
const dest = join(root, "packages", "cli", "skill-assets");

if (!existsSync(source)) {
  console.error(`Skill source missing: ${source}`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(source, dest, { recursive: true });
console.log(`Copied skill assets → ${dest}`);
