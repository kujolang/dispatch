# Sourced resources, Eval budgets and reservation planning

Experimental static graph contract on retained trusted local storage. Dispatch owns
resource authority. This extends its existing graph journal, lock, installed host
and retained-host reconciliation; it introduces neither a scheduler nor billing.

## Opt-in and units

The anchored workflow declares `metadata.graph_resources`:

```json
{"schema":"dispatch.graph-resources/v1alpha1","max_eval_attempts":4,"require_provider_usage":false}
```

It also opts into existing graph attempt accounting and static graph policy.
The graph ceiling is 0–8 Eval dispatches. Each evaluation node may declare
`config.max_eval_attempts` as 1 (default) or 2. Configuration is immutable under the
existing anchored definition. Participants cannot change limits or required work.
A program dispatch, Eval dispatch, human decision and group receipt are distinct.
The existing program-attempt ledger and ceiling are reused unchanged.

Eval rows retain their ordinal, unique attempt ID, exact input-binding reference,
reservation, release, consumed dispatch and resolution. Dispatch consumption occurs
before the installed evaluator callback. A crash or missing reply does not refund it.
An exclusive retained worker claim prevents accidental second worker invocation.
The callback receives the exact binding and attempt identity. It must be an installed,
source-bound evaluation-only adapter; it must not rerun the subject program or admit
its external effects. An evaluator process can produce knowledge, not graph authority.

A successful evaluator response is validated against the exact producer subject,
result and artifact digests, and anchored evaluator identity. Its bytes are retained.
A separate node terminal operation applies existing Eval control policy; an Eval
result alone does not finalize the node or graph. Failure verdicts remain judgments,
not infrastructure failures. The sole new retry class is an installed adapter's
conclusive terminated infrastructure failure. Retry is explicit, bounded and retains
the same inputs, old consumption and old response. Missing replies and uncertain
termination remain unknown and cannot use that retry path. There is no Eval backoff,
retry queue, general replay or underlying program rerun.

## Sources and classification

An installed host resolves one retained source per consumed attempt and source kind.
The observation candidate binds subject (program/Eval, node, execution identity), raw
artifact SHA-256, current state, journal and installed authority. Operator publication
revalidates under the existing graph lock and retains the raw bytes as existing
content-addressed artifacts. Repeated observations cannot double count. A recorded
source is immutable; absent sources may be supplied later. Runtime and model facts
must be attributed to distinct process/model invocations by the installed collector;
hashing alone cannot prove source truth or non-overlap. This is trusted-host evidence,
not malicious-source verification.

- Runtime: existing `kujo.runtime-measurements/v1`, observed process wall interval,
  nullable process CPU delta and lifetime peak RSS, and independently sampled counters.
- Model: existing SDK `kujo.context-ledger/v1`. Only `usage_source=provider` supplies
  provider-reported input/output tokens. Missing fields remain null. Fixture or
  unavailable source labels cannot promote numeric fields into reported usage.
- Estimates: component token estimates and their named estimator remain separate.
- Unknown: missing artifact, missing provider fields, CPU/RSS unavailable, and monetary
  cost. Known partial sums explicitly report their unknown attempt coverage.

The report does not sum RSS. Sum of observed process wall intervals is labelled as
such: it is neither graph elapsed time nor CPU. Nested/inclusive runtime counters are
not added as independent durations. Collection may describe a prefix of detached work.
Neither time, tokens nor monetary cost has a hard numeric ceiling in this slice:
post-hoc observations do not provide trustworthy worst-case admission reservations.
No provider pricing, currency default, inferred cost or conversion is introduced.

The optional `require_provider_usage` policy requires complete provider input/output
usage for every previously consumed program/Eval attempt before *new* reservations
or dispatch. Missing, partial or estimated-only usage blocks; zero must be an actual
reported value. This deliberately strict policy is unsuitable for adapters unable to
supply that evidence. It does not block result/measurement recording, release, Eval
resolution or terminal publication for already-consumed work.

## Operator API and plans

The installed controller calls `resource_operation(root, run_id, request, options)`.
`operation=report` returns `dispatch.resource-report/v1alpha1`, an informational,
revision/journal-bound view with program and Eval ledgers, source classes, exact
artifact references, per-attempt readings and known sums with unknown coverage.
A report or plan grants no authority.

