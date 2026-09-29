# Bounded sequential continuation: architecture decision

Status: verified experimental local trusted-host proof, 2026-09-29. See the
[final validation receipt](../../evidence/sequential-effects/validation.json).

Dispatch owns an append-only lifecycle over the existing immutable plan and
parent result. A fresh assessment is a durable evidence-basis record. Selection
allocates one attempt; rebinding changes only its evidence basis; cancellation
records intentional abandonment only before consumption; admission permanently
consumes the attempt. Independent verification records sink truth. Only a new
assessment following that verification can support the next explicit selection.
There is no remainder ticket, automatic loop, parallel effects or parent replay.
Even when every effect is verified, this API does not rewrite the historical
parent result, finalize the parent action, or advance other workflow steps. The
original paused control boundary remains subject to separate operator policy.

The existing one-effect API and its historical vectors remain supported without
reinterpretation. The sequential API is separately feature-gated so previous
controllers cannot silently ignore its lifecycle. Both paths share current
context validation, installed authority, actual run locks, protected storage and
sink adapters. The new lifecycle derives active/consumed/cancelled/completed facts
from immutable records rather than allowing callers to edit a status enum.

All sequential mutations require the caller's exact expected state revision and
journal cursor, checked after acquiring the run lock and reloading. A consumed
claim is never removed. Rebind and cancellation also check for a durable claim
that may have survived an interrupted journal publication. An orphan or torn
control journal remains a review condition, not automatic recovery permission.

The existing persisted negotiation pins exactly one assurance profile per run.
The proof therefore uses the same generic lifecycle in a SQLite run and a
Workcell Git run. A mixed-profile run would require a reviewed composite authority
contract; this change does not disguise one family's authority as another's.
SQLite transaction/row truth remains in its adapter; Git CAS/ref/marker truth
remains in Workcell. Installed adapter functions validate the exact plan mapping,
observe one effect, and perform one checked mutation. Participants cannot install
these functions or invoke lifecycle authority through recording SDKs.

Renewal keeps the original selection, run/parent/plan/effect/attempt and exact
configuration/registration/environment/preservation commitments. Only observation
references and their fresh timestamps may change. Here “same effect set” means
the immutable ordered plan and parent result; a new evidence-bundle hash is
necessarily expected for renewal. Every replacement predicate is independently
reconstructed. New profile/authority revisions are not treated as compatible
merely because their labels match.

Validation passed: 80 sequential scenarios across the two real families, six
portable lifecycle vectors in four independent languages, all historical
compatibility checks, the complete Dispatch gate, Workcell canonical/adapter
gates, and Kujo documentation plus locked build checks. The receipt preserves
source pins, commands, counts, initial failures, warnings, skips and hashed logs.

## Operator surface and durable state

`sequential_effect_operation(root, run_id, request, installed_options)` accepts
one closed request at a time. `inspect` returns a cursor and derived lifecycle.
Every other request supplies that exact `{revision, journal}` cursor. `refresh`
and `select` name one `effect_id`; `rebind`, `cancel`, `admit`, and `verify` name
one `attempt_id`. Cancellation reasons are `operator_cancelled` and
`no_longer_required`. Unknown operations/fields fail closed. This is an installed
operator API, not a participant transport or stable public API.

The protected checkpoint references at most 64 immutable SHA-256-addressed
`dispatch.effect-lifecycle-event/v1alpha1` records. Each event binds its prior
state revision and journal digest. The control journal records the entire current
reference sequence and must reconcile exactly with authoritative state. Original
parent bytes, plan, observations, and evidence bundles remain confined immutable
artifacts. Old controllers refuse `sequential-effects/v1alpha1` rather than
silently ignoring it. Old one-effect state is not implicitly migrated.

The lifecycle is derived from `assessed`, `selected`, `rebound`, `cancelled`,
`admitted`, and `observed` records. A selection retains the existing
`dispatch.effect-selection/v1alpha1` identity recipe. Rebinding appends the old
and new basis references without changing that selection. Cancellation appends
its bounded reason; reselection, if subsequently justified by a fresh assessment,
is a distinct attempt. Admission writes an exclusive durable claim before
publishing consumption. A surviving orphan claim blocks admission, cancellation,
and rebind even if its journal publication was interrupted.

```text
independent observations → locked fresh assessment
  → explicit eligible effect → immutable selection/attempt
  → optional explicit fresh-evidence rebind OR unconsumed cancellation
  → final current-binding validation → permanent claim/admission
  → family checked mutation → independent observation
  → separately requested fresh assessment → separately selected next effect
```

A recorded observation of `not_started` following admission does not unconsume
anything. The attempt remains terminal for execution; review may determine what
happened, but renewal and cancellation cannot manufacture replay permission.

## Ownership

| Step | Information producer | Validator | Authority owner | Durable requirement |
| --- | --- | --- | --- | --- |
| Claims/result/metadata | Participant or installed action | Existing result/plan parser | None from claims | Original parent/result and plan |
| Live observation | SQLite or Workcell family owner | Installed identity mapping and independent readback | No admission authority | Fresh content-addressed observation |
| Assessment | Read-only assessor | Exact plan/result/evidence and current verifier | Informational only | Explicit Dispatch assessment basis |
| Selection | Operator names one effect | Dispatch under run lock | Dispatch | Immutable selection, attempt, journal and checkpoint |
| Rebinding | Operator requests renewal | Dispatch re-observes exact predicates and validates unconsumed lineage | Dispatch | Original basis plus appended replacement link |
| Cancellation | Operator names bounded reason | Dispatch proves current eligible unconsumed state and no claim | Dispatch | Append-only abandonment record |
| Admission | Operator requests exact attempt | Dispatch repeats identity/freshness/authority checks | Dispatch | Exclusive permanent claim and admitted record |
| Mutation | Installed family adapter | SQLite transaction or Workcell Git CAS plus final host callback | Sink owns mutation semantics | Sink-owned row or ref/marker evidence |
| Verification/progression | Independent family observer | Dispatch validates bindings, then separately reassesses | Dispatch alone selects any next effect | Observation, later assessment, distinct next selection |

