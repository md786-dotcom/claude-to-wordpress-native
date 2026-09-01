/**
 * Structural CSS checks for WPCode snippets and Elementor HTML <style> blocks.
 * Does not rewrite CSS. Callers must fail generate when errors exist.
 */
import type { CtwPackage, ElementNode, JsonValue } from "@ctw/schema";
import { checkPackageStylePolicy } from "./check-css-policy.js";

export type CssIssue = {
  path: string;
  message: string;
};

type CssKind = "css" | "html-css";

type CssSource = {
  path: string;
  kind: CssKind;
  css: string;
};

const STYLE_BLOCK = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const HTML_ENTITY = /&(?:gt|lt|amp|quot|#0*60|#0*62|#x0*3[ce]);/i;
const ESCAPED_COMBINATOR = /\\>|\\3e\s/i;
const STYLE_WRAPPER = /<style[\s>]/i;

/**
 * Scan a package and return CSS problems. Empty means the CSS is structurally OK.
 */
export function checkPackageCss(pkg: CtwPackage): CssIssue[] {
  const issues: CssIssue[] = [...checkPackageStylePolicy(pkg)];
  for (const source of collectCssSources(pkg)) {
    issues.push(...checkCssSource(source));
  }
  return issues;
}

/**
 * Throw when the package CSS would not print as intended on the front end.
 */
export function assertPackageCss(pkg: CtwPackage): void {
  const issues = checkPackageCss(pkg);
  if (issues.length === 0) {
    return;
  }
  throw new Error(formatCssIssues(issues));
}

/**
 * Human-readable error list for CLI / generate.
 */
export function formatCssIssues(issues: CssIssue[]): string {
  const lines = issues.map((issue) => `- ${issue.path}: ${issue.message}`);
  return `CSS check failed with ${String(issues.length)} error(s):\n${lines.join("\n")}`;
}

function checkCssSource(source: CssSource): CssIssue[] {
  const issues: CssIssue[] = [];
  const prefix = source.path;
  const css = source.css;

  if (source.kind === "css" && STYLE_WRAPPER.test(css)) {
    issues.push({
      path: prefix,
      message:
        "WPCode type \"css\" must be raw CSS. Remove <style> tags; WPCode wraps CSS for you.",
    });
  }
  if (HTML_ENTITY.test(css)) {
    issues.push({
      path: prefix,
      message:
        "Do not HTML-escape CSS. Write the child combinator as `>` not `&gt;`. Escaping `>` changes the selector and it will not match.",
    });
  }
  if (ESCAPED_COMBINATOR.test(css)) {
    issues.push({
      path: prefix,
      message:
        "Do not backslash-escape the child combinator (`\\>` / `\\3e`). Write `>` in WPCode type \"css\" snippets. Page layout still belongs in native Elementor settings, not CSS.",
    });
  }
  if (source.kind === "html-css") {
    issues.push({
      path: prefix,
      message:
        "Do not put CSS in HTML <style> blocks. Use native Elementor widget and container settings. WPCode type \"css\" is WooCommerce-only.",
    });
    return issues;
  }
  for (const message of scanCssStructure(css)) {
    issues.push({ path: prefix, message });
  }
  return issues;
}

/**
 * Brace / string / comment balance. Catches truncated rules such as
 * `{grid-template-columns:1fr !important;` with no closing `}`.
 */
export function scanCssStructure(css: string): string[] {
  return new CssBraceScanner().scan(css);
}

class CssBraceScanner {
  private brace = 0;
  private inString: '"' | "'" | null = null;
  private inComment = false;
  private escaped = false;
  private skipNext = false;
  private readonly openAt: string[] = [];
  private readonly messages: string[] = [];
  private line = 1;
  private col = 1;

  scan(css: string): string[] {
    for (let i = 0; i < css.length; i += 1) {
      if (this.skipNext) {
        this.skipNext = false;
        continue;
      }
      this.feed(css[i] ?? "", css[i + 1] ?? "");
    }
    this.finish();
    return this.messages;
  }

  private feed(ch: string, next: string): void {
    if (this.inComment) {
      this.feedComment(ch, next);
      return;
    }
    if (this.inString !== null) {
      this.feedString(ch);
      return;
    }
    this.feedCode(ch, next);
  }

  private feedComment(ch: string, next: string): void {
    if (ch === "*" && next === "/") {
      this.inComment = false;
      this.skipNext = true;
      this.col += 2;
      return;
    }
    this.step(ch);
  }

  private feedString(ch: string): void {
    if (this.escaped) {
      this.escaped = false;
      this.step(ch);
      return;
    }
    if (ch === "\\") {
      this.escaped = true;
      this.col += 1;
      return;
    }
    if (ch === this.inString) {
      this.inString = null;
    }
    this.step(ch);
  }

  private feedCode(ch: string, next: string): void {
    if (ch === "/" && next === "*") {
      this.inComment = true;
      this.skipNext = true;
      this.col += 2;
      return;
    }
    if (ch === "\"" || ch === "'") {
      this.inString = ch;
      this.col += 1;
      return;
    }
    if (ch === "{") {
      this.brace += 1;
      this.openAt.push(`${String(this.line)}:${String(this.col)}`);
      this.col += 1;
      return;
    }
    if (ch === "}") {
      this.closeBrace();
      return;
    }
    this.step(ch);
  }

  private closeBrace(): void {
    this.brace -= 1;
    this.openAt.pop();
    if (this.brace < 0) {
      this.messages.push(`extra } at ${String(this.line)}:${String(this.col)}`);
      this.brace = 0;
    }
    this.col += 1;
  }

  private finish(): void {
    if (this.inComment) {
      this.messages.push("unclosed CSS comment");
    }
    if (this.inString !== null) {
      this.messages.push(`unclosed CSS string (${this.inString})`);
    }
    if (this.brace > 0) {
      const where = this.openAt[this.openAt.length - 1] ?? "unknown";
      this.messages.push(
        `unclosed { (${String(this.brace)} still open; last opened at ${where}). Every rule must end with }.`,
      );
    }
  }

  private step(ch: string): void {
    if (ch === "\n") {
      this.line += 1;
      this.col = 1;
      return;
    }
    this.col += 1;
  }
}

function collectCssSources(pkg: CtwPackage): CssSource[] {
  const sources: CssSource[] = [];
  pkg.snippets.forEach((snippet, index) => {
    const path = `snippets[${String(index)}] "${snippet.title}"`;
    if (snippet.type === "css") {
      sources.push({ path, kind: "css", css: snippet.code });
      return;
    }
    if (snippet.type === "html") {
      for (const [blockIndex, css] of extractStyleBlocks(snippet.code).entries()) {
        sources.push({
          path: `${path} <style>#${String(blockIndex)}`,
          kind: "html-css",
          css,
        });
      }
    }
  });
  pkg.pages.forEach((page, index) => {
    walkElements(page.elements, `pages[${String(index)}].elements`, sources);
  });
  if (pkg.header !== undefined) {
    walkElements(pkg.header.elements, "header.elements", sources);
  }
  if (pkg.footer !== undefined) {
    walkElements(pkg.footer.elements, "footer.elements", sources);
  }
  const wooPages = pkg.woocommerce.pages;
  (["shop", "cart", "checkout"] as const).forEach((key) => {
    const page = wooPages[key];
    if (page !== undefined) {
      walkElements(page.elements, `woocommerce.pages.${key}.elements`, sources);
    }
  });
  return sources;
}

function walkElements(elements: ElementNode[], path: string, sources: CssSource[]): void {
  elements.forEach((node, index) => {
    const nodePath = `${path}[${String(index)}]`;
    const html = settingString(node.settings, "html");
    if (html !== undefined) {
      extractStyleBlocks(html).forEach((css, blockIndex) => {
        sources.push({
          path: `${nodePath} html <style>#${String(blockIndex)}`,
          kind: "html-css",
          css,
        });
      });
    }
    const editor = settingString(node.settings, "editor");
    if (editor !== undefined) {
      extractStyleBlocks(editor).forEach((css, blockIndex) => {
        sources.push({
          path: `${nodePath} editor <style>#${String(blockIndex)}`,
          kind: "html-css",
          css,
        });
      });
    }
    if (node.elements.length > 0) {
      walkElements(node.elements, `${nodePath}.elements`, sources);
    }
  });
}

function settingString(settings: { [key: string]: JsonValue }, key: string): string | undefined {
  const value = settings[key];
  return typeof value === "string" ? value : undefined;
}

function extractStyleBlocks(html: string): string[] {
  const blocks: string[] = [];
  const matcher = new RegExp(STYLE_BLOCK.source, STYLE_BLOCK.flags);
  let match = matcher.exec(html);
  while (match !== null) {
    blocks.push(match[1] ?? "");
    match = matcher.exec(html);
  }
  return blocks;
}
