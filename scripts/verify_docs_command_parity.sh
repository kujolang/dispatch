#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

export KUJO_BIN="${KUJO_BIN:-$ROOT_DIR/kujo}"
PARITY_OUT_DIR=".eval_readme_parity"
PARITY_QS_CLI_OUT_DIR=".eval_readme_parity_cli"
PARITY_QS_API_OUT_DIR=".eval_readme_parity_api"
PARITY_QS_AGENT_OUT_DIR=".eval_readme_parity_agent"
PARITY_QS_STRICT_OUT_DIR=".eval_readme_parity_strict"
PARITY_QS_SANDBOX_OUT_DIR=".eval_readme_parity_sandbox"
PARITY_TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/kujo-eval-docs-parity.XXXXXX")"
DOCS_WATCHDOG_TIMEOUT_SECONDS="${KUJO_EVAL_DOCS_WATCHDOG_TIMEOUT_SECONDS:-120}"

cleanup_parity_artifacts() {
	rm -rf "$PARITY_OUT_DIR"
	rm -rf "$PARITY_QS_CLI_OUT_DIR"
	rm -rf "$PARITY_QS_API_OUT_DIR"
	rm -rf "$PARITY_QS_AGENT_OUT_DIR"
	rm -rf "$PARITY_QS_STRICT_OUT_DIR"
	rm -rf "$PARITY_QS_SANDBOX_OUT_DIR"
	rm -rf "$PARITY_TMP_DIR"
}

trap cleanup_parity_artifacts EXIT

rm -rf "$PARITY_OUT_DIR"
mkdir -p "$PARITY_OUT_DIR"
rm -rf "$PARITY_QS_CLI_OUT_DIR" "$PARITY_QS_API_OUT_DIR" "$PARITY_QS_AGENT_OUT_DIR" "$PARITY_QS_STRICT_OUT_DIR" "$PARITY_QS_SANDBOX_OUT_DIR"
mkdir -p "$PARITY_QS_CLI_OUT_DIR" "$PARITY_QS_API_OUT_DIR" "$PARITY_QS_AGENT_OUT_DIR" "$PARITY_QS_STRICT_OUT_DIR" "$PARITY_QS_SANDBOX_OUT_DIR"

run_doc_cmd() {
	local label="$1"
	local cmd="$2"
	echo "[DOCS] ${label}"
	if ! bash -c "$cmd"; then
		echo "FAIL: ${label}"
		exit 1
	fi
}

run_doc_cmd_watchdog() {
	local label="$1"
	local cmd="$2"
	local log_file="$3"
	local required_pattern="$4"
	local required_file_a="$5"
	local required_file_b="$6"

	echo "[DOCS] ${label}"
	rm -f "$log_file"
	if [ -n "$required_file_a" ]; then
		rm -f "$required_file_a"
	fi
	if [ -n "$required_file_b" ]; then
		rm -f "$required_file_b"
	fi

	bash -c "$cmd" > "$log_file" 2>&1 &
	local pid=$!
	local start_epoch="$(date +%s)"
	local success=0
	local timed_out=0

	while true; do

		local files_ok=1
		if [ -n "$required_file_a" ] && [ ! -f "$required_file_a" ]; then
			files_ok=0
		fi
		if [ -n "$required_file_b" ] && [ ! -f "$required_file_b" ]; then
			files_ok=0
		fi

		if [ "$files_ok" -eq 1 ]; then
			if [ -n "$required_pattern" ]; then
				if grep -q "$required_pattern" "$log_file" 2>/dev/null; then
					success=1
					break
				fi
			else
				success=1
				break
			fi
		fi

		if ! kill -0 "$pid" 2>/dev/null; then
			if [ "$files_ok" -eq 1 ]; then
				if [ -n "$required_pattern" ]; then
					if grep -q "$required_pattern" "$log_file" 2>/dev/null; then
						success=1
						break
					fi
				else
					success=1
					break
				fi
			fi
			break
		fi

		local now_epoch="$(date +%s)"
		local elapsed_seconds=$((now_epoch - start_epoch))
		if [ "$elapsed_seconds" -ge "$DOCS_WATCHDOG_TIMEOUT_SECONDS" ]; then
			timed_out=1
			break
		fi

		sleep 0.05
	done

	if [ "$success" -eq 1 ]; then
		if kill -0 "$pid" 2>/dev/null; then
			kill "$pid" 2>/dev/null || true
		fi
		wait "$pid" 2>/dev/null || true
		return 0
	fi

	if [ "$timed_out" -eq 1 ]; then
		echo "FAIL: ${label} watchdog timed out after ${DOCS_WATCHDOG_TIMEOUT_SECONDS}s"
	else
		if wait "$pid"; then
			echo "FAIL: ${label}"
		else
			local cmd_exit_code=$?
			echo "FAIL: ${label} (exit ${cmd_exit_code})"
		fi
	fi

	if kill -0 "$pid" 2>/dev/null; then
		kill "$pid" 2>/dev/null || true
	fi
	wait "$pid" 2>/dev/null || true

	if [ -f "$log_file" ]; then
		tail -n 40 "$log_file"
	fi
	exit 1
}

