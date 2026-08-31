---
name: ctw-native
description: Generate Hello Elementor child theme ZIPs with Elementor Free pages for Claude-to-WordPress Native. Use for WordPress, Elementor, WooCommerce shop, media/Unsplash/Pexels, dummy products, WPCode Free snippets (css/js/html/php via insert-headers-and-footers, not WPCode Pro), Font Awesome Free icons via CDN, or CSS/package checks before generate (/ctw-native-check).
---

# CTW Native (Claude Code)

You generate an offline site package. You do **not** edit a live WordPress site after install.

**Disclaimer:** Theme quality depends on the Claude model and the prompt. This skill/tool is a bridge between Claude-generated output and Elementor Free editing compatibility — it does not guarantee design quality on its own.

## Install this skill (once per project)

```bash
npx -y claude-to-wordpress-native skill
```

```bash
# Brochure
npx -y claude-to-wordpress-native init --name "Acme Child" --slug acme-child

# Shop
npx -y claude-to-wordpress-native init --name "Shop Child" --slug shop-child --woocommerce
```

Write the WordPress plugin ZIP (upload under **Plugins → Add New → Upload Plugin**):

```bash
npx -y claude-to-wordpress-native plugin-zip
```

From a local clone of this repo, use `npm run ctw -- plugin-zip` instead.

## Media and images

Ship real files under `./media/` and list them in `media[]`. Prefer downloading remotes before generate.

```bash
npx -y claude-to-wordpress-native media fetch \
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
2. **Full width only — never boxed.** Every Elementor `container` must set `"content_width": "full"`. Omitting it makes Elementor Free default to boxed. Do not set `"content_width": "boxed"` or rely on `boxed_width`. Pages already use the `elementor_header_footer` (Elementor Full Width) template.
3. Build **shop / cart / checkout** as Free Elementor trees under `woocommerce.pages.*`. Use `heading`, `text-editor`, `container`, `button`, `image`, and **`shortcode`** widgets:
   - Shop: `[products limit="4" columns="2"]`
   - Cart: `[woocommerce_cart]`
   - Checkout: `[woocommerce_checkout]`
4. Match layout spacing, headings, and copy to the project brief. Never use Woo Elementor widgets, Theme Builder, or Pro.
5. **Single product + product archives** use the child theme PHP templates (`woocommerce/single-product.php`, `archive-product.php`) styled by the emitted tokens. Do not invent Pro single-product builders.
6. If you omit a `woocommerce.pages` entry, Setup import creates a default heading + shortcode page and assigns the WooCommerce page option.

Example outer container:

```json
{
  "id": "home001",
  "elType": "container",
  "widgetType": null,
  "isInner": false,
  "settings": {
    "content_width": "full",
    "flex_direction": "column"
  },
  "elements": []
}
```

### Dummy products (max 4)

Only these fields: **name**, **price**, **description**, **image** (via Unsplash/Pexels https URL). Cap is **4**.

```bash
npx -y claude-to-wordpress-native products add \
  --name "Ceramic Mug" \
  --price 18.00 \
  --description "Matte glaze, 12oz" \
  --image-url "https://images.unsplash.com/photo-…" \
  --package ./ctw-package.json \
  --media ./media
