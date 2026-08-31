# Claude-to-WordPress Native

Offline **Claude Code** toolchain that emits a Hello Elementor **child theme** ZIP. A companion plugin installs Hello Elementor and the declared free stack, then imports pages so **Edit with Elementor** works.

Claude Code only. No Cursor. No Claude Desktop. Claude does not edit the site after install.

## Quick start (Claude Code)

The package is **not on the npm registry yet**. Install and run from GitHub **main**:

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native skill
```

Write an uploadable WordPress plugin ZIP into the current project:

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native plugin-zip
```

This creates `./ctw-native.zip`. In WordPress: **Plugins → Add New → Upload Plugin**.

Scaffold a starter package, media folder, and skill:

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native init --name "Acme Child" --slug acme-child
```

Generate the child theme ZIP:

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native generate --package ./ctw-package.json --out ./acme-child.zip --media ./media
```

The CLI ships as a self-contained `dist/ctw.mjs` bundle so unpublished workspace packages are not required at runtime.
From a local clone of this repo:

```bash
npm install
npm run build
npm run ctw -- skill
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
| Shop / cart / archives | Native **WooCommerce** PHP templates (only if `woocommerce.enabled`) |
| Extra CSS | **Appearance → Customize → Additional CSS** |

## Web-dev flow

1. Run `npx -y github:md786-dotcom/claude-to-wordpress-native plugin-zip` and upload `ctw-native.zip` (activate the plugin).
2. In Claude Code, run the GitHub `npx` skill (or `init`), then generate a site ZIP.
3. Upload and activate the child theme (`Template: hello-elementor`).
4. Open **CTW Native → Setup**. Install the stack (WooCommerce only if the package enables it). Import once.
5. Hand the site to the client.

Re-import is refused while generated pages exist. Wipe first to regenerate. Wipe does not delete Customizer Additional CSS.

## Local monorepo

```bash
npm install
npm run build
npm run ctw -- generate --package ./fixtures/brochure/ctw-package.json --out ./brochure.zip
```

Package legality (Free widgets, core plugins, snippet types) lives in `packages/schema/contract/ctw-contract.json`. Run `npm run build -w @ctw/schema` after editing it.

Validate without writing a ZIP: `npm run ctw -- validate --package ./ctw-package.json`.

## Plugins installed by setup

Always: Elementor, ElementsKit Lite, MetForm, WPCode (`insert-headers-and-footers`).

Optional: WooCommerce when `woocommerce.enabled` is true.

Parent theme: Hello Elementor from wordpress.org (not vendored).

## License

GPL-2.0-or-later. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

Patterns adapted from [msrbuilds/elementor-mcp](https://github.com/msrbuilds/elementor-mcp). Parent theme: [elementor/hello-theme](https://github.com/elementor/hello-theme).
