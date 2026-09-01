import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { unzipSync } from "fflate";
import { readFileSync } from "node:fs";
import { findPluginSourceDir, packPluginZip } from "../src/plugin-zip.js";

describe("packPluginZip", () => {
  const dirs: string[] = [];
  after(() => {
    for (const dir of dirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("finds the plugin source", () => {
    const dir = findPluginSourceDir();
    assert.ok(existsSync(join(dir, "ctw-native.php")));
  });

  it("writes a WordPress uploadable zip with ctw-native/ prefix", () => {
    const cwd = mkdtempSync(join(tmpdir(), "ctw-plugin-zip-"));
    dirs.push(cwd);
    const out = join(cwd, "ctw-native.zip");
    const result = packPluginZip({ outputPath: out });
    assert.equal(result.outputPath, out);
    assert.ok(result.fileCount > 5);
    assert.ok(existsSync(out));

    const unzipped = unzipSync(readFileSync(out));
    const paths = Object.keys(unzipped).sort();
    assert.ok(paths.includes("ctw-native/ctw-native.php"));
    assert.ok(paths.some((p) => p.startsWith("ctw-native/includes/")));
    assert.ok(!paths.some((p) => p.includes("/vendor/")));
    assert.ok(!paths.some((p) => p.includes("/tests/")));
  });

  it("ships the GPL license text and third-party NOTICE", () => {
    const cwd = mkdtempSync(join(tmpdir(), "ctw-plugin-zip-license-"));
    dirs.push(cwd);
    const out = join(cwd, "ctw-native.zip");
    packPluginZip({ outputPath: out });

    const unzipped = unzipSync(readFileSync(out));
    const decoder = new TextDecoder();
    const license = unzipped["ctw-native/LICENSE"];
    const notice = unzipped["ctw-native/NOTICE"];
    assert.ok(license, "LICENSE must be in the plugin ZIP");
    assert.ok(notice, "NOTICE must be in the plugin ZIP");
    assert.match(decoder.decode(license), /GNU GENERAL PUBLIC LICENSE/);
    assert.match(decoder.decode(notice), /elementor-mcp/);
  });
});
