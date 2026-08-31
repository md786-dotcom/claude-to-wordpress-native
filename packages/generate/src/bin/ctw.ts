#!/usr/bin/env node
import { resolve } from "node:path";
import { generateChildThemeZip } from "../generate.js";

function printHelp(): void {
  process.stdout.write(
    [
      "ctw generate — emit a Hello Elementor child theme ZIP",
      "",
      "Usage:",
      "  ctw generate --package <ctw-package.json> --out <theme.zip> [--media <dir>]",
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

function main(argv: string[]): number {
  if (argv.includes("--help") || argv.includes("-h") || argv.length === 0) {
    printHelp();
    return 0;
  }

  const [command, ...rest] = argv;
  if (command !== "generate") {
    process.stderr.write(`Unknown command: ${String(command)}\n`);
    printHelp();
    return 1;
  }

  const packagePath = readFlag(rest, "--package");
  const outPath = readFlag(rest, "--out");
  const mediaRoot = readFlag(rest, "--media");

  if (packagePath === undefined || outPath === undefined) {
    process.stderr.write("Missing --package or --out.\n");
    printHelp();
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
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Generate failed: ${message}\n`);
    return 1;
  }
}

process.exitCode = main(process.argv.slice(2));
