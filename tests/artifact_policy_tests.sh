#!/usr/bin/env bash
set -euo pipefail
source_root="$(cd "$(dirname "$0")/.." && pwd)"
fixture="$(mktemp -d)"
trap 'rm -rf "$fixture"' EXIT
mkdir -p "$fixture/.github/scripts" "$fixture/config" "$fixture/docs/evidence/resource-accounting"
cp "$source_root/.github/scripts/check-kujo-tool-artifacts.sh" "$fixture/.github/scripts/"
cp "$source_root/config/kujo-tool-artifacts.gitignore" "$fixture/config/"
cp "$source_root/.gitignore" "$fixture/.gitignore"
git -C "$fixture" init -q
git -C "$fixture" config user.name fixture
git -C "$fixture" config user.email fixture@example.invalid
git -C "$fixture" add .
git -C "$fixture" commit -qm initial
base="$(git -C "$fixture" rev-parse HEAD)"
printf 'retained proof\n' > "$fixture/docs/evidence/resource-accounting/proof.log"
git -C "$fixture" add docs/evidence/resource-accounting/proof.log
git -C "$fixture" commit -qm evidence
bash "$fixture/.github/scripts/check-kujo-tool-artifacts.sh" "$base" HEAD
# Both source-rule coverage and accidental output detection remain enforced.
sed '/^!docs\/evidence\/resource-accounting\/\*\.log$/d' "$fixture/.gitignore" > "$fixture/reduced"
mv "$fixture/reduced" "$fixture/.gitignore"
if bash "$fixture/.github/scripts/check-kujo-tool-artifacts.sh" "$base" HEAD > "$fixture/coverage.txt" 2>&1; then exit 1; fi
grep -q 'missing rules' "$fixture/coverage.txt"
cp "$source_root/.gitignore" "$fixture/.gitignore"
printf 'ordinary output\n' > "$fixture/runtime.log"
git -C "$fixture" add -f runtime.log
git -C "$fixture" commit -qm accidental
if bash "$fixture/.github/scripts/check-kujo-tool-artifacts.sh" "$base" HEAD > "$fixture/guard.txt" 2>&1; then exit 1; fi
grep -q 'Artifact path: runtime.log' "$fixture/guard.txt"
printf 'Artifact policy: 3 checks passed.\n'
