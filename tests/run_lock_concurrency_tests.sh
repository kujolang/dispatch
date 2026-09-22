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

# A crash after the external effect but before its state checkpoint releases
# ownership. Resuming makes progress, but replays the non-idempotent effect;
# operators must provide external idempotency for exactly-once requirements.
crash_id="$("$KUJO_BIN" run tests/fixtures/run_lock_workflow.kujo -- prepare "$fixture_dir")"
crash_marker="$fixture_dir/crash-effects.log"
"$KUJO_BIN" run tests/fixtures/run_lock_workflow.kujo -- \
	execute "$fixture_dir" "$crash_id" "$crash_marker" \
	>"$fixture_dir/crash-first.json" 2>"$fixture_dir/crash-first.stderr" &
crash_pid="$!"
for attempt in {1..150}; do
	if [[ -s "$crash_marker" ]]; then break; fi
	if ! kill -0 "$crash_pid" 2>/dev/null; then break; fi
	sleep 0.02
done
[[ -s "$crash_marker" ]]
kill -0 "$crash_pid"
kill -TERM "$crash_pid"
wait "$crash_pid" 2>/dev/null || true
grep -q '"status":"running"' "$fixture_dir/$crash_id/state.json"
"$KUJO_BIN" run tests/fixtures/run_lock_workflow.kujo -- \
	execute "$fixture_dir" "$crash_id" "$crash_marker" \
	>"$fixture_dir/crash-resumed.json" 2>"$fixture_dir/crash-resumed.stderr"
grep -q '"ok":true' "$fixture_dir/crash-resumed.json"
grep -q '"status":"completed"' "$fixture_dir/$crash_id/state.json"
[[ "$(wc -l < "$crash_marker" | tr -d ' ')" == 2 ]]

# An external sink that atomically accepts the stable run/step key can reject
# the replay even when Dispatch has not checkpointed the step result yet.
idempotent_id="$("$KUJO_BIN" run tests/fixtures/run_lock_workflow.kujo -- prepare "$fixture_dir")"
idempotent_marker="$fixture_dir/idempotent-effect"
"$KUJO_BIN" run tests/fixtures/run_lock_workflow.kujo -- \
	idempotent "$fixture_dir" "$idempotent_id" "$idempotent_marker" \
	>"$fixture_dir/idempotent-first.json" 2>"$fixture_dir/idempotent-first.stderr" &
idempotent_pid="$!"
for attempt in {1..150}; do
	if [[ -s "$idempotent_marker" ]]; then break; fi
	if ! kill -0 "$idempotent_pid" 2>/dev/null; then break; fi
	sleep 0.02
done
[[ -s "$idempotent_marker" ]]
kill -0 "$idempotent_pid"
kill -TERM "$idempotent_pid"
wait "$idempotent_pid" 2>/dev/null || true
"$KUJO_BIN" run tests/fixtures/run_lock_workflow.kujo -- \
	idempotent "$fixture_dir" "$idempotent_id" "$idempotent_marker" \
	>"$fixture_dir/idempotent-resumed.json" 2>"$fixture_dir/idempotent-resumed.stderr"
grep -q '"ok":true' "$fixture_dir/idempotent-resumed.json"
[[ "$(<"$idempotent_marker")" == "$idempotent_id:work" ]]
grep -q '"status":"completed"' "$fixture_dir/$idempotent_id/state.json"
echo "Run locking, at-least-once crash replay, and external idempotency passed."
