# `@ctw/cli`

Claude Code entry for Claude-to-WordPress Native.

Not on the npm registry yet. Use GitHub **main**:

```bash
npx -y github:md786-dotcom/claude-to-wordpress-native skill
npx -y github:md786-dotcom/claude-to-wordpress-native init --name "Acme Child" --slug acme-child
npx -y github:md786-dotcom/claude-to-wordpress-native validate --package ./ctw-package.json
npx -y github:md786-dotcom/claude-to-wordpress-native generate --package ./ctw-package.json --out ./acme-child.zip --media ./media
```

`skill` copies the packaged skill into `.claude/skills/ctw-native`. `init` also writes a starter `ctw-package.json` and `media/`.

Runtime ships as a self-contained `dist/ctw.mjs` bundle (no unpublished `@ctw/*` resolution).