```

This downloads the image into `./media/`, registers `media[]`, and appends `woocommerce.products[]` with `imageMediaId`. The WordPress importer creates simple products on import.

## WPCode Free snippets (not Pro)

The stack installs **WPCode Free** from wordpress.org (`insert-headers-and-footers`). Do **not** assume WPCode Pro. Do not emit Pro-only snippet types, auto-insert locations, generators, cloud library payloads, or device/conditional rules.

`snippets[]` types (Free only): `css` | `js` | `html` | **`php`**. Never `scss`, `blocks`, or `universal`.

### Locations (package JSON → WPCode Free)

| Package `location` | `css` / `js` / `html` | `php` |
| --- | --- | --- |
| `"header"` | Site Wide Header (`wp_head`) | Site Wide Header |
| `"footer"` | Site Wide Footer (`wp_footer`) | Site Wide Footer |
| `"everywhere"` | **Invalid** — `check` / schema fail. Use `"header"`. | Run Everywhere (PHP only) |

- Put **layout CSS** (grids, hero splits, `.e-con-inner`) in a `type: "css"` snippet with `location: "header"`. Do not put that CSS in an Elementor `html` widget.
- Omit `location` and css/js/html default to `"header"`; php defaults to `"everywhere"`.
- Use `php` only for small site helpers (filters, Woo tweaks). Prefer CSS tokens for branding when possible.
- Never emit remote code loaders or destructive admin scripts.
- Never use Pro auto-insert: CSS-selector “anywhere”, insert after N words, Woo/EDD/MemberPress locations.
- Never use Pro conditions: device type (desktop/mobile), browser, OS, geo, schedule, Woo rules. Free snippets always run on every device.
- WPCode Free wraps `type: "css"` in `<style class="wpcode-css-snippet">` for you. Raw CSS only.

### CSS must parse (run `check` before generate)

WPCode prints `type: "css"` as real CSS. The child combinator `>` is valid. **Do not** “escape special characters” in selectors:

| Wrong | Why | Right |
| --- | --- | --- |
| `.grid-2 \> .e-con-inner` or `.grid-2 &gt; .e-con-inner` | Escaping `>` changes the selector. It will not match. | `.grid-2 .e-con-inner, .grid-2 { … }` |
| `{grid-template-columns:1fr !important;` | Truncated rule (missing `}`) | Close every `{` with `}` |
| `<style>…</style>` inside `type: "css"` | WPCode wraps CSS for you | Raw CSS only |

Prefer descendant targeting so Elementor inner wrappers still receive the grid:

```css
.grid-2,
.grid-2 .e-con-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
```

After writing or changing snippets, **always** run:

```bash
npx -y claude-to-wordpress-native check --package ./ctw-package.json
```

Fix every error and re-run until exit 0. The `/ctw-native-check` skill is this same loop. `generate` refuses a ZIP when CSS check fails.

## Icons (Font Awesome Free via CDN)

Elementor Free widgets `icon`, `icon-box`, `icon-list`, and `social-icons` need **Font Awesome Free CSS** on the front end. Always ship it as a WPCode **`html`** snippet in **`header`** (do not rely on Elementor’s bundled icons alone).

```json
{
  "title": "Font Awesome Free CDN",
  "type": "html",
  "location": "header",
  "code": "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/css/all.min.css\" crossorigin=\"anonymous\" referrerpolicy=\"no-referrer\" />"
}
```

Rules:

- Use this **jsDelivr Font Awesome Free** stylesheet only (`@fortawesome/fontawesome-free`). Pin a specific version (e.g. `6.7.2`).
- In Elementor icon settings use Free classes only, e.g. `fas fa-home`, `far fa-envelope`, `fab fa-instagram` via `selected_icon: { "value": "fas fa-home", "library": "fa-solid" }` (or `fa-regular` / `fa-brands`).
- Do **not** use Font Awesome Pro kits, kit codes, or paid families.
- Do **not** load the full **Web Awesome** component CDN (`ka-f.webawesome.com` / `<wa-icon>`) for Elementor Free trees — that is a separate web-component stack and does not drive Elementor’s icon controls. Prefer FA Free CSS above.
- One CDN snippet per package is enough; do not duplicate it.

## Supported Elementor Free widgets

Use **only** these `widgetType` values (plus `elType: "container"` for layout). Never emit Pro, Woo Elementor, Theme Builder, or other widgets.

| widgetType | Notes |
| --- | --- |
| `heading` | |
| `image` | Reference media via `{ "id": "<media.id>", "url": "" }` |
| `text-editor` | |
| `video` | |
| `button` | |
| `divider` | |
| `spacer` | |
| `google_maps` | |
| `icon` | Needs Font Awesome Free CDN snippet |
| `image-box` | |
| `icon-box` | Needs Font Awesome Free CDN snippet |
| `star-rating` | |
| `image-carousel` | |
| `image-gallery` | |
| `icon-list` | Needs Font Awesome Free CDN snippet |
| `counter` | |
| `progress` | |
| `testimonial` | |
| `tabs` | |
| `accordion` | |
| `toggle` | |
| `social-icons` | Needs Font Awesome Free CDN snippet |
| `alert` | |
| `html` | |
| `shortcode` | Prefer for Woo shop/cart/checkout |
| `menu-anchor` | |
| `sidebar` | |

Forms → MetForm (`forms[]`). Header/footer → ElementsKit (`header` / `footer`). Not Elementor form or Theme Builder.

## Output

After `/ctw-native` finishes writing the package, **always** run `/ctw-native-check` before generate.

1. Write valid `ctw-package.json` (version 1).
2. Ensure media files exist (fetch/sync/products add).
3. Run `/ctw-native-check` (same as `check`) and fix CSS/schema errors until it passes:

```bash
npx -y claude-to-wordpress-native check --package ./ctw-package.json
```

4. Generate (blocked until check passes):

```bash
npx -y claude-to-wordpress-native generate \
  --package ./ctw-package.json --out ./<theme-slug>.zip --media ./media
```

5. Tell the web developer the install / re-import steps below.

## After uploading or activating a new Claude theme

Claude cannot edit the live site. After the developer uploads and activates a new (or regenerated) child theme ZIP:

1. Open **CTW Native → Setup** in WordPress.
2. Click **Wipe generated content** (required whenever generated pages already exist; wipe does not delete Customizer Additional CSS).
3. Click **Import package (one-shot)** to apply the new theme’s `ctw-package.json`.

First-time sites (nothing imported yet): skip wipe, install the stack if needed, then **Import package (one-shot)** once.

Always tell the developer: upload/activate child theme → **CTW Native → Wipe generated content** → **Import package (one-shot)**.

## Package rules

- Parent: Hello Elementor (`Template: hello-elementor`).
- Exactly one `isFrontPage: true`.
- Elementor Free allowlist only (see table above). Forms → MetForm. Header/footer → ElementsKit.
- Containers: always `"content_width": "full"` (never boxed).
- Brochure: `woocommerce.enabled: false` and omit woo from `plugins`, products, and woo pages.

## Client editing

- Pages/posts: Elementor Free
- Header/footer: ElementsKit
- Shop / cart / checkout: Elementor pages assigned as WooCommerce pages (plus native single/archive templates)
- Extra CSS: Appearance → Customize → Additional CSS
- Snippets: **WPCode Free** → Code Snippets (wordpress.org `insert-headers-and-footers`). Auto Insert = Site Wide Header/Footer. Not WPCode Pro (no SCSS, Blocks, device rules, or CSS-selector insert).
