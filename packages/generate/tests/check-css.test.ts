import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { CORE_PLUGIN_SLUGS, WOO_PLUGIN_SLUG } from "@ctw/schema";
import {
  assertPackageCss,
  checkPackageCss,
  formatCssIssues,
  generateChildThemeZip,
  readPackageFromJsonText,
  scanCssStructure,
} from "../src/index.js";
import { cssRuleSelectors, selectorTargetsWoo } from "../src/check-css-policy.js";

const truncatedHeroCss = `.grid-2 > .e-con-inner,.grid-2,.grid-3 > .e-con-inner,.grid-3,
.grid-4 > .e-con-inner,.grid-4,.split > .e-con-inner,.split,
.foot-grid > .e-con-inner,.foot-grid{grid-template-columns:1fr !important;`;

type SnippetInput = {
  title: string;
  type: "css" | "js" | "html" | "php";
  code: string;
};

type PageInput = {
  title: string;
  slug: string;
  isFrontPage: boolean;
  template: string;
  elements: Array<{
    id: string;
    elType: string;
    widgetType: string | null;
    isInner: boolean;
    settings: { [key: string]: string };
    elements: [];
  }>;
};

function packageWithSnippets(
  snippets: SnippetInput[],
  pages?: PageInput[],
  options?: { woocommerce?: boolean },
): string {
  const woo = options?.woocommerce === true;
  return JSON.stringify({
    version: 1,
    theme: {
      slug: "demo-child",
      name: "Demo Child",
      colors: {},
      typography: {},
      menus: [],
    },
    media: [],
    pages: pages ?? [
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
            settings: { content_width: "full" },
            elements: [],
          },
        ],
      },
    ],
    forms: [],
    snippets,
    woocommerce: { enabled: woo },
    plugins: woo ? [...CORE_PLUGIN_SLUGS, WOO_PLUGIN_SLUG] : [...CORE_PLUGIN_SLUGS],
  });
}

function shopCss(code: string, title = "Woo"): string {
  return packageWithSnippets([{ title, type: "css", code }], undefined, {
    woocommerce: true,
  });
}

describe("scanCssStructure", () => {
  it("accepts balanced rules including a child combinator", () => {
    const css = ".grid-2 > .e-con-inner,.grid-2{display:grid;grid-template-columns:1fr 1fr;}";
    assert.deepEqual(scanCssStructure(css), []);
  });

  it("flags the truncated hero grid rule", () => {
    const messages = scanCssStructure(truncatedHeroCss);
    assert.equal(messages.length, 1);
    assert.match(messages[0] ?? "", /unclosed \{/);
  });

  it("flags extra closing braces", () => {
    assert.match(scanCssStructure("h1{color:red;}}")[0] ?? "", /extra \}/);
  });

  it("flags unclosed comments and strings", () => {
    assert.match(scanCssStructure("/* oops")[0] ?? "", /unclosed CSS comment/);
    assert.match(scanCssStructure("h1{content:\"oops}")[0] ?? "", /unclosed CSS string/);
  });

  it("ignores braces inside comments and strings", () => {
    assert.deepEqual(scanCssStructure("/* { } */ h1{color:'{';}"), []);
    assert.deepEqual(scanCssStructure("h1{content:\"\\\\{\";}"), []);
  });
});

