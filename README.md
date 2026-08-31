# Claude-to-WordPress Native

Offline **Claude Code** toolchain that emits a Hello Elementor **child theme** ZIP. A companion plugin installs Hello Elementor and the declared free stack, then imports pages so **Edit with Elementor** works.

Claude Code only. No Cursor. No Claude Desktop. Claude does not edit the site after install.

## What you get

| Artifact | Role |
| --- | --- |
| `plugin/` (`ctw-native`) | One-click stack install + one-shot import |
| Child theme ZIP from `ctw generate` | Hello child + `ctw-package.json` + media |

## Client editing surfaces

| Surface | Tool |
| --- | --- |
| Pages and posts | **Edit with Elementor** (Free widgets only) |
| Header and footer | **ElementsKit** Header Footer |
| Shop / cart / archives | Native **WooCommerce** PHP templates (only if `woocommerce.enabled`) |
| Extra CSS | **Appearance → Customize → Additional CSS** |

## Web-dev flow

1. Install and activate the `ctw-native` plugin.
2. In Claude Code, generate a site ZIP (`ctw generate`).
3. Upload and activate the child theme (`Template: hello-elementor`).
4. Open **CTW Native → Setup**. Install the stack (WooCommerce only if the package enables it). Import once.
5. Hand the site to the client.

Re-import is refused while generated pages exist. Wipe first to regenerate. Wipe does not delete Customizer Additional CSS.

## Claude Code

```bash
npm install
npm run build
npx ctw generate --package ./path/to/ctw-package.json --out ./acme-child.zip --media ./path/to/media
```

Use the skill in [`skills/ctw-native/`](skills/ctw-native/). Set `woocommerce.enabled` from the brief. Ship only Free Elementor widgets. WPCode snippets may be `css`, `js`, or `html` — never `php`.

## Plugins installed by setup

Always: Elementor, ElementsKit Lite, MetForm, WPCode (`insert-headers-and-footers`).

Optional: WooCommerce when `woocommerce.enabled` is true.

Parent theme: Hello Elementor from wordpress.org (not vendored).

## License

GPL-2.0-or-later. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

Patterns adapted from [msrbuilds/elementor-mcp](https://github.com/msrbuilds/elementor-mcp). Parent theme: [elementor/hello-theme](https://github.com/elementor/hello-theme).
