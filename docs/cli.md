# CLI reference

The published command is `claude-to-wordpress-native` (alias `ctw`). Runtime is the bundled `dist/ctw.mjs`. Requires Node.js 20+.

Print this summary:

```bash
npx -y claude-to-wordpress-native --help
```

Exit status: `0` on success, `1` on error (invalid package, missing flags, download failure).

## Commands

| Command | Purpose | Main inputs | Output |
| --- | --- | --- | --- |
| `skill` | Install Claude Code skills | `--cwd` (optional) | `.claude/skills/ctw-native` and `.claude/skills/ctw-native-check` |
| `plugin-zip` | Pack the companion WordPress plugin | `--cwd`, `--out` (default `ctw-native.zip`) | Uploadable plugin ZIP |
| `media fetch` | Download one https image into `./media` | `--url`, `--id`, optional `--package`, `--media`, `--alt`, `--path`, `--cwd` | File on disk; optional `media[]` update |
| `media sync` | Download missing `media[].sourceUrl` files | `--package`, optional `--media`, `--force`, `--cwd` | Files on disk |
| `products add` | Append a dummy WooCommerce product (max 4) | `--name`, `--price`, `--image-url`, `--package`, optional `--description`, `--image-id`, `--media`, `--cwd` | Updated `ctw-package.json` and media file |
| `init` | Scaffold package, media folder, and skills | `--name`, `--slug`, optional `--woocommerce`, `--cwd` | `ctw-package.json`, `media/`, skills |
| `check` | Validate package without writing a ZIP | `--package` | stdout success or stderr issues |
| `generate` | Build Hello Elementor child theme ZIP | `--package`, `--out`, optional `--media` | Child theme ZIP; auto-syncs missing `sourceUrl` media |

Image downloads require `https://` URLs only.

## Package file (`ctw-package.json`)

The machine-readable external interface is a JSON package file. Allowed Free widgets, core plugins, WooCommerce gate, and WPCode snippet types are defined in [`packages/schema/contract/ctw-contract.json`](../packages/schema/contract/ctw-contract.json). Invalid packages fail `check` and `generate`.

## Plugin UI

After you upload `ctw-native.zip` and a child theme, WordPress **CTW Native → Setup** installs the free stack and imports the package once. Wipe generated content before a second import. That UI is documented in the [README](../README.md#web-dev-flow).
