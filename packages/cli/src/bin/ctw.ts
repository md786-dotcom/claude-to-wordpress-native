#!/usr/bin/env node
import { resolve } from "node:path";
import { generateChildThemeZip, readPackageFromFile } from "@ctw/generate";
import { initProject, installSkill } from "../skill.js";

function printHelp(): void {
  process.stdout.write(
    [
      "claude-to-wordpress-native (ctw) — Claude Code toolchain",
      "",
      "Simple start:",
      "  npx claude-to-wordpress-native skill",
      "  npx claude-to-wordpress-native init --name \"Acme Child\" --slug acme-child",
      "  npx claude-to-wordpress-native generate --package ./ctw-package.json --out ./acme-child.zip",
      "",
      "Commands:",
      "  skill              Install the Claude Code skill into .claude/skills/ctw-native",
      "  init               Scaffold ctw-package.json, media/, and the Claude Code skill",
      "  validate           Validate a ctw-package.json without writing a ZIP",
      "  generate           Emit a Hello Elementor child theme ZIP",
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

function runInit(args: string[]): number {
  const root = resolve(readFlag(args, "--cwd") ?? process.cwd());
  const name = readFlag(args, "--name") ?? "Site Child";
  const slug = readFlag(args, "--slug") ?? slugify(name);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    process.stderr.write("Invalid --slug. Use lowercase kebab-case.\n");
    return 1;
  }
  const result = initProject(root, slug, name);
  process.stdout.write(`Wrote ${result.packagePath}\n`);
  process.stdout.write(`Media folder: ${result.mediaDir}\n`);
  process.stdout.write(`Skill: ${result.skill.targetDir}\n`);
  process.stdout.write(
    "Next: edit ctw-package.json (or ask Claude Code), then run generate.\n",
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

function runGenerate(args: string[]): number {
  const packagePath = readFlag(args, "--package");
  const outPath = readFlag(args, "--out");
  const mediaRoot = readFlag(args, "--media");
  if (packagePath === undefined || outPath === undefined) {
    process.stderr.write("Missing --package or --out.\n");
    return 1;
  }
  try {
    const result = generateChildThemeZip({
      packagePath: resolve(packagePath),
      outputPath: resolve(outPath),
      ...(mediaRoot !== undefined ? { mediaRoot: resolve(mediaRoot) } : {}),
    });
    process.stdout.write(
      `Wrote ${result.outputPath} for theme ${result.package.theme.slug}\n`,
    );
    process.stdout.write(
      "Install ctw-native in WordPress, upload this ZIP, open CTW Native → Setup, import once.\n",
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Generate failed: ${message}\n`);
    return 1;
  }
}

function main(argv: string[]): number {
  if (argv.includes("--help") || argv.includes("-h") || argv.length === 0) {
    printHelp();
    return 0;
  }

  const [command, ...rest] = argv;
  switch (command) {
    case "skill":
      return runSkill(rest);
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

process.exitCode = main(process.argv.slice(2));