describe("checkPackageCss", () => {
  it("rejects brochure css snippets", () => {
    const pkg = readPackageFromJsonText(
      packageWithSnippets([
        {
          title: "Hero",
          type: "css",
          code: ".grid-2,.grid-2 .e-con-inner{display:grid;grid-template-columns:1fr 1fr;}",
        },
      ]),
    );
    assert.match(checkPackageCss(pkg)[0]?.message ?? "", /Brochure packages/);
  });

  it("allows a Woo-scoped css snippet that uses > as a combinator", () => {
    const pkg = readPackageFromJsonText(
      shopCss(".woocommerce .products > li{margin:0;}"),
    );
    assert.deepEqual(checkPackageCss(pkg), []);
  });

  it("rejects page selectors on shop css snippets", () => {
    const pkg = readPackageFromJsonText(
      shopCss(".grid-2,.grid-2 .e-con-inner{display:grid;}"),
    );
    assert.match(checkPackageCss(pkg)[0]?.message ?? "", /not WooCommerce-scoped/);
  });

  it("rejects html snippets with style blocks", () => {
    const pkg = readPackageFromJsonText(
      packageWithSnippets([
        {
          title: "Reset",
          type: "html",
          code: "<style>body{margin:0;}</style>",
        },
      ]),
    );
    assert.match(checkPackageCss(pkg)[0]?.message ?? "", /HTML <style>/);
  });

  it("rejects HTML-escaped and backslash-escaped combinators", () => {
    const htmlEscaped = readPackageFromJsonText(
      shopCss(".woocommerce .products &gt; li{margin:0;}"),
    );
    const slashEscaped = readPackageFromJsonText(
      shopCss(".woocommerce .products \\> li{margin:0;}"),
    );
    assert.match(checkPackageCss(htmlEscaped)[0]?.message ?? "", /HTML-escape/);
    assert.match(checkPackageCss(slashEscaped)[0]?.message ?? "", /backslash-escape/);
  });

  it("rejects style wrappers on css snippets", () => {
    const pkg = readPackageFromJsonText(
      shopCss("<style>.woocommerce{color:red;}</style>"),
    );
    assert.match(checkPackageCss(pkg)[0]?.message ?? "", /raw CSS/);
  });

  it("rejects style tags inside html widgets", () => {
    const pkg = readPackageFromJsonText(
      packageWithSnippets([], [
        {
          title: "Home",
          slug: "home",
          isFrontPage: true,
          template: "elementor_header_footer",
          elements: [
            {
              id: "whtml",
              elType: "widget",
              widgetType: "html",
              isInner: false,
              settings: {
                html: "<style>.grid-2 > .e-con-inner{display:grid;}</style>",
              },
              elements: [],
            },
          ],
        },
      ]),
    );
    assert.match(checkPackageCss(pkg)[0]?.message ?? "", /HTML <style>/);
  });

  it("rejects _css_classes on containers", () => {
    const pkg = readPackageFromJsonText(
      packageWithSnippets([], [
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
              settings: { _css_classes: "grid-2" },
              elements: [],
            },
          ],
        },
      ]),
    );
    assert.match(checkPackageCss(pkg)[0]?.message ?? "", /CSS classes/);
  });

  it("rejects package header and footer keys", () => {
    const pkg = readPackageFromJsonText(
      JSON.stringify({
        version: 1,
        theme: {
          slug: "demo-child",
          name: "Demo Child",
          colors: {},
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
                settings: { content_width: "full" },
                elements: [],
              },
            ],
          },
        ],
        header: { title: "Header", elements: [] },
        footer: { title: "Footer", elements: [] },
        forms: [],
        snippets: [],
        woocommerce: { enabled: false },
        plugins: [...CORE_PLUGIN_SLUGS],
      }),
    );
    const messages = checkPackageCss(pkg).map((issue) => issue.message).join("\n");
    assert.match(messages, /Do not emit a package header template/);
    assert.match(messages, /Do not emit a package footer template/);
  });

  it("allows Woo-scoped :hover in shop css snippets", () => {
    const pkg = readPackageFromJsonText(
      shopCss(".woocommerce a.button:hover{background:#111;}"),
    );
    assert.deepEqual(checkPackageCss(pkg), []);
  });

  it("rejects page :hover selectors in shop css snippets", () => {
    const pkg = readPackageFromJsonText(shopCss("a:hover{color:red;}"));
    assert.match(checkPackageCss(pkg)[0]?.message ?? "", /:hover|:focus|::before|not WooCommerce-scoped/);
  });

  it("rejects Font Awesome CDN html snippets", () => {
    const pkg = readPackageFromJsonText(
      packageWithSnippets([
        {
          title: "FA CDN",
          type: "html",
          location: "header",
          code:
            '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/css/all.min.css" />',
        },
      ]),
    );
    assert.match(checkPackageCss(pkg)[0]?.message ?? "", /Font Awesome|Web Awesome|fa-/i);
  });

  it("rejects fa-solid selected_icon classes", () => {
    const pkg = readPackageFromJsonText(
      packageWithSnippets([], [
        {
          title: "Home",
          slug: "home",
          isFrontPage: true,
          template: "elementor_header_footer",
          elements: [
            {
              id: "i1",
              elType: "widget",
              widgetType: "icon",
              isInner: false,
              settings: {
                selected_icon: { value: "fas fa-home", library: "fa-solid" },
              },
              elements: [],
            },
          ],
        },
      ]),
    );
    assert.match(checkPackageCss(pkg)[0]?.message ?? "", /Font Awesome|fa-/i);
  });

  it("rejects hover_animation on elements", () => {
    const pkg = readPackageFromJsonText(
      packageWithSnippets([], [
        {
          title: "Home",
          slug: "home",
          isFrontPage: true,
          template: "elementor_header_footer",
          elements: [
            {
              id: "b1",
              elType: "widget",
              widgetType: "button",
              isInner: false,
              settings: { hover_animation: "grow" },
              elements: [],
            },
          ],
        },
      ]),
    );
    assert.match(checkPackageCss(pkg)[0]?.message ?? "", /hover-animation|motion/i);
  });

  it("flags custom_css and widget style blocks on pages", () => {
    const pkg = readPackageFromJsonText(
      JSON.stringify({
        version: 1,
        theme: {
          slug: "demo-child",
          name: "Demo Child",
          colors: {},
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
                settings: { custom_css: "h2{font-weight:700;}" },
                elements: [],
              },
            ],
          },
        ],
        forms: [],
        snippets: [],
        woocommerce: {
          enabled: true,
          pages: {
            shop: {
              title: "Shop",
              elements: [
                {
                  id: "s1",
                  elType: "widget",
                  widgetType: "html",
                  isInner: false,
                  settings: { html: "<style>.shop{display:block;}</style>" },
                  elements: [],
                },
              ],
            },
          },
        },
        plugins: [...CORE_PLUGIN_SLUGS, WOO_PLUGIN_SLUG],
      }),
    );
    const messages = checkPackageCss(pkg).map((issue) => issue.message).join("\n");
    assert.match(messages, /custom_css/);
    assert.match(messages, /HTML <style>/);
  });

  it("formatCssIssues lists every path", () => {
    const text = formatCssIssues([
      { path: "snippets[0]", message: "unclosed {" },
    ]);
    assert.match(text, /CSS check failed with 1 error/);
    assert.match(text, /snippets\[0\]: unclosed \{/);
  });

  it("assertPackageCss throws the formatted list", () => {
    const pkg = readPackageFromJsonText(
      packageWithSnippets([{ title: "Hero", type: "css", code: truncatedHeroCss }]),
    );
    assert.throws(() => assertPackageCss(pkg), /unclosed \{/);
  });

  it("assertPackageCss is a no-op when CSS is valid", () => {
    const pkg = readPackageFromJsonText(packageWithSnippets([]));
    assert.doesNotThrow(() => assertPackageCss(pkg));
  });
});

