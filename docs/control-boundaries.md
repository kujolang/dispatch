# Workflow control boundaries

Dispatch can opt a workflow into producer-neutral evaluation and policy control.
An evaluator emits `kujo.evaluation-result/v1`; the workflow `control` rules map
that judgment to a `kujo.policy-decision/v1`. Eval is one producer, but Dispatch
does not import or call Eval.

```json
{
  "control": {
    "policy_id": "release-gates",
    "policy_version": "1",
    "policies": [
      {
        "when": {"result": "evaluation", "verdict": "fail", "minimum_severity": "error"},
        "decide": {
          "disposition": "require_intervention",
          "reason_code": "evaluation_failed",
          "reason": "Release evaluation failed.",
          "scope": "workflow",
          "in_flight": "allow_finish",
          "preservation": {"required": false, "acceptable_modes": ["none"]},
          "allowed_actions": ["retry_evaluation", "approve_override", "abort"]
        }
      }
    ],
    "default": {"disposition": "continue", "reason": "No blocking rule matched."}
  }
}
```

The scheduler persists a barrier before emitting review hooks. The producing
step remains `completed`; policy failure is a separate workflow outcome. A
review boundary writes `state.json`, a hash-linked `control-events.jsonl`, and
a `kujo.intervention-request/v2`. Bare `resume` refuses an open policy boundary.

`resume-decision` accepts the existing approval payload and the new
`kujo.intervention-decision/v2` payload. A v2 payload must include Dispatch's
additive `run_id` routing field, match the request and boundary IDs, match the
persisted state revision, name an allowed action, and identify an authenticated
actor. Decisions are single-use. `resume_from_boundary` and `approve_override`
continue after the producer without rerunning it. `retry_evaluation`,
`retry_step`, and `amend_inputs` create an explicit new attempt only when the
target declares a safe effect class or idempotency key. `retry_clean` fails
closed until an execution provider supplies a
`kujo.reexecution-descriptor/v1`. A valid descriptor is attached to the new
attempt's tool context as `reexecution_descriptor` with
`reexecution_source: clean`; the tool/provider remains responsible for
materializing the clean environment. Inspectable-only descriptors and unsafe
non-idempotent targets are rejected.

Effect classes are `unknown`, `none`, `local_reversible`,
`external_idempotent`, `external_non_idempotent`, and `destructive`. They do
not imply rollback. They only constrain retry admission. Dispatch never claims
that stopping a workflow reverses an external effect.

`DISPATCH_DEBUG_ERRORS=true` adds the caught internal error string to an
unexpected runner failure. Use it only for local diagnostics because internal
errors may expose implementation details.
