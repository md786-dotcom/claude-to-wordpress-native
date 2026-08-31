---
name: ctw-native
description: Generate Hello Elementor child theme ZIPs with Elementor Free pages for Claude-to-WordPress Native. Use for WordPress, Elementor, WooCommerce shop, media/Unsplash/Pexels, dummy products, or WPCode snippets (css/js/html/php).
---

# CTW Native (Claude Code)

You generate an offline site package. You do **not** edit a live WordPress site after install.

## Install this skill (once per project)

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native skill
```

```bash
# Brochure
npx -y github:md786-dotcom/claude-to-wordpress-native init --name "Acme Child" --slug acme-child

# Shop
npx -y github:md786-dotcom/claude-to-wordpress-native init --name "Shop Child" --slug shop-child --woocommerce
npx -y github:md786-dotcom/claude-to-wordpress-native plugin-zip
```

## Media and images

Ship real files under `./media/` and list them in `media[]`. Prefer downloading remotes before generate.

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native media fetch \
  --url "https://images.unsplash.com/photo-…" --id hero --alt "Hero" \
  --package ./ctw-package.json --media ./media
```

Or set `media[].sourceUrl` (https only) and let `generate` / `media sync` pull missing files.

Elementor image controls: `{ "id": "<media.id>", "url": "" }`.

## WooCommerce / shop packages

When the brief is a shop or ecommerce site:

```json
"woocommerce": {
  "enabled": true,
  "products": [],
  "pages": {
    "shop": { "title": "Shop", "elements": [ /* Free Elementor tree */ ] },
    "cart": { "title": "Cart", "elements": [ /* … */ ] },
    "checkout": { "title": "Checkout", "elements": [ /* … */ ] }
  }
},
"plugins": [
  "elementor",
  "elementskit-lite",
  "metform",
  "insert-headers-and-footers",
  "woocommerce"
]
```

### Branding (colors, fonts, layouts)

1. Set `theme.colors` (`primary`, `secondary`, `text`, `background`) and `theme.typography` (`headingFont`, `bodyFont`). Generate emits CSS variables and WooCommerce surface styles into the child theme.
2. Build **shop / cart / checkout** as Free Elementor trees under `woocommerce.pages.*`. Use `heading`, `text-editor`, `container`, `button`, `image`, and **`shortcode`** widgets:
   - Shop: `[products limit="4" columns="2"]`
   - Cart: `[woocommerce_cart]`
   - Checkout: `[woocommerce_checkout]`
3. Match layout spacing, headings, and copy to the project brief. Never use Woo Elementor widgets, Theme Builder, or Pro.
4. **Single product + product archives** use the child theme PHP templates (`woocommerce/single-product.php`, `archive-product.php`) styled by the emitted tokens. Do not invent Pro single-product builders.
5. If you omit a `woocommerce.pages` entry, Setup import creates a default heading + shortcode page and assigns the WooCommerce page option.

### Dummy products (max 4)

Only these fields: **name**, **price**, **description**, **image** (via Unsplash/Pexels https URL). Cap is **4**.

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native products add \
  --name "Ceramic Mug" \
  --price 18.00 \
  --description "Matte glaze, 12oz" \
  --image-url "https://images.unsplash.com/photo-…" \
  --package ./ctw-package.json \
  --media ./media
```

This downloads the image into `./media/`, registers `media[]`, and appends `woocommerce.products[]` with `imageMediaId`. The WordPress importer creates simple products on import.

## WPCode snippets

`snippets[]` supports `css` | `js` | `html` | **`php`** for WPCode (Insert Headers and Footers / WPCode).

- Use `php` only for small site helpers that WPCode would run (filters, Woo tweaks). Prefer CSS tokens for branding when possible.
- Never emit remote code loaders or destructive admin scripts.
- Locations: `header` | `footer` | `everywhere`.

## Output

1. Write valid `ctw-package.json` (version 1).
2. Ensure media files exist (fetch/sync/products add).
3. Generate:

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native generate \
  --package ./ctw-package.json --out ./<theme-slug>.zip --media ./media
```

4. Tell the web developer: `plugin-zip` → upload plugin → upload child ZIP → **CTW Native → Setup** (Install WooCommerce if needed) → import once.

## Package rules

- Parent: Hello Elementor (`Template: hello-elementor`).
- Exactly one `isFrontPage: true`.
- Elementor Free allowlist only. Forms → MetForm. Header/footer → ElementsKit.
- Brochure: `woocommerce.enabled: false` and omit woo from `plugins`, products, and woo pages.

## Client editing

- Pages/posts: Elementor Free
- Header/footer: ElementsKit
- Shop / cart / checkout: Elementor pages assigned as WooCommerce pages (plus native single/archive templates)
- Extra CSS: Appearance → Customize → Additional CSS
- Snippets: WPCode

## After install

Claude cannot edit the live site. Import is one-shot; wipe before regenerate.
