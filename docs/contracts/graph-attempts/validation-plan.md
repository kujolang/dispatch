# Attempt-accounting proof plan

This is a pre-implementation checklist, not evidence of completion. The final audit
must replace planned coverage with exact commands, counts and retained results.

| Requirement | Planned proof |
| --- | --- |
| Distinct attempt identities and terminal facts | A → B refused execution instance 1 → explicitly reserved instance 2 → independent parent finalization → C; old child and claim history retained |
| Reservation before dispatch | Crash at durable reservation; fresh report shows held one / consumed zero / admission absent; explicit release restores availability |
| Consumption boundary | Dispatch event consumes one permanently, including preflight refusal; stale/duplicate/read-only requests consume zero |
| Node ceiling | Two refusals consume two independent dispatches; third retry rejects before binding/execution |
| Same immutable input policy | Second child binds original producer/result/output/policy references; changed source bytes, subject, authority or new output cannot silently replace them |
| Unsafe retry | Real selected SQLite effect mutation and lost reply; report remains consumed/uncertain; release/retry reject; independent verification alone resolves effect fact |
| Existing failure strategies | Retry is a declared strategy, not a count heuristic; graph blocked while retry is due, terminal failure only when explicit policy/ceiling permits |
| Dispatch/child load crash | Durable dispatch before child load and child load before admission both retain identity and consumed unit; no automatic redelivery/refund |
| Consumed admission crash | Before mutation: permanent claim retained; no retry despite available graph units |
| Derived accounting stale | Actual immutable event/index gap and journal/state gap; operator reconciliation rebuilds exact projection, no invented event/refund |
| Contention | Two independent fresh processes for last graph slot, release, same-node retry/next attempt; exact single transition under existing lock |
| Branch accounting | Eval activation consumes no program unit; inactive path reserves/consumes zero; selected child remains independently admitted |
| Subgraph accounting | Count each member dispatch once; group terminal receipt adds zero program units; parent binds receipt |
| Heterogeneous units | Eval result/decision and human requests reported as separate instances, not executable attempts or invented token/cost measurements |
| Outcome and budget | Required pending work blocks at exhaustion; complete work still finalizes; unresolved consumed work cannot be reclaimed |
| Portable compatibility | Additive input-binding commitment, independent four-language vectors, unchanged historical alpha/beta/participant/parent bytes |
| Gate closure | Fresh focused baseline before source edits; new focused suites then complete Dispatch canonical; isolated Kujo docs/format/contracts/locked build |

Safety preconditions are validated under the graph lock, then child lock where needed.
A release cannot race a legal dispatch because the same graph lock serializes both.
A refusal is published before the child admission claim and seals the child run.
Only Dispatch can produce this admission fact; a participant-supplied refusal file
or retryable flag is not evidence. Neither branch nor group policy can waive it.

## Development corrections to retain in final evidence

- Initial recovery artifact inventory edit missed one closing brace; parser rejected
  fixture initialization. Corrected before the successful smoke/recovery proofs.
- First Go/TypeScript/Python run found the isolated checkout's missing TypeScript
  build output. Built with its pinned local compiler and reran successfully.
- A full A → refused B1 → B2 → C lifecycle reached independent finalization, then
  graph assessment rejected `commitment_bound`: the full internal ledger exceeded
  portable-json's 8 KiB bound. Kept that bound unchanged and used an exact retained
  internal JSON digest. The concurrent development policy run was explicitly stopped
  before changing its installed source, after one passing branch check; a complete
  rerun follows. No partial run is counted as a canonical pass.
- A changed child configuration initially failed at child admission after graph
  dispatch had already consumed a unit. Added a distinct exact-authority inspection
  before dispatch. Full execution admission still validates exact inputs and a durable
  dispatch. The distinction also permits safe release after input binding but before
  dispatch; a surviving binding alone never grants execution. The focused source
  inventory now includes the changed assurance-configuration module in place of the
  unchanged state module, retaining the existing sixteen-file manifest bound.
