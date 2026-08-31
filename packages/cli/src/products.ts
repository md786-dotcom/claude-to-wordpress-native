import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CtwPackage, CtwWooProduct, JsonValue } from "@ctw/schema";
import { parsePackageJson } from "@ctw/schema";
import { fetchIntoPackage, type FetchLike } from "./media-fetch.js";

export const MAX_DUMMY_PRODUCTS = 4;

export type AddProductOptions = {
  packagePath: string;
  mediaRoot: string;
  name: string;
  price: string;
  description?: string;
  imageUrl: string;
  imageMediaId?: string;
  fetchImpl?: FetchLike;
};

export type AddProductResult = {
  product: CtwWooProduct;
  mediaId: string;
  mediaPath: string;
  packagePath: string;
  count: number;
};

/**
 * Append one dummy product (max 4). Downloads imageUrl into media/ and registers media[].
 */
export async function addDummyProduct(options: AddProductOptions): Promise<AddProductResult> {
  if (!options.imageUrl.startsWith("https://")) {
    throw new Error("Product images must use https URLs (Unsplash, Pexels, or direct).");
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(options.price)) {
    throw new Error("price must look like 19.99");
  }

  const packagePath = resolve(options.packagePath);
  const raw = JSON.parse(readFileSync(packagePath, "utf8")) as { [key: string]: JsonValue };
  const pkg = parsePackageJson(raw);

  if (!pkg.woocommerce.enabled) {
    throw new Error("Enable woocommerce.enabled (and list woocommerce in plugins) before adding products.");
  }
  if (pkg.woocommerce.products.length >= MAX_DUMMY_PRODUCTS) {
    throw new Error(`Dummy products are capped at ${String(MAX_DUMMY_PRODUCTS)}.`);
  }

  const mediaId =
    options.imageMediaId ??
    `product-${String(pkg.woocommerce.products.length + 1)}-${slugify(options.name)}`.slice(0, 64);

  const fetched = await fetchIntoPackage({
    url: options.imageUrl,
    id: mediaId,
    alt: options.name,
    mediaRoot: options.mediaRoot,
    packagePath,
    ...(options.fetchImpl !== undefined ? { fetchImpl: options.fetchImpl } : {}),
  });

  // Re-read after media update
  const nextRaw = JSON.parse(readFileSync(packagePath, "utf8")) as { [key: string]: JsonValue };
  const nextPkg = parsePackageJson(nextRaw);
  const product: CtwWooProduct = {
    name: options.name,
    price: options.price,
    description: options.description ?? "",
    imageMediaId: mediaId,
  };
  const products = [...nextPkg.woocommerce.products, product];
  const updated: CtwPackage = {
    ...nextPkg,
    woocommerce: {
      ...nextPkg.woocommerce,
      products,
    },
  };
  writeFileSync(packagePath, `${JSON.stringify(updated, null, 2)}\n`, "utf8");

  return {
    product,
    mediaId,
    mediaPath: fetched.relativePath,
    packagePath,
    count: products.length,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}
