/**
 * Package style policy: page styling is native Elementor; WPCode CSS is Woo-only.
 */
import type { CtwPackage, ElementNode, JsonValue } from "@ctw/schema";

type CssIssue = {
  path: string;
  message: string;
};

const PSEUDO_CLASS = /:(hover|focus|active|visited|focus-visible|focus-within)\b/i;
const PSEUDO_ELEMENT = /::(before|after|placeholder|first-line|first-letter)\b/i;
const BANNED_MOTION_KEYS =
  /^(motion_fx|motion_fx_|hover_animation|sticky|sticky_on|sticky_parent|sticky_effects_offset)$/i;
const WOO_CLASS = /\.(?:woocommerce[\w-]*|ctw-woo-[\w-]+)/;
const NESTED_AT = /^@(?:media|supports|layer|container)\b/i;
const CSS_CLASS_KEYS = ["_css_classes", "css_classes"] as const;
const TREE_KEYS = ["shop", "cart", "checkout"] as const;

/**
 * Policy findings that `check` / generate must fail on.
 */
export function checkPackageStylePolicy(pkg: CtwPackage): CssIssue[] {
  const issues: CssIssue[] = [];
  if (pkg.header !== undefined) {
    issues.push({
      path: "header",
      message:
        "Do not emit a package header template. Build header and footer manually in ElementsKit Free (Header Footer) after import. Omit the top-level header key.",
    });
  }
  if (pkg.footer !== undefined) {
    issues.push({
      path: "footer",
      message:
        "Do not emit a package footer template. Build header and footer manually in ElementsKit Free (Header Footer) after import. Omit the top-level footer key.",
    });
  }
  pkg.snippets.forEach((snippet, index) => {
    if (snippet.type !== "css") {
      return;
    }
    const path = `snippets[${String(index)}] "${snippet.title}"`;
    if (!pkg.woocommerce.enabled) {
      issues.push({
        path,
        message:
          "Brochure packages must not include type \"css\" snippets. Use native Elementor container and widget settings. CSS snippets are WooCommerce-only.",
      });
      return;
    }
    for (const selector of cssRuleSelectors(snippet.code)) {
      if (!selectorTargetsWoo(selector)) {
        const pseudo = selectorUsesBannedPseudo(selector);
        issues.push({
          path,
          message: pseudo
            ? `Selector \`${selector}\` uses :hover / :focus or ::before / ::after on page elements. Use static native Elementor widget settings. WooCommerce CSS may use pseudo only on .woocommerce / .ctw-woo-* selectors.`
            : `Selector \`${selector}\` is not WooCommerce-scoped. CSS snippets may only target .woocommerce, .woocommerce-*, or .ctw-woo-* so Edit with Elementor still wins on pages.`,
        });
      }
    }
  });
  pkg.pages.forEach((page, index) => {
    walkElementPolicy(page.elements, `pages[${String(index)}].elements`, issues);
  });
  if (pkg.header !== undefined) {
    walkElementPolicy(pkg.header.elements, "header.elements", issues);
  }
  if (pkg.footer !== undefined) {
    walkElementPolicy(pkg.footer.elements, "footer.elements", issues);
  }
  for (const key of TREE_KEYS) {
    const page = pkg.woocommerce.pages[key];
    if (page !== undefined) {
      walkElementPolicy(
        page.elements,
        `woocommerce.pages.${key}.elements`,
        issues,
      );
    }
  }
  return issues;
}

/**
 * True when a selector is scoped to WooCommerce or CTW Woo surfaces.
 */
export function selectorTargetsWoo(selector: string): boolean {
  return WOO_CLASS.test(selector);
}

/**
 * True when a selector uses interaction pseudo-classes or pseudo-elements.
 */
export function selectorUsesBannedPseudo(selector: string): boolean {
  return PSEUDO_CLASS.test(selector) || PSEUDO_ELEMENT.test(selector);
}

/**
 * Collect CSS rule selectors (comma-split). Nested @media/@supports bodies
 * are included. @font-face / @keyframes bodies are skipped.
 */
export function cssRuleSelectors(css: string): string[] {
  const cursor = new CssCursor(css);
  const selectors: string[] = [];
  let buffer = "";
  while (!cursor.done) {
    const copied = cursor.eatMeta();
    if (copied !== null) {
      buffer += copied;
      continue;
    }
    const ch = cursor.ch;
    if (ch === "{") {
      onRuleOpen(cursor, buffer, selectors);
      buffer = "";
      continue;
    }
    if (ch === "}") {
      buffer = "";
      cursor.step();
      continue;
    }
    buffer += ch;
    cursor.step();
  }
  return selectors;
}

