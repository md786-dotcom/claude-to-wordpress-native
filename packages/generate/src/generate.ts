import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { CtwPackage } from "@ctw/schema";
import { assertPackageCss } from "./check-css.js";
import { readPackageFromFile } from "./theme-files.js";
import { buildChildThemeZip } from "./zip.js";

export type GenerateOptions = {
  packagePath: string;
  outputPath: string;
  mediaRoot?: string;
  themeKitRoot?: string;
};

/**
 * Deep emit entry: validated package path → Hello Elementor child ZIP on disk.
 * Owns kit merge, Woo gate, media embed, and theme headers via buildChildThemeZip.
 */
export function generateChildThemeZip(options: GenerateOptions): {
  bytes: Uint8Array;
  package: CtwPackage;
  outputPath: string;
} {
  const pkg = readPackageFromFile(options.packagePath);
  assertPackageCss(pkg);
  const bytes = buildChildThemeZip({
    package: pkg,
    ...(options.mediaRoot !== undefined ? { mediaRoot: options.mediaRoot } : {}),
    ...(options.themeKitRoot !== undefined
      ? { themeKitRoot: options.themeKitRoot }
      : {}),
  });
  const outputPath = resolve(options.outputPath);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, bytes);
  return { bytes, package: pkg, outputPath };
}
