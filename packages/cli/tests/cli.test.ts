import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const bin = join(root, "dist/ctw.mjs");
const fixturePackage = join(root, "fixtures/brochure/ctw-package.json");

function run(
  args: string[],
  cwd?: string,
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [bin, ...args], {
    cwd,
    encoding: "utf8",
  });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

describe("ctw CLI", () => {
  const dirs: string[] = [];
  after(() => {
    for (const dir of dirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("prints help", () => {
    const result = run(["--help"]);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /npx -y github:md786-dotcom\/claude-to-wordpress-native skill/);
    assert.match(result.stdout, /plugin-zip/);
    assert.match(result.stdout, /--woocommerce/);
    assert.match(result.stdout, /media fetch/);
    assert.match(result.stdout, /products add/);
  });

  it("writes plugin-zip into the project directory", () => {
    const cwd = mkdtempSync(join(tmpdir(), "ctw-plugin-cli-"));
    dirs.push(cwd);
    const result = run(["plugin-zip", "--cwd", cwd]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(existsSync(join(cwd, "ctw-native.zip")));
    assert.match(result.stdout, /Wrote /);
  });

  it("rejects unknown commands", () => {
    const result = run(["nope"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unknown command/);
  });

  it("installs the skill", () => {
    const cwd = mkdtempSync(join(tmpdir(), "ctw-skill-cli-"));
    dirs.push(cwd);
    const result = run(["skill", "--cwd", cwd]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(existsSync(join(cwd, ".claude/skills/ctw-native/SKILL.md")));
    const again = run(["skill", "--cwd", cwd]);
    assert.equal(again.status, 0, again.stderr);
    assert.match(again.stdout, /Updated/);
  });

  it("validates the brochure fixture", () => {
    const result = run(["validate", "--package", fixturePackage]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Valid package/);
  });

  it("fails validate without --package", () => {
    const result = run(["validate"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Missing --package/);
  });

  it("fails validate on bad JSON package", () => {
    const cwd = mkdtempSync(join(tmpdir(), "ctw-bad-"));
    dirs.push(cwd);
    const bad = join(cwd, "bad.json");
    writeFileSync(bad, '{"version":1}\n', "utf8");
    const result = run(["validate", "--package", bad]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Invalid package/);
  });

  it("rejects invalid slug on init", () => {
    const result = run(["init", "--slug", "BAD_SLUG"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Invalid --slug/);
  });

  it("fails generate without required flags", () => {
    const result = run(["generate"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Missing --package or --out/);
  });

  it("inits and generates a zip", () => {
    const cwd = mkdtempSync(join(tmpdir(), "ctw-cli-"));
    dirs.push(cwd);
    const init = run(
      ["init", "--cwd", cwd, "--name", "Demo Child", "--slug", "demo-child"],
      cwd,
    );
    assert.equal(init.status, 0, init.stderr);
    assert.ok(existsSync(join(cwd, "ctw-package.json")));
    assert.ok(existsSync(join(cwd, ".claude/skills/ctw-native/SKILL.md")));

    const out = join(cwd, "demo-child.zip");
    const gen = run(
      [
        "generate",
        "--package",
        join(cwd, "ctw-package.json"),
        "--out",
        out,
        "--media",
        join(cwd, "media"),
      ],
      cwd,
    );
    assert.equal(gen.status, 0, gen.stderr);
    assert.ok(existsSync(out));
  });

  it("reports generate failures", () => {
    const cwd = mkdtempSync(join(tmpdir(), "ctw-gen-fail-"));
    dirs.push(cwd);
    const missing = join(cwd, "missing.json");
    const result = run([
      "generate",
      "--package",
      missing,
      "--out",
      join(cwd, "out.zip"),
    ]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Generate failed/);
  });
});
