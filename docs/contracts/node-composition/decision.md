# Wave F static composition: pre-implementation decision

Baseline: Dispatch `09d2d0d06889545b91d2d6fbbade582a81de6cf8`, Kujo
`515cdda7133cb7e898397434ac374d87e9fb1b18`. Baseline validation is running before
source changes. This document records design, not a completed proof.

## Existing machinery and gap

| Existing Dispatch concept | Wave F role | Gap |
| --- | --- | --- |
| Immutable workflow definition / policy anchor | Static graph definition | Explicit node execution references and typed data edges |
| Step identity and `depends_on` | Scheduling node and readiness edges | Historical completed/skipped is not finalized producer authority |
| Runner dependency scan, serial execution, run lock | Only graph scheduler | Installed run-backed node adapter must pause for independent finalization |
| Protected run with its own step/attempt | Node execution instance | Exact durable input binding before first admission |
| Last-unresolved-parent finalization | Node terminal authority | Cannot be broadened implicitly to pending descendants in the same run |
| Result output + evidence-ref/v1 | Named artifact identity | Validate one JSON family with explicit schema identity |
| Existing control journal and retained recovery | Binding and terminal receipts | Exact additive transitions, no inferred bindings |
| Effect lifecycle and permanent claims | Independent node mutation authority | Graph dependency must never become an effect ticket |
| Workflow budgets and tool/agent policy | Node-owned policy | No inheritance across artifact edges |

The current `depends_on` means readiness after completed/skipped steps. The control
barrier blocks transitive dependents during review; it does not declare child
ownership. Parent finalization requires all other required steps resolved. Treating
A's downstream B as A's completion obligation would deadlock A → B.

## Bounded representation

Compose **run-backed steps** in the existing DAG. Each node is a separate protected
Dispatch execution instance with its own single-parent workflow, negotiated authority,
Workcell, effects, evaluation and terminal receipt. The outer workflow owns static
scheduling and references those exact node runs. This preserves the existing parent
contract and lifecycle bytes instead of converting one run's single-parent ledger
into a new multiaction scheduler.

The existing runner will invoke an explicitly installed node adapter only after its
ordinary dependency check. The adapter independently verifies finalized predecessor
receipts; mutable step status or participant output cannot satisfy the predicate.
A node waiting for review/finalization pauses progression. An explicit subsequent
runner invocation observes durable node truth and proceeds. Finalizing a node never
calls the graph runner.

Scheduling edges remain `depends_on`. Data edges separately name producer step,
output, expected JSON type/schema and consumer input name. This slice accepts only
bounded static edges to scheduling ancestors. Completion-only edges carry no data.
A join is a bounded list of exact inputs, not dynamic graph construction.

Producer output identity reuses original execution-result output references and
parent-finalization output receipts. The JSON schema is declared by the anchored
node/graph contract; metadata, raw content digest, subject, original result and exact
terminal decision remain separate identities. Installed bounded resolvers supply
bytes; paths and URLs in producer evidence install no resolver.

Before execution, the consumer's own lock protects a durable input-binding event
and retained bytes. A separate one-use initial admission uses the existing locked
runner admission path and permanent exclusive-claim pattern. Later effect admissions
still use existing Wave C machinery. No binding can be replaced or unconsumed.
Current input validation remains a required installed authority predicate, including
at effect admission and finalization. Missing or changed bytes fail closed.

Mechanical recovery may reconstruct only an actually recorded exact binding or
terminal observation; artifacts without that event are informational orphans.
Admission claims survive every reconstruction, including admission-before-execution
crashes. A missing result never permits rerunning the initial node attempt.

## Provenance and ownership

Evidence-ref/v1 already carries subject, content integrity and optional artifact
schema. Eval already identifies exact input evidence and evaluator configuration.
Scent manifests package source/context and redaction metadata; RAG citations retain
source/chunk identities and ranking observations. Those are useful source artifacts,
not terminal or input admission authority. Keep this proof to inspectable JSON
artifacts; neither RAG nor prompts/model reasoning are prerequisites.

RunLedger/Watchdog may observe existing receipts; no new audit subsystem is needed.
Agents SDK has independent uncommitted maintenance work and remains untouched. An
agent producer is optional, not a reason to expand this tranche's dependencies.

## Compatibility and limits

Opt-in required controller features reject old readers. Existing workflow behavior,
parent receipts, participant wire, alpha/beta vectors and one profile per run remain
unchanged. New portable input commitments receive independent four-language vectors.
Only static trusted-host composition is claimed. No dynamic scheduler, multi-host
execution, remote trust, machine migration, mixed profiles, compensation, exactly-once,
universal rollback, stable SDK or language syntax change is introduced.
