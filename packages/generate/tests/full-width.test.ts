import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CORE_PLUGIN_SLUGS } from "@ctw/schema";
import {
  ensureContainerFullWidth,
  ensurePackageFullWidth,
  ensureTreeFullWidth,
  readPackageFromJsonText,
} from "../src/index.js";

describe("full-width containers", () => {
  it("sets content_width full on containers", () => {
    const settings = ensureContainerFullWidth({ flex_direction: "column" });
    assert.equal(settings.content_width, "full");
    assert.equal(settings.flex_direction, "column");
  });

  it("overrides boxed to full in a tree", () => {
    const tree = ensureTreeFullWidth([
      {
        id: "c1",
        elType: "container",
        widgetType: null,
        isInner: false,
        settings: { content_width: "boxed" },
        elements: [
          {
            id: "w1",
            elType: "widget",
            widgetType: "heading",
            isInner: false,
            settings: { title: "Hi" },
            elements: [],
          },
        ],
      },
    ]);
    assert.equal(tree[0]?.settings.content_width, "full");
  });

  it("normalizes packages on read for generate", () => {
    const pkg = readPackageFromJsonText(
      JSON.stringify({
        version: 1,
        theme: { slug: "demo-child", name: "Demo", colors: {}, typography: {}, menus: [] },
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
                elements: [],
              },
            ],
          },
        ],
        forms: [],
        snippets: [],
        woocommerce: { enabled: false },
        plugins: [...CORE_PLUGIN_SLUGS],
      }),
    );
    assert.equal(pkg.pages[0]?.elements[0]?.settings.content_width, "full");
    const again = ensurePackageFullWidth(pkg);
    assert.equal(again.pages[0]?.elements[0]?.settings.content_width, "full");
  });
});
