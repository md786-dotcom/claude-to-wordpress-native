import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { addDummyProduct, MAX_DUMMY_PRODUCTS } from "../src/products.js";
import type { FetchLike } from "../src/media-fetch.js";
import { CORE_PLUGIN_SLUGS, WOO_PLUGIN_SLUG } from "@ctw/schema";

function pngResponse(): Response {
  const bytes = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
    0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90,
    0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8,
    0xff, 0xff, 0x3f, 0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59, 0xe7, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  return new Response(bytes, {
    status: 200,
    headers: { "content-type": "image/png" },
  });
}

function writeShopPackage(path: string): void {
  const body = {
    version: 1,
    theme: { slug: "shop-child", name: "Shop Child", colors: {}, typography: {}, menus: [] },
    media: [],
    pages: [
      {
        title: "Home",
        slug: "home",
        isFrontPage: true,
        template: "elementor_header_footer",
        elements: [
          {
            id: "home001",
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
    woocommerce: { enabled: true, products: [], pages: {} },
    plugins: [...CORE_PLUGIN_SLUGS, WOO_PLUGIN_SLUG],
  };
  writeFileSync(path, `${JSON.stringify(body, null, 2)}\n`);
}

describe("addDummyProduct", () => {
  const dirs: string[] = [];
  after(() => {
    for (const dir of dirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("adds a product with fetched image and caps at 4", async () => {
    const root = mkdtempSync(join(tmpdir(), "ctw-prod-"));
    dirs.push(root);
    const packagePath = join(root, "ctw-package.json");
    const mediaRoot = join(root, "media");
    writeShopPackage(packagePath);
    const fetchImpl: FetchLike = async () => pngResponse();

    for (let i = 1; i <= MAX_DUMMY_PRODUCTS; i += 1) {
      const result = await addDummyProduct({
        packagePath,
        mediaRoot,
        name: `Item ${String(i)}`,
        price: `${String(10 + i)}.00`,
        description: "Demo",
        imageUrl: `https://images.unsplash.com/photo-${String(i)}`,
        imageMediaId: `p${String(i)}`,
        fetchImpl,
      });
      assert.equal(result.count, i);
    }

    await assert.rejects(
      () =>
        addDummyProduct({
          packagePath,
          mediaRoot,
          name: "Too many",
          price: "1.00",
          imageUrl: "https://images.unsplash.com/photo-x",
          fetchImpl,
        }),
      /capped at 4/,
    );

    const pkg = JSON.parse(readFileSync(packagePath, "utf8")) as {
      woocommerce: { products: Array<{ name: string }> };
      media: Array<{ id: string }>;
    };
    assert.equal(pkg.woocommerce.products.length, 4);
    assert.equal(pkg.media.length, 4);
  });
});
