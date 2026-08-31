---
name: ctw-native
description: Generate Hello Elementor child theme ZIPs with Elementor Free pages for Claude-to-WordPress Native. Use when the user asks for a WordPress site, Elementor theme, or CTW package. Use for images, Unsplash, Pexels, or media in the theme.
---

# CTW Native (Claude Code)

You generate an offline site package. You do **not** edit a live WordPress site after install.

## Install this skill (once per project)

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native skill
```

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native init --name "Acme Child" --slug acme-child
npx -y github:md786-dotcom/claude-to-wordpress-native plugin-zip
```

## Media and images

Always ship real image files under `./media/` and list them in `media[]`. Never leave live Unsplash/Pexels URLs inside Elementor widget settings for production import.

### Local files (user attached images, or files already on disk)

1. Save/copy the file into `./media/` (e.g. `./media/hero.jpg`).
2. Register it:

```json
"media": [
  { "id": "hero", "path": "hero.jpg", "alt": "Storefront exterior" }
]
```

3. Reference it on Free Elementor image widgets via package media id:

```json
"settings": {
  "image": { "id": "hero", "url": "" }
}
```

Same `{ "id": "<media.id>", "url": "" }` pattern for `image-box` and other Free widgets that take an Elementor image control.

### Remote URLs (Unsplash, Pexels, direct https)

Prefer a **direct image URL** (ends with the image or is a CDN image link), not an HTML gallery page.

Download + register in one step:

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native media fetch \
  --url "https://images.unsplash.com/photo-…" \
  --id hero \
  --alt "Hero photo" \
  --package ./ctw-package.json \
  --media ./media
```

Or declare `sourceUrl` in `media[]` and let generate pull missing files:

```json
"media": [
  {
    "id": "hero",
    "path": "hero.jpg",
    "alt": "Hero photo",
    "sourceUrl": "https://images.unsplash.com/photo-…"
  }
]
```

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native media sync --package ./ctw-package.json --media ./media
```

`generate` also auto-syncs `sourceUrl` when `--media` is set (defaults to `./media` if the package declares media).

Only `https://` image URLs are allowed.

## Output

1. Write a valid `ctw-package.json` (version 1).
2. Ensure every `media[]` path exists under `./media/` (fetch/sync or copy).
3. Run:

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native generate --package ./ctw-package.json --out ./<theme-slug>.zip --media ./media
```

4. Tell the web developer to: run `plugin-zip`, upload `ctw-native.zip`, upload the child ZIP, open **CTW Native → Setup**, install stack, import once.

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
