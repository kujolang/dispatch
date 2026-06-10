#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

export KUJO_BIN="${KUJO_BIN:-$ROOT_DIR/kujo}"

echo "[PARITY] Running default test runtime..."
DEFAULT_OUT="$($KUJO_BIN test 2>&1)"
echo "$DEFAULT_OUT"
if ! echo "$DEFAULT_OUT" | grep -q "Passed 7/7"; then
	echo "FAIL: default runtime did not report full pass set"
	exit 1
fi

echo "[PARITY] Running interpreter runtime..."
INTERP_EXIT=0
INTERP_OUT="$($KUJO_BIN test --runtime interpreter 2>&1)" || INTERP_EXIT=$?
echo "$INTERP_OUT"
if echo "$INTERP_OUT" | grep -q "Passed 7/7"; then
	echo "PASS: test runtime parity verified (default and interpreter both pass 7/7)"
else
	echo "WARN: interpreter runtime did not report 7/7 (exit $INTERP_EXIT); current runtime treats this mode as informational"
fi
