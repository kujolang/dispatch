#!/usr/bin/env bash
set -euo pipefail
script="$(cd "$(dirname "$0")/.." && pwd)/scripts/prepare_graph_fixture_layout.sh"
fixture_root="$(mktemp -d "${TMPDIR:-/tmp}/dispatch-ci-layout-test.XXXXXX")"
trap 'rm -rf "$fixture_root"' EXIT
workspace="$fixture_root/dispatch"
mkdir -p "$workspace/.ci/workcell-wave-f/src" "$workspace/.ci/eval-wave-f/src" "$workspace/.ci/agents-sdk-wave-d/src"
GITHUB_WORKSPACE="$workspace" bash "$script"
for name in workcell eval agents-sdk; do test -L "$fixture_root/$name"; done
GITHUB_WORKSPACE="$workspace" bash "$script"
echo 'PASS complete layout and exact idempotent reuse'
release_workspace="$fixture_root/tag/dispatch"
mkdir -p "$release_workspace/.release/workcell-wave-f/src" "$release_workspace/.release/eval-wave-f/src" "$release_workspace/.release/agents-sdk-wave-d/src"
GITHUB_WORKSPACE="$release_workspace" DISPATCH_GRAPH_FIXTURE_ROOT="$release_workspace/.release" bash "$script"
test "$(readlink "$fixture_root/tag/eval")" = "$release_workspace/.release/eval-wave-f"
echo 'PASS tagged release layout uses the explicit source root'
rm "$fixture_root/workcell"
mkdir "$fixture_root/workcell"
printf 'preserve\n' > "$fixture_root/workcell/user-file"
if GITHUB_WORKSPACE="$workspace" bash "$script" >"$fixture_root/refusal" 2>&1; then exit 1; fi
test "$(cat "$fixture_root/workcell/user-file")" = preserve
echo 'PASS existing checkout is preserved and rejected'
rm "$fixture_root/workcell/user-file"
rmdir "$fixture_root/workcell"
ln -s "$workspace/.ci/eval-wave-f" "$fixture_root/workcell"
if GITHUB_WORKSPACE="$workspace" bash "$script" >"$fixture_root/refusal" 2>&1; then exit 1; fi
test "$(readlink "$fixture_root/workcell")" = "$workspace/.ci/eval-wave-f"
echo 'PASS conflicting alias is preserved and rejected'
rm "$fixture_root/workcell"
rmdir "$workspace/.ci/workcell-wave-f/src"
if GITHUB_WORKSPACE="$workspace" bash "$script" >"$fixture_root/refusal" 2>&1; then exit 1; fi
test ! -e "$fixture_root/workcell"
echo 'PASS missing dependency source rejects'
