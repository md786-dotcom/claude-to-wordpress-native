# Claude-to-WordPress Native

Offline **Claude Code** toolchain that emits a Hello Elementor **child theme** ZIP. A companion plugin installs Hello Elementor and the declared free stack, then imports pages so **Edit with Elementor** works.

Claude Code only. Claude does not edit the site after install.

**Disclaimer:** The quality of the generated theme depends on the Claude model and the prompt. This tool/skill is a bridge between Claude-generated output and Elementor Free editing compatibility.

## Quick start (Claude Code)

```bash
npx -y claude-to-wordpress-native skill
```

Write an uploadable WordPress plugin ZIP into the current project:

```bash
npx -y claude-to-wordpress-native plugin-zip
```

This creates `./ctw-native.zip`. In WordPress: **Plugins → Add New → Upload Plugin**.

Pull images from Unsplash/Pexels/direct https into `./media` (optional `--package` updates `media[]`):

```bash
npx -y claude-to-wordpress-native media fetch \
  --url "https://images.unsplash.com/photo-…" \
  --id hero \
  --package ./ctw-package.json
```

Or set `media[].sourceUrl` and run `media sync` / `generate` (auto-fetches missing files).

Scaffold a starter package, media folder, and skill:

```bash
npx -y claude-to-wordpress-native init --name "Acme Child" --slug acme-child
# Shop scaffold:
# npx -y claude-to-wordpress-native init --name "Shop Child" --slug shop-child --woocommerce
```

Generate the child theme ZIP:

```bash
npx -y claude-to-wordpress-native generate --package ./ctw-package.json --out ./acme-child.zip --media ./media
```

The CLI ships as a self-contained `dist/ctw.mjs` bundle so unpublished workspace packages are not required at runtime.

Also available as `npx -y ctw …` after global install (`npm install -g claude-to-wordpress-native`).

From a local clone of this repo:

```bash
npm install
npm run build
npm run ctw -- skill
npm run ctw -- plugin-zip
npm run ctw -- generate --package ./ctw-package.json --out ./acme-child.zip --media ./media
```

In Claude Code, ask for a WordPress / Elementor site after `skill` or `init`. The skill drives `ctw-package.json` and the generate command.

## What you get

| Artifact | Role |
| --- | --- |
| `plugin/` (`ctw-native`) | One-click stack install + one-shot import |
| Child theme ZIP from `ctw generate` | Hello child + `ctw-package.json` + media |
| Claude Code skill | `.claude/skills/ctw-native` via `npx … skill` |

## Client editing surfaces

| Surface | Tool |
| --- | --- |
| Pages and posts | **Edit with Elementor** (Free widgets only) |
| Header and footer | **ElementsKit** Header Footer |
| Shop / cart / checkout | Elementor Free pages + shortcodes (assigned as Woo pages); single/archive use child PHP templates |
| Dummy products | Up to 4 via `products add` / `woocommerce.products` (name, price, description, image) |
| Extra CSS | **Appearance → Customize → Additional CSS** |

## Web-dev flow

1. Run `npx -y claude-to-wordpress-native plugin-zip` and upload `ctw-native.zip` (activate the plugin).
2. In Claude Code, run `npx -y claude-to-wordpress-native skill` (or `init`), then generate a site ZIP.
3. Upload and activate the child theme (`Template: hello-elementor`).
4. Open **CTW Native → Setup**. Use the **Install WooCommerce** switch when you need a shop (auto-on if the package enables it). Install the stack. Import once.
5. Hand the site to the client.

### After uploading or activating a new Claude theme

Whenever you upload/activate a new or regenerated child theme from Claude:

1. Open **CTW Native → Setup**.
2. Click **Wipe generated content** (required if a previous import exists; does not delete Customizer Additional CSS).
3. Click **Import package (one-shot)** to load the new theme package into Elementor.

Activating any theme (CTW child or not) automatically purges WordPress, Elementor, and common page caches so the new theme is shown.

Re-import is refused while generated pages exist. Wipe first to regenerate.

## Supported Elementor Free widgets

`heading`, `image`, `text-editor`, `video`, `button`, `divider`, `spacer`, `google_maps`, `icon`, `image-box`, `icon-box`, `star-rating`, `image-carousel`, `image-gallery`, `icon-list`, `counter`, `progress`, `testimonial`, `tabs`, `accordion`, `toggle`, `social-icons`, `alert`, `html`, `shortcode`, `menu-anchor`, `sidebar`.

Layout uses Elementor `container` (`content_width: full`). Forms → MetForm. Header/footer → ElementsKit.

## Media

| Source | How |
| --- | --- |
| Local / Claude-attached files | Copy into `./media/`, list in `media[]`, reference `{ "id": "<media.id>", "url": "" }` on image widgets |
| Unsplash / Pexels / https | `media fetch --url … --id …` or `media[].sourceUrl` + `media sync` / `generate` |

Only `https://` image URLs. Remotes are downloaded into `./media/` before the child ZIP is built — live CDN URLs are not left in Elementor settings.

## Local monorepo

```bash
npm install
npm run build
npm run ctw -- plugin-zip
npm run ctw -- generate --package ./fixtures/brochure/ctw-package.json --out ./brochure.zip
```

Package legality (Free widgets, core plugins, snippet types) lives in `packages/schema/contract/ctw-contract.json`. Run `npm run build -w @ctw/schema` after editing it.

Validate schema and CSS snippets without writing a ZIP: `npm run ctw -- check --package ./ctw-package.json` (`validate` is the same command). `generate` refuses a ZIP when CSS check fails (unclosed `{`, HTML-escaped `>` combinators, `<style>` wrappers on `type: "css"`).

## Publish (maintainers)

```bash
npm login
npm publish
```

Preview the tarball first: `npm pack --dry-run` / `npm publish --dry-run`. Name `claude-to-wordpress-native@version` cannot be reused after publish.

## Plugins installed by setup

Always: Elementor, ElementsKit Lite, MetForm, **WPCode Free** (`insert-headers-and-footers` on wordpress.org — not WPCode Pro).

Optional: WooCommerce when `woocommerce.enabled` is true in the package, or when the Setup **Install WooCommerce** switch is turned on. Shop packages may include branded shop/cart/checkout Elementor pages, up to 4 dummy products, and WPCode Free snippets (`css` | `js` | `html` | `php`). CSS/JS/HTML use `header` or `footer` only; `everywhere` is PHP-only.

Parent theme: Hello Elementor from wordpress.org (not vendored).

## License

GPL-2.0-or-later. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

Patterns adapted from [msrbuilds/elementor-mcp](https://github.com/msrbuilds/elementor-mcp). Parent theme: [elementor/hello-theme](https://github.com/elementor/hello-theme).
