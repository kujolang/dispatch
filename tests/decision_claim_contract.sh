#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
KUJO_BIN="${KUJO_BIN:-kujo}"
root="tests/tmp/decision-claim-$$"
mkdir -p "$root"
"$KUJO_BIN" run tests/decision_claim_fixture.kujo "$root"
"$KUJO_BIN" run dispatch.kujo resume-decision "$root/decision.json" --output-root "$root" > "$root/first.log" 2>&1 &
first=$!
"$KUJO_BIN" run dispatch.kujo resume-decision "$root/decision.json" --output-root "$root" > "$root/second.log" 2>&1 &
second=$!
wait "$first"
wait "$second"
grep -q 'already_applied' "$root/first.log" "$root/second.log"
run_id="$(jq -r .run_id "$root/decision.json")"
test "$(jq -s '[.[] | select(.kind == "intervention_decision")] | length' "$root/$run_id/control-events.jsonl")" = 1
jq '.reason = "conflicting payload"' "$root/decision.json" > "$root/conflict.json"
if "$KUJO_BIN" run dispatch.kujo resume-decision "$root/conflict.json" --output-root "$root" > "$root/conflict.log" 2>&1; then
  echo 'conflicting decision was accepted' >&2
  exit 1
fi
grep -q 'conflicting_intervention_decision' "$root/conflict.log"
echo 'Decision claims: concurrent duplicate applied once; conflicting payload rejected.'
