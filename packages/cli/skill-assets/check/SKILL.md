---
name: ctw-native-check
description: Validate a CTW Native ctw-package.json (schema + CSS snippets) and fix CSS before generating the Hello Elementor child theme ZIP. Use when asked to /ctw-native-check, check the theme, lint snippets, or when CSS looks wrong on the WordPress front end.
---

# CTW Native check

Run this skill when the user invokes `/ctw-native-check`, asks to check the package, or before `generate`.

You generate an offline site package. You do **not** edit a live WordPress site.

## Command

```bash
npx -y claude-to-wordpress-native check --package ./ctw-package.json
```

From a local clone: `npm run ctw -- check --package ./ctw-package.json`.

`validate` runs the same checks. `generate` refuses to write a ZIP when CSS check fails.

## Loop

1. Run `check`.
2. If it exits non-zero, fix every reported error in `ctw-package.json`.
3. Re-run until exit 0.
4. Only then run `generate`.

## CSS rules (do not “escape” combinators)

WPCode **css** snippets print as real CSS. The child combinator `>` is valid. **Do not** “fix” `.grid-2 > .e-con-inner` by turning `>` into `\>`, `\3e`, or `&gt;` — that changes the selector and it will not match.

Prefer Elementor-safe targeting (inner wrapper plus the container itself):

```css
.grid-2,
.grid-2 .e-con-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
```

Use a descendant space, not a backslash-escaped `>`.

Other rules the checker enforces:

- `type: "css"` snippets must be **raw CSS** (no `<style>` wrapper).
- Every `{` must have a matching `}`. Truncated rules such as `{grid-template-columns:1fr !important;` fail.
- Do not HTML-escape CSS (`&gt;`, `&lt;`).
- CSS inside Elementor `html` / text-editor `<style>` blocks must not use `>`. Move that CSS to a WPCode `type: "css"` snippet, or use a descendant selector.

Layout CSS belongs in `snippets[]` with `"type": "css"` and `"location": "header"`.
