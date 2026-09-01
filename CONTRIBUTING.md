# Contributing

Thank you for helping improve Claude-to-WordPress Native.

## How to contribute

1. Open a [GitHub issue](https://github.com/md786-dotcom/claude-to-wordpress-native/issues) for bugs or enhancement ideas (search first).
2. Fork the repository (or push a branch if you have write access).
3. Create a branch from `main`.
4. Make your change. Keep each source file under 500 lines.
5. Add or update automated tests when you add major functionality.
6. Open a **pull request** against `main`. Use the pull request template.
7. Wait for CI (GitHub Actions) to pass. Maintainers review and merge.

Do not commit secrets, npm tokens, or private keys.

## Development setup

Requires Node.js 20+ and npm.

```bash
npm install
npm run build
```

PHP plugin tests need PHP 8.1+ and Composer:

```bash
cd plugin
composer install --no-interaction
```

## How to run tests and checks

TypeScript (schema, generate, CLI):

```bash
npm test
npm run test:coverage
npm run lint
npm run typecheck
npx knip --include files,dependencies,unlisted
```

PHP plugin:

```bash
cd plugin
vendor/bin/phpunit
vendor/bin/phpstan analyse includes --level=5
vendor/bin/phpmd includes text cleancode,codesize,unusedcode
```

CI runs these on every pull request (see `.github/workflows/ci.yml`). CodeQL static analysis runs on `.github/workflows/codeql.yml`.

## Requirements for acceptable contributions

These match `.github/PULL_REQUEST_TEMPLATE.md`:

- Each source file has fewer than 500 lines of code.
- TypeScript has no `any` or bare `unknown` outside Zod parse boundaries.
- PHP snippets are allowed only as WPCode `type: "php"` and documented in the skill.
- WooCommerce installs only when `woocommerce.enabled` is true (or the Setup switch is on).
- Pull request comments use [ASD-STE100](docs/STE100.md) plain language.

ESLint (including SonarJS) and TypeScript `tsc` must stay clean. Do not disable linters to hide new warnings.

## Test policy

When you add major new functionality, add automated tests in the matching package (`packages/*/tests`) or in `plugin/tests`. CI must stay green. This policy is required even if a change is small enough to skip extra tests; reviewers may still ask for tests.

## Security

Report vulnerabilities using [SECURITY.md](SECURITY.md). Do not file public issues for undisclosed security problems.

## License

Contributions are licensed under GPL-2.0-or-later, the same as the project. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
