---
name: ctw-native
description: Generate Hello Elementor child theme ZIPs with Elementor Free pages for Claude-to-WordPress Native. Use when the user asks for a WordPress site, Elementor theme, or CTW package.
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
npx -y github:md786-dotcom/claude-to-wordpress-native init --name "Acme Child" --slug acme-child
```

Do **not** run `npx claude-to-wordpress-native` — that name 404s on the public registry until publish.
Do **not** pin the old feature branch; use `main`.

## Output

1. Write a valid `ctw-package.json` (version 1).
2. Put media files under a media directory referenced by `media[].path`.
3. Run:

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native generate --package ./ctw-package.json --out ./<theme-slug>.zip --media ./media
```

4. Tell the web developer to: install `ctw-native`, upload the child ZIP, open **CTW Native → Setup**, install stack, import once.

## Package rules

- Parent is always Hello Elementor (`Template: hello-elementor` in generated `style.css`).
- Exactly one page with `isFrontPage: true`.
- Elementor widgets: Free allowlist only (`heading`, `image`, `text-editor`, `button`, `container`, …). Never `form`, Woo widgets, Theme Builder, or Pro custom CSS.
- Forms → MetForm entries in `forms[]`.
- Header/footer → ElementsKit payloads in `header` / `footer`.
- Snippets → WPCode `css` | `js` | `html` only. Never `php`.
- `woocommerce.enabled`: set `true` only for shop briefs; then include `woocommerce` in `plugins`. Brochure sites keep it `false`.
- Always include plugins: `elementor`, `elementskit-lite`, `metform`, `insert-headers-and-footers`.

## Client editing (document this)

- Pages/posts: Edit with Elementor
- Header/footer: ElementsKit
- Shop: WooCommerce PHP templates (if enabled)
- Extra CSS: Appearance → Customize → Additional CSS

## After install

Claude cannot edit the site. Humans edit in WordPress. Import is one-shot; wipe before regenerate.
