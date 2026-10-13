#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
KUJO_BIN="${KUJO_BIN:-kujo}"
root="tests/tmp/revision-bound-approval-$$"
mkdir -p "$root"
export DISPATCH_POLICY_PROFILE=development DISPATCH_OFFLINE_FIXTURE=true
# The same observation preserves native v2 boundary evidence without converting it.
case_root="$root/v2-view"
mkdir -p "$case_root"
"$KUJO_BIN" run tests/resume_policy_fixture.kujo "$case_root" v2 direct
run_id="$(jq -r .run_id "$case_root/decision.json")"
"$KUJO_BIN" run dispatch.kujo inspect "$run_id" --output-root "$case_root" --json > "$case_root/inspect.json"
jq -e --slurpfile state "$case_root/$run_id/state.json" '.control.available and .control.human_intervention == $state[0].human_intervention and .control.current_control_boundary == $state[0].current_control_boundary and .control.state_revision == $state[0].revision' "$case_root/inspect.json" >/dev/null
for backend in filesystem sqlite; do
  case_root="$root/$backend"
  mkdir -p "$case_root"
  DISPATCH_STATE_BACKEND="$backend" "$KUJO_BIN" run tests/resume_policy_fixture.kujo "$case_root" v1 two-gates
  run_id="$(jq -r .run_id "$case_root/decision.json")"
  cp "$case_root/$run_id/state.json" "$case_root/before.json"
  if [[ "$backend" == sqlite ]]; then
    # The database remains authoritative even without a backend environment hint.
    printf '{"status":"corrupted"}' > "$case_root/$run_id/state.json"
  fi
  "$KUJO_BIN" run dispatch.kujo inspect "$run_id" --output-root "$case_root" --json > "$case_root/inspect.json"
  jq -e --slurpfile state "$case_root/before.json" '.control.available and .control.state_revision == $state[0].revision and .control.human_intervention == $state[0].human_intervention and .control.run_status == "paused"' "$case_root/inspect.json" >/dev/null
  cp "$case_root/$run_id/state.json" "$case_root/snapshot-before.json"
  revision="$(jq .control.state_revision "$case_root/inspect.json")"
  jq --argjson revision "$revision" '. + {expected_state_revision:$revision}' "$case_root/decision.json" > "$case_root/bound.json"
  for invalid in 0 -1 1.5 '"1"' null true; do
    jq --argjson revision "$invalid" '.expected_state_revision=$revision' "$case_root/bound.json" > "$case_root/invalid.json"
    if "$KUJO_BIN" run dispatch.kujo resume-decision "$case_root/invalid.json" --output-root "$case_root" > "$case_root/invalid.log" 2>&1; then exit 1; fi
    grep -q 'invalid_resume_request' "$case_root/invalid.log"
  done
  jq '.expected_state_revision += 1' "$case_root/bound.json" > "$case_root/stale.json"
  if "$KUJO_BIN" run dispatch.kujo resume-decision "$case_root/stale.json" --output-root "$case_root" > "$case_root/stale.log" 2>&1; then exit 1; fi
  grep -q stale_resume_decision "$case_root/stale.log"
  cmp "$case_root/snapshot-before.json" "$case_root/$run_id/state.json"
  "$KUJO_BIN" run dispatch.kujo inspect "$run_id" --output-root "$case_root" --json > "$case_root/inspect-after-stale.json"
  cmp "$case_root/inspect.json" "$case_root/inspect-after-stale.json"
  "$KUJO_BIN" run dispatch.kujo resume-decision "$case_root/bound.json" --output-root "$case_root" > "$case_root/applied.log"
  jq -e '.status == "paused" and .human_intervention.run.step_id == "gate-two" and ([.steps[] | select(.id == "downstream")][0].status == "pending")' "$case_root/$run_id/state.json" >/dev/null
  cp "$case_root/$run_id/state.json" "$case_root/after.json"
  "$KUJO_BIN" run dispatch.kujo resume-decision "$case_root/bound.json" --output-root "$case_root" > "$case_root/duplicate.log"
  grep -q already_applied "$case_root/duplicate.log"
  jq '.response="changed review"' "$case_root/bound.json" > "$case_root/conflict.json"
  if "$KUJO_BIN" run dispatch.kujo resume-decision "$case_root/conflict.json" --output-root "$case_root" > "$case_root/conflict.log" 2>&1; then exit 1; fi
  grep -q decision_conflict "$case_root/conflict.log"
  cmp "$case_root/after.json" "$case_root/$run_id/state.json"
