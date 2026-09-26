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

`scope: workflow` closes admission for every pending step immediately.
`step`, `descendants`, and `branch` use the transitive dependency closure rooted
at the producing step; Dispatch drains unrelated runnable DAG branches, then
enters `paused`. The persisted boundary lists the exact blocked step IDs and
records `workflow_quiescing` followed by `workflow_paused`. Because Dispatch's
current parallel batches join before policy resolution, there are no live
in-process siblings at the decision point: their late outcomes are already
recorded, and `in_flight` remains auditable policy metadata rather than a claim
that arbitrary tool processes were rolled back or force-killed.

Policy engines may attach an already-produced
`kujo.preservation-outcome/v1` as `preservation_outcome` and a
`kujo.reexecution-descriptor/v1` as `reexecution_descriptor`. Dispatch stores
those provider-owned outcomes on the boundary; it otherwise records an honest
unsupported/satisfied-none local placeholder and never invents a Workcell
snapshot.

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

## Failure and safe re-execution completion (September 2026)

Opt-in `control` workflows also accept `kujo.execution-result/v1`, either
as tool data or under `execution_result`. Rules use `when.result: execution`
and optional `status`/`classification`. Unmatched unsuccessful execution stops.
Failed handlers are normalized before the legacy terminal failure path; an
explicit review policy can pause a failed step while leaving descendants
pending. Execution-failure review currently closes the whole workflow scope.
A trusted step configured with `control_role: evaluator` maps a handler crash
to `evaluation_status: error`, `verdict: indeterminate`, and zero failed checks.
It does not claim the subject failed a quality check. Legacy workflows without
`control` retain their old behavior.

For control workflows, execution attempts stop after the first failure; policy
`retry` requests review rather than silently replaying the action. Same-result
policy decision IDs are deterministic. Evaluation defaults are fail-closed
unless the workflow supplies an explicit default. A producer cannot emit a
policy decision unless its trusted step config sets `policy_authority: true`.

These rules replace the earlier idempotency-key-only retry guidance above:

- `retry_evaluation` requires `control_role: evaluator`, retained evaluation
  facts, and the same input/evidence references. Tool context includes
  `retained_evidence`, `retained_input_evidence_ids`, `reexecution_source:
  existing_evidence`, and the new `control_attempt`. The evaluator adapter must
  verify referenced artifacts against retained integrity before using them.
- `retry_step` requires satisfied, unexpired filesystem preservation with
  `reconstructability: same_filesystem` and trusted config
  `reexecution_modes: ["same_workspace"]`. The handler receives the preservation
  record and must verify that the owned workspace still exists.
- `retry_clean` requires a re-executable descriptor, replay permission and
  trusted config `reexecution_modes: ["clean_workspace"]`. The adapter creates
  a fresh workspace from trusted original definitions. Metadata commands are
  never executed by Dispatch. The new attempt bypasses the old result cache.
- A submitted key alone cannot permit replay. An observed external idempotent
  effect requires `idempotency_key`, `enforced_by`, and
  `enforcement_evidence_ref`. Unknown/partial non-idempotent effects deny replay,
  even if a step was originally declared pure. JSON facts must come from a
  trusted producer; these fields cannot prove an untrusted sink's behavior.
- `resume_from_boundary`/`approve_override` accept the boundary without replay;
  a failed producing step becomes explicitly skipped with the decision ID.
  `abort`/`cancel` end the run. Terminal runs cannot re-enter execution.

V2 decision consumption holds the run lock across reload, validation, claim,
continuation and final receipt. A repeated identical decision returns
`already_applied`; reusing its ID with another payload is a conflict. A claimed
but unfinished decision requires recovery, never automatic replay. Expired,
stale, unrelated-target and disallowed decisions fail before changing steps.
Local CLI access is the authority boundary; actor fields record attribution,
not cryptographic authentication. Remote consumers must authenticate transport.

Control events retain normalized policy inputs/decisions, references, revision,
and typed intervention decisions; raw producer `output` is excluded. New events
are written to immutable, atomic, directory-synced `control-records/<sequence>.json`
files before appending the hash-linked JSONL index. On admission, the consumer
checks sequence, hashes, records and checkpoint cursor once. A torn tail, orphan
record or checkpoint mismatch returns `control_recovery_required` or
`control_journal_corrupt`. Preserve these files and reconcile the checkpoint
against the immutable decisions under the run lock; there is deliberately no
command that guesses whether an external effect happened. Existing legacy
journal records remain readable. Active journals are bounded to 8 MiB; archive
completed runs before reaching the limit. Journals are audit evidence, not an
event-sourced scheduler or an authenticated signature chain.

Run the offline example in [failure-gate/README.md](../examples/failure-gate/README.md)
and the focused safety, execution, boundary and concurrent decision-claim tests.

The durable-record path requires a Kujo source build exposing
`sync_directory_beneath` (currently an Unreleased preview primitive), in addition
to bounded artifact I/O. This is not a claim that the published 1.5.0 binary
already contains the directory-sync primitive. Workflows without `control`
retain legacy execution/retry behavior and do not create control records.

Intervention requests distinguish policy-authorized `allowed_actions` from
`unavailable_actions`, which carries the current effect/preservation rejection
code and message. Admission rechecks these facts when a decision arrives. Unknown
policy reason codes use the portable `other` reason type and retain their original
code. Action lists are unique and bounded by the eight supported actions.

`tests/reexecution_lifecycle_fixture.kujo` exercises a trusted local adapter with
actual retained/fresh workspace identities, reconstructed input hashes, a stable
sink-enforced idempotency key and reconciled attempt journals. It is an offline
contract proof, not a provider-resume guarantee.

The journal also snapshots each intervention request before delivery. Its
transport target, routing and callback metadata are redacted; typed review facts,
preservation, authorized/unavailable actions and correlation identities remain
inspectable independently of mutable workflow state.
