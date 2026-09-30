# Retained-host attempt accounting matrix

The executable cases live in `tests/graph_attempt_recovery.mjs` and
`tests/graph_attempt_authority.mjs`. Controllers are fresh Kujo processes. Crash
cases terminate at actual publication/admission boundaries with SIGKILL; the orphan
cases interrupt the immutable-record/index boundary in an installed source copy.
The final validation record identifies the tested source and gate outcomes.

| Boundary | Surviving durable fact | Fresh-controller action | Prohibited inference/action |
| --- | --- | --- | --- |
| Reservation before input binding | Held reservation; no dispatch, claim or work | Operator may release under graph/child locks | Invent execution or a consumed attempt |
| Binding before dispatch | Held reservation and exact child binding | Operator may release; direct child start rejects | Treat binding as admission |
| Dispatch before child loads | Permanently consumed dispatch | Report delivery/admission as unproven | Redeliver, refund or retry from silence |
| Child loads before admission | Same consumed dispatch and child identity | Reload and preserve uncertainty | Create another attempt because no reply arrived |
| Admission before work | Permanent child claim/admission, no work result | Preserve consumed identity; require evidence/review | Clear claim or release capacity |
| SQLite mutation before reply | Consumed node/effect admission and real sink row | Independent sink verification may resolve effect fact | Replay or refund the mutation |
| Terminal fact, derived graph view stale | Exact immutable terminal observation | Mechanical retained-host repair reconstructs accounting | Invent graph finalization or erase consumption |
| Reservation immutable record, index missing | Source-bound orphan reservation | Exact reconciliation appends missing index/projection | Pick an unrelated child or run it |
| Release immutable record, index missing | Source-bound orphan release | Exact reconciliation retains release history | Release any dispatched reservation |
| Retry immutable record, index missing | New declared child and prior-terminal lineage | Reconstruct reserved next attempt; do not run | Replace old refusal or reuse its identity |
| Child refusal immutable record, index missing | Exact dispatcher refusal before claim | Reconstruct sealed refusal | Admit the refused child |
| Child authority changes after reservation | Old held reservation and stale child revision | Reject dispatch/release under stale authority | Treat remaining units as current authority |
| Operator authority revoked during apply | Informational candidate only | Final revalidation rejects | Publish the stale candidate |

Contention uses the existing locks and revision checks. Two independently loaded
controllers compete for the last graph unit, release, and the same retry/next-child
creation. Exactly one transition may publish. A rejected candidate, duplicate delivery
or read-only assessment consumes no additional unit.

Successful node truth remains independent of graph policy. The safe retry chain
preserves B1's refusal and B2's own execution, effect admission, output, Eval and parent
finalization. A downstream C consumes B2's exact output. Branch activation consumes no
program unit; inactive repair work has no reservation. A group receipt adds no unit
on top of its member dispatches. Held optional work must be explicitly released before
cancellation and graph sealing.

The recovery matrix assumes retained trusted local storage and valid immutable
history. Missing/conflicting authority, corrupt records and uncertain effects cannot
be repaired by an accounting refund. General machine recovery, remote trust,
distributed coordination, compensation and exactly-once effects remain unsolved.
