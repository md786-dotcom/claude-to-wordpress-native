import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import {
  fetchIntoPackage,
  guessMediaFilename,
  syncPackageMedia,
  type FetchLike,
} from "../src/media-fetch.js";
import type { CtwPackage } from "@ctw/schema";

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

describe("guessMediaFilename", () => {
  it("uses content-type and id", () => {
    assert.equal(
      guessMediaFilename("https://images.unsplash.com/photo-1", "image/jpeg", "Hero Shot"),
      "hero-shot.jpg",
    );
    assert.equal(
      guessMediaFilename("https://example.com/a/b/pic.webp", null, "pic"),
      "pic.webp",
    );
  });
});

describe("fetchIntoPackage https guard", () => {
  it("rejects non-https URLs", async () => {
    await assert.rejects(
      () =>
        fetchIntoPackage({
          url: "http://example.com/a.png",
          id: "x",
          mediaRoot: tmpdir(),
        }),
      /Only https/,
    );
  });
});

describe("media fetch/sync", () => {
  const dirs: string[] = [];
  after(() => {
    for (const dir of dirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("downloads into media and updates the package", async () => {
    const root = mkdtempSync(join(tmpdir(), "ctw-media-"));
    dirs.push(root);
    const mediaRoot = join(root, "media");
    const packagePath = join(root, "ctw-package.json");
    writeStarterPackage(packagePath);

    const fetchImpl: FetchLike = async () => pngResponse();
    const result = await fetchIntoPackage({
      url: "https://images.unsplash.com/photo-test",
      id: "hero",
      alt: "Hero",
      mediaRoot,
      packagePath,
      fetchImpl,
    });
    assert.equal(result.relativePath, "hero.png");
    assert.ok(existsSync(join(mediaRoot, "hero.png")));
    const pkg = JSON.parse(readFileSync(packagePath, "utf8")) as {
      media: Array<{ id: string; sourceUrl?: string }>;
    };
    assert.equal(pkg.media.length, 1);
    assert.equal(pkg.media[0]?.id, "hero");
    assert.equal(pkg.media[0]?.sourceUrl, "https://images.unsplash.com/photo-test");
  });

  it("syncs missing sourceUrl files", async () => {
    const root = mkdtempSync(join(tmpdir(), "ctw-sync-"));
    dirs.push(root);
    const mediaRoot = join(root, "media");
    const pkg: CtwPackage = {
      version: 1,
      theme: {
        slug: "demo",
        name: "Demo",
        colors: {},
        typography: {},
        menus: [],
      },
      media: [
        {
          id: "hero",
          path: "hero.png",
          alt: "",
          sourceUrl: "https://images.pexels.com/photos/1/jpeg",
        },
      ],
      pages: [
        {
          title: "Home",
          slug: "home",
          isFrontPage: true,
          template: "elementor_header_footer",
          elements: [],
        },
      ],
      forms: [],
      snippets: [],
      woocommerce: { enabled: false },
      plugins: ["elementor", "elementskit-lite", "metform", "insert-headers-and-footers"],
    };

    const fetchImpl: FetchLike = async () => pngResponse();
    const result = await syncPackageMedia({ pkg, mediaRoot, fetchImpl });
    assert.deepEqual(result.downloaded, ["hero.png"]);
    assert.ok(existsSync(join(mediaRoot, "hero.png")));
    const again = await syncPackageMedia({ pkg, mediaRoot, fetchImpl });
    assert.deepEqual(again.downloaded, []);
    assert.deepEqual(again.skipped, ["hero.png"]);
  });
});

function writeStarterPackage(path: string): void {
  const body = {
    version: 1,
    theme: { slug: "demo", name: "Demo", colors: {}, typography: {}, menus: [] },
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
    woocommerce: { enabled: false },
    plugins: ["elementor", "elementskit-lite", "metform", "insert-headers-and-footers"],
  };
  writeFileSync(path, `${JSON.stringify(body, null, 2)}\n`);
}
