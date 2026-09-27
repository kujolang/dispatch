#!/usr/bin/env bash
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."
export KUJO_BIN="${KUJO_BIN:-kujo}"
export DISPATCH_OFFLINE_FIXTURE=true
export FAILURE_GATE_WORKCELL="${FAILURE_GATE_WORKCELL:-$(cd ../workcell && pwd)}"
export FAILURE_GATE_EVAL="${FAILURE_GATE_EVAL:-$(cd ../eval && pwd)}"
export FAILURE_GATE_RUNLEDGER="${FAILURE_GATE_RUNLEDGER:-$(cd ../runledger && pwd)}"
export PATH="$FAILURE_GATE_WORKCELL/tests/fixtures/backend-protocol:$PATH"
root="$(pwd)/tests/tmp/durable-review-$$"
output_root="tests/tmp/durable-review-$$/runs"
mkdir -p "$root"
export TMPDIR="$root"

# This process exits, relinquishing every lock and in-memory controller object.
"$KUJO_BIN" run tests/durable_review_fixture.kujo "$root" > "$root/first.log" 2>&1
id="$(jq -r .run_id "$root/decision.json")"
checkpoint="$(jq -r .checkpoint.checkpoint_id "$root/checkpoint.json")"
state="$root/runs/$id/state.json"
jq -e '.status == "paused" and .steps[2].attempts == 0' "$state" > /dev/null
cp "$state" "$root/paused-state.json"

# Missing/altered publication cannot claim a decision or admit descendants.
manifest="$root/runs/$id/checkpoints/$checkpoint.json"
mv "$manifest" "$root/saved-manifest.json"
if "$KUJO_BIN" run dispatch.kujo resume-decision "$root/decision.json" --output-root "$output_root" --checkpoint "$checkpoint" > "$root/missing.log" 2>&1; then
    echo 'Missing checkpoint authorized continuation' >&2; exit 1
fi
grep -q checkpoint_unreadable "$root/missing.log"
cmp "$state" "$root/paused-state.json"
mv "$root/saved-manifest.json" "$manifest"
jq '.expected_state_revision += 1' "$root/decision.json" > "$root/stale-decision.json"
if "$KUJO_BIN" run dispatch.kujo resume-decision "$root/stale-decision.json" --output-root "$output_root" --checkpoint "$checkpoint" > "$root/stale.log" 2>&1; then
    echo 'Stale decision authorized continuation' >&2; exit 1
fi
grep -q stale_intervention_decision "$root/stale.log"
cmp "$state" "$root/paused-state.json"

# An ordinary fresh CLI process performs the locked load/validate/claim/continue.
"$KUJO_BIN" run dispatch.kujo resume-decision "$root/decision.json" --output-root "$output_root" --checkpoint "$checkpoint" > "$root/second.log" 2>&1
cp "$state" "$root/final-state.json"
"$KUJO_BIN" run dispatch.kujo resume-decision "$root/decision.json" --output-root "$output_root" --checkpoint "$checkpoint" > "$root/duplicate.log" 2>&1
grep -q already_applied "$root/duplicate.log"
cmp "$state" "$root/final-state.json"
test "$(jq -s '[.[] | select(.kind == "intervention_decision")] | length' "$root/runs/$id/control-events.jsonl")" = 1
"$KUJO_BIN" run tests/durable_review_verify.kujo "$root" > "$root/verification.log" 2>&1
echo "Durable review passed: real Workcell/Eval; exited controller; blocked failures; fresh CLI resume; single attempts; verified evidence and RunLedger. Evidence: $root"