## Crash and race contract

| Boundary | Durable state | Sink/reload truth | Allowed action | Prohibited action |
| --- | --- | --- | --- | --- |
| Fresh evidence before rebind | Old selection; new assessed basis | No selected mutation | Explicit rebind using current cursor | Treat refresh as admission |
| Before rebind persistence | Old selection/basis | No selected mutation | Revalidate/retry explicit rebind | Infer a phantom rebind |
| Rebind persisted, reply lost | Original selection plus replacement basis | Same unconsumed attempt | Inspect and admit only after fresh checks | New unrelated attempt from reply loss |
| Rebound evidence expires | Historical basis retained | No admission eligibility | Refresh and explicitly rebind again | Execute on expired evidence |
| Before cancellation persistence | Original unconsumed selection | No selected mutation | Revalidate cancellation | Infer abandonment |
| Cancellation persisted, reply lost | Durable cancellation | Abandoned attempt remains unconsumed | Inspect; separately assess any new selection | Admit abandoned attempt |
| Admission before mutation | Claim and consumption | Mutation may be absent | Independent verification/review | Rebind, cancel, or repeat admission |
| Mutation before observation | Claim and consumption | Independent row/ref truth required | Verify exact effect | Replay because acknowledgement is absent |
| Observation before new assessment | Completion record | C complete; D separately gated | Explicit new assessment | Select D on pre-C assessment |
| D selected, controller dies | Distinct D selection/attempt | C complete; D not yet admitted | Revalidate surviving D selection | Reuse C's attempt for D |
| Competing fresh controllers | Same loaded expected cursor | Real run lock serializes publication | One current operation succeeds | Stale contender mutation |
| Torn journal/orphan publication | Inconsistent cursor or surviving claim | Review required | Inspect retained evidence | Automatic repair into executable authority |

## TOCTOU review

All operations reacquire the actual run lock, load authoritative storage, reconcile
journal records, and compare the supplied cursor. Selection rechecks current
bindings before publication. Rebinding/cancellation reload and compare again
before append. Final admission resolves installed source inventory/configuration,
registration, exact plan/parent, environment/preservation, evidence deadlines,
selected-effect truth, and complete prefix. The installed callback repeats these
checks at the sink boundary. SQLite calls it after `BEGIN IMMEDIATE`; Workcell
calls it immediately before the bounded Git atomic ref transaction and rechecks
its deadline. The Dispatch lock remains held through mutation and observation.

The callback is not an atomic transaction over all host configuration and all
sinks. Trusted host changes must honor the authority/lock model; arbitrary
privileged writers, hostile adapters, multi-host writers, and wall-clock rollback
are outside this proof. Git's CAS protects its target/marker transaction. A failed
callback consumes no additional attempt and never deletes the existing claim.
The explicit observation record and later assessment prevent success replies from
becoming automatic next-effect permission.

## Remaining boundaries and next phase

No generalized scheduler, parallel effects, DAG orchestration, compensation,
remote authenticated trust, malicious participant verification, remote renewal,
multi-host authority, distributed transactions, cross-sink atomicity, stable/public
SDK, protocol freeze, A2A, machine-loss recovery, exactly-once claim, or universal
rollback is provided. Mixed-profile authority remains a separate design problem.

The next phase should be chosen from final evidence, particularly whether retained
journal/checkpoint divergence can be reconciled safely by an operator without
manufacturing execution permission. More local happy-path variants alone would
not establish either durable recovery or remote trust.

### Original recommendation after sequential validation

Broader durable recovery and operator reconciliation is the strongest next phase.
The local authority separation now has two genuinely different sink mechanisms;
additional happy-path sink variants have diminishing architectural value. The
remaining retained-host failure boundary is publication divergence: an orphan
claim or journal/checkpoint mismatch correctly denies mutation, but safe inspection
and explicit reconciliation still need an operational contract. Design recovery
that can classify retained evidence, preserve consumed attempts, explain allowed
operator actions, and publish reconciled knowledge without manufacturing admission.
This is broader than adding another renewal test and narrower than machine-loss
or distributed recovery. Remote authenticated participant trust should follow a
separate threat-model and authority design; transport authentication would not
solve these local recovery semantics.

### Retained-host follow-up

The bounded [reconciliation contract](../recovery/retained-host.md) now supports
explicit mechanical recovery of complete immutable control records and stale
lifecycle checkpoints. Lifecycle-only orphans remain review conditions. A recovery
receipt advances the checkpoint without changing effect facts; existing admission
checks still apply. The subsequent [parent-finalization contract](../parent-finalization/protocol.md)
adds an explicit terminal decision for the last unresolved protected parent. Its
[Wave F crosswalk](../parent-finalization/wave-f-crosswalk.md) now identifies bounded
producer/consumer node composition as the next architecture slice.
