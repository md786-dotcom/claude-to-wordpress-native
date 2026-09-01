---
name: ctw-native
description: Generate Hello Elementor child theme ZIPs with Elementor Free pages for Claude-to-WordPress Native. Use for WordPress, Elementor, WooCommerce shop, media/Unsplash/Pexels, dummy products, custom SVG icons in media, WPCode Free snippets (css/js/html/php via insert-headers-and-footers, not WPCode Pro), or CSS/package checks before generate (/ctw-native-check).
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

## Layout: native Elementor settings first

There are two styling authorities. **Edit with Elementor** is the product USP. WPCode CSS is site-wide, is not editable in Elementor, and with `!important` (or layout selectors like `.e-con-inner`) silently overrides later client edits.

Do **not** put page layout CSS (grids, hero splits, `.e-con-inner`, `.grid-2`) in a WPCode snippet.

### Grids → native Grid Container

Use Elementor `container_type: "grid"` (Free Grid Container, 3.16+). The importer writes `settings` through verbatim.

```json
{
  "id": "heroGrid",
  "elType": "container",
  "widgetType": null,
  "isInner": false,
  "settings": {
    "content_width": "full",
    "container_type": "grid",
    "grid_columns_grid": { "unit": "fr", "size": 2, "sizes": [] },
    "grid_rows_grid": { "unit": "fr", "size": 1, "sizes": [] },
    "grid_gaps": {
      "unit": "px",
      "size": 24,
      "sizes": [],
      "column": "24",
      "row": "24",
      "isLinked": true
    },
    "grid_columns_grid_tablet": { "unit": "fr", "size": 2, "sizes": [] },
    "grid_columns_grid_mobile": { "unit": "fr", "size": 1, "sizes": [] }
  },
  "elements": []
}
```

Pre-3.16 fallback: `container_type: "flex"` with `flex_direction: "row"` and `flex_direction_mobile: "column"`. Never CSS `display: grid` on Elementor wrappers.

### Page styling → native widget settings

Padding, colors, typography, borders, letter-spacing, and gaps belong on the element (`padding`, `background_color`, `typography_*`, `border_*`). Do not set `_css_classes` / `css_classes` to hook layout CSS.

Fonts and brand colors need no page CSS: set `theme.colors` / `theme.typography` (generate emits `--ctw-*` tokens) and set heading/text-editor typography on the widget (Elementor enqueues Google Fonts).

### CSS snippets are WooCommerce-only

- Brochure packages (`woocommerce.enabled: false`): **zero** `type: "css"` snippets.
- Shop packages: `type: "css"` selectors must be `.woocommerce…` or `.ctw-woo-…` only. `!important` is legitimate there.
- Icons: custom SVG in `media[]` only — no Font Awesome, Web Awesome, or icon CDNs. `php` / `js` follow the Free location rules below.

`/ctw-native-check` (`check`) fails the package when these rules are broken.

### No header or footer in the package

Do **not** emit top-level `header` or `footer` in `ctw-package.json`. ElementsKit Free **Header Footer** is configured **manually in WordPress** after import (not by Claude Code).

Tell the developer: after import, open **ElementsKit → Header Footer**, create header and footer templates, and assign them to the site.

### No pseudo-elements, hover CSS, or motion tricks

Site-wide page CSS is banned. Do not design layouts that need custom `:hover`, `:focus`, `::before`, `::after`, transitions, or motion effects backed by WPCode or widget `<style>` blocks.

- Use **static** native Elementor settings: solid colors, typography, padding, borders, grid/flex layout.
- Do **not** set `hover_animation`, `motion_fx`, or sticky/motion keys on elements.
- Do **not** put pseudo-class or pseudo-element CSS in `html` / text-editor content.
- WooCommerce `type: "css"` snippets may still use `:hover` or `::` **only** on `.woocommerce` / `.ctw-woo-*` selectors (for example `.woocommerce a.button:hover`).

## WPCode Free snippets (not Pro)

The stack installs **WPCode Free** from wordpress.org (`insert-headers-and-footers`). Do **not** assume WPCode Pro. Do not emit Pro-only snippet types, auto-insert locations, generators, cloud library payloads, or device/conditional rules.

`snippets[]` types (Free only): `css` | `js` | `html` | **`php`**. Never `scss`, `blocks`, or `universal`.

### Locations (package JSON → WPCode Free)

| Package `location` | `css` / `js` / `html` | `php` |
| --- | --- | --- |
| `"header"` | Site Wide Header (`wp_head`) | Site Wide Header |
| `"footer"` | Site Wide Footer (`wp_footer`) | Site Wide Footer |
| `"everywhere"` | **Invalid** — `check` / schema fail. Use `"header"`. | Run Everywhere (PHP only) |

- Do **not** put layout CSS (grids, hero splits, `.e-con-inner`) in a `type: "css"` snippet or in an Elementor `html` / text-editor `<style>` block. Use native Grid/Flex container settings.
- Omit `location` and css/js/html default to `"header"`; php defaults to `"everywhere"`.
- Use `php` only for small site helpers (filters, Woo tweaks). Prefer CSS tokens for branding when possible.
- Never emit remote code loaders or destructive admin scripts.
- Never use Pro auto-insert: CSS-selector “anywhere”, insert after N words, Woo/EDD/MemberPress locations.
- Never use Pro conditions: device type (desktop/mobile), browser, OS, geo, schedule, Woo rules. Free snippets always run on every device.
- WPCode Free wraps `type: "css"` in `<style class="wpcode-css-snippet">` for you. Raw CSS only.

