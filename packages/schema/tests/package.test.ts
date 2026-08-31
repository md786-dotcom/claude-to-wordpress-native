import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CORE_PLUGIN_SLUGS,
  declaredPlugins,
  FREE_WIDGET_SET,
  parsePackageJson,
  safeParsePackageJson,
  type JsonValue,
  WOO_PLUGIN_SLUG,
} from "../src/index.js";

function basePackage(): { [key: string]: JsonValue } {
  return {
    version: 1,
    theme: {
      slug: "acme-child",
      name: "Acme Child",
      colors: { primary: "#112233" },
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
            id: "abc123",
            elType: "container",
            widgetType: null,
            isInner: false,
            settings: {},
            elements: [
              {
                id: "def456",
                elType: "widget",
                widgetType: "heading",
                isInner: false,
                settings: { title: "Hello" },
                elements: [],
              },
            ],
          },
        ],
      },
    ],
    forms: [],
    snippets: [],
    woocommerce: { enabled: false },
    plugins: [...CORE_PLUGIN_SLUGS],
  };
}

describe("parsePackageJson", () => {
  it("accepts a valid brochure package", () => {
    const pkg = parsePackageJson(basePackage());
    assert.equal(pkg.theme.slug, "acme-child");
    assert.equal(pkg.woocommerce.enabled, false);
    assert.deepEqual(declaredPlugins(pkg), [...CORE_PLUGIN_SLUGS]);
  });

  it("requires woocommerce plugin when enabled", () => {
    const input = basePackage();
    input.woocommerce = { enabled: true };
    const result = safeParsePackageJson(input);
    assert.equal(result.success, false);
  });

  it("accepts shop package with woocommerce plugin", () => {
    const input = basePackage();
    input.woocommerce = { enabled: true };
    input.plugins = [...CORE_PLUGIN_SLUGS, WOO_PLUGIN_SLUG];
    const pkg = parsePackageJson(input);
    assert.equal(pkg.woocommerce.enabled, true);
    assert.ok(declaredPlugins(pkg).includes(WOO_PLUGIN_SLUG));
  });

  it("rejects php snippet type", () => {
    const input = basePackage();
    input.snippets = [
      {
        title: "Bad",
        code: "<?php echo 1;",
        type: "php",
        location: "everywhere",
      },
    ];
    const result = safeParsePackageJson(input);
    assert.equal(result.success, false);
  });

  it("rejects pro widget types", () => {
    const input = basePackage();
    input.pages = [
      {
        title: "Home",
        slug: "home",
        isFrontPage: true,
        template: "elementor_header_footer",
        elements: [
          {
            id: "pro001",
            elType: "widget",
            widgetType: "form",
            isInner: false,
            settings: {},
            elements: [],
          },
        ],
      },
    ];
    const result = safeParsePackageJson(input);
    assert.equal(result.success, false);
  });

  it("rejects packages without exactly one front page", () => {
    const input = basePackage();
    input.pages = [
      {
        title: "Home",
        slug: "home",
        isFrontPage: false,
        template: "elementor_header_footer",
        elements: [
          {
            id: "abc123",
            elType: "container",
            widgetType: null,
            isInner: false,
            settings: {},
            elements: [],
          },
        ],
      },
    ];
    const result = safeParsePackageJson(input);
    assert.equal(result.success, false);
  });

  it("rejects path traversal in media", () => {
    const input = basePackage();
    input.media = [{ id: "m1", path: "../evil.png", alt: "" }];
    const result = safeParsePackageJson(input);
    assert.equal(result.success, false);
  });

  it("accepts https sourceUrl on media", () => {
    const input = basePackage();
    input.media = [
      {
        id: "hero",
        path: "hero.jpg",
        alt: "Hero",
        sourceUrl: "https://images.unsplash.com/photo-abc",
      },
    ];
    const pkg = parsePackageJson(input);
    assert.equal(pkg.media[0]?.sourceUrl, "https://images.unsplash.com/photo-abc");
  });

  it("rejects http sourceUrl on media", () => {
    const input = basePackage();
    input.media = [
      {
        id: "hero",
        path: "hero.jpg",
        alt: "Hero",
        sourceUrl: "http://example.com/a.jpg",
      },
    ];
    const result = safeParsePackageJson(input);
    assert.equal(result.success, false);
  });

  it("lists only free widgets in the allowlist", () => {
    assert.ok(FREE_WIDGET_SET.has("heading"));
    assert.equal(FREE_WIDGET_SET.has("form"), false);
  });

  it("rejects woocommerce plugin when disabled", () => {
    const input = basePackage();
    input.plugins = [...CORE_PLUGIN_SLUGS, WOO_PLUGIN_SLUG];
    const result = safeParsePackageJson(input);
    assert.equal(result.success, false);
  });

  it("accepts css js and html snippets", () => {
    const input = basePackage();
    input.snippets = [
      { title: "A", code: "body{}", type: "css", location: "header" },
      { title: "B", code: "console.log(1)", type: "js", location: "footer" },
      { title: "C", code: "<div></div>", type: "html", location: "everywhere" },
    ];
    const pkg = parsePackageJson(input);
    assert.equal(pkg.snippets.length, 3);
  });
});

describe("package contract source", () => {
  it("matches generated FREE_WIDGET_TYPES and CORE_PLUGIN_SLUGS", async () => {
    const { readFileSync } = await import("node:fs");
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const root = join(dirname(fileURLToPath(import.meta.url)), "..");
    const contract = JSON.parse(
      readFileSync(join(root, "contract/ctw-contract.json"), "utf8"),
    ) as {
      freeWidgets: string[];
      corePlugins: string[];
      wooPlugin: string;
      snippetTypes: string[];
    };
    const { FREE_WIDGET_TYPES, SNIPPET_TYPES } = await import("../src/index.js");
    assert.deepEqual([...FREE_WIDGET_TYPES], contract.freeWidgets);
    assert.deepEqual([...CORE_PLUGIN_SLUGS], contract.corePlugins);
    assert.equal(WOO_PLUGIN_SLUG, contract.wooPlugin);
    assert.deepEqual([...SNIPPET_TYPES], contract.snippetTypes);
  });
});
