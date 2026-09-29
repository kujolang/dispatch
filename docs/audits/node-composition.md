# Wave F node composition audit

Starting authority: Dispatch `09d2d0d06889545b91d2d6fbbade582a81de6cf8`, Kujo
`515cdda7133cb7e898397434ac374d87e9fb1b18`, Workcell
`e645d80e697cb722d49c35982905b2294da0a627`. The pre-implementation crosswalk was
committed before implementation. The full baseline gate ran against unchanged
source in the original checkout; implementation used an isolated worktree after
focused DAG, preservation and parent-finalization baselines passed.

## Implemented boundary

Dispatch's existing DAG runner recognizes opt-in run-backed steps. The installed
host resolves exact protected child runs; it cannot use a participant's output as
terminal authority. Each child has an immutable typed input binding, retained raw
provenance, a permanent initial claim, independent Workcell/action, selected SQLite
effect, Eval record and parent terminal decision. A later explicit graph invocation
records successful terminal observations. There is no second scheduling loop.

The proof uses filesystem-backed protected state, a real unique-key SQLite effect
sink and actual Workcell Git worktrees. Processes are fresh Kujo invocations.
Completion-only fan-out and a bounded two-input join use the same readiness scan.
The outer run status remains the existing derived DAG summary, not a new universal
graph terminal-decision contract. Admission reads actual child terminal receipts
even when step/status summaries claim completion. Current progression also requires
the installed resolver chain and exact upstream bytes; retained historical
provenance does not promise continued eligibility after live-source loss.

The existing SQLite state-store gate remains part of compatibility validation;
this tranche does not claim a separate composition proof for every storage backend.

See [protocol](../contracts/node-composition/protocol.md),
[crash matrix](../contracts/node-composition/crash-matrix.md), and
[validation manifest](../evidence/node-composition/validation.json).

## TOCTOU review

| Boundary | Mutable fact / validation |
| --- | --- |
| Assessment → binding | Reload graph and child under existing graph-then-child locks; compare exact expected binding and re-read producer bytes before journaling |
| Binding → dispatch | Existing graph readiness plus actual successful producer terminal records; data identities remain distinct from ordering |
| Dispatch → initial admission | Child lock; current pinned installed configuration, graph dispatch/definition, predecessor terminal identities and raw input digests; exclusive synced claim |
| Admission → action | Current authority checked again; ordinary tool policy and cancellation; exact retained content read with hash validation |
| Action → selected effect | Ordinary independent effect lifecycle, preservation/registration/freshness and one-use admission |
| Observation → terminal | Existing parent output/Eval/preservation/operator decision checks; no automatic terminal inference |
| Terminal → graph projection | Exact original result, terminal receipt/revision and retained artifacts; source-bound control event, state published last |
| Reconciliation → continuation | Exact source-bound repair under existing lock; no scheduling or execution side effect |

The host installs validators and byte resolvers. Participant dictionaries cannot
install code, inherit capabilities or supply graph control decisions. Source bytes
are retained by identity; changing a live output cannot replace the consumer's
historical input. Current missing/stale evidence can still block admission without
rewriting historical truth. A consumed node or effect attempt is never reset.

## Development failures retained

The validation manifest links original logs, including corrected failures:

- Fixture initially used an incompatible mutable closure ticket and then an invalid
  Workcell run ID. The final wrapper uses its private invocation predicate plus
  permanent claim; Workcell uses its established `wc-` identity shape.
- Kujo `has_key` returns integer `1`; a strict Boolean assertion incorrectly rejected
  real finalized producers. The predicate now compares explicitly.
- The first Eval-negative assertion expected rejection, but existing policy correctly
  proposed a **failed** terminal outcome. The test now verifies that outcome and
  separately proves it never satisfies a successful dependency.
- Disposable crash-copy module search roots initially rejected a Workcell symlink
  escape. The test uses the canonical sibling module root, preserving runtime import
  confinement rather than bypassing it.
- Recovery application accessed `human_intervention` before any review existed.
  Exact initial-node repair now treats the absent field as absent, without fabricating
  review authority. Graph review-state checks likewise use bounded optional reads.
- The additive journal projection initially required workflow metadata on legacy
  journal-only records. The existing failure-safety suite exposed this regression;
  optional feature detection now preserves those historical records. A disposable
  verification copy initially omitted its test fixture dependency; that setup error
  is retained separately from the successful 20-test correction.
- The portable schema initially used `uniqueItems`, unsupported by the current Kujo
  JSON-schema subset. The schema uses supported vocabulary; construction deduplicates
  retained references and exact binding comparison remains authoritative.

No failure was suppressed. Source and log hashes, commands, explicit skips, warnings
and final gate counts are recorded in the manifest. Optional agent-produced and RAG
examples were not implemented: typed deterministic composition is already a complete
bounded proof, and neither additional repository is required for admission ownership.

## Remaining architecture

Continue Wave F with heterogeneous node terminal predicates and graph-level outcome
policy. A human approval or evaluation-only node should not impersonate a program
execution result. Keep exact source/context provenance available for Wave E without
making RAG mandatory. Remote trust and machine migration remain separate projects.

No dynamic scheduler, distributed graph execution, remote authentication, machine-loss
recovery, mixed profiles within a run, compensation, exactly-once, universal rollback,
legacy selected-state migration, public/stable SDK or language change is claimed.
