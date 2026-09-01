# OpenSSF Best Practices Badge (passing)

This project is set up to qualify for the [OpenSSF Best Practices **passing** badge](https://www.bestpractices.dev/en/criteria/0). The badge is **self-certified** on bestpractices.dev. Only a GitHub user who can represent this repository can create the project entry (GitHub OAuth). An automation token cannot complete that login.

## After this branch is merged to `main`

1. Sign in at [https://www.bestpractices.dev](https://www.bestpractices.dev) with GitHub (`md786-dotcom`).
2. Choose **Add New Project**.
3. Set:
   - **Name:** Claude-to-WordPress Native
   - **Description:** Offline Claude Code toolchain that emits Hello Elementor child theme ZIPs and a companion plugin so Edit with Elementor works on Elementor Free.
   - **Homepage URL:** `https://github.com/md786-dotcom/claude-to-wordpress-native`
   - **Repository URL:** `https://github.com/md786-dotcom/claude-to-wordpress-native`
4. Select the **Metal series** (passing / silver / gold). Fill **passing** first.
5. Use the answers below. Many GitHub-hosted fields autofill.
6. Copy the numeric project id from the URL (`https://www.bestpractices.dev/projects/<ID>`).
7. Add this badge to `README.md` (replace `<ID>`):

```markdown
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/<ID>/badge)](https://www.bestpractices.dev/projects/<ID>)
```

8. Enable **Private vulnerability reporting**: GitHub repo **Settings → Code security → Private vulnerability reporting**.

## Suggested passing answers

Mark **Met** unless noted. Paste the URLs. Use **N/A** only where listed.

### Basics

| Criterion | Status | Justification / URL |
| --- | --- | --- |
| description_good | Met | README opening paragraphs. |
| interact | Met | README: obtain via npm/`npx`; [issues](https://github.com/md786-dotcom/claude-to-wordpress-native/issues); [CONTRIBUTING.md](https://github.com/md786-dotcom/claude-to-wordpress-native/blob/main/CONTRIBUTING.md). |
| contribution | Met | https://github.com/md786-dotcom/claude-to-wordpress-native/blob/main/CONTRIBUTING.md |
| contribution_requirements | Met | Same file: coding standards, tests, PR template. |
| floss_license | Met | GPL-2.0-or-later (OSI). |
| floss_license_osi | Met | GPL-2.0-or-later. |
| license_location | Met | https://github.com/md786-dotcom/claude-to-wordpress-native/blob/main/LICENSE |
| documentation_basics | Met | README: install (`npx`), start (skill / plugin-zip / generate), use, HTTPS-only media. |
| documentation_interface | Met | https://github.com/md786-dotcom/claude-to-wordpress-native/blob/main/docs/cli.md |
| sites_https | Met | GitHub and npm over HTTPS. |
| discussion | Met | GitHub issues and pull requests. |
| english | Met | Docs and issues in English. |
| maintained | Met | Active npm releases (for example 0.2.0). |

### Change control

| Criterion | Status | Justification / URL |
| --- | --- | --- |
| repo_public | Met | This GitHub repository. |
| repo_track | Met | Git history (author, date, message). |
| repo_interim | Met | Full git history, not release tarballs only. |
| repo_distributed | Met | git. |
| version_unique | Met | npm SemVer (`package.json` `version`; tags `v0.2.0`). |
| version_semver | Met | Semantic Versioning. |
| version_tags | Met | GitHub tags such as `v0.2.0`. |
| release_notes | Met | https://github.com/md786-dotcom/claude-to-wordpress-native/blob/main/CHANGELOG.md and [Releases](https://github.com/md786-dotcom/claude-to-wordpress-native/releases). |
| release_notes_vulns | N/A | No publicly known CVE-assigned runtime vulnerabilities in published releases (see CHANGELOG). |

### Reporting

| Criterion | Status | Justification / URL |
| --- | --- | --- |
| report_process | Met | https://github.com/md786-dotcom/claude-to-wordpress-native/issues |
| report_tracker | Met | GitHub Issues. |
| report_responses | Met | No bug reports in the last 2–12 months yet; new reports will be acknowledged. |
| enhancement_responses | Met | Same as above for enhancement requests. |
| report_archive | Met | https://github.com/md786-dotcom/claude-to-wordpress-native/issues?q=is%3Aissue |
| vulnerability_report_process | Met | https://github.com/md786-dotcom/claude-to-wordpress-native/blob/main/SECURITY.md |
| vulnerability_report_private | Met | SECURITY.md: GitHub private reporting (enable in repo settings) and maintainer email fallback. |
| vulnerability_report_response | N/A | No vulnerability reports in the last 6 months. |

### Quality

| Criterion | Status | Justification / URL |
| --- | --- | --- |
| build | Met | `npm run build` (documented in README and CONTRIBUTING). |
| build_common_tools | Met | npm, TypeScript, esbuild, Composer/PHPUnit. |
| build_floss_tools | Met | Node.js, npm, PHP, Composer. |
| test | Met | `npm test`; plugin `vendor/bin/phpunit`; CONTRIBUTING.md; `.github/workflows/ci.yml`. |
| test_invocation | Met | `npm test` / `vendor/bin/phpunit`. |
| test_most | Unmet | Coverage exists (`npm run test:coverage`) but is not claimed as “most branches”. |
| test_continuous_integration | Met | GitHub Actions CI on push and pull request. |
| test_policy | Met | CONTRIBUTING.md “Test policy”. |
| tests_are_added | Met | Packages under `packages/*/tests` and `plugin/tests` grow with features. |
| tests_documented_added | Met | CONTRIBUTING.md. |
| warnings | Met | ESLint + typescript-eslint + SonarJS; `tsc`; PHPStan/PHPMD in CI. |
| warnings_fixed | Met | `npm run lint` and `npm run typecheck` must pass in CI. |
| warnings_strict | Met | ESLint recommended + `no-explicit-any` error. |

### Security

| Criterion | Status | Justification |
| --- | --- | --- |
| know_secure_design | Met | Primary maintainer: HTTPS-only delivery and media, least privilege (no live WP credentials in the CLI), fail-safe defaults, input allowlists (package contract / Zod). |
| know_common_errors | Met | XSS/injection in generated WP/Elementor output, unsafe URL fetch; mitigated by https-only media, schema allowlists, no arbitrary PHP except documented WPCode `php` snippets. |
| crypto_* (published, call, floss, keylength, working, weaknesses, pfs, password_storage, random) | N/A | Project does not implement cryptography. TLS is provided by Node.js/npm and GitHub. No password storage. |
| delivery_mitm | Met | npm registry and GitHub HTTPS. |
| delivery_unsigned | Met | Hashes are not fetched over HTTP. |
| vulnerabilities_fixed_60_days | Met | No known unpatched medium+ public vulnerabilities. |
| vulnerabilities_critical_fixed | Met | Same. |
| no_leaked_credentials | Met | Repository must not contain live secrets; CONTRIBUTING forbids committing tokens. |

### Analysis

| Criterion | Status | Justification / URL |
| --- | --- | --- |
| static_analysis | Met | ESLint SonarJS, PHPStan, PHPMD, Knip, CodeQL for JavaScript/TypeScript (`.github/workflows/codeql.yml`). PHP is not a CodeQL language; PHPStan/PHPMD cover the plugin. |
| static_analysis_common_vulnerabilities | Met | CodeQL + SonarJS. |
| static_analysis_fixed | Met | Medium+ exploitable findings are fixed before release. |
| static_analysis_often | Met | CI and CodeQL on pull requests. |
| dynamic_analysis | Unmet | No fuzzer/DAST yet. Automated tests exist but are not claimed as 80% branch coverage. |
| dynamic_analysis_unsafe | N/A | No C/C++ in project results. |
| dynamic_analysis_enable_assertions | Unmet | No separate assertion-heavy dynamic analysis config. |
| dynamic_analysis_fixed | N/A | Dynamic analysis (beyond the test suite) is not run for vulnerability hunting. |

SHOULD/SUGGESTED items marked **Unmet** are allowed at passing if they are considered (the form still needs a rating). MUST items above are Met or N/A.
