import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { unzipSync, zipSync, strToU8 } from "fflate";
import type { CtwPackage } from "@ctw/schema";
import {
  functionsPhp,
  loadThemeKitRoot,
  packageJsonForTheme,
  styleCss,
} from "./theme-files.js";

type ZipMap = Record<string, Uint8Array>;

function walkFiles(dir: string, base: string, out: ZipMap, prefix: string): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(base, full).replaceAll("\\", "/");
    const stats = statSync(full);
    if (stats.isDirectory()) {
      if (entry === "woocommerce") {
        continue;
      }
      walkFiles(full, base, out, prefix);
      continue;
    }
    out[`${prefix}/${rel}`] = readFileSync(full);
  }
}

function addWooTemplates(out: ZipMap, prefix: string, kitRoot: string): void {
  const wooDir = join(kitRoot, "woocommerce");
  try {
    if (!statSync(wooDir).isDirectory()) {
      return;
    }
  } catch {
    return;
  }
  for (const entry of readdirSync(wooDir)) {
    const full = join(wooDir, entry);
    if (!statSync(full).isFile()) {
      continue;
    }
    out[`${prefix}/woocommerce/${entry}`] = readFileSync(full);
  }
}

function addPackageMedia(
  out: ZipMap,
  prefix: string,
  pkg: CtwPackage,
  mediaRoot: string,
): void {
  for (const item of pkg.media) {
    const full = join(mediaRoot, item.path);
    out[`${prefix}/media/${item.path}`] = readFileSync(full);
  }
}

export type BuildZipOptions = {
  package: CtwPackage;
  mediaRoot?: string;
  themeKitRoot?: string;
};

/**
 * Build a Hello Elementor child theme ZIP.
 */
export function buildChildThemeZip(options: BuildZipOptions): Uint8Array {
  const pkg = options.package;
  const kitRoot = options.themeKitRoot ?? loadThemeKitRoot();
  const prefix = pkg.theme.slug;
  const files: ZipMap = {};

  walkFiles(kitRoot, kitRoot, files, prefix);

  files[`${prefix}/style.css`] = strToU8(styleCss(pkg));
  files[`${prefix}/functions.php`] = strToU8(functionsPhp(pkg));
  files[`${prefix}/ctw-package.json`] = strToU8(packageJsonForTheme(pkg));

  if (pkg.woocommerce.enabled) {
    addWooTemplates(files, prefix, kitRoot);
  }

  if (options.mediaRoot !== undefined) {
    addPackageMedia(files, prefix, pkg, options.mediaRoot);
  }

  return zipSync(files, { level: 6 });
}

export function readZipText(zipBytes: Uint8Array, path: string): string {
  const entries = unzipSync(zipBytes);
  const file = entries[path];
  if (file === undefined) {
    throw new Error(`missing zip entry: ${path}`);
  }
  return new TextDecoder().decode(file);
}

export function zipContains(zipBytes: Uint8Array, path: string): boolean {
  const entries = unzipSync(zipBytes);
  return Object.prototype.hasOwnProperty.call(entries, path);
}

export function listZipPaths(zipBytes: Uint8Array): string[] {
  return Object.keys(unzipSync(zipBytes)).sort();
}
