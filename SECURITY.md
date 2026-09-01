# Security policy

## Supported versions

Security fixes apply to the latest published npm release of `claude-to-wordpress-native` (see [Releases](https://github.com/md786-dotcom/claude-to-wordpress-native/releases) and [npm](https://www.npmjs.com/package/claude-to-wordpress-native)). Older versions do not receive patches.

## How to report a vulnerability

Do **not** open a public GitHub issue for a security vulnerability.

### Preferred: private GitHub report

1. Open [Privately report a vulnerability](https://github.com/md786-dotcom/claude-to-wordpress-native/security/advisories/new).
2. If that page is not available, the repository owner must enable **Private vulnerability reporting** under **Settings → Code security**.
3. Include the affected version, a description of the issue, and steps to reproduce.

### Fallback

If private reporting is not enabled, email the maintainer at the address on the [GitHub profile](https://github.com/md786-dotcom) (`afanaus5@gmail.com`). Use a clear subject such as `SECURITY: claude-to-wordpress-native`.

## What to expect

- The project aims to acknowledge vulnerability reports within **14 days**.
- Confirmed issues are fixed in a new release when practical. Publicly known medium-or-higher severity issues are targeted for a patch within **60 days** of public disclosure.
- Release notes in [CHANGELOG.md](CHANGELOG.md) and GitHub Releases will name any publicly known, CVE-assigned runtime vulnerability that a release fixes.

## Security notes for this software

- Obtain the CLI from npm over HTTPS (`npx` / `npm install`) or from this GitHub repository over HTTPS.
- `media fetch` / `media sync` accept **https** image URLs only. The toolchain does not keep live CDN URLs in Elementor widget settings.
- The plugin does not store end-user passwords. WordPress and WooCommerce handle authentication.
- Generated sites should stay on HTTPS in production (WordPress site URL and TLS).
