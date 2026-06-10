#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

export KUJO_BIN="${KUJO_BIN:-$ROOT_DIR/kujo}"
INCLUDE_INTERPRETER=0

if [ "${KUJO_EVAL_CLI_SMOKE_INCLUDE_INTERPRETER:-0}" = "1" ]; then
	INCLUDE_INTERPRETER=1
fi

while [ "$#" -gt 0 ]; do
	case "$1" in
		--include-interpreter)
			INCLUDE_INTERPRETER=1
			;;
		*)
			echo "FAIL: unknown argument: $1"
			exit 1
			;;
	esac
	shift
done

run_step() {
	local label="$1"
	local mode="$2"
	shift 2
	echo "[SMOKE][$mode] $label"
	if ! run_eval "$mode" "$@"; then
		echo "FAIL: $label ($mode)"
		exit 1
	fi
}

run_eval() {
	local mode="$1"
	shift
	if [ "$mode" = "interpreter" ]; then
		"$KUJO_BIN" run main.ruff --interpreter "$@"
	else
		"$KUJO_BIN" run main.ruff "$@"
	fi
}

assert_exists() {
	local path="$1"
	if [ ! -f "$path" ]; then
		echo "FAIL: expected file not found: $path"
		exit 1
	fi
}

run_matrix() {
	local mode="$1"
	local work_dir
	work_dir="$(mktemp -d "${TMPDIR:-/tmp}/kujo-eval-cli-smoke.${mode}.XXXXXX")"

cleanup_smoke_dir() {
	if [ -n "${work_dir:-}" ] && [ -d "$work_dir" ]; then
		rm -rf "$work_dir"
	fi
}
	trap 'rm -rf "$work_dir"' EXIT

	cp main.ruff "$work_dir/main.ruff"
	cp -R src "$work_dir/src"
	cp -R examples "$work_dir/examples"

	cd "$work_dir"

	run_step "version" "$mode" version
	run_step "list-checks" "$mode" list-checks
	run_step "init" "$mode" init --name cli-smoke-suite --template basic
	assert_exists "eval.json"
	run_step "lint" "$mode" lint eval.json
	run_step "run" "$mode" run eval.json --output-dir .eval_smoke_out --artifact-checksums --json
	assert_exists ".eval_smoke_out/last_run.json"
	assert_exists ".eval_smoke_out/summary.json"
	assert_exists ".eval_smoke_out/artifact-manifest.json"
	assert_exists ".eval_smoke_out/cli-summary.json"
	run_step "report" "$mode" report eval.json --output-dir .eval_smoke_out --artifact-checksums --json
	run_step "verify-manifest" "$mode" verify-manifest --output-dir .eval_smoke_out --json
	run_step "compare" "$mode" compare .eval_smoke_out/last_run.json .eval_smoke_out/last_run.json
	run_step "snapshots" "$mode" snapshots --snapshot-dir ./snapshots
	run_step "diff" "$mode" diff eval.json eval.json
	run_step "export" "$mode" export eval.json --output exported_suite.sh
	assert_exists "exported_suite.sh"
	run_step "completion" "$mode" completion --shell bash
	run_step "watch" "$mode" watch --config eval.json --max-loops 1 --poll-ms 0

	cd "$ROOT_DIR"
	cleanup_smoke_dir
	trap - EXIT
}

echo "=== Kujo Eval CLI Smoke Matrix ==="
run_matrix "vm"
if [ "$INCLUDE_INTERPRETER" -eq 1 ]; then
	run_matrix "interpreter"
fi

echo "PASS: CLI smoke matrix succeeded"
