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

# Native advisory ownership survives backdated lock metadata: age alone must
# never permit another writer into an active run.
DISPATCH_RUN_LOCK_TIMEOUT_MS=100 "$KUJO_BIN" run tests/fixtures/run_lock_contender.kujo -- "$fixture_dir" \
	>"$fixture_dir/holder.json" 2>"$fixture_dir/holder.stderr" &
holder_pid="$!"
for attempt in {1..150}; do
	if grep -q '"ok":true' "$fixture_dir/holder.json"; then break; fi
	if ! kill -0 "$holder_pid" 2>/dev/null; then break; fi
	sleep 0.02
done
grep -q '"ok":true' "$fixture_dir/holder.json"
kill -0 "$holder_pid"
touch -t 200001010000 "$fixture_dir/.dispatch-run.lock"
DISPATCH_RUN_LOCK_STALE_MS=10000 DISPATCH_RUN_LOCK_TIMEOUT_MS=100 \
	"$KUJO_BIN" run tests/fixtures/run_lock_contender.kujo -- "$fixture_dir" \
	>"$fixture_dir/backdated.json" 2>"$fixture_dir/backdated.stderr"
grep -q '"code":"run_lock_timeout"' "$fixture_dir/backdated.json"
wait "$holder_pid"

# The lock file remains in place but the OS releases its handle on process
# exit, so recovery after a crash does not require deleting or ageing it.
DISPATCH_RUN_LOCK_TIMEOUT_MS=100 "$KUJO_BIN" run tests/fixtures/run_lock_contender.kujo -- "$fixture_dir" \
	>"$fixture_dir/recovered.json" 2>"$fixture_dir/recovered.stderr"
grep -q '"ok":true' "$fixture_dir/recovered.json"

# A real resumed workflow holds the lock across side effects and persistence.
run_id="$("$KUJO_BIN" run tests/fixtures/run_lock_workflow.kujo -- prepare "$fixture_dir")"
marker="$fixture_dir/effects.log"
DISPATCH_RUN_LOCK_TIMEOUT_MS=100 "$KUJO_BIN" run tests/fixtures/run_lock_workflow.kujo -- \
	execute "$fixture_dir" "$run_id" "$marker" >"$fixture_dir/first.json" 2>"$fixture_dir/first.stderr" &
first_pid="$!"
for attempt in {1..150}; do
	if [[ -s "$marker" ]]; then break; fi
	if ! kill -0 "$first_pid" 2>/dev/null; then break; fi
	sleep 0.02
done
[[ -s "$marker" ]]
kill -0 "$first_pid"
touch -t 200001010000 "$fixture_dir/$run_id/.dispatch-run.lock"
DISPATCH_RUN_LOCK_TIMEOUT_MS=100 "$KUJO_BIN" run tests/fixtures/run_lock_workflow.kujo -- \
	execute "$fixture_dir" "$run_id" "$marker" >"$fixture_dir/second.json" 2>"$fixture_dir/second.stderr"
grep -q '"code":"run_lock_timeout"' "$fixture_dir/second.json"
wait "$first_pid"
grep -q '"ok":true' "$fixture_dir/first.json"
[[ "$(wc -l < "$marker" | tr -d ' ')" == 1 ]]
grep -q '"status":"completed"' "$fixture_dir/$run_id/state.json"
echo "Run lock contention, expiry resistance, crash recovery, and resumed side-effect fencing passed."