function onRuleOpen(cursor: CssCursor, buffer: string, selectors: string[]): void {
  const sel = buffer.trim();
  cursor.step();
  if (sel === "" || NESTED_AT.test(sel)) {
    return;
  }
  if (sel.startsWith("@")) {
    cursor.skipBlock();
    return;
  }
  for (const part of sel.split(",")) {
    const item = part.trim();
    if (item !== "") {
      selectors.push(item);
    }
  }
  cursor.skipBlock();
}

/**
 * Walks CSS while tracking comments and strings.
 */
class CssCursor {
  i = 0;
  private inString: '"' | "'" | null = null;
  private inComment = false;
  private escaped = false;

  constructor(private readonly css: string) {}

  get done(): boolean {
    return this.i >= this.css.length;
  }

  get ch(): string {
    return this.css[this.i] ?? "";
  }

  step(): void {
    this.i += 1;
  }

  /**
   * Consume a comment or string character.
   * Returns "" when a comment char was eaten, the char when a string char
   * was eaten, or null when the current char is source CSS.
   */
  eatMeta(): string | null {
    if (this.inComment) {
      this.eatComment();
      return "";
    }
    if (this.inString !== null) {
      const ch = this.ch;
      this.eatString();
      return ch;
    }
    return this.openMeta();
  }

  skipBlock(): void {
    let depth = 1;
    while (!this.done && depth > 0) {
      if (this.eatMeta() !== null) {
        continue;
      }
      depth += this.braceDelta();
      this.step();
    }
  }

  private braceDelta(): number {
    if (this.ch === "{") {
      return 1;
    }
    if (this.ch === "}") {
      return -1;
    }
    return 0;
  }

  private openMeta(): string | null {
    const next = this.css[this.i + 1] ?? "";
    if (this.ch === "/" && next === "*") {
      this.inComment = true;
      this.i += 2;
      return "";
    }
    if (this.ch === "\"" || this.ch === "'") {
      this.inString = this.ch;
      const ch = this.ch;
      this.step();
      return ch;
    }
    return null;
  }

  private eatComment(): void {
    const next = this.css[this.i + 1] ?? "";
    if (this.ch === "*" && next === "/") {
      this.inComment = false;
      this.i += 2;
      return;
    }
    this.step();
  }

  private eatString(): void {
    if (this.escaped) {
      this.escaped = false;
      this.step();
      return;
    }
    if (this.ch === "\\") {
      this.escaped = true;
      this.step();
      return;
    }
    if (this.ch === this.inString) {
      this.inString = null;
    }
    this.step();
  }
}

function walkElementPolicy(
  elements: ElementNode[],
  path: string,
  issues: CssIssue[],
): void {
  elements.forEach((node, index) => {
    const nodePath = `${path}[${String(index)}]`;
    for (const [key, value] of Object.entries(node.settings)) {
      if (BANNED_MOTION_KEYS.test(key)) {
        issues.push({
          path: `${nodePath} ${key}`,
          message:
            "Do not use motion, sticky, or hover-animation settings that need custom CSS or Pro. Use static native Elementor colors, typography, and borders.",
        });
      }
      if (typeof value === "string") {
        scanTextForBannedPseudo(value, `${nodePath} ${key}`, issues);
      }
    }
    for (const key of CSS_CLASS_KEYS) {
      const value = settingString(node.settings, key);
      if (value !== undefined && value.trim() !== "") {
        issues.push({
          path: `${nodePath} ${key}`,
          message:
            "Do not set CSS classes for page styling. Use native Elementor container and widget settings (container_type grid, padding, colors, typography) so Edit with Elementor remains the styling authority.",
        });
      }
    }
    const customCss = settingString(node.settings, "custom_css");
    if (customCss !== undefined && customCss.trim() !== "") {
      issues.push({
        path: `${nodePath} custom_css`,
        message:
          "Do not use custom_css. Elementor Free does not print it, and it is not editable like native widget settings. Use padding, colors, typography, and borders on the element instead.",
      });
    }
    if (node.elements.length > 0) {
      walkElementPolicy(node.elements, `${nodePath}.elements`, issues);
    }
  });
}

function settingString(
  settings: { [key: string]: JsonValue },
  key: string,
): string | undefined {
  const value = settings[key];
  return typeof value === "string" ? value : undefined;
}

function scanTextForBannedPseudo(text: string, path: string, issues: CssIssue[]): void {
  if (!PSEUDO_CLASS.test(text) && !PSEUDO_ELEMENT.test(text)) {
    return;
  }
  issues.push({
    path,
    message:
      "Do not embed :hover / :focus or ::before / ::after CSS in widget content. Use static native Elementor settings. WooCommerce CSS snippets may use pseudo only on .woocommerce / .ctw-woo-* selectors.",
  });
}
