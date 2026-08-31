#!/usr/bin/env node
import { resolve } from "node:path";
import { generateChildThemeZip, readPackageFromFile } from "@ctw/generate";
import { fetchIntoPackage, syncPackageMedia } from "../media-fetch.js";
import { packPluginZip } from "../plugin-zip.js";
import { addDummyProduct, MAX_DUMMY_PRODUCTS } from "../products.js";
import { initProject, installSkill } from "../skill.js";

function printHelp(): void {
  process.stdout.write(
    [
      "claude-to-wordpress-native (ctw) — Claude Code toolchain",
      "",
      "Simple start (GitHub main — not on npm yet):",
      "  npx -y github:md786-dotcom/claude-to-wordpress-native skill",
      "  npx -y github:md786-dotcom/claude-to-wordpress-native plugin-zip",
      "  npx -y github:md786-dotcom/claude-to-wordpress-native media fetch --url https://images.unsplash.com/... --id hero",
      "  npx -y github:md786-dotcom/claude-to-wordpress-native init --name \"Acme Child\" --slug acme-child",
      "  npx -y github:md786-dotcom/claude-to-wordpress-native init --name \"Shop Child\" --slug shop-child --woocommerce",
      "  npx -y github:md786-dotcom/claude-to-wordpress-native products add --name \"Mug\" --price 12.00 --image-url https://images.unsplash.com/... --package ./ctw-package.json",
      "  npx -y github:md786-dotcom/claude-to-wordpress-native generate --package ./ctw-package.json --out ./acme-child.zip --media ./media",
      "",
      "Commands:",
      "  skill              Install the Claude Code skill into .claude/skills/ctw-native",
      "  plugin-zip         Write ctw-native.zip (WordPress uploadable plugin) to the project dir",
      "  media fetch        Download an https image (Unsplash/Pexels/direct) into ./media",
      "  media sync         Download all package media[].sourceUrl files that are missing",
      "  products add       Add a dummy WooCommerce product (max " +
        String(MAX_DUMMY_PRODUCTS) +
        ": name, price, description, image)",
      "  init               Scaffold ctw-package.json, media/, and the Claude Code skill",
      "                    (add --woocommerce for shop packages)",
      "  validate           Validate a ctw-package.json without writing a ZIP",
      "  generate           Emit a Hello Elementor child theme ZIP (auto-syncs sourceUrl media)",
      "",
      "Claude Code only. No Cursor. No live WordPress MCP.",
      "",
    ].join("\n"),
  );
}

function readFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function runSkill(args: string[]): number {
  const root = resolve(readFlag(args, "--cwd") ?? process.cwd());
  const result = installSkill(root);
  process.stdout.write(
    result.created
      ? `Installed Claude Code skill at ${result.targetDir}\n`
      : `Updated Claude Code skill at ${result.targetDir}\n`,
  );
  process.stdout.write(
    "In Claude Code, ask for a WordPress / Elementor site. The skill will guide package creation.\n",
  );
  return 0;
}

function runPluginZip(args: string[]): number {
  const cwd = resolve(readFlag(args, "--cwd") ?? process.cwd());
  const outPath = resolve(cwd, readFlag(args, "--out") ?? "ctw-native.zip");
  try {
    const result = packPluginZip({ outputPath: outPath });
    process.stdout.write(
      `Wrote ${result.outputPath} (${String(result.fileCount)} files)\n`,
    );
    process.stdout.write(
      "In WordPress: Plugins → Add New → Upload Plugin → choose this ZIP → Activate.\n",
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`plugin-zip failed: ${message}\n`);
    return 1;
  }
}

async function runMedia(args: string[]): Promise<number> {
  const [sub, ...rest] = args;
  if (sub === "fetch") {
    return runMediaFetch(rest);
  }
  if (sub === "sync") {
    return runMediaSync(rest);
  }
  process.stderr.write("Usage: media fetch|sync …\n");
  return 1;
}

async function runMediaFetch(args: string[]): Promise<number> {
  const url = readFlag(args, "--url");
  const id = readFlag(args, "--id");
  if (url === undefined || id === undefined) {
    process.stderr.write("Missing --url or --id.\n");
    return 1;
  }
  const cwd = resolve(readFlag(args, "--cwd") ?? process.cwd());
  const mediaRoot = resolve(cwd, readFlag(args, "--media") ?? "media");
  const packagePath = readFlag(args, "--package");
  const alt = readFlag(args, "--alt");
  const relativePath = readFlag(args, "--path");
  try {
    const result = await fetchIntoPackage({
      url,
      id,
      mediaRoot,
      ...(alt !== undefined ? { alt } : {}),
      ...(relativePath !== undefined ? { relativePath } : {}),
      ...(packagePath !== undefined
        ? { packagePath: resolve(cwd, packagePath) }
        : {}),
    });
    process.stdout.write(`Downloaded ${result.relativePath} → ${mediaRoot}\n`);
    if (result.packagePath !== undefined) {
      process.stdout.write(`Updated media[] in ${result.packagePath}\n`);
    }
    process.stdout.write(
      `In Elementor trees use settings.image = { "id": "${id}", "url": "" }\n`,
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`media fetch failed: ${message}\n`);
    return 1;
  }
}

async function runMediaSync(args: string[]): Promise<number> {
  const packagePath = readFlag(args, "--package");
  if (packagePath === undefined) {
    process.stderr.write("Missing --package.\n");
    return 1;
  }
  const cwd = resolve(readFlag(args, "--cwd") ?? process.cwd());
  const mediaRoot = resolve(cwd, readFlag(args, "--media") ?? "media");
  const force = args.includes("--force");
  try {
    const pkg = readPackageFromFile(resolve(cwd, packagePath));
    const result = await syncPackageMedia({ pkg, mediaRoot, force });
    process.stdout.write(
      `Media sync: downloaded ${String(result.downloaded.length)}, skipped ${String(result.skipped.length)}\n`,
    );
    for (const path of result.downloaded) {
      process.stdout.write(`  + ${path}\n`);
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`media sync failed: ${message}\n`);
    return 1;
  }
}

