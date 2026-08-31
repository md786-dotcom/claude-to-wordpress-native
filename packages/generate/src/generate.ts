import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { CtwPackage } from "@ctw/schema";
import { readPackageFromFile } from "./theme-files.js";
import { buildChildThemeZip } from "./zip.js";

export type GenerateOptions = {
  packagePath: string;
  outputPath: string;
  mediaRoot?: string;
  themeKitRoot?: string;
};

export function generateChildThemeZip(options: GenerateOptions): {
  bytes: Uint8Array;
  package: CtwPackage;
  outputPath: string;
} {
  const pkg = readPackageFromFile(options.packagePath);
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
