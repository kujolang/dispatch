#!/usr/bin/env bash
set -euo pipefail
KUJO_BIN="${KUJO_BIN:-kujo}"
mkdir -p tests/tmp
fixture_dir="$(mktemp -d tests/tmp/lock-contention.XXXXXX)"
trap 'rm -rf "$fixture_dir"' EXIT
pids=()
for index in 1 2 3 4; do
	DISPATCH_RUN_LOCK_TIMEOUT_MS=100 "$KUJO_BIN" run tests/fixtures/run_lock_contender.kujo -- "$fixture_dir" \
		>"$fixture_dir/$index.json" 2>"$fixture_dir/$index.stderr" &
	pids+=("$!")
done
for pid in "${pids[@]}"; do wait "$pid"; done
winners=0
for index in 1 2 3 4; do
	[[ ! -s "$fixture_dir/$index.stderr" ]]
	if grep -q '"ok":true' "$fixture_dir/$index.json"; then
		winners=$((winners + 1))
	else
		grep -q '"code":"run_lock_timeout"' "$fixture_dir/$index.json"
	fi
done
[[ "$winners" == 1 ]]
echo "Run lock contention passed (one winner, three timeouts)."
