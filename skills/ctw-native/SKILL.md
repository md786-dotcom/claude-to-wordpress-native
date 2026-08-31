---
name: ctw-native
description: Generate Hello Elementor child theme ZIPs with Elementor Free pages for Claude-to-WordPress Native. Use when the user asks for a WordPress site, Elementor theme, CTW package, WooCommerce shop, or ecommerce theme.
---

# CTW Native (Claude Code)

You generate an offline site package. You do **not** edit a live WordPress site after install.

## Install this skill (once per project)

This package is **not published to npm** yet. Always use GitHub **main**:

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native skill
```

Scaffold a starter package + skill:

```bash
# Brochure (default)
npx -y github:md786-dotcom/claude-to-wordpress-native init --name "Acme Child" --slug acme-child

# Shop / WooCommerce
npx -y github:md786-dotcom/claude-to-wordpress-native init --name "Shop Child" --slug shop-child --woocommerce
```

Do **not** run `npx claude-to-wordpress-native` — that name 404s on the public registry until publish.
Do **not** pin the old feature branch; use `main`.

Write the WordPress plugin ZIP (upload under Plugins → Add New → Upload Plugin):

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native plugin-zip
```

## Output

1. Write a valid `ctw-package.json` (version 1).
2. Put media files under a media directory referenced by `media[].path`.
3. Run:

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native generate --package ./ctw-package.json --out ./<theme-slug>.zip --media ./media
```

4. Tell the web developer to: run `plugin-zip`, upload `ctw-native.zip`, upload the child ZIP, open **CTW Native → Setup**, toggle **Install WooCommerce** if needed, install stack, import once.

## WooCommerce / shop packages

When the brief is a shop, store, or ecommerce site, **always** enable WooCommerce in the package. Do both of these together:

```json
"woocommerce": { "enabled": true },
"plugins": [
  "elementor",
  "elementskit-lite",
  "metform",
  "insert-headers-and-footers",
  "woocommerce"
]
```

Rules:

- Brochure / local business / marketing sites → `"woocommerce": { "enabled": false }` and **omit** `woocommerce` from `plugins`.
- Shop briefs → `enabled: true` **and** include `"woocommerce"` in `plugins` (schema rejects a mismatch).
- Scaffold with `init --woocommerce` when starting a shop project.
- Never use Woo Elementor widgets, Woo Theme Builder, or Pro widgets. Shop UI uses native WooCommerce PHP templates from the child theme kit.
- Products, cart, and checkout are managed in WordPress after import (the package does not ship a product catalog).
- On the WordPress site, **CTW Native → Setup** has an **Install WooCommerce** checkbox. If the package already enables Woo, the switch stays on and Setup installs it with the stack. Humans can also turn the switch on for brochure packages if they decide to add a shop later.

## Package rules

- Parent is always Hello Elementor (`Template: hello-elementor` in generated `style.css`).
- Exactly one page with `isFrontPage: true`.
- Elementor widgets: Free allowlist only (`heading`, `image`, `text-editor`, `button`, `container`, …). Never `form`, Woo widgets, Theme Builder, or Pro custom CSS.
- Forms → MetForm entries in `forms[]`.
- Header/footer → ElementsKit payloads in `header` / `footer`.
- Snippets → WPCode `css` | `js` | `html` only. Never `php`.
- Always include plugins: `elementor`, `elementskit-lite`, `metform`, `insert-headers-and-footers` (plus `woocommerce` when enabled).

## Client editing (document this)

- Pages/posts: Edit with Elementor
- Header/footer: ElementsKit
- Shop: WooCommerce PHP templates (if enabled)
- Extra CSS: Appearance → Customize → Additional CSS

## After install

Claude cannot edit the site. Humans edit in WordPress. Import is one-shot; wipe before regenerate.
