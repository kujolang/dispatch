# Bounded run-backed node composition

This experimental contract opts an existing protected Dispatch workflow into
`metadata.node_composition = dispatch.node-composition/v1alpha1`. It is a static,
trusted retained-host composition adapter inside the existing DAG runner. It is
not a participant protocol or a second scheduler.

## Definition and ownership

A graph contains one to eight required serial tool steps. Each step's anchored
`config.node_execution` has schema `dispatch.run-backed-node/v1alpha1`, an exact
`run_id`, `step_id`, `inputs`, and `outputs`. Its independently negotiated child
run opts into `metadata.node_input_required = dispatch.node-input/v1alpha1`.
The child has one parent action and requires the existing parent-finalization
policy and control contract. Existing controlled execution limits that action to
one tool attempt; ordinary retry configuration cannot silently repeat it.
Old readers reject additive required features. Historical workflows opt into
neither feature and retain their previous behavior and bytes.

| Concern | Existing owner / representation | Composition use |
| --- | --- | --- |
| Definition | Anchored workflow and step configuration | Static node run and output declarations |
| Scheduling | Existing `depends_on`, readiness scan, barriers, run lock | Predecessors must additionally have verified successful terminal receipts |
| Data | Separate `node_execution.inputs` | Named output from a scheduling ancestor; direct dependency is not required |
| Attempt | Child run, single parent step, attempt `1` | Independent from graph and every producer |
| Capabilities | Child installed host and ordinary tool policy | Never copied from producer metadata or edge |
| Effects | Existing selected-effect lifecycle | Independent admission; graph cannot issue an effect ticket |
| Evaluation | Existing evaluation-result/v1 and pinned evaluator | Exact original result/output inputs |
| Finalization | Existing parent finalization | Successful receipt required to satisfy a node dependency |
| Graph completion | Existing required-step completion | All declared required nodes have durable successful terminal observations |
| Budgets | Existing run budget structures | Graph charges a completed node once; child retains its own execution budget |

`depends_on` establishes ordering, not an output name. Data entries specify
`name`, `source_node`, `source_output`, and `type_id`. A completion-only edge has
no input entry. A bounded join lists both producers and their separately named
inputs. Missing, cancelled, failed, uncertain, or review-pending producers cannot
satisfy a successful terminal dependency. There is no graph-specific override
for Eval failure or a partially completed effect set.

## Exact typed output

The bounded family is JSON with a declared JSON schema whose `$id` equals
`type_id`. The proof uses `kujo.example/node-summary/v1`. The existing original
execution-result/v1 `output` names evidence references; the existing terminal
receipt commits to output metadata and content. No new execution-result version
or globally mandatory artifact type is introduced.

The installed resolver supplies bounded bytes. Dispatch validates:

- original producer run, step, attempt and execution result;
- actual successful parent terminal record and its resulting revision;
- named output in that terminal record;
- evidence-ref/v1 subject, JSON media type and SHA-256 integrity;
- exact schema identity and JSON schema validation;
- metadata and content digests against the terminal commitment.

A URI in metadata does not install a resolver. A participant cannot authoritatively
add a graph edge, satisfy a dependency, bind consumer input, or finalize a node.
Output existence, a successful process exit, an effect observation, or an Eval
claim alone is insufficient.

## Binding and independent admission

`assess_node_inputs` returns informational data. `bind_node_inputs` acquires the
existing graph lock, then the child's existing run lock, reloads and revalidates,
and persists a `node_inputs_bound` control event before publication of child state.
Raw evidence, result, finalization and content bytes are retained by content digest
under `node-input/`. The control record contains identity, never arbitrary payload.

`dispatch.node-input-binding/v1alpha1` binds graph run/definition, node identity,
consumer subject, scheduling predecessor terminal identities, named typed input
identities, and retained artifact references. Each input binds producer subject,
original result, finalization digest/revision, output name/type/schema, evidence
metadata and content digest. `node_reference` uses existing portable JSON v1.
A consumer binding has no rebind or replacement operation in this tranche.

The existing runner records `node_start_requested` under the graph lock. The
installed child launcher starts a fresh controller. `run_bound_node` uses the
existing locked runner admission callback, verifies the exact graph dispatch and
input bindings, exclusively writes and syncs a permanent claim, and records
`node_execution_admitted`. Only that invocation receives the private execution
predicate. Ordinary runner calls cannot turn a persisted binding into a new ticket.
Subsequent effects use their own ordinary selected-effect admission.

A claim remains consumed if the process dies before the action. Neither claim nor
admission proves an effect occurred. There is no implicit retry, reclaim, or input
rebinding. A changed artifact, stale installed authority, missing producer receipt,
or incompatible graph dispatch rejects continuation. Execution reads the retained
exact bytes; it does not race a mutable producer path when consuming its input.

Node finalization never invokes the graph runner. A separately requested graph
run observes the terminal record, retains its exact artifacts, journals
`node_terminal_observed`, and lets normal readiness scanning proceed. Consumer
failure does not mutate producer history.

## Provenance and recovery

The retained chain is consumer input → output metadata/content → producer subject
→ original execution result → exact finalization and source artifact. A new
producer version cannot substitute for this chain. Historical input bytes remain
inspectable even if the live source is unavailable; current admission may still
fail closed because live authority is unavailable.

The existing retained recovery inventory includes `node-input/`, exact control
records, permanent claims and graph terminal observations. Mechanical replay of
these control events reconstructs only an exact recorded predecessor transition.
It never invents edges, bindings, output facts or terminal decisions. An unreferenced
raw artifact remains an orphan for review. A claim lacking its admission event
remains consumed and unresolved. A running interrupted action is not reset.
Recovery application remains an explicit operator action and never starts a node.

Lock order is graph then child. Child validation reads graph authority without
acquiring the graph lock, avoiding inversion. It requires the durable start request
and exact predecessor observations. The graph definition is immutable. Final input
checks occur under the child lock immediately before execution and at ordinary
subsequent admission/finalization boundaries. Retained content is hash-checked when
read, so a change after a live-source check cannot substitute different input bytes.
This relies on the existing trusted local host, installed resolver and filesystem
assumptions; it does not claim hostile-storage or arbitrary malicious-host safety.

## Minimum node contract and next phase

The reusable concerns are identity, definition, exact input/output provenance,
scheduling prerequisites, attempt, effects, evaluation and terminal authority.
They remain separate existing contracts. A Kujo program, agent or tool can produce
this bounded JSON family through an installed adapter. An evaluator or human
approval may eventually satisfy another kind of terminal predicate, but neither
should be forced to impersonate execution-result/v1. Heterogeneous terminal
contracts and graph-level failure/terminal policy are the next Wave F design slice.

Scent manifests and RAG source/chunk citations can be upstream artifacts in this
chain; they do not become admission authority. No hidden reasoning or prompts are
recorded here. Agents SDK and RAG producers are optional future examples, not
mandatory dependencies. Model usage, wall time, retries and effect limits remain
node-owned budget concerns; this work adds no billing subsystem.

Out of scope: dynamic graph rewriting, parallel run-backed execution, heterogeneous
node implementation, automatic consumer rebinding, universal graph finalization,
distributed workers, remote trust, machine-loss recovery, mixed profiles within a
run, compensation, exactly-once, universal rollback, public/stable SDK and new Kujo
syntax. Legacy selected-state migration remains unsupported.
