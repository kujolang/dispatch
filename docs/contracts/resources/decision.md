# Sourced resources and bounded Eval work: design crosswalk

Starts at Dispatch b724f369ab4101a46ea0d5493cc41fc3d0fa3b9c. Kujo's concurrent
runtime and editor changes are outside this work; validation uses the retained
pinned runtime and isolated documentation checkout.

| Dimension | Existing source | Classification / enforcement decision |
| --- | --- | --- |
| Program attempts | Dispatch graph attempt journal | Authoritative durable dispatch count; existing ceiling/reservation remains |
| Eval attempts | No existing graph dispatch: read_evaluation only imports results | Add explicit opt-in reservation and dispatch, under the existing graph lock, separate from program execution |
| Human decisions | Revision-bound intervention evidence | Decision instances, not program or Eval resource units |
| Process wall time | Kujo runtime-measurements/v1 wall_ns | Observed process interval, not graph elapsed time; observational only |
| CPU | Runtime cpu_seconds | Observed process CPU delta excluding children, nullable; no inferred CPU from wall |
| RSS | Runtime process_peak_rss_bytes | Observed process-lifetime peak, nullable; never summed as memory allocation |
| Runtime/task counters | Runtime counters; independent snapshot | Observed bounded counters, some inclusive; no timing enforcement |
| Provider input/output tokens | Agents SDK context-ledger/v1 provider_usage with usage_source=provider | Provider-reported; preserve null; do not use SDK budget defaults |
| Estimated tokens | Context ledger component estimated_tokens | Estimated, separate from provider usage; no promotion to reported |
| Monetary cost | RunLedger nullable amounts; SDK tracing may default currency | Unknown here: no scoped source with required currency assurance; no pricing |
| Watchdog projection | runtime_measurements_adapter binds original bytes by SHA256 | Observation transport, no Dispatch authority |
| RunLedger | Receipt/usage/cost reporting | Aggregation, no reservation or admission authority |

## Bounded implementation decision

Use a new opt-in internal resource policy, not new participant wire bytes. Retain
exact source artifacts through existing node-input content addresses and journal
control records. Installed source-bound host callbacks bind each artifact to an
exact consumed program or Eval attempt. A hash proves integrity, not truthful
attribution; trusted installed collection owns that binding. Missing source stays
unknown and may be supplied later. A recorded source cannot silently change.

Eval reservations hold a distinct graph capacity unit. Durable Eval dispatch
consumes it before invoking a source-bound installed evaluator, once. Reply loss
stays consumed/unknown. A separately recorded infrastructure failure permits an
explicit bounded new evaluation of the same immutable inputs; ordinary fail
verdict and missing reply do not. No underlying program/action is repeated.

Plans list explicit dependency-ready active nodes and capacity in both dimensions.
They are informational until exact revalidation and operator authorization under
the existing lock. An atomic reservation event may hold several program/Eval slots;
it neither runs work nor creates a second scheduler. Inactive and unselected paths
hold nothing. Subgraph members count individually; receipts add no execution unit.

Process measurements and reported/estimated usage remain separate observations.
No hard token or wall-time ceilings are claimed: post-hoc provider usage supplies
no safe worst-case pre-admission reservation bound. An optional closed policy can
require complete provider usage for every prior consumed attempt before permitting
new work. Unavailable or estimated-only facts then block, including held work at
final dispatch. Results, measurements, release and terminal publication remain
possible at exhaustion. Recovery folds existing immutable records; it never
refunds consumed dispatch, invents measurements or finalizes a graph.
