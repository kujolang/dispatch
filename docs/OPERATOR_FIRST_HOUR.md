# Operator rehearsal: first-hour findings

Starting points: Dispatch `de66a668a6bceb0b27dd2d4ae97797c969c595c2` and Kujo
`fbaaf244708b9384fcb321e8e6772c6764e21425`. The unrelated primary Kujo checkout was
left untouched; work used isolated branches. This is a factual installation and
operator exercise, not a subjective usability score or a new architecture phase.

| Category | Observed friction | Classification | Bounded response |
| --- | --- | --- | --- |
| Installation | Default Dispatch manifest names a Kujo source SHA; the installer attempted a nonexistent release for that SHA, then required Cargo in the clean environment. | Required prerequisite insufficiently explicit for binary-only use | Document exact binary manifest, release checksum verification and source-build distinction. Preserve canonical source pin. |
| Setup | The Dispatch package closure installs AI/Agents SDK but not the Workcell/Eval host used by graph proofs. | Required but undocumented | Install two exact experimental dependency archives; no fixture symlinks or inherited module path. |
| Public control | Stable installed `dispatch --help` has no graph operator path. The documented routed-review demo succeeds, but does not exercise graph terminal/resource authority. | Internal-only integration assumption | Add one closed experimental batch host behind `dispatch operator`; retain existing core APIs. |
| Status | An operator would need fixture functions/raw state to join output, review, branch, attempt and resource facts. | Missing explanation surface | Human and versioned JSON report with exact provenance, unknown usage and recovery assessment. |
| State terminology | Newly allocated child runs have a persisted `running` control status before any dispatch. Showing that as process liveness would be misleading. | Confusing terminology | Report control status separately from durable dispatch/result/finalization facts; make no process-liveness claim. |
| Review | Internal examples constructed subject/revision-bound decision JSON. | Command requiring source knowledge | `review` opens an exact request; `plan approve/deny` constructs the candidate; `apply` checks the current OS user and core authority. |
| Recovery | Rehearsal must identify surviving reservations before continuing after a killed controller. | Recovery ambiguity | Expose the existing retained-host plan/apply API; no implicit resume or refund. |
| Error text | Capacity/path/stale-candidate codes lacked a corrective operator action. | Implementation-centric diagnostic | Preserve the exact code and add a bounded next action. Never recommend raw state editing. |

## Workflow and interfaces

A bounded integer batch produces a typed summary and one SQLite publication
receipt. H reviews its exact output; E checks the configured expected total. The
existing Eval branch selects B (publication) or R (repair report). Each executable
node retains its own Workcell, effect admission, schema evaluation and parent
finalization. The graph terminal decision is separate. There is no live model.
Graph Eval budgets count explicit E dispatches; the local schema check within a
program's parent contract is not another graph evaluator node.

Public entrypoints: `dispatch operator init`, `inspect [--json]`, `plan`, `apply`,
`review`, and `run`. Plans name one operation and preserve exact existing revision
and evidence preconditions. Planning a receipt operation is a requested command,
not a guarantee that admission will pass final revalidation. The wrapper's explicit
absolute workspace argument opts into the existing non-default output-root policy.

The executable black-box proof is `tests/operator_rehearsal.mjs`. It copies only
package files into a new installation, supplies pinned real dependencies, clears
the inherited environment except documented prerequisites, uses a fresh HOME,
and invokes the public launcher from outside the installation. It imports no
internal fixture helpers and never edits control state. Its only low-level access
is read-only hashing and watching immutable record publication to time SIGKILL.
A separate archive installation rehearses the real GitHub installer path.

## Proof boundaries

- Happy path: independent program/receipt, human decision, Eval, selected consumer
  and graph terminal authority. Exact A digest remains B's input; source input,
  review and branch facts remain inspectable.
- Failure: an actual wrong expected total yields failed Eval and the declared R
  branch. The failed verdict remains historical; B stays `not_selected`.
- Review: wrong subject and stale revision reject. Approval starts no evaluator
  and grants no consumer effect admission.
- Budget: no Eval capacity blocks reservation; a graph already using its last
  program/Eval units may still record evidence and finalize.
- Recovery: SIGKILL occurs after immutable reservation publication. A fresh
  controller inventories/reconciles surviving facts, retains the reservation and
  observes no program admission or output. Ordinary continuation follows. This
  operator scenario does not newly claim every lost-reply crash case; the existing
  canonical recovery/consumed-attempt suites cover those boundaries.
- Resources: real Eval runtime observation is retained. Process-time partial sums
  are not graph elapsed time or CPU. Provider tokens, estimates and money remain
  unknown where no source exists; unknown totals are null, not zero.

## Remaining scope

This is a supported experimental walkthrough for one installed host, not arbitrary
workflow authoring or a public graph SDK. Trusted local OS/filesystem authority,
static topology, exact installed implementation and surviving local storage are
required. Evidence/preservation expire; this walkthrough does not expose renewal,
unsafe retries, mutable ceilings, remote trust, machine migration or force recovery.
No pricing, dashboard, scheduler, participant wire changes or new language syntax
were added. Workcell and Eval sources were inspected/installed but not modified.

Freeze the local Wave F architecture lane once canonical verification passes.
Return to product/release work and real user feedback. No additional graph or
resource architecture follows automatically from this rehearsal. Validation counts,
source pins, failures and artifact hashes belong in the accompanying evidence
record; a green happy path alone is not a release approval.
