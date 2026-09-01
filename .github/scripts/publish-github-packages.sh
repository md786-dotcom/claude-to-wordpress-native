#!/usr/bin/env bash
set -euo pipefail

owner="${GITHUB_REPOSITORY_OWNER:?GITHUB_REPOSITORY_OWNER is required}"
token="${NODE_AUTH_TOKEN:?NODE_AUTH_TOKEN is required}"
pkg="claude-to-wordpress-native"
scoped="@${owner}/${pkg}"
version="$(node -p "require('./package.json').version")"

npm pkg set "name=${scoped}"

{
  echo "@${owner}:registry=https://npm.pkg.github.com/"
  echo "//npm.pkg.github.com/:_authToken=${token}"
} >> .npmrc

if npm publish --access public; then
  echo "Published ${scoped}@${version} to GitHub Packages."
  exit 0
fi

if npm view "${scoped}@${version}" --registry https://npm.pkg.github.com >/dev/null 2>&1; then
  echo "${scoped}@${version} is already on GitHub Packages."
  exit 0
fi

echo "npm publish failed and ${scoped}@${version} is not on GitHub Packages." >&2
exit 1
