---
name: ctw-native-check
description: Check a CTW Native ctw-package.json (schema + style policy + CSS) and fix it before generating the Hello Elementor child theme ZIP. Use when asked to /ctw-native-check, check the theme, lint snippets, or when CSS would override later Elementor edits.
---

# CTW Native check

Run this skill when the user invokes `/ctw-native-check`, asks to check the package, or **after `/ctw-native` has written `ctw-package.json`** and before `generate`.

You generate an offline site package. You do **not** edit a live WordPress site.

## Command

```bash
npx -y claude-to-wordpress-native check --package ./ctw-package.json
```

From a local clone: `npm run ctw -- check --package ./ctw-package.json`.

There is no `validate` command. `check` is the only audit. `generate` refuses to write a ZIP when `check` fails.

## Loop

1. Run `check`.
2. If it exits non-zero, fix every reported error in `ctw-package.json`.
3. Re-run until exit 0.
4. Only then run `generate`.

## What `check` enforces

This stack uses **WPCode Free** (`insert-headers-and-footers`), not WPCode Pro. `type: "css"` snippets must use `"location": "header"` or `"footer"` (`everywhere` is PHP-only and fails schema). Never emit `scss`, `blocks`, device rules, or CSS-selector insert locations.

Page layout and styling belong in **native Elementor settings**, not WPCode. A site-wide CSS snippet keeps printing after import and overrides later **Edit with Elementor** changes. CSS snippets are WooCommerce-only.

Automatic findings (fix all of them):

- Brochure packages (`woocommerce.enabled: false`) must have **zero** `type: "css"` snippets.
- Shop `type: "css"` selectors must include `.woocommerce`, `.woocommerce-*`, or `.ctw-woo-*` only. `!important` is allowed there.
- Any `<style>` in Elementor `html` / text-editor widgets (or WPCode `html` snippets) fails. Do not move that CSS to a page snippet.
- `custom_css` on elements fails (Elementor Free does not print it).
- `_css_classes` / `css_classes` on elements fails. Use `container_type: "grid"` and native padding/colors/typography.
- `type: "css"` snippets must be **raw CSS** (no `<style>` wrapper).
- Every `{` must have a matching `}`.
- Do not HTML-escape CSS (`&gt;`, `&lt;`) or backslash-escape `>`.

WPCode Free **css** snippets print as real CSS. The child combinator `>` is valid in residual Woo CSS. **Do not** turn `>` into `\>`, `\3e`, or `&gt;`.

Font Awesome stays a WPCode **`html`** snippet (`<link>`), not CSS.
