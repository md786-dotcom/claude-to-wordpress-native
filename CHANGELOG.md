# Changelog

Human-readable summaries of each user-facing release. This file is not a raw `git log`.

The project uses [Semantic Versioning](https://semver.org/). Git tags use the form `vMAJOR.MINOR.PATCH` (for example `v0.2.0`).

When a release fixes a publicly known runtime vulnerability that already had a CVE (or similar) at release time, that identifier is listed here.

## Unreleased

- README: minimalist layout with single npm and X links, improved spacing, and credit to Othneil Drew's Best-README-Template.
- Maintainer publish is local `npm login` and `npm publish`. GitHub Actions publish is optional (`workflow_dispatch` only). Git tags do not start a publish.

## [0.2.1](https://github.com/md786-dotcom/claude-to-wordpress-native/releases/tag/v0.2.1) - 2026-09-01

Install: `npx -y claude-to-wordpress-native@0.2.1 skill`

- Publish from GitHub Actions with npm trusted publishing (OIDC). npm attaches Sigstore / SLSA provenance. No long-lived `NPM_TOKEN`.
- README: npm provenance badge; OpenSSF Scorecard badge reads the published score from api.scorecard.dev.

No publicly known CVE-assigned runtime vulnerabilities were fixed in this release.

## [0.2.0](https://github.com/md786-dotcom/claude-to-wordpress-native/releases/tag/v0.2.0) - 2026-09-01

Install: `npx -y claude-to-wordpress-native@0.2.0 skill`

- Add `/ctw-native-check` skill and `check` CLI for schema, WPCode Free, and CSS policy before `generate`.
- Import WPCode Free snippets (Woo-only CSS; header/footer for CSS/JS/HTML; PHP-only `everywhere`).
- Use native Elementor grid/flex containers at full width. Remove package header/footer keys.
- Use custom SVG icons in skills. Remove Font Awesome.
- Add GitHub Actions npm publish workflow (`.github/workflows/publish.yml`).
- Document wipe → import flow, disclaimer, and Elementor Free widgets.
- Keep Elementor edits from fighting WPCode CSS. Ban page pseudo/hover CSS in the skill.

No publicly known CVE-assigned runtime vulnerabilities were fixed in this release.

## [0.1.0](https://www.npmjs.com/package/claude-to-wordpress-native)

Initial public npm package: Claude Code toolchain, companion plugin ZIP, media fetch, and Hello Elementor child theme generate.

No publicly known CVE-assigned runtime vulnerabilities were fixed in this release.
