# Heterogeneous terminals and graph outcome policy

Experimental, static, retained trusted-host Dispatch composition. Opt in with both
`node_composition: dispatch.node-composition/v1alpha1` and
`graph_outcome: dispatch.graph-outcome/v1alpha1` in anchored workflow metadata.
At most eight serial nodes; no topology rewrites or mixed profiles within a run.
The existing runner remains the only scheduler. These APIs are installed local
controller APIs, not a stable/public participant SDK or a transport protocol.

## Node kind and terminal contracts

`config.kind` is descriptive. Only the anchored `config.terminal_contract` chooses
one of three closed built-in validators. Missing terminal_contract retains the
historical program contract; merely labeling a step human/agent cannot change it.

| Terminal contract | Required facts | Explicit terminal authority |
| --- | --- | --- |
| parent-finalization/v1alpha1 | Independent protected run, original result, resolved effects, required outputs, Eval/preservation/review as configured | Existing parent-finalization receipt; graph separately observes it |
| evaluation-result/v1 | One exact typed producer output, original result/subject, evaluator name/version/configuration hash, completed evaluation-result/v1 and existing Dispatch policy mapping | Separate graph-local terminal decision under graph lock |
| intervention-decision/v2 | Exact graph/node/decision instance, immutable upstream input binding, durable v2 review request, current revision, authorized actor and approve_override/abort/cancel | Separate graph-local terminal decision under graph lock |

Eval and human nodes have no synthetic execution-result, process, Workcell or effect.
Eval's pass/fail judgment does not grant scheduling or effect authority. Dispatch's
existing `resolve_control_decision` maps it to continue/fail/cancel; review/retry
remain nonterminal in this bounded slice. Human abort is retained as **rejected**,
not an execution failure; graph policy separately maps required rejection to failed.

Graph-local steps use `config.inputs`; executable steps retain `node_execution`.
Inputs name finalized typed program outputs from scheduling ancestors. Evaluator and
human terminals can be scheduling prerequisites without publishing data artifacts.
An explicit review-open operation constructs the existing intervention-request/v2.
Stale requests can be explicitly refreshed against the same immutable inputs. A
successful terminal decision cannot be refreshed, replaced or contradicted. The
installed local authorization callback checks the authenticated actor identity; a
chat assertion or self-declared actor field does not suffice. No remote authentication
or Leash transport certification is claimed, and no messages are sent by these APIs.

## Scheduling, data and outcome membership

- `depends_on` requires verified successful predecessor terminals before admission.
- Typed `inputs` bind exact producer output versions, independently of direct edges.
- Anchored `optional` determines contribution to graph outcome, not scheduling trust.

A cancelled or failed optional predecessor cannot satisfy a consumer's successful
dependency. A required human can gate graph completion without gating or supplying
data to an independent consumer. The immutable workflow/policy anchor rejects changed
requirements, new descendants, edge changes or required→optional downgrades.

Historical input-binding/v1alpha1 bytes are unchanged. Opted graphs use additive
input-binding/v1alpha2 whose predecessor identities name heterogeneous terminals.
The typed program data portion retains its old exact identity contract. Required
controller features reject old readers, including consumers of the additive binding.

## Graph outcome policy

The one supported policy is `required-success/no-unfinished-admission/v1alpha1`.
It is fixed by graph_outcome version in the immutable definition.

| Durable assessment | Candidate |
| --- | --- |
| Every required terminal completed; optional unresolved work never dispatched | completed |
| Required failed/rejected terminal; no unfinished dispatched/admitted program | failed |
| Required cancelled terminal, no required failure and no unfinished program | cancelled |
| Pending review, unresolved evaluation, missing required terminal, consumed unfinished work, or an outstanding dispatch | blocked (nonterminal assessment) |
| Missing/corrupt evidence, changed output or unavailable authority | Rejected assessment with exact reason; no terminal permission |

Optional terminal failure remains failure in history but does not alone fail the
graph. Optional never-dispatched program work may be explicitly cancelled under
graph-then-child locks and operator authority. This records non-execution cancellation;
it never masquerades as successful execution or unconsumes an attempt. A graph may
leave optional never-dispatched work unperformed; its exact absence is included in
the decision. Once dispatched, optionality cannot waive its unfinished lifecycle.

