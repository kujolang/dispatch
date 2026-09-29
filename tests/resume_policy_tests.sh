#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
KUJO_BIN="${KUJO_BIN:-kujo}"
root="tests/tmp/resume-policy-$$"
mkdir -p "$root"
export DISPATCH_POLICY_PROFILE=development
export DISPATCH_OFFLINE_FIXTURE=false
export DISPATCH_SDK_BRIDGE_SCRIPT="$PWD/tests/fixtures/policy_model_bridge.kujo"
export AI_SDK_PATH="${AI_SDK_PATH:-$PWD}"
for version in v2 v1; do
  for kind in direct model; do
    for source in env config allow; do
      case_root="$root/$version-$kind-$source"
      mkdir -p "$case_root"
      "$KUJO_BIN" run tests/resume_policy_fixture.kujo "$case_root" "$version" "$kind"
      export DISPATCH_DENIED_TOOLS=''
      extra=()
      if [[ "$source" == env ]]; then export DISPATCH_DENIED_TOOLS=timestamp_tool; fi
      if [[ "$source" == config ]]; then
        printf '{"deny_tools":["timestamp_tool"]}' > "$case_root/config.json"
        extra=(--config "$case_root/config.json")
      fi
      code=0
      "$KUJO_BIN" run dispatch.kujo resume-decision "$case_root/decision.json" --output-root "$case_root" ${extra[@]+"${extra[@]}"} > "$case_root/result.log" 2>&1 || code=$?
      if [[ "$source" == allow ]]; then
        test "$code" = 0
        grep -q 'Status: completed' "$case_root/result.log"
      else
        test "$code" != 0
        run_id="$(jq -r .run_id "$case_root/decision.json")"
        jq -e '[.. | objects | select(.code? == "tool_execution_denied")] | length > 0' "$case_root/$run_id/state.json" >/dev/null
      fi
    done
  done
done
# Invalid policy is rejected before state/journal/decision mutation.
case_root="$root/invalid"
mkdir -p "$case_root"
"$KUJO_BIN" run tests/resume_policy_fixture.kujo "$case_root" v2 direct
run_id="$(jq -r .run_id "$case_root/decision.json")"
cp "$case_root/$run_id/state.json" "$case_root/before.json"
cp "$case_root/$run_id/control-events.jsonl" "$case_root/before.jsonl"
printf '{"policy_profile":"unknown-profile"}' > "$case_root/config.json"
if "$KUJO_BIN" run dispatch.kujo resume-decision "$case_root/decision.json" --output-root "$case_root" --config "$case_root/config.json" > "$case_root/result.log" 2>&1; then exit 1; fi
grep -q 'Unknown policy profile' "$case_root/result.log"
cmp "$case_root/before.json" "$case_root/$run_id/state.json"
cmp "$case_root/before.jsonl" "$case_root/$run_id/control-events.jsonl"
echo 'Resume policy: v1/v2 direct/model env/config denial and allowed controls pass; invalid policy preserves state.'

# An approval callback cannot grant approval for another gate.
export DISPATCH_DENIED_TOOLS=''
case_root="$root/two-gates"
mkdir -p "$case_root"
"$KUJO_BIN" run tests/resume_policy_fixture.kujo "$case_root" v1 two-gates
"$KUJO_BIN" run dispatch.kujo resume-decision "$case_root/decision.json" --output-root "$case_root" > "$case_root/result.log" 2>&1
run_id="$(jq -r .run_id "$case_root/decision.json")"
jq -e '.status == "paused" and .human_intervention.run.step_id == "gate-two" and ([.steps[] | select(.id == "downstream")][0].status == "pending")' "$case_root/$run_id/state.json" >/dev/null
# Concurrent duplicate delivery is serialized before loading and claiming state.
case_root="$root/concurrent"
mkdir -p "$case_root"
"$KUJO_BIN" run tests/resume_policy_fixture.kujo "$case_root" v1 direct
pids=()
for contender in 1 2 3 4; do
  ("$KUJO_BIN" run dispatch.kujo resume-decision "$case_root/decision.json" --output-root "$case_root" > "$case_root/$contender.log" 2>&1 && echo accepted > "$case_root/$contender.accepted") &
  pids+=("$!")
done
for pid in "${pids[@]}"; do wait "$pid" || true; done
test "$(grep -l 'Status: completed' "$case_root/"[1-4].log | wc -l | tr -d ' ')" = 1
test "$(grep -l 'already_applied' "$case_root/"[1-4].log | wc -l | tr -d ' ')" = 3
run_id="$(jq -r .run_id "$case_root/decision.json")"
jq -e '.status == "completed" and (.human_decisions | length == 1)' "$case_root/$run_id/state.json" >/dev/null
echo 'Legacy decision boundary: next approval pauses; concurrent delivery has one winner.'

# Network callbacks must validate before a review claim, for both schemas.
for version in v1 v2; do
  case_root="$root/webhook-$version"
  mkdir -p "$case_root"
  "$KUJO_BIN" run tests/resume_policy_fixture.kujo "$case_root" "$version" direct
  run_id="$(jq -r .run_id "$case_root/decision.json")"
  cp "$case_root/$run_id/state.json" "$case_root/before.json"
  if DISPATCH_WEBHOOK_SIGNING_KEY='' DISPATCH_ALLOWED_WEBHOOK_ORIGINS=https://callbacks.example "$KUJO_BIN" run dispatch.kujo resume-decision "$case_root/decision.json" --output-root "$case_root" --webhook-url https://callbacks.example/hook > "$case_root/result.log" 2>&1; then exit 1; fi
  grep -q 'webhook_signing_key_required' "$case_root/result.log"
  cmp "$case_root/before.json" "$case_root/$run_id/state.json"
done
echo 'Unsigned callback preflight preserves both v1/v2 review states.'
