# `@ctw/cli`

Claude Code entry for Claude-to-WordPress Native.

```bash
npx claude-to-wordpress-native skill
npx claude-to-wordpress-native init --name "Acme Child" --slug acme-child
npx claude-to-wordpress-native validate --package ./ctw-package.json
npx claude-to-wordpress-native generate --package ./ctw-package.json --out ./acme-child.zip --media ./media
```

`skill` copies the packaged skill into `.claude/skills/ctw-native`. `init` also writes a starter `ctw-package.json` and `media/`.
