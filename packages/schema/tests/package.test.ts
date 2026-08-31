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

  it("accepts php snippets for WPCode Free", () => {
    const input = basePackage();
    input.snippets = [
      {
        title: "Woo tweak",
        code: "<?php add_filter( 'woocommerce_enqueue_styles', '__return_empty_array' );",
        type: "php",
        location: "everywhere",
      },
    ];
    const pkg = parsePackageJson(input);
    assert.equal(pkg.snippets[0]?.type, "php");
    assert.equal(pkg.snippets[0]?.location, "everywhere");
  });

  it("defaults css js html location to header and php to everywhere", () => {
    const input = basePackage();
    input.snippets = [
      { title: "A", code: "body{}", type: "css" },
      { title: "B", code: "console.log(1)", type: "js" },
      { title: "C", code: "<div></div>", type: "html" },
      { title: "D", code: "<?php // ok", type: "php" },
    ];
    const pkg = parsePackageJson(input);
    assert.equal(pkg.snippets[0]?.location, "header");
    assert.equal(pkg.snippets[1]?.location, "header");
    assert.equal(pkg.snippets[2]?.location, "header");
    assert.equal(pkg.snippets[3]?.location, "everywhere");
  });

  it("rejects everywhere on css js and html for WPCode Free", () => {
    for (const type of ["css", "js", "html"] as const) {
      const input = basePackage();
      input.snippets = [{ title: "Bad", code: "x{}", type, location: "everywhere" }];
      const result = safeParsePackageJson(input);
      assert.equal(result.success, false, `${type} everywhere must fail`);
    }
  });

  it("rejects WPCode Pro snippet types", () => {
    const input = basePackage();
    input.snippets = [
      {
        title: "Pro",
        code: "$c:#f00;",
        type: "scss",
        location: "header",
      } satisfies { [key: string]: JsonValue },
    ];
    const result = safeParsePackageJson(input);
    assert.equal(result.success, false);
  });

  it("accepts up to 4 dummy products when woo enabled", () => {
    const input = basePackage();
    input.woocommerce = {
      enabled: true,
      products: [
        {
          name: "Mug",
          price: "12.00",
          description: "Ceramic mug",
          imageMediaId: "mug",
        },
      ],
      pages: {
        shop: {
          title: "Shop",
          elements: [
            {
              id: "shop001",
              elType: "container",
              widgetType: null,
              isInner: false,
              settings: {},
              elements: [
                {
                  id: "shop002",
                  elType: "widget",
                  widgetType: "shortcode",
                  isInner: false,
                  settings: { shortcode: "[products limit=\"4\"]" },
                  elements: [],
                },
              ],
            },
          ],
        },
      },
    };
    input.media = [{ id: "mug", path: "mug.jpg", alt: "Mug" }];
    input.plugins = [...CORE_PLUGIN_SLUGS, WOO_PLUGIN_SLUG];
    const pkg = parsePackageJson(input);
    assert.equal(pkg.woocommerce.products.length, 1);
    assert.equal(pkg.woocommerce.pages.shop?.title, "Shop");
  });

  it("rejects more than 4 products", () => {
    const input = basePackage();
    input.plugins = [...CORE_PLUGIN_SLUGS, WOO_PLUGIN_SLUG];
    input.media = [
      { id: "a", path: "a.jpg", alt: "" },
      { id: "b", path: "b.jpg", alt: "" },
      { id: "c", path: "c.jpg", alt: "" },
      { id: "d", path: "d.jpg", alt: "" },
      { id: "e", path: "e.jpg", alt: "" },
    ];
    input.woocommerce = {
      enabled: true,
      products: ["a", "b", "c", "d", "e"].map((id) => ({
        name: id,
        price: "1",
        description: "",
        imageMediaId: id,
      })),
    };
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

  it("accepts css js html and php snippets", () => {
    const input = basePackage();
    input.snippets = [
      { title: "A", code: "body{}", type: "css", location: "header" },
      { title: "B", code: "console.log(1)", type: "js", location: "footer" },
      { title: "C", code: "<div></div>", type: "html", location: "header" },
      { title: "D", code: "<?php // ok", type: "php", location: "everywhere" },
    ];
    const pkg = parsePackageJson(input);
    assert.equal(pkg.snippets.length, 4);
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
