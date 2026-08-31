import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { CtwMediaItem, CtwPackage } from "@ctw/schema";
import { parsePackageJson, type JsonValue } from "@ctw/schema";

export type FetchLike = (
  input: string,
  init?: { redirect?: "follow" | "error" | "manual"; headers?: Record<string, string> },
) => Promise<Response>;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
};

/**
 * Guess a safe relative filename for a remote image URL.
 */
export function guessMediaFilename(url: string, contentType: string | null, id: string): string {
  const mime = (contentType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  const fromMime = EXT_BY_MIME[mime];
  let ext = fromMime ?? "";
  if (ext === "") {
    try {
      const pathname = new URL(url).pathname;
      const raw = extname(pathname).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"].includes(raw)) {
        ext = raw === ".jpeg" ? ".jpg" : raw;
      }
    } catch {
      // ignore
    }
  }
  if (ext === "") {
    ext = ".jpg";
  }
  const safeId = id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${safeId || "image"}${ext}`;
}

/**
 * Download an https image URL into mediaRoot/relativePath.
 */
export async function downloadMediaFile(options: {
  url: string;
  mediaRoot: string;
  relativePath: string;
  fetchImpl?: FetchLike;
}): Promise<string> {
  if (!options.url.startsWith("https://")) {
    throw new Error("Only https image URLs are allowed.");
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(options.url, {
    redirect: "follow",
    headers: {
      "user-agent": "claude-to-wordpress-native/0.1 (+https://github.com/md786-dotcom/claude-to-wordpress-native)",
      accept: "image/*,*/*;q=0.8",
    },
  });
  if (!response.ok) {
    throw new Error(`Download failed (${String(response.status)}): ${options.url}`);
  }
  const type = response.headers.get("content-type") ?? "";
  if (type !== "" && !type.startsWith("image/") && !type.startsWith("application/octet-stream")) {
    throw new Error(`URL did not return an image (content-type: ${type})`);
  }
  const dest = resolve(options.mediaRoot, options.relativePath);
  if (options.relativePath.includes("..") || options.relativePath.startsWith("/")) {
    throw new Error("Invalid media path.");
  }
  mkdirSync(dirname(dest), { recursive: true });
  if (response.body === null) {
    const buf = Buffer.from(await response.arrayBuffer());
    writeFileSync(dest, buf);
  } else {
    await pipeline(Readable.fromWeb(response.body as never), createWriteStream(dest));
  }
  return dest;
}

export type SyncMediaResult = {
  downloaded: string[];
  skipped: string[];
};

/**
 * For each media item with sourceUrl, download into mediaRoot if the file is missing.
 */
export async function syncPackageMedia(options: {
  pkg: CtwPackage;
  mediaRoot: string;
  fetchImpl?: FetchLike;
  force?: boolean;
}): Promise<SyncMediaResult> {
  const mediaRoot = resolve(options.mediaRoot);
  mkdirSync(mediaRoot, { recursive: true });
  const downloaded: string[] = [];
  const skipped: string[] = [];

  for (const item of options.pkg.media) {
    const dest = join(mediaRoot, item.path);
    if (!options.force && existsSync(dest)) {
      skipped.push(item.path);
      continue;
    }
    if (item.sourceUrl === undefined) {
      if (!existsSync(dest)) {
        throw new Error(
          `Media file missing and no sourceUrl: ${item.path} (id=${item.id}). Place the file under ${mediaRoot} or set sourceUrl.`,
        );
      }
      skipped.push(item.path);
      continue;
    }
    await downloadMediaFile({
      url: item.sourceUrl,
      mediaRoot,
      relativePath: item.path,
      ...(options.fetchImpl !== undefined ? { fetchImpl: options.fetchImpl } : {}),
    });
    downloaded.push(item.path);
  }
  return { downloaded, skipped };
}

export type FetchIntoPackageOptions = {
  url: string;
  id: string;
  alt?: string;
  mediaRoot: string;
  packagePath?: string;
  relativePath?: string;
  fetchImpl?: FetchLike;
};

/**
 * Download a URL into ./media and optionally append/update ctw-package.json media[].
 */
export async function fetchIntoPackage(
  options: FetchIntoPackageOptions,
): Promise<{ relativePath: string; packagePath?: string }> {
  if (!options.url.startsWith("https://")) {
    throw new Error("Only https image URLs are allowed.");
  }
  const mediaRoot = resolve(options.mediaRoot);
  mkdirSync(mediaRoot, { recursive: true });

  const fetchImpl = options.fetchImpl ?? fetch;
  const head = await fetchImpl(options.url, {
    redirect: "follow",
    headers: {
      "user-agent": "claude-to-wordpress-native/0.1 (+https://github.com/md786-dotcom/claude-to-wordpress-native)",
      accept: "image/*,*/*;q=0.8",
    },
  });
  if (!head.ok) {
    throw new Error(`Download failed (${String(head.status)}): ${options.url}`);
  }
  const contentType = head.headers.get("content-type");
  const relativePath =
    options.relativePath ?? guessMediaFilename(options.url, contentType, options.id);

  // Re-use body from first response when possible
  const dest = resolve(mediaRoot, relativePath);
  mkdirSync(dirname(dest), { recursive: true });
  if (head.body === null) {
    writeFileSync(dest, Buffer.from(await head.arrayBuffer()));
  } else {
    await pipeline(Readable.fromWeb(head.body as never), createWriteStream(dest));
  }

  if (options.packagePath === undefined) {
    return { relativePath };
  }

  const packagePath = resolve(options.packagePath);
  const raw = JSON.parse(readFileSync(packagePath, "utf8")) as { [key: string]: JsonValue };
  const pkg = parsePackageJson(raw);
  const nextItem: CtwMediaItem = {
    id: options.id,
    path: relativePath,
    alt: options.alt ?? "",
    sourceUrl: options.url,
  };
  const media = pkg.media.filter((item) => item.id !== options.id);
  media.push(nextItem);
  const updated = { ...pkg, media };
  writeFileSync(packagePath, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
  return { relativePath, packagePath };
}
