#!/usr/bin/env bash
set -euo pipefail
operator_root="$(cd "$(dirname "$0")/.." && pwd)"
if [[ $# -lt 2 || $1 == --help ]]; then
  cat <<'HELP'
Experimental local batch-summary operator host
  dispatch operator init /absolute/workspace /absolute/batch.json
  dispatch operator inspect /absolute/workspace [--json]
  dispatch operator plan /absolute/workspace ACTION [NODE] > plan.json
  dispatch operator apply /absolute/workspace /absolute/plan.json
  dispatch operator review /absolute/workspace
  dispatch operator run /absolute/workspace
Actions: reserve, refresh, select, admit, parent-finalize, approve, deny,
         eval-dispatch, eval-release, eval-resolve, observe, node-finalize,
         branch, graph-finalize, recover.
Plans and inspection grant no authority. Apply affects only the named operation.
See docs/operator-rehearsal.md. This host runs only the shipped batch workflow.
HELP
  exit 0
fi
operator_deps="${DISPATCH_OPERATOR_DEPS:-$operator_root/.operator-deps}"
for dependency in workcell eval; do
  if [[ ! -d "$operator_deps/$dependency/src" ]]; then
    echo "Missing installed $dependency. Run bash $operator_root/scripts/install_operator_dependencies.sh before using the experimental operator host." >&2
    exit 1
  fi
done
# The explicit absolute workspace argument opts into a user-selected output root.
export DISPATCH_ALLOW_ANY_OUTPUT_ROOT=true
export DISPATCH_ROOT="$operator_root"
export DISPATCH_OPERATOR_DEPS="$operator_deps"
export KUJO_BIN="${KUJO_BIN:-$(command -v kujo)}"
export KUJO_MODULE_PATH="$operator_root:$operator_deps:$operator_deps/workcell:$operator_deps/eval"
exec "$KUJO_BIN" run "$operator_root/src/operator/main.kujo" "$@"
