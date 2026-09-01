import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const here = dirname(fileURLToPath(import.meta.url));

const SKIP_DIR_NAMES = new Set([
  "vendor",
  "tests",
  "node_modules",
  ".git",
  ".phpunit.cache",
  ".phpstan",
]);

const SKIP_FILE_NAMES = new Set([
  ".gitignore",
  "composer.lock",
  "phpunit.xml",
  "infection.log",
]);

/**
 * GPL-2.0 requires every distributed copy to carry the license text, and the
 * NOTICE carries third-party attribution. Neither lives under plugin/, so they
 * are pulled from the package root that encloses it.
 */
const LICENSE_FILE_NAMES = ["LICENSE", "NOTICE"];

/**
 * Locate the plugin/ source directory from src, dist, or root CLI bundle.
 */
export function findPluginSourceDir(): string {
  const candidates = [
    join(here, "../../../plugin"),
    join(here, "../../plugin"),
    join(here, "../plugin"),
  ];
  for (const dir of candidates) {
    if (statSync(join(dir, "ctw-native.php"), { throwIfNoEntry: false })?.isFile()) {
      return dir;
    }
  }
  throw new Error("plugin/ source not found next to the CLI package.");
}

export type PackPluginOptions = {
  outputPath: string;
  pluginRoot?: string;
};

export type PackPluginResult = {
  outputPath: string;
  fileCount: number;
};

/**
 * Build a WordPress-uploadable ZIP: ctw-native/… at the archive root.
 */
export function packPluginZip(options: PackPluginOptions): PackPluginResult {
  const pluginRoot = resolve(options.pluginRoot ?? findPluginSourceDir());
  const main = join(pluginRoot, "ctw-native.php");
  if (!statSync(main, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`Missing ctw-native.php in ${pluginRoot}`);
  }

  const files: Record<string, Uint8Array> = {};
  collectFiles(pluginRoot, pluginRoot, files);
  addLicenseFiles(pluginRoot, files);
  const fileCount = Object.keys(files).length;
  if (fileCount === 0) {
    throw new Error("No plugin files to pack.");
  }

  const bytes = zipSync(files, { level: 6 });
  const outputPath = resolve(options.outputPath);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, bytes);
  return { outputPath, fileCount };
}

function addLicenseFiles(
  pluginRoot: string,
  out: Record<string, Uint8Array>,
): void {
  for (const name of LICENSE_FILE_NAMES) {
    const target = `ctw-native/${name}`;
    if (out[target]) {
      continue;
    }
    const source = [join(pluginRoot, name), join(pluginRoot, "..", name)].find(
      (candidate) => statSync(candidate, { throwIfNoEntry: false })?.isFile(),
    );
    if (!source) {
      throw new Error(`Missing ${name} for the plugin ZIP; GPL builds must ship it.`);
    }
    out[target] = readFileSync(source);
  }
}

function collectFiles(
  absDir: string,
  pluginRoot: string,
  out: Record<string, Uint8Array>,
): void {
  for (const entry of readdirSync(absDir)) {
    if (SKIP_DIR_NAMES.has(entry) || SKIP_FILE_NAMES.has(entry)) {
      continue;
    }
    const full = join(absDir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      collectFiles(full, pluginRoot, out);
      continue;
    }
    if (!stats.isFile()) {
      continue;
    }
    const rel = relative(pluginRoot, full).replaceAll("\\", "/");
    out[`ctw-native/${rel}`] = readFileSync(full);
  }
}
