#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

export KUJO_BIN="${KUJO_BIN:-$ROOT_DIR/kujo}"
CONTRACT_OUT_DIR=".eval_artifact_contract"
CONTRACT_LOG_FILE="$(mktemp "${TMPDIR:-/tmp}/kujo-eval-artifact-contract.XXXXXX.log")"

cleanup_contract_artifacts() {
	rm -rf "$CONTRACT_OUT_DIR"
	rm -f "$CONTRACT_LOG_FILE"
}

extract_json_string() {
	local key="$1"
	local file="$2"
	sed -nE 's/.*"'"$key"'":"([^"]+)".*/\1/p' "$file" | head -n1
}

fail_contract() {
	local message="$1"
	echo "FAIL: $message"
	if [ -f "$CONTRACT_LOG_FILE" ]; then
		tail -n 40 "$CONTRACT_LOG_FILE"
	fi
	exit 1
}

trap cleanup_contract_artifacts EXIT

rm -rf "$CONTRACT_OUT_DIR"

echo "[CONTRACT] run release gate suite with checksums"
if ! "$KUJO_BIN" run main.ruff run examples/release_gate_suite.json --output-dir "$CONTRACT_OUT_DIR" --artifact-checksums --json > "$CONTRACT_LOG_FILE" 2>&1; then
	fail_contract "run command failed"
fi

SUMMARY_PATH="$CONTRACT_OUT_DIR/summary.json"
MANIFEST_PATH="$CONTRACT_OUT_DIR/artifact-manifest.json"
CHANNEL_PATH="$CONTRACT_OUT_DIR/cli-summary.json"
LAST_RUN_PATH="$CONTRACT_OUT_DIR/last_run.json"
REPORT_PATH="$CONTRACT_OUT_DIR/eval-report.md"

for required in "$SUMMARY_PATH" "$MANIFEST_PATH" "$CHANNEL_PATH" "$LAST_RUN_PATH" "$REPORT_PATH"; do
	if [ ! -f "$required" ]; then
		fail_contract "missing expected artifact: $required"
	fi
done

echo "[CONTRACT] validate summary payload"
grep -q '"suite_name"' "$SUMMARY_PATH" || fail_contract "summary missing suite_name"
grep -q '"status":"PASS"' "$SUMMARY_PATH" || fail_contract "summary missing PASS status"
grep -q '"passed"' "$SUMMARY_PATH" || fail_contract "summary missing passed count"
grep -q '"failed"' "$SUMMARY_PATH" || fail_contract "summary missing failed count"
grep -q '"total"' "$SUMMARY_PATH" || fail_contract "summary missing total count"

echo "[CONTRACT] validate manifest payload"
grep -q '"artifacts"' "$MANIFEST_PATH" || fail_contract "manifest missing artifacts"
grep -q '"checksums"' "$MANIFEST_PATH" || fail_contract "manifest missing checksums"
grep -q '"algorithm":"sha256"' "$MANIFEST_PATH" || fail_contract "manifest missing sha256 algorithm"

echo "[CONTRACT] validate machine channel payload"
grep -q '"command":"run"' "$CHANNEL_PATH" || fail_contract "channel missing command=run"
grep -q '"status":"PASS"' "$CHANNEL_PATH" || fail_contract "channel missing status=PASS"
grep -q '"summary_path"' "$CHANNEL_PATH" || fail_contract "channel missing summary_path"
grep -q '"manifest_path"' "$CHANNEL_PATH" || fail_contract "channel missing manifest_path"
grep -q '"report_path"' "$CHANNEL_PATH" || fail_contract "channel missing report_path"

CHANNEL_SUMMARY_PATH="$(extract_json_string "summary_path" "$CHANNEL_PATH")"
CHANNEL_MANIFEST_PATH="$(extract_json_string "manifest_path" "$CHANNEL_PATH")"
CHANNEL_REPORT_PATH="$(extract_json_string "report_path" "$CHANNEL_PATH")"

if [ ! -f "$CHANNEL_SUMMARY_PATH" ]; then
	fail_contract "summary_path from channel does not exist: $CHANNEL_SUMMARY_PATH"
fi
if [ ! -f "$CHANNEL_MANIFEST_PATH" ]; then
	fail_contract "manifest_path from channel does not exist: $CHANNEL_MANIFEST_PATH"
fi
if [ ! -f "$CHANNEL_REPORT_PATH" ]; then
	fail_contract "report_path from channel does not exist: $CHANNEL_REPORT_PATH"
fi

echo "[CONTRACT] verify manifest checksums"
if ! "$KUJO_BIN" run main.ruff verify-manifest --output-dir "$CONTRACT_OUT_DIR" --json > /dev/null 2>&1; then
	fail_contract "verify-manifest failed"
fi

echo "PASS: artifact contract is valid"