run_doc_cmd "version" "$KUJO_BIN run main.ruff version"
run_doc_cmd "list-checks" "$KUJO_BIN run main.ruff list-checks"
run_doc_cmd "policy-explain" "$KUJO_BIN run main.ruff policy-explain examples/release_gate_suite.json --policy-stage release --json"
run_doc_cmd "command inventory freshness" "bash scripts/generate_command_inventory.sh --check"

run_doc_cmd_watchdog \
	"run release-gate suite (json)" \
	"$KUJO_BIN run main.ruff run examples/release_gate_suite.json --output-dir $PARITY_OUT_DIR --json" \
	"$PARITY_TMP_DIR/readme_parity_run.out" \
	"" \
	"$PARITY_OUT_DIR/summary.json" \
	"$PARITY_OUT_DIR/artifact-manifest.json"

run_doc_cmd_watchdog \
	"run release-gate suite (summary-only)" \
	"$KUJO_BIN run main.ruff run examples/release_gate_suite.json --output-dir $PARITY_OUT_DIR --summary-only" \
	"$PARITY_TMP_DIR/readme_parity_run_summary.out" \
	"" \
	"$PARITY_OUT_DIR/summary.json" \
	"$PARITY_OUT_DIR/artifact-manifest.json"

run_doc_cmd_watchdog \
	"run release-gate suite (summary channel path)" \
	"$KUJO_BIN run main.ruff run examples/release_gate_suite.json --output-dir $PARITY_OUT_DIR --summary-channel-path $PARITY_OUT_DIR/run-channel.json --json" \
	"$PARITY_TMP_DIR/readme_parity_run_channel.out" \
	"" \
	"$PARITY_OUT_DIR/run-channel.json" \
	"$PARITY_OUT_DIR/artifact-manifest.json"

run_doc_cmd_watchdog \
	"run release-gate suite (artifact checksums)" \
	"$KUJO_BIN run main.ruff run examples/release_gate_suite.json --output-dir $PARITY_OUT_DIR --artifact-checksums --json" \
	"$PARITY_TMP_DIR/readme_parity_run_checksums.out" \
	"" \
	"$PARITY_OUT_DIR/summary.json" \
	"$PARITY_OUT_DIR/artifact-manifest.json"

run_doc_cmd "verify-manifest" "$KUJO_BIN run main.ruff verify-manifest --output-dir $PARITY_OUT_DIR --json"

run_doc_cmd_watchdog \
	"report release-gate suite (rerun json)" \
	"$KUJO_BIN run main.ruff report examples/release_gate_suite.json --rerun --output-dir $PARITY_OUT_DIR --json" \
	"$PARITY_TMP_DIR/readme_parity_report.out" \
	"" \
	"$PARITY_OUT_DIR/summary.json" \
	"$PARITY_OUT_DIR/artifact-manifest.json"

run_doc_cmd_watchdog \
	"report release-gate suite (incremental json)" \
	"$KUJO_BIN run main.ruff report examples/release_gate_suite.json --rerun --output-dir $PARITY_OUT_DIR --incremental --json" \
	"$PARITY_TMP_DIR/readme_parity_report_incremental.out" \
	"" \
	"$PARITY_OUT_DIR/summary.json" \
	"$PARITY_OUT_DIR/artifact-manifest.json"

