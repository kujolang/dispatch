#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
KUJO_BIN="${KUJO_BIN:-kujo}"
mkdir -p tests/tmp
fixture_dir="$(mktemp -d tests/tmp/showcase.XXXXXX)"
trap 'rm -rf "$fixture_dir"' EXIT
export DISPATCH_OFFLINE_FIXTURE=true

"$KUJO_BIN" run dispatch.kujo validate --workflow-file examples/workflows/routed-review.json --json \
	>"$fixture_dir/validate.json"
"$KUJO_BIN" run dispatch.kujo explain-route --workflow-file examples/workflows/routed-review.json \
	--step-id plan --json >"$fixture_dir/route.json"
"$KUJO_BIN" run dispatch.kujo demo "First workflow tour" \
	--workflow-file examples/workflows/routed-review.json \
	--yes --non-interactive --output-root "$fixture_dir/routed" >"$fixture_dir/routed.log"
grep -q 'Status: completed' "$fixture_dir/routed.log"

run_id="$(sed -n 's/^Run ID: //p' "$fixture_dir/routed.log")"
[[ -n "$run_id" ]]
"$KUJO_BIN" run dispatch.kujo inspect "$run_id" --output-root "$fixture_dir/routed" --json \
	>"$fixture_dir/inspect.json"
test -s "$fixture_dir/routed/$run_id/state.json"
test -s "$fixture_dir/routed/$run_id/trace.json"
test -s "$fixture_dir/routed/$run_id/report.md"
grep -q 'route_decisions' "$fixture_dir/routed/$run_id/state.json"

"$KUJO_BIN" run dispatch.kujo demo "Plugin tour" \
	--workflow-file examples/workflows/plugin-echo.json --plugin sample --allow-tools echo_tool \
	--yes --non-interactive --output-root "$fixture_dir/plugin" >"$fixture_dir/plugin.log"
grep -q 'Status: completed' "$fixture_dir/plugin.log"
plugin_run_id="$(sed -n 's/^Run ID: //p' "$fixture_dir/plugin.log")"
grep -q '"tool_name":"echo_tool"' "$fixture_dir/plugin/$plugin_run_id/state.json"
grep -q '"step_id":"echo"' "$fixture_dir/plugin/$plugin_run_id/trace.json"

if "$KUJO_BIN" run dispatch.kujo demo "Plugin denied" \
	--workflow-file examples/workflows/plugin-echo.json --plugin sample --deny-tools echo_tool \
	--yes --non-interactive --output-root "$fixture_dir/denied" >"$fixture_dir/denied.log" 2>&1; then
	echo "Denied plugin tool unexpectedly ran." >&2
	exit 1
fi
grep -q 'tool_not_allowed\|tool_not_authorized\|policy' "$fixture_dir/denied.log"

echo "First workflow and scoped plugin walkthrough passed."
