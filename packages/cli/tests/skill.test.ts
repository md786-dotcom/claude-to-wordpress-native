import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import {
  initProject,
  installSkill,
  readSkillMarkdown,
  skillAssetsDir,
} from "../src/index.js";

describe("skill assets", () => {
  it("resolves packaged or repo skill markdown", () => {
    const markdown = readSkillMarkdown();
    assert.match(markdown, /ctw-native/);
    assert.match(markdown, /claude-to-wordpress-native/);
    assert.match(markdown, /content_width/);
    assert.match(markdown, /full width only|never boxed/i);
    assert.match(markdown, /plugin-zip/);
    assert.ok(existsSync(join(skillAssetsDir(), "SKILL.md")));
  });
});

describe("installSkill", () => {
  const dirs: string[] = [];
  after(() => {
    for (const dir of dirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("copies the skill into .claude/skills/ctw-native", () => {
    const root = mkdtempSync(join(tmpdir(), "ctw-skill-"));
    dirs.push(root);
    const first = installSkill(root);
    assert.equal(first.created, true);
    assert.ok(existsSync(join(first.targetDir, "SKILL.md")));
    const second = installSkill(root);
    assert.equal(second.created, false);
  });
});

describe("initProject", () => {
  const dirs: string[] = [];
  after(() => {
    for (const dir of dirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("scaffolds package, media, and skill", () => {
    const root = mkdtempSync(join(tmpdir(), "ctw-init-"));
    dirs.push(root);
    const result = initProject(root, "acme-child", "Acme Child");
    assert.ok(existsSync(result.packagePath));
    assert.ok(existsSync(result.mediaDir));
    assert.ok(existsSync(join(result.skill.targetDir, "SKILL.md")));
    const pkg = JSON.parse(readFileSync(result.packagePath, "utf8")) as {
      theme: { slug: string };
      woocommerce: { enabled: boolean };
      plugins: string[];
      pages: Array<{ elements: Array<{ settings?: { content_width?: string } }> }>;
    };
    assert.equal(pkg.theme.slug, "acme-child");
    assert.equal(pkg.woocommerce.enabled, false);
    assert.ok(!pkg.plugins.includes("woocommerce"));
    assert.equal(pkg.pages[0]?.elements[0]?.settings?.content_width, "full");
  });

  it("scaffolds a WooCommerce shop package with --woocommerce options", () => {
    const root = mkdtempSync(join(tmpdir(), "ctw-init-woo-"));
    dirs.push(root);
    const result = initProject(root, "shop-child", "Shop Child", { woocommerce: true });
    const pkg = JSON.parse(readFileSync(result.packagePath, "utf8")) as {
      woocommerce: { enabled: boolean };
      plugins: string[];
    };
    assert.equal(pkg.woocommerce.enabled, true);
    assert.ok(pkg.plugins.includes("woocommerce"));
  });
});
