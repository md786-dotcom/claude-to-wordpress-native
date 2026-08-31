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

function packageWithSnippets(snippets: SnippetInput[], pages?: PageInput[]): string {
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
    woocommerce: { enabled: false },
    plugins: [...CORE_PLUGIN_SLUGS],
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
  it("allows a complete css snippet that uses > as a combinator", () => {
    const pkg = readPackageFromJsonText(
      packageWithSnippets([
        {
          title: "Hero",
          type: "css",
          code: ".grid-2,.grid-2 .e-con-inner{display:grid;grid-template-columns:1fr 1fr;}",
        },
      ]),
    );
    assert.deepEqual(checkPackageCss(pkg), []);
  });

  it("accepts html snippets with balanced style blocks", () => {
    const pkg = readPackageFromJsonText(
      packageWithSnippets([
        {
          title: "Reset",
          type: "html",
          code: "<style>body{margin:0;}</style>",
        },
      ]),
    );
    assert.deepEqual(checkPackageCss(pkg), []);
  });

  it("rejects child combinators in html snippet style tags", () => {
    const pkg = readPackageFromJsonText(
      packageWithSnippets([
        {
          title: "Bad",
          type: "html",
          code: "<style>.a > .b{color:red;}</style>",
        },
      ]),
    );
    assert.match(checkPackageCss(pkg)[0]?.message ?? "", /Child combinator/);
  });

  it("rejects HTML-escaped and backslash-escaped combinators", () => {
    const htmlEscaped = readPackageFromJsonText(
      packageWithSnippets([
        {
          title: "Hero",
          type: "css",
          code: ".grid-2 &gt; .e-con-inner{display:grid;}",
        },
      ]),
    );
    const slashEscaped = readPackageFromJsonText(
      packageWithSnippets([
        {
          title: "Hero",
          type: "css",
          code: ".grid-2 \\> .e-con-inner{display:grid;}",
        },
      ]),
    );
    assert.match(checkPackageCss(htmlEscaped)[0]?.message ?? "", /HTML-escape/);
    assert.match(checkPackageCss(slashEscaped)[0]?.message ?? "", /backslash-escape/);
  });

  it("rejects style wrappers on css snippets", () => {
    const pkg = readPackageFromJsonText(
      packageWithSnippets([
        {
          title: "Hero",
          type: "css",
          code: "<style>h1{color:red;}</style>",
        },
      ]),
    );
    assert.match(checkPackageCss(pkg)[0]?.message ?? "", /raw CSS/);
  });

  it("rejects child combinators inside html widget style tags", () => {
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
    assert.match(checkPackageCss(pkg)[0]?.message ?? "", /Child combinator/);
  });

  it("checks header, footer, text-editor, custom_css, and woo pages", () => {
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
        header: {
          title: "Head",
          elements: [
            {
              id: "h1",
              elType: "widget",
              widgetType: "html",
              isInner: false,
              settings: { html: "<style>a{color:red;}</style>" },
              elements: [],
            },
          ],
        },
        footer: {
          title: "Foot",
          elements: [
            {
              id: "f1",
              elType: "widget",
              widgetType: "text-editor",
              isInner: false,
              settings: { editor: "<style>p{margin:0;}</style>" },
              elements: [],
            },
          ],
        },
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
    assert.deepEqual(checkPackageCss(pkg), []);
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
