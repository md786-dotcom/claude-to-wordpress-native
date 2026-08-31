# `@ctw/cli`

Claude Code entry for Claude-to-WordPress Native.

Published via the root package [`claude-to-wordpress-native`](https://www.npmjs.com/package/claude-to-wordpress-native):

```bash
npx -y claude-to-wordpress-native skill
npx -y claude-to-wordpress-native plugin-zip
npx -y claude-to-wordpress-native media fetch --url https://images.unsplash.com/… --id hero --package ./ctw-package.json
npx -y claude-to-wordpress-native media sync --package ./ctw-package.json
npx -y claude-to-wordpress-native init --name "Acme Child" --slug acme-child
npx -y claude-to-wordpress-native init --name "Shop Child" --slug shop-child --woocommerce
npx -y claude-to-wordpress-native products add --name "Mug" --price 12.00 --image-url https://images.unsplash.com/… --package ./ctw-package.json
npx -y claude-to-wordpress-native validate --package ./ctw-package.json
npx -y claude-to-wordpress-native check --package ./ctw-package.json
npx -y claude-to-wordpress-native generate --package ./ctw-package.json --out ./acme-child.zip --media ./media
```

`skill` copies the packaged skills into `.claude/skills/ctw-native` and `.claude/skills/ctw-native-check`. `plugin-zip` writes `./ctw-native.zip` for WordPress upload. `media fetch` / `media sync` pull https images into `./media`. `products add` appends up to 4 dummy WooCommerce products. `init` also writes a starter `ctw-package.json` and `media/` (add `--woocommerce` for shop packages). `check` / `validate` verify schema plus CSS snippets (unclosed rules, HTML-escaped combinators, WPCode Free locations) before `generate`. Snippets target WPCode Free (`insert-headers-and-footers`), not Pro.

Runtime ships as a self-contained `dist/ctw.mjs` bundle (no unpublished `@ctw/*` resolution). This workspace package is private and not published on its own.