### CSS must parse (run `check` before generate)

WPCode prints residual Woo `type: "css"` as real CSS. The child combinator `>` is valid. **Do not** “escape special characters” in selectors:

| Wrong | Why | Right |
| --- | --- | --- |
| `.woocommerce .products \> li` or `&gt;` | Escaping `>` changes the selector. It will not match. | `.woocommerce .products > li` or a descendant space |
| `{grid-template-columns:1fr !important;` | Truncated rule (missing `}`) | Close every `{` with `}` |
| `<style>…</style>` inside `type: "css"` | WPCode wraps CSS for you | Raw CSS only |

After writing or changing snippets, **always** run:

```bash
npx -y claude-to-wordpress-native check --package ./ctw-package.json
```

Fix every error and re-run until exit 0. The `/ctw-native-check` skill is this same loop. `generate` refuses a ZIP when check fails. There is no `validate` command.

## Icons (custom SVG only)

Do **not** use Font Awesome, Web Awesome, icon font CDNs, or `fas fa-*` / `fa-solid` classes. Do not ship a WPCode snippet that loads `@fortawesome/fontawesome-free`, Font Awesome kits, or Web Awesome (`webawesome.com`, `<wa-icon>`).

Use **custom SVG files** in `./media/` and list them in `media[]`.

### Preferred patterns

1. **`image` widget** — reference SVG media: `{ "id": "<media.id>", "url": "" }` with `path` ending in `.svg`.
2. **`html` widget** — inline a small SVG (no `<style>` block): `<svg xmlns="http://www.w3.org/2000/svg" …>…</svg>`.
3. **`icon` / `icon-box` / `icon-list` / `social-icons`** — prefer `image` + text, or inline SVG in `html`, instead of Elementor icon-font libraries. Text-only `icon-list` rows (no icon glyph) are fine when the brief does not need glyphs.

### Media example

```json
{
  "id": "icon-phone",
  "path": "icons/phone.svg",
  "alt": "Phone"
}
```

```json
{
  "id": "svcIcon",
  "elType": "widget",
  "widgetType": "image",
  "isInner": false,
  "settings": {
    "image": { "id": "icon-phone", "url": "" }
  },
  "elements": []
}
```

Copy or generate SVGs into `./media/icons/` before `generate`. `check` fails Font Awesome / Web Awesome CDN snippets and `fa-*` icon classes.

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
| `icon` | Custom SVG via `image` or inline `html` — no icon fonts |
| `image-box` | |
| `icon-box` | Custom SVG via `image` or inline `html` — no icon fonts |
| `star-rating` | |
| `image-carousel` | |
| `image-gallery` | |
| `icon-list` | Text-only rows OK; custom SVG via `image`/`html` if icons needed |
| `counter` | |
| `progress` | |
| `testimonial` | |
| `tabs` | |
| `accordion` | |
| `toggle` | |
| `social-icons` | Custom SVG links via `image`/`html` — no FA / Web Awesome |
| `alert` | |
| `html` | Do not put `<style>` here. Use native Elementor settings. |
| `shortcode` | Prefer for Woo shop/cart/checkout |
| `menu-anchor` | |
| `sidebar` | |

Forms → MetForm (`forms[]`). **Do not** emit package `header` / `footer` — ElementsKit Free Header Footer is built manually in WordPress after import. Not Elementor form or Theme Builder.

## Output

After `/ctw-native` finishes writing the package, **always** run `/ctw-native-check` before generate.

1. Write valid `ctw-package.json` (version 1).
2. Ensure media files exist (fetch/sync/products add).
3. Run `/ctw-native-check` (`check`) and fix schema/style errors until it passes:

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

Always tell the developer: upload/activate child theme → **CTW Native → Wipe generated content** → **Import package (one-shot)** → **ElementsKit → Header Footer** (build header and footer manually).

## Package rules

- Parent: Hello Elementor (`Template: hello-elementor`).
- Exactly one `isFrontPage: true`.
- Elementor Free allowlist only (see table above). Forms → MetForm. **No** package `header` / `footer` (ElementsKit Free after import).
- Containers: always `"content_width": "full"` (never boxed).
- Layout via native container settings (`container_type: "grid"` or flex). CSS snippets are Woo-only; brochure packages ship none.
- Brochure: `woocommerce.enabled: false` and omit woo from `plugins`, products, and woo pages.

## Client editing

- Pages/posts: Elementor Free
- Header/footer: **ElementsKit Free** (manual in WP after import — not in `ctw-package.json`)
- Shop / cart / checkout: Elementor pages assigned as WooCommerce pages (plus native single/archive templates)
- Extra CSS: Appearance → Customize → Additional CSS (client-authored). Do not ship page layout CSS in WPCode — it would override these Elementor edits.
- Snippets: **WPCode Free** → Code Snippets (wordpress.org `insert-headers-and-footers`). Auto Insert = Site Wide Header/Footer. CSS snippets are Woo-only. Not WPCode Pro (no SCSS, Blocks, device rules, or CSS-selector insert).