done
echo 'Revision-bound approvals: authoritative inspection, stale/invalid refusal, exact duplicate recovery, conflict and second-gate isolation passed.'

# Older receipts cannot establish exact-payload equality for a revision-bound caller.
case_root="$root/legacy-receipt"
mkdir -p "$case_root"
"$KUJO_BIN" run tests/resume_policy_fixture.kujo "$case_root" v1 direct
run_id="$(jq -r .run_id "$case_root/decision.json")"
revision="$(jq .revision "$case_root/$run_id/state.json")"
decision_id="$(jq -r .decision_id "$case_root/decision.json")"
jq --argjson revision "$revision" '. + {expected_state_revision:$revision}' "$case_root/decision.json" > "$case_root/bound.json"
jq --arg id "$decision_id" '.human_decisions[$id]={status:"applied"}' "$case_root/$run_id/state.json" > "$case_root/legacy.json"
cp "$case_root/legacy.json" "$case_root/$run_id/state.json"
if "$KUJO_BIN" run dispatch.kujo resume-decision "$case_root/bound.json" --output-root "$case_root" > "$case_root/refused.log" 2>&1; then exit 1; fi
grep -q 'legacy receipt cannot prove' "$case_root/refused.log"
cmp "$case_root/legacy.json" "$case_root/$run_id/state.json"
"$KUJO_BIN" run dispatch.kujo resume-decision "$case_root/decision.json" --output-root "$case_root" > "$case_root/legacy.log"
grep -q already_applied "$case_root/legacy.log"

# New claimed/failed receipts may be inspected but never replayed by redelivery.
case_root="$root/filesystem"
run_id="$(jq -r .run_id "$case_root/decision.json")"
decision_id="$(jq -r .decision_id "$case_root/decision.json")"
for status in claimed failed; do
  jq --arg id "$decision_id" --arg status "$status" '.human_decisions[$id].status=$status' "$case_root/after.json" > "$case_root/uncertain.json"
  cp "$case_root/uncertain.json" "$case_root/$run_id/state.json"
  if "$KUJO_BIN" run dispatch.kujo resume-decision "$case_root/bound.json" --output-root "$case_root" > "$case_root/uncertain.log" 2>&1; then exit 1; fi
  grep -q control_recovery_required "$case_root/uncertain.log"
  cmp "$case_root/uncertain.json" "$case_root/$run_id/state.json"
done
echo 'Historical receipts retain compatibility; revision-bound ambiguity and uncertain claims fail closed.'

# The shipped first-run templates all expose v1 approvals. Complete them using
# the inspected revision and exact event, never the blanket --yes option.
for template in research-report crud-reliability approval-handoff; do
  case_root="$root/template-$template"
  mkdir -p "$case_root"
  "$KUJO_BIN" run dispatch.kujo demo 'Revision-bound first-run tour' --workflow "$template" --non-interactive --policy-profile production --output-root "$case_root" > "$case_root/start.log"
  run_id="$(sed -n 's/^Run ID: //p' "$case_root/start.log")"
  "$KUJO_BIN" run dispatch.kujo inspect "$run_id" --output-root "$case_root" --json > "$case_root/inspect.json"
  jq -e '.control.available and .control.run_status == "paused" and .control.human_intervention.schema_version == "1.0"' "$case_root/inspect.json" >/dev/null
  jq '.control | {run_id, expected_state_revision:.state_revision, step_id:.human_intervention.run.step_id, event_id:.human_intervention.event_id, decision_id:.human_intervention.security.decision_id, decision:"approve"}' "$case_root/inspect.json" > "$case_root/bound.json"
  "$KUJO_BIN" run dispatch.kujo resume-decision "$case_root/bound.json" --output-root "$case_root" --policy-profile production > "$case_root/resume.log"
  "$KUJO_BIN" run dispatch.kujo inspect "$run_id" --output-root "$case_root" --json > "$case_root/completed.json"
  jq -e '.control.run_status == "completed" and ([.steps[] | select(.status != "completed" and .status != "skipped")] | length == 0)' "$case_root/completed.json" >/dev/null
done
echo 'All three shipped offline templates completed through revision-bound approval.'
