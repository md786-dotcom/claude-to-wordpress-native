#!/usr/bin/env bash
set -euo pipefail

owner="${GITHUB_REPOSITORY_OWNER:?GITHUB_REPOSITORY_OWNER is required}"
token="${NODE_AUTH_TOKEN:?NODE_AUTH_TOKEN is required}"
pkg="claude-to-wordpress-native"
scoped="@${owner}/${pkg}"
encoded="$(printf '%s' "${scoped}" | sed 's/@/%40/; s/\//%2F/')"

npm pkg set "name=${scoped}"

{
  echo "@${owner}:registry=https://npm.pkg.github.com/"
  echo "//npm.pkg.github.com/:_authToken=${token}"
} >> .npmrc

npm publish --access public

if command -v gh >/dev/null 2>&1; then
  gh api -X PATCH "user/packages/npm/${encoded}" -f visibility=public
fi
