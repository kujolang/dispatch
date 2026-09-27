# Durable review checkpoint slice (2026-09-26)

Wave A in Kujo is green at bdf634f: complete release gate, explicit VM fixtures,
bounded measurement contract, behavioral comparisons and recorded overhead.
This plan precedes Wave B implementation. Dispatch starts at 61a367e.

## Ownership and scope

Dispatch already persists run/step/attempt identity, inputs, workflow, policy,
results, evidence references, open boundaries, decisions and a journal cursor.
Workcell owns preservation and materialization. Eval owns judgments. RunLedger
owns correlated receipts. None of these belong in a new core VM lifecycle.

Implement a **review checkpoint**, binding existing authoritative state and its
journal at a quiescent paused boundary. It is not a portable VM snapshot, recovery
permission, workspace backup, or proof of replay safety. Existing bundle export
is not sufficient: it does not bind control-record durability or admission.

## Files and API

1. `src/core/runner.kujo`, `state.kujo`: share terminal classification. Reproduced
   bug: a persisted rejected run currently executes pending descendants. Include
   the runner's existing aborted terminal spelling in the shared predicate.
2. `src/core/checkpoint.kujo`: bounded immutable manifest and canonical state
   snapshot, exported publish API loads authoritative state under the process
   lock, reconciles the journal, requires paused/open-boundary/no running steps.
   Strip only read-time health diagnostics from canonical comparison.
3. `dispatch.kujo`: additive checkpoint command; optional checkpoint reference on
   v2 resume-decision, verified after lock/reload and before a new decision claim.
   Preserve existing applied-decision idempotency. No alternate decision engine.
4. Manifest `dispatch.review-checkpoint/v1`: run/revision/boundary identity,
   state SHA/ref, input/workflow/policy SHA, journal cursor, explicit nonportable
   scope. Content-derived ID, confined relative paths, 8 MiB state / 64 KiB
   manifest limits. Publish snapshot first, sync directory, manifest last, sync.
5. Tests/docs/changelog/gate: terminal regression, schema/path/hash/revision
   failures, corrupt/orphan journal, no state mutation on failed validation.
   Real Workcell + Eval first controller exits at review; second CLI controller
   validates checkpoint and accepts authorized override; descendant then runs.
   Correlate final evidence through real RunLedger. Existing safety suites cover
   expired preservation, missing adapters, uncertain effects and decision claims.

## Compatibility and risks

No lifecycle enum replacement, workflow re-execution, provider pricing or generic
rollback. A checkpoint never authorizes a decision; existing v2 action/revision,
effect and preservation checks still apply. No model process remains resident.
State contains private application data: checkpoint is local protected state,
not redacted telemetry. Hashes detect accidental mismatch, not malicious writers
with access to the authoritative store. Read/write limits bound each artifact;
retention remains run-owner policy. Publication is explicit, not a hot path.

Crash before manifest publication leaves an unusable orphan snapshot. Crash after
publication leaves an inspectable marker, requiring live state+journal agreement.
Missing live authority, orphan effects/results, journal mismatch and a claimed
but unfinished decision fail closed. Machine-loss restore/migration is deferred;
this slice requires the existing run store and evidence to survive interruption.

## Validation and completion

Run focused tests and separate-process fixture; then the unmodified full Dispatch
release gate plus added checkpoint suite. Verify file manifests and final journal,
action/evaluator attempt counts, blocked-before/continued-after descendants,
duplicate decision behavior and reproducible ledger correlation. Review bounds,
path confinement, stale state, secrets, crashes, and conservative replay rules.
Document concrete Wave C attestation design separately; no broad effect taxonomy
implementation is necessary for this slice.