run_doc_cmd_watchdog \
	"report release-gate suite (junit)" \
	"$KUJO_BIN run main.ruff report examples/release_gate_suite.json --rerun --output-dir $PARITY_OUT_DIR --format junit" \
	"$PARITY_TMP_DIR/readme_parity_report_junit.out" \
	"" \
	"$PARITY_OUT_DIR/eval-report.xml" \
	""

run_doc_cmd_watchdog \
	"report release-gate suite (tap)" \
	"$KUJO_BIN run main.ruff report examples/release_gate_suite.json --rerun --output-dir $PARITY_OUT_DIR --format tap" \
	"$PARITY_TMP_DIR/readme_parity_report_tap.out" \
	"" \
	"$PARITY_OUT_DIR/eval-report.tap" \
	""

run_doc_cmd_watchdog \
	"quickstart: enterprise CLI gate" \
	"$KUJO_BIN run main.ruff run examples/enterprise_cli_quality_gate.json --output-dir $PARITY_QS_CLI_OUT_DIR --json" \
	"$PARITY_TMP_DIR/readme_parity_qs_cli.out" \
	"" \
	"$PARITY_QS_CLI_OUT_DIR/summary.json" \
	"$PARITY_QS_CLI_OUT_DIR/artifact-manifest.json"

run_doc_cmd_watchdog \
	"quickstart: enterprise API gate" \
	"$KUJO_BIN run main.ruff run examples/enterprise_api_contract_gate.json --output-dir $PARITY_QS_API_OUT_DIR --parallel-workers 8 --json" \
	"$PARITY_TMP_DIR/readme_parity_qs_api.out" \
	"" \
	"$PARITY_QS_API_OUT_DIR/summary.json" \
	"$PARITY_QS_API_OUT_DIR/artifact-manifest.json"

run_doc_cmd_watchdog \
	"quickstart: enterprise agent gate" \
	"$KUJO_BIN run main.ruff run examples/enterprise_agent_output_gate.json --output-dir $PARITY_QS_AGENT_OUT_DIR --parallel-workers 8 --json" \
	"$PARITY_TMP_DIR/readme_parity_qs_agent.out" \
	"" \
	"$PARITY_QS_AGENT_OUT_DIR/summary.json" \
	"$PARITY_QS_AGENT_OUT_DIR/artifact-manifest.json"

run_doc_cmd_watchdog \
	"quickstart: strict enterprise policy gate" \
	"$KUJO_BIN run main.ruff run examples/strict_enterprise_policy_gate.json --output-dir $PARITY_QS_STRICT_OUT_DIR --json" \
	"$PARITY_TMP_DIR/readme_parity_qs_strict.out" \
	"" \
	"$PARITY_QS_STRICT_OUT_DIR/summary.json" \
	"$PARITY_QS_STRICT_OUT_DIR/artifact-manifest.json"

run_doc_cmd_watchdog \
	"quickstart: sandbox-adjacent policy gate" \
	"$KUJO_BIN run main.ruff run examples/sandbox_adjacent_policy_gate.json --output-dir $PARITY_QS_SANDBOX_OUT_DIR --json" \
	"$PARITY_TMP_DIR/readme_parity_qs_sandbox.out" \
	"" \
	"$PARITY_QS_SANDBOX_OUT_DIR/summary.json" \
	"$PARITY_QS_SANDBOX_OUT_DIR/artifact-manifest.json"

run_doc_cmd "ecosystem: scout import alias" "printf '[{\"name\":\"scout-docs-check\",\"check\":\"file_exists\",\"params\":{\"path\":\"kennel.toml\"}}]' > \"$PARITY_TMP_DIR/ecosystem-scout.json\" && $KUJO_BIN run main.ruff init --name scout-docs-suite --from-scout \"$PARITY_TMP_DIR/ecosystem-scout.json\" && grep -q '\"name\":\"scout-docs-suite\"' eval.json && rm -f eval.json"

run_doc_cmd "diff identical files" "$KUJO_BIN run main.ruff diff README.md README.md"
run_doc_cmd "test command" "$KUJO_BIN test"

if [[ ! -f "docs/COMMAND_INVENTORY.md" ]]; then
	echo "FAIL: generated command inventory missing at docs/COMMAND_INVENTORY.md"
	exit 1
fi

echo "PASS: docs command parity checks succeeded"
