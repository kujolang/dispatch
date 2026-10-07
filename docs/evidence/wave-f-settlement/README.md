# Wave F settlement verification

Audit authority: Kujo `docs/WAVE_F_EXECUTION_AUDIT_2026_10.md`, first committed as
`ccaab63` before implementation. Dispatch implementation is `93b747a`.
The source baseline is fetched main `e1bbc21166022b00fb21ed000cc4f3cbb26e7e07`.

## Completed gates

Baseline: 112 passing suites (88 focused + 24 shards). Corrected: 113 passing
suites (89 focused + 24 shards), including the new five-group regression. Both
executed all 101 sharded contracts with zero failures, passed command smoke and
completed 3/3 bounded workloads. Baseline used retained 1.7.0; corrected coverage
used checksum-verified released 1.8.0. Exact commands, source identities, suite
names and invocation exit codes are in [validation.json](validation.json).

The fresh worktree initially lacked pinned operator dependencies, then the Python
offline wheelhouse. These caused two setup exits after 34 and 47 passing suites.
The canonical installer supplied Workcell/Eval, and unchanged baseline wheels were
verified against `requirements.lock` by the isolated pip test. Exact canonical
continuations resumed at the failed commands; no assertions, source or historical
fixtures changed. The initial failure logs and continuation scripts are retained.
This is complete resumed coverage, not an uninterrupted first-pass success.

The correction changes only group-scoped accounting blockers in
`scoped_outcome_facts`. It introduces no schema, participant wire, portable encoding,
controller feature, public CLI option, scheduler or runtime primitive. Source-bound
installed controller hashes still require an exact match; existing protected runs
are not migrated automatically.

## New adversarial regression

`tests/subgraph_settlement_scope.mjs` is part of `scripts/run_release_gate.sh`.
Five proof groups cover unrelated held program capacity, unrelated held Eval
capacity, unrelated consumed Eval uncertainty, and failed/cancelled groups with
held or uncertain optional members. Each operation uses a fresh Kujo controller.
Three actual SIGKILLs occur after durable Eval dispatch and before worker delivery.
The test verifies permanent consumption, no redelivery/refund, no whole-graph
finalization, no manufactured member result and stale/duplicate candidate rejection.

Unchanged main reproduces `blocked` where settled group outcome should be
`completed`, with both the retained local runtime and checksum-verified released
1.8.0. The initial isolated-worktree invocation hit an import-root setup error;
verification was rerun from a sibling worktree. That setup failure is not the
semantic reproduction. No source change was made to bypass import confinement.

Existing canonical suites independently cover immutable group/graph publication
crashes, orphan index repair, concurrent finalizers, node/effect claims, exact
artifact bindings, safe refusal retries, branches/joins, human/Eval rejections,
capacity races, corrupt state, incompatible readers and Wave C/D historical bytes.
Nested graphs remain unsupported; rejection tests do not establish nested execution
or cancellation support.

## Measurement scope

Five fresh-process settled two-node group assessments per variant used the same
retained local binary, SHA-256
`2f9242613c497736f77c20fdb669a18b7c815e489e8a2e8cf5047ee75fd2e3e0`
(reporting 1.7.0). Baseline median was 1278.939 ms; corrected median 1000.847 ms.
Background verification load was uncontrolled and the runs were not interleaved;
these characterize startup-inclusive cost, not a demonstrated speedup. Three
corrected assessments with unrelated held program work were 1066.416, 1111.944
and 1081.846 ms. No optimization was attempted or retained. The correction adds
bounded membership checks to the existing ledger scan; persistence and admission
protocols are unchanged. No general latency or scalability guarantee follows.

## Independent compatibility finding

Watchdog main's measurement test assumes every runtime-emitted counter is required.
Its adapter and the v1 schema correctly allow additional numeric counters.
The pinned 1.6.0 run passes 76 cases plus HTTP/RunLedger integration; released 1.8.0
fails the negative `missing-counter-bytecode_compile_wall_ns`. This separate test
maintenance item is retained in SignalBox capture
`cap_53c47b3e-265d-4c3f-9de3-fca151d836be` (exact and concept retrieval passed).
No Signal was created; this is a bounded verification defect, not a demonstrated
admission safety failure. No duplicates were found. Planned future architecture,
completed implementation and routine test results were excluded from SignalBox.

## Evidence location and limits

Detailed command logs, reproduction, measurements and repository pins are retained
at `/Users/robertdevore/2026/Kujolang/validation/wave-f-20261007/`.
The final validation receipt records completed commands and counts, including the
resolved setup failures and the independent unresolved Watchdog test defect.

No exactly-once external effects, rollback, automatic unknown-effect replay,
graph-wide cancellation propagation, dynamic topology, nested graph lifecycle,
hard token/time/currency ceilings, remote trust, hostile-storage recovery,
machine-loss restore, distributed scheduling or production readiness is claimed.
