# Graph attempt accounting: pre-implementation crosswalk

Audit starts at Dispatch `27a87ecbe05566578484dac970616a20d78b0ff3` and Kujo
`da35f5b3d673e1ddc5d7bcaabacf5fdfe5bd2b30`. Existing Kujo runtime edits are unrelated
and preserved; documentation/build work uses an isolated checkout of main.

| Existing identity/fact | Meaning | Accounting role / gap |
| --- | --- | --- |
| Graph `run_id`, anchored workflow, revision, journal cursor | Existing Dispatch control authority | Own definitions, reservation/dispatch transitions and budget projection |
| Workflow step `id` | Logical DAG node | Remains B across retries; topology does not grow |
| `node_execution.run_id` plus child step/attempt subject | Independently controlled execution instance | Reuse distinct child run identities for B's bounded attempts; preserve each old run and its immutable parent/claim records |
| Child `control_attempt`, result `subject.attempt_id` | Attempt within a child action run | Remains separate from graph dispatch; do not relabel result bytes |
| Runner `run_with_retry` / `attempt_records` | In-process retry loop | Not the graph retry mechanism; graph-backed child runner remains max-attempts one |
| `node_start_requested` | Durable graph dispatch before callback | Existing conservative budget-consumption boundary; no refund after this point even if delivery/admission is unknown |
| `node_inputs_bound` | Exact child input commitment | New child can bind the same logical inputs with its own consumer identity; producer/output/policy references must remain equal |
| Permanent node-input `.claim`, `node_execution_admitted` | One-use execution admission | Consumption cannot be erased, refunded or reused; absence of reply is not failure-before-admission |
| Effect selection ID / effect attempt ID / admission claim | Independently gated external mutation | Never inherited by another graph attempt; uncertainty blocks retry regardless of graph budget |
| `execution_result`, parent finalization | Execution knowledge and distinct terminal authority | Successful graph attempt still requires effects, outputs, evaluation and parent finalization |
| Eval subject/input IDs and local terminal receipt | Evaluation/decision instance | Count/report separately from executable dispatches; no automatic evaluator retry added |
| Human request/decision revision | Authorized decision instance | Not a program execution unit; no conversion to fake execution result |
| Branch activation | Durable path policy | Consumes no execution unit; inactive nodes reserve nothing |
| Subgraph terminal receipt | Group policy conclusion over member facts | No extra execution unit; count each executed member attempt once |

## Bounded extension

An opt-in accounting contract uses the existing graph lock, journal and immutable
record machinery. Reservation precedes child binding/dispatch. Availability is limit
minus held reservations minus consumed dispatches, derived from the event history.
Release is permitted only before dispatch, with child lock and exact absence of
admission/claim/execution. Released reservation history remains. A fresh reservation
may target the same never-dispatched execution instance; it is a new reservation,
not an unconsumed attempt restored from consumed work.

A logical program node may declare up to two predeclared child run identities. They
are execution instances, not graph nodes. Each child has ordinary independent
configuration, capability/admission, result and finalization. Retry creation is an
explicit authorized graph transition with lineage, immutable input equivalence,
current authority and ceiling checks. The old child remains sealed. No dynamic
child factory, topology callback, scheduler, retry queue or backoff is introduced.

The initial safe retry proof is an installed preflight refusal, recorded under the
child lock before creating its node admission claim or invoking execution. The child
is terminally refused and can never later admit. This is an admission fact, not an
invented execution-result or parent success. A bounded program-attempt terminal
contract wraps either that exact refusal or ordinary independent parent finalization.
Any admitted/claimed child without conclusive ordinary finalization is ineligible;
unknown effects, stale authority/evidence and reply loss cannot use the refusal path.
Remaining retry count never supplies safety evidence.

Failure strategy remains explicit: declared same-node retry keeps a safe failed
attempt blocked for an authorized new attempt while capacity remains; exhaustion
permits ordinary terminal failure policy. Existing route/block/review policies remain
separate. A graph terminal decision binds exact attempt/reservation history and budget.
No accounting repair infers a missing attempt, dispatch, refusal or terminal event.

## Ownership and deliberate exclusions

RunLedger README describes correlated receipts/reporting, not authoritative Dispatch
attempts. Watchdog telemetry observes attempt chains/durations, not admission. Existing
content-addressed artifacts and control events are sufficient; no integration or
repository change is needed merely to mirror accounting. Reports can consume exact
Dispatch references later. No monetary, token or elapsed-time inference is introduced.
Ceiling extensions, evaluator retries and general retry engines remain outside this
bounded executable-attempt contract; no mutable workflow edit may raise a limit.