A program execution failure whose effects/terminal facts remain unresolved is blocked,
not fabricated terminal failure. Successful upstream node truth is never rewritten by
a downstream failure or graph failure. The policy does not implicitly cancel children.

## Operator flow and explanation

The installed controller calls `graph_terminal_operation(root, run_id, request, options)`:

1. Existing graph runner binds exact local-node inputs; it pauses for independent facts.
2. `review-open` explicitly publishes/refreshed human review against the current revision.
3. `node-assess` reads Eval or validates the submitted human decision; returns a candidate.
4. `node-finalize` revalidates that exact candidate under the existing graph run lock.
5. A separate graph runner invocation may admit downstream program work.
6. `graph-assess` returns an informational candidate/explanation.
7. `graph-finalize` requires the exact candidate and an installed-authorized operator actor.

`optional-cancel` is a separate operator operation, not a scheduler fallback.
`graph_boundary` is an installed callback, never participant-configured executable code.
Application does not run nodes, mutate policy, extend preservation or grant effects.

The bounded explanation schema is `dispatch.graph-outcome-candidate/v1alpha1`:
graph identity/definition digest, source state digest/revision/journal, authority
revision, policy identity, outcome, and one entry per declared node with required
membership, terminal identity or null, and reason. It references facts rather than
copying outputs or hidden reasoning. A candidate hash commits the entire explanation.
Blocked is not added to the run-status vocabulary; the run stays paused. The runner's
all-completed scan likewise leaves opted graphs paused until graph terminal authority
exists. Historical non-opted DAG behavior is unchanged.

## Durability and authority

A common node terminal identity binds node, contract, variant-specific subject,
facts_ref, outcome, finalized revision and authority_ref. Program facts_ref identifies
the existing parent receipt. Eval/human facts_ref identifies the graph-local receipt,
which binds exact inputs and original judgment/decision bytes. Subject shapes stay
variant-specific; decision_instance is not an execution attempt.

The common fields describe **evidence of terminal authority**, not a universal
execution-result. Workcell, effects, Eval, process exit, model usage, output artifacts
and human actor are not universal requirements. Closed variants are sufficient for
this proof; arbitrary participant-supplied terminal validators are not supported.

| Producer | Fact owner | Authority validator / durable requirement |
| --- | --- | --- |
| Program/tool/agent | Domain output and execution knowledge | Dispatch parent authority and exact receipt |
| Workcell | Environment/preservation facts | Existing preservation policy, independent of replay |
| Eval | Evaluation judgment | Installed resolver, exact subject/config/inputs, Dispatch policy |
| Human/Leash adapter | Authenticated decision evidence | Existing v2 validation plus installed authorization and immutable request |
| Dispatch | Definition, dependency predicates, admission, outcome policy | Anchored configuration, run lock, journal and explicit terminal receipt |
| RunLedger/Scent/RAG | Receipts or context/source provenance | Informational; no terminal, graph or admission authority |

Finalization reloads state and current authority under the run lock, retains exact raw
facts, then revalidates before appending the existing immutable control event. State
publishes last. Actor evidence is retained by reference. Another controller sees a
stale/terminal run rather than a second transition. Child terminal receipts are
immutable; outstanding child dispatch/admission blocks graph terminal policy. This
avoids finalizing over an initial admission racing in a separate child process.

## Wave E overlap and remaining boundaries

The inspectable chain is producer original result/output → exact typed input → Eval
judgment or human decision → terminal receipt → consumer binding → own effect/result
→ graph outcome. Existing Scent manifests and RAG source/chunk references can be
upstream artifacts; this tranche does not claim a standardized source/context chain
or require a RAG rewrite. No prompts or chain-of-thought are stored.

The next substantial Wave F slice is graph failure strategy and bounded conditional
branches/subgraphs, with explicit terminal and budget policy. Static heterogeneous
terminals do not justify agent-owned topology or arbitrary dynamic scheduling.
Deferred: distributed execution, remote trust, machine-loss recovery, mixed profiles,
compensation, exactly-once, rollback, public/stable SDK, new syntax and legacy selection
migration. No universal interoperability or API freeze is claimed.
