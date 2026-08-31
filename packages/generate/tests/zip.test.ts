import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CORE_PLUGIN_SLUGS, WOO_PLUGIN_SLUG } from "@ctw/schema";
import {
  buildChildThemeZip,
  generateChildThemeZip,
  listZipPaths,
  readPackageFromJsonText,
  readZipText,
  zipContains,
} from "../src/index.js";

function samplePackage(enabledWoo: boolean): string {
  return JSON.stringify({
    version: 1,
    theme: {
      slug: "demo-child",
      name: "Demo Child",
      colors: { primary: "#224466" },
      typography: {},
      menus: [],
    },
    media: [],
    pages: [
      {
        title: "Home",
        slug: "home",
        isFrontPage: true,
        template: "elementor_header_footer",
        elements: [
          {
            id: "c1",
            elType: "container",
            widgetType: null,
            isInner: false,
            settings: {},
            elements: [
              {
                id: "w1",
                elType: "widget",
                widgetType: "heading",
                isInner: false,
                settings: { title: "Demo" },
                elements: [],
              },
            ],
          },
        ],
      },
    ],
    forms: [],
    snippets: [],
    woocommerce: { enabled: enabledWoo },
    plugins: enabledWoo
      ? [...CORE_PLUGIN_SLUGS, WOO_PLUGIN_SLUG]
      : [...CORE_PLUGIN_SLUGS],
  });
}

describe("buildChildThemeZip", () => {
  it("emits Template hello-elementor and ctw-package.json", () => {
    const pkg = readPackageFromJsonText(samplePackage(false));
    const zip = buildChildThemeZip({ package: pkg });
    assert.equal(zipContains(zip, "demo-child/ctw-package.json"), true);
    const style = readZipText(zip, "demo-child/style.css");
    assert.match(style, /Template:\s*hello-elementor/);
    assert.equal(zipContains(zip, "demo-child/woocommerce/archive-product.php"), false);
  });

  it("includes woocommerce templates and design tokens when enabled", () => {
    const pkg = readPackageFromJsonText(samplePackage(true));
    const zip = buildChildThemeZip({ package: pkg });
    assert.equal(zipContains(zip, "demo-child/woocommerce/archive-product.php"), true);
    assert.equal(zipContains(zip, "demo-child/woocommerce/single-product.php"), true);
    const php = readZipText(zip, "demo-child/functions.php");
    assert.match(php, /--ctw-primary/);
    assert.match(php, /\.woocommerce/);
  });

  it("writes a zip file via generateChildThemeZip", () => {
    const dir = mkdtempSync(join(tmpdir(), "ctw-"));
    const packagePath = join(dir, "ctw-package.json");
    const outPath = join(dir, "out", "demo-child.zip");
    writeFileSync(packagePath, samplePackage(false));
    const result = generateChildThemeZip({
      packagePath,
      outputPath: outPath,
    });
    assert.equal(result.outputPath, outPath);
    const bytes = readFileSync(outPath);
    assert.ok(bytes.byteLength > 100);
  });

  it("functions.php does not dequeue custom css", () => {
    const pkg = readPackageFromJsonText(samplePackage(false));
    const zip = buildChildThemeZip({ package: pkg });
    const php = readZipText(zip, "demo-child/functions.php");
    assert.equal(php.includes("dequeue"), false);
    assert.equal(php.includes("wp_custom_css_cb"), false);
  });

  it("listZipPaths returns sorted entries", () => {
    const pkg = readPackageFromJsonText(samplePackage(false));
    const zip = buildChildThemeZip({ package: pkg });
    const paths = listZipPaths(zip);
    assert.ok(paths.includes("demo-child/style.css"));
    assert.deepEqual(paths, [...paths].sort());
  });

  it("readZipText throws for missing entries", () => {
    const pkg = readPackageFromJsonText(samplePackage(false));
    const zip = buildChildThemeZip({ package: pkg });
    assert.throws(() => readZipText(zip, "missing.txt"));
  });

  it("accepts the brochure fixture", () => {
    const fixture = readFileSync(
      join(process.cwd(), "../../fixtures/brochure/ctw-package.json"),
      "utf8",
    );
    const pkg = readPackageFromJsonText(fixture);
    assert.equal(pkg.theme.slug, "clearflow-child");
    const zip = buildChildThemeZip({ package: pkg });
    assert.equal(zipContains(zip, "clearflow-child/ctw-package.json"), true);
  });
});