`operation=assess` with `action=reserve,nodes=[...]` proposes a bounded set of up to
eight explicit active, dependency-ready program/Eval nodes. It checks both dimensions
as a set. It does not choose nodes, activate branches or allocate inactive paths.
`operation=apply` repeats the request with the exact candidate and installed-authorized
actor. Graph lock, relevant child locks, source revalidation and existing journal
publication precede a single reservation transition. The plan never executes work.
Program nodes still use ordinary independent admission and effect policy.

Eval `release`, `dispatch` and `resolve` use separate assess/apply requests with
`node_id`. Release requires the current row never to have dispatched. Dispatch
consumes before the callback, even if work subsequently fails. Resolve reads exact
retained response evidence through the installed adapter after a lost controller
reply; it never invokes evaluation. `observe` binds a consumed `subject` and
`source_kind` (`runtime` or `model`). Missing source yields an explicit unknown error,
never a fabricated zero artifact. All applies record operator attribution.

The graph outcome binds exact Eval/resource history as a digest, in addition to the
existing program ledger. Held capacity and unresolved consumed evaluations prevent
sealing. Exhaustion blocks new work, not recording or finalizing consumed work.
Optional work, inactive branches and subgraph receipts cannot erase consumption.

## Authority table

| Step | Information producer | Validator / authority | Durable prerequisite |
| --- | --- | --- | --- |
| Source measurement | Runtime / SDK / installed adapter | Dispatch validates identity, bounds and bytes | Exact consumed subject and source artifact |
| Reservation plan | Controller assessment | Informational only | Current anchored graph and journal |
| Reservation commit | Authorized local operator | Dispatch graph and child locks | Exact revalidated plan, immutable record |
| Eval dispatch | Installed controller | Dispatch lock / consumed row | Held reservation, current inputs and authority |
| Eval work | Installed evaluation-only worker | One-use retained claim | Exact consumed dispatch |
| Eval result | Eval | Dispatch exact subject/input/evaluator validation | Retained response and result |
| Eval terminal | Existing control policy | Dispatch | Consumed completed Eval result |
| Graph terminal | Existing graph policy | Dispatch | Required terminal facts and resolved reservations |
| Recovery | Operator | Existing retained-host reconciliation | Exact immutable lineage, never invented facts |
| Reporting | Watchdog / RunLedger may consume references | No budget authority | No new external integration required |

## Boundaries

No hard runtime/token/currency enforcement, inferred prices, automatic uncertain
retry, mutable ceiling extension, general quota service, dynamic topology, distributed
reservations, remote trust, machine-loss recovery, mixed profiles, compensation,
exactly-once, universal rollback, stable SDK or new Kujo syntax. Host-local source
references and control events suffice; no participant wire format or historical
portable vectors change. Late observation after a sealed graph requires an external
historical report; graph terminal authority is not silently rewritten.

## Installed host surface

The source-bound `node_host` additionally supplies:

- `evaluation_identity(node_id)`: live evaluator name/version/configuration digest;
  it must equal the anchored node contract before reservation and dispatch.
- `start_evaluation(node_id, binding, attempt_id)`: one bounded local invocation.
  A worker reloads the graph and calls `claim_evaluation` once before evaluating.
- `read_evaluation_attempt(node_id, binding, attempt_id)`: read-only exact response
  recovery; it must never invoke the evaluator.
- `read_resource_source(subject, source_kind)`: `{subject, source_kind, raw}` for the
  exact consumed invocation, or null when unavailable. Provider logic stays outside
  Dispatch; source labels are interpreted by the closed artifact adapters.

An Eval response binds `attempt_id` and `binding_ref`. `status=completed` carries
`evaluation_raw`; `status=infrastructure_failed` carries a bounded reason backed by
conclusive local termination. Timeouts, cancellation or truncated protocol replies
must remain unknown. A completed response without its retained worker claim rejects
before publication. Runtime/model source callbacks may not substitute a different
invocation or aggregate overlapping measurements as disjoint work.

These are installed trusted-host hooks, not public participant APIs or permission
to execute outside Dispatch. The fixture runs a separate restricted-purpose evaluator
process using the real Eval result contract and existing runtime collector. It does
not certify arbitrary effect-producing Eval command suites as safely retryable.

The Eval ceiling covers first-class Dispatch-managed evaluator invocations in this
opt-in graph. Historical imported evaluation receipts and parent evaluation evidence
are not retroactively counted as dispatched processes. Their existing authority
contracts remain unchanged; this is not a claim to meter all external Eval activity.