describe("cssRuleSelectors", () => {
  it("reads nested media queries and skips keyframes", () => {
    const css = `
      .woocommerce ul.products{display:grid;}
      @media (max-width: 768px){.woocommerce ul.products{display:block;}}
      @keyframes pulse{0%{opacity:1;}100%{opacity:0;}}
    `;
    assert.deepEqual(cssRuleSelectors(css), [
      ".woocommerce ul.products",
      ".woocommerce ul.products",
    ]);
    assert.equal(selectorTargetsWoo(".woocommerce ul.products"), true);
    assert.equal(selectorTargetsWoo(".grid-2 .e-con-inner"), false);
    assert.equal(selectorTargetsWoo(".ctw-woo-archive h1"), true);
  });
});

describe("generateChildThemeZip CSS gate", () => {
  it("refuses a ZIP when a css snippet is truncated", () => {
    const dir = mkdtempSync(join(tmpdir(), "ctw-css-gen-"));
    const pkgPath = join(dir, "ctw-package.json");
    writeFileSync(
      pkgPath,
      packageWithSnippets([{ title: "Hero", type: "css", code: truncatedHeroCss }]),
      "utf8",
    );
    assert.throws(
      () =>
        generateChildThemeZip({
          packagePath: pkgPath,
          outputPath: join(dir, "out.zip"),
        }),
      /CSS check failed/,
    );
  });
});