async function runProducts(args: string[]): Promise<number> {
  const [sub, ...rest] = args;
  if (sub !== "add") {
    process.stderr.write("Usage: products add --name … --price … --image-url … --package …\n");
    return 1;
  }
  const name = readFlag(rest, "--name");
  const price = readFlag(rest, "--price");
  const imageUrl = readFlag(rest, "--image-url");
  const packagePath = readFlag(rest, "--package");
  if (name === undefined || price === undefined || imageUrl === undefined || packagePath === undefined) {
    process.stderr.write("Missing --name, --price, --image-url, or --package.\n");
    return 1;
  }
  const cwd = resolve(readFlag(rest, "--cwd") ?? process.cwd());
  const mediaRoot = resolve(cwd, readFlag(rest, "--media") ?? "media");
  const description = readFlag(rest, "--description");
  const imageMediaId = readFlag(rest, "--image-id");
  try {
    const result = await addDummyProduct({
      packagePath: resolve(cwd, packagePath),
      mediaRoot,
      name,
      price,
      imageUrl,
      ...(description !== undefined ? { description } : {}),
      ...(imageMediaId !== undefined ? { imageMediaId } : {}),
    });
    process.stdout.write(
      `Added product "${result.product.name}" (${String(result.count)}/${String(MAX_DUMMY_PRODUCTS)})\n`,
    );
    process.stdout.write(`Image ${result.mediaId} → ${result.mediaPath}\n`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`products add failed: ${message}\n`);
    return 1;
  }
}

function runInit(args: string[]): number {
  const root = resolve(readFlag(args, "--cwd") ?? process.cwd());
  const name = readFlag(args, "--name") ?? "Site Child";
  const slug = readFlag(args, "--slug") ?? slugify(name);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    process.stderr.write("Invalid --slug. Use lowercase kebab-case.\n");
    return 1;
  }
  const result = initProject(root, slug, name, {
    woocommerce: hasFlag(args, "--woocommerce"),
  });
  process.stdout.write(`Wrote ${result.packagePath}\n`);
  process.stdout.write(`Media folder: ${result.mediaDir}\n`);
  process.stdout.write(`Skill: ${result.skill.targetDir}\n`);
  if (hasFlag(args, "--woocommerce")) {
    process.stdout.write("WooCommerce enabled in package (plugins includes woocommerce).\n");
  }
  process.stdout.write(
    "Next: run plugin-zip for WordPress upload, add images (media fetch or copy into media/), edit ctw-package.json, then generate.\n",
  );
  return 0;
}

function runValidate(args: string[]): number {
  const packagePath = readFlag(args, "--package");
  if (packagePath === undefined) {
    process.stderr.write("Missing --package.\n");
    return 1;
  }
  try {
    const pkg = readPackageFromFile(resolve(packagePath));
    process.stdout.write(
      `Valid package for theme ${pkg.theme.slug} (${pkg.pages.length} pages, woo=${String(pkg.woocommerce.enabled)})\n`,
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Invalid package: ${message}\n`);
    return 1;
  }
}

async function runGenerate(args: string[]): Promise<number> {
  const packagePath = readFlag(args, "--package");
  const outPath = readFlag(args, "--out");
  const mediaRoot = readFlag(args, "--media");
  if (packagePath === undefined || outPath === undefined) {
    process.stderr.write("Missing --package or --out.\n");
    return 1;
  }
  try {
    const resolvedPackage = resolve(packagePath);
    const pkg = readPackageFromFile(resolvedPackage);
    const resolvedMedia =
      mediaRoot !== undefined
        ? resolve(mediaRoot)
        : pkg.media.length > 0
          ? resolve("media")
          : undefined;

    if (pkg.media.length > 0 && resolvedMedia === undefined) {
      process.stderr.write("Package declares media but --media was not set.\n");
      return 1;
    }

    if (resolvedMedia !== undefined && pkg.media.length > 0) {
      const sync = await syncPackageMedia({ pkg, mediaRoot: resolvedMedia });
      if (sync.downloaded.length > 0) {
        process.stdout.write(
          `Fetched ${String(sync.downloaded.length)} media file(s) into ${resolvedMedia}\n`,
        );
      }
    }

    const result = generateChildThemeZip({
      packagePath: resolvedPackage,
      outputPath: resolve(outPath),
      ...(resolvedMedia !== undefined ? { mediaRoot: resolvedMedia } : {}),
    });
    process.stdout.write(
      `Wrote ${result.outputPath} for theme ${result.package.theme.slug}\n`,
    );
    process.stdout.write(
      "Install ctw-native (npx … plugin-zip), upload the child ZIP, open CTW Native → Setup, import once.\n",
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Generate failed: ${message}\n`);
    return 1;
  }
}

async function main(argv: string[]): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h") || argv.length === 0) {
    printHelp();
    return 0;
  }

  const [command, ...rest] = argv;
  switch (command) {
    case "skill":
      return runSkill(rest);
    case "plugin-zip":
      return runPluginZip(rest);
    case "media":
      return runMedia(rest);
    case "products":
      return runProducts(rest);
    case "init":
      return runInit(rest);
    case "validate":
      return runValidate(rest);
    case "generate":
      return runGenerate(rest);
    default:
      process.stderr.write(`Unknown command: ${String(command)}\n`);
      printHelp();
      return 1;
  }
}

const code = await main(process.argv.slice(2));
process.exitCode = code;
