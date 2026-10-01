# Explicit graph attempt accounting proof

Experimental retained trusted-host scope. Dispatch extends its existing static DAG,
run lock, journal, node admission, parent finalization and mechanical reconciliation.
The objective crosswalk is [requirements](../contracts/graph-attempts/requirements.md).
Exact gate results, source pins, commands, hashes, warnings and skips are in
[validation](../evidence/graph-attempt-accounting/validation.json). No partial or
interrupted run counts as a complete canonical pass.

## Verified result (2026-10-01)

The complete Dispatch release gate passed at source
`119de2e6f800e1cbceadcb01dec153c2e9394d19`: 106 suite groups, all 101 native
shard assertions, 55 new accounting checks, four new commitment vectors and 3/3
bounded release workloads. The independent Go/TypeScript/Python comparison reports
152 checks, five MCP checks and nine malformed-input checks; Kujo verifies all four
new vectors. No canonical suite is skipped. The pre-implementation baseline passed
252 focused checks. Both canonical failures and the environmental interruption are
retained rather than counted as successful runs.

Kujo documentation commit `2946f2a1a76700519292db3da8004ea1a9e31f61` passed format,
locked release build and 13 architecture/README/workflow contract tests. Two existing
artifact-dependent workflow tests remain explicitly ignored; vendor tiny_http emits
two existing warnings. No related repository was modified by this work. Kujo main
advanced independently during validation; the tested documentation branch retains its
original main base, with no claim that unrelated newer runtime changes were tested.

## Model

A logical node stays fixed while its explicitly declared child execution run changes.
A held reservation consumes availability; a durable graph dispatch permanently
consumes a program-dispatch unit. Node admission and effect admission remain separate.
Loss of delivery, reply or certainty does not refund dispatch. The current view is
journal-derived, not an independently mutable counter.

Release requires graph then child lock and exact proof of no dispatch, claim,
execution, refusal or uncertainty. A released reservation remains historical; its
surviving input binding grants no admission. Retry requires a sealed Dispatch-owned
resource-preflight refusal before node admission. An operator explicitly authorizes
a new child run, exact original logical inputs and lineage. The old child stays
sealed; the new child independently crosses execution, effects, Eval and finalization.
A descendant reservation or immutable child binding blocks retiring its source.

Only program dispatches use this unit. Inactive branches, branch activation and group
terminal receipts add none. Group members count once. Human decision and Eval instances
remain separate report categories. No price, token or elapsed-time measurement is
invented. The static graph ceiling and node ceiling remain anchored.

## Proof and limits

The integration chain is A → pre-admission refusal B1 → independently completed B2 → C.
The tests retain B1, validate actual typed downstream input, deny a third attempt,
reject changed artifacts and authority, and finalize all-complete work at zero
availability. Exhaustion with required work remaining blocks; it does not fabricate
failure or reclaim uncertain work.

Fresh-process races cover the last graph slot, release and retry/next-attempt creation.
Crash injection covers reservation before binding, binding before dispatch, durable
dispatch before delivery, child load before admission, consumed admission before work,
real SQLite mutation with lost reply, and immutable terminal/index publication gaps.
Retained-host repair reconstructs exact reserve/release/retry/refusal/terminal lineage
without execution, refund, missing event invention or graph finalization.

Portable additions are input-binding/v1alpha4 and program-attempt terminal/v1alpha2.
Four independent language implementations check the new commitments. Historical
schemas, alpha/beta commitments, execution-result/v1 and participant bytes stay intact.
Development failures and fixes are retained, including the wrong AJV draft validator.
A host restart interrupted a subsequent canonical run; its surviving evidence and
loss of temporary originals are explicit, and a complete rerun is required. The
post-restart run also exposed an assumption that historical observation-only journals
carried workflow definitions. Opt-in accounting now preserves their absence while
rejecting accounting events or unexplained ledger rows; the real effect-set crash
and renewal suite and three additional contract assertions verify the correction.

## Ownership and next phase

Dispatch owns accounting authority; Workcell supplies environment facts; Eval supplies
judgment facts; RunLedger reports; Watchdog observes. No unrelated repository change
or duplicate audit system is needed. The operator report is informational, not an
execution or retry ticket.

Next major phase: sourced resource and Eval measurement with bounded reservation
planning, evaluator budgets and fan-out quotas. Establish trustworthy units before
cost/time policy. General retries, automatic redelivery, ceiling extension, arbitrary
loops, dynamic topology, distributed scheduling, remote trust, machine-loss recovery,
mixed profiles, compensation, exactly-once, universal rollback, public/stable SDKs
and new language syntax remain outside scope.
