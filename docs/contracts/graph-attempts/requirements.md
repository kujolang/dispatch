# Objective-to-proof crosswalk

This maps the requested tranche to implemented mechanisms and executable assertions.
A row names coverage, not a standalone release claim; the complete validation result
is `docs/evidence/graph-attempt-accounting/validation.json`.

| Objective parts | Mechanism / disposition | Authoritative proof |
| --- | --- | --- |
| First step, 1, 28, 29: identity and history | Existing logical node, independent child run/action/effect IDs; append-only attempt lineage; program-specific refusal or ordinary parent terminal | `decision.md`; `graph_attempt_integration.mjs` full A/B1/B2/C history; contract tests |
| 2–5, 18: reserve, consume, count | Existing run lock and journal; reserve before binding; durable dispatch consumes permanently; denied/read-only operations add no unit | `graph_attempt_smoke.mjs`; `graph_attempt_contract_tests.kujo`; recovery last-unit race |
| 6: node ceiling | Anchored maximum one or two child runs; static graph ceiling unchanged | Integration two-refusal/third-attempt denial; contract bound rejection; existing static policy mutation assertions |
| 7–11: safe retry and exact inputs | Explicit operator transition only after sealed Dispatch pre-admission refusal; fresh child and exact producer/predecessor/policy bindings | Integration full chain and stale artifact; authority ordinary execution failure rejection; binding-safety descendant reservation/binding assertions |
| 12: release | Graph then child lock; no dispatch/claim/result/refusal/running work; retained binding supplies no admission | Recovery reservation and bound-before-dispatch release; authority configuration/revocation; release contention |
| 13 A–F: crashes | Reservation, dispatch-before-load, load-before-admission, consumed admission, real mutation reply loss, retained terminal with stale projection | `graph_attempt_recovery.mjs` named crash assertions; SIGKILL and real SQLite readback |
| 14: competing controllers | Existing persisted run locks and revision-bound candidates | Recovery fresh-process last-unit, release, retry and next-attempt races; one successful transition |
| 15–17: group/branch/heterogeneous accounting | Member program dispatches count once; inactive nodes/activation/group receipts count zero; Eval/human instances separate | `graph_attempt_policy.mjs` branch, group plus human, optional reservation; accounting report fields |
| 19: reconstruct accounting | Existing retained-host inventory and mechanical reconciliation; immutable lineage and journal-derived projection | Recovery orphan reserve/release/retry/refusal and terminal-record/index gap; no execution/refund/finalization |
| 20, 30: graph outcome | Exhaustion blocks pending required work, not already consumed resolution; held reservation prevents sealing; terminal decision binds ledger digest | Integration budget exhaustion and all-complete zero availability; policy held optional reservation; contract outcome tests |
| 21: budget extension | Deliberately deferred; existing immutable ceilings cannot be raised | Decision/accounting docs; existing static policy immutable-budget tests |
| 22: resource types | Implement only sourced program-dispatch count; separate Eval/decision instances; unknown readback remains unknown | `graph_policy_operation.kujo` accounting report; smoke report assertions; operator contract |
| 23: RunLedger/Watchdog | Reviewed ownership; no authority integration or unrelated repo changes | `decision.md` ownership review; reporting/observation remains external |
| 24: portable additions | Input alpha4 and program-attempt terminal alpha2; old bytes untouched | Four vectors in `tests/vectors/graph-attempts.json`; independent Kujo/TS/Python/Go checks in canonical gate |
| 25–26: exclusions | No automatic general retries, queues/backoff or invented pricing | Explicit assess/apply operator API; sealed-refusal-only retry; accounting contract exclusions |
| 27: explanation | Informational versioned report with exact references, per-attempt state and remaining units | Operator docs; smoke report assertions; graph outcome explanations remain separate authority |
| 31 A–E: proof shapes | A/B1/B2/C, uncertain real mutation, last-slot contention, Eval branch, subgraph members | Integration, recovery and policy suites named above |
| 32: validation | Baseline before edits, focused suites, full Dispatch canonical, Kujo format/docs/contracts/locked build; related repos unchanged | Retained baseline/focused/development logs and final validation manifest; explicit skips and environment interruption |
| 33: documentation | Crosswalk, accounting/retry contract, operator authority, crash matrix, outcome interaction, remaining boundaries | Files in this directory; Dispatch audit; Kujo roadmap, next-phase architecture and Wave F accounting note |

The sole retryable failure class is the implemented Dispatch-owned refusal before node
admission. General execution failure, unknown effects and consumed acknowledgement loss
are not promoted into that class. This is the bounded safe retry proof requested by
this tranche, not general failure recovery. Optional budget extension and time/cost
categories are deferred rather than simulated. No second scheduler is introduced.
