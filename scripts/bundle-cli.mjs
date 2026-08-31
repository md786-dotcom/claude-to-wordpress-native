#!/usr/bin/env node
/**
 * Bundle the CLI into a single ESM file for `npx github:...`.
 * Avoids unpublished @ctw/* workspace resolution at runtime.
 */
import * as esbuild from "esbuild";
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outfile = join(root, "dist", "ctw.mjs");

spawnSync(process.execPath, [join(root, "scripts/copy-skill-assets.mjs")], {
  cwd: root,
  stdio: "inherit",
});

mkdirSync(dirname(outfile), { recursive: true });

await esbuild.build({
  absWorkingDir: root,
  entryPoints: [join(root, "packages/cli/src/bin/ctw.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile,
  logLevel: "info",
});

let code = readFileSync(outfile, "utf8");
code = code.replace(/^(?:#!.*\n)+/, "");
writeFileSync(outfile, `#!/usr/bin/env node\n${code}`, "utf8");
chmodSync(outfile, 0o755);
console.log(`Bundled CLI → ${outfile}`);
