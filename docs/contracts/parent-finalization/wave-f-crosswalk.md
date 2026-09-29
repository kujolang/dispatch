# Wave F: minimum composition contract from bounded finalization

This is a design crosswalk, not a new graph engine or runtime protocol.
Dispatch's current DAG and `depends_on` behavior remain in place.

| Existing fact/owner | Minimum future node concept | Boundary |
| --- | --- | --- |
| Dispatch run/step/control attempt | Node execution identity | Logical node and attempt must remain distinct |
| Workflow input/policy anchor | Typed input commitment | Schema plus exact content/provenance references |
| `depends_on` and readiness | Scheduling dependency edge | Does not itself mean owned child completion |
| execution-result/v1 | Execution facts | Original producer status is immutable history |
| Effect plan/set/lifecycle | External effect facts and attempts | Unknown is not pending; consumed never resets |
| Dispatch selection/admission | Mutation authority | One effect; no whole-node replay from reply loss |
| evidence-ref/v1 and retained raw bytes | Artifact/provenance references | Resolver ownership and byte identity explicit |
| Eval result/input evidence IDs | Evaluation facts | Judgment binds exact outputs and evaluator config |
| Workcell preservation/owner observation | Environment facts | Retention is not replay authority |
| Workflow control and operator review | Failure/finalization policy | Policy owns accept/fail/review decisions |
| Immutable parent finalization control event | Node terminal decision | Explicit locked transition; evidence alone cannot finalize |

## Minimum separation

Four small linked surfaces are needed, not one universal payload:

1. **Execution instance:** node identity, attempt, typed committed inputs, existing
   execution-result reference, required effect plan and output references.
2. **Policy:** installed assurance profile/configuration, capabilities and budgets
   already declared by the workflow, evaluation/failure/finalization requirements.
   Capabilities and budgets do not belong in producer assertions.
3. **Evidence:** exact artifact identities, source/subject linkage, environment
   observations, evaluator identity and exact evaluated input set, terminal receipt.
4. **Edges:** readiness dependencies and separately declared completion obligations.
   Treating every outgoing `depends_on` edge as a child-completion requirement can
   deadlock: the dependent cannot start until the parent is terminal. The bounded
   implementation therefore refuses unresolved required work rather than inventing
   a graph ownership relationship.

The next composition proof should connect two existing Dispatch nodes: a bounded
producer finalizes its outputs; a dependent evaluator/consumer receives their exact
references and records its own terminal decision. Define typed input/output and
completion-edge semantics first. Reuse existing admission, journal and DAG rather
than replacing them. Prove stale output substitution and predecessor decision loss
cannot make a dependent ready. This is a Wave F slice with explicit Wave E provenance
requirements, not a remote mesh or distributed scheduler.

No dynamic graph mutation, mixed-profile authority, cross-run consensus, public SDK,
remote trust, machine migration, compensation, exactly-once or universal rollback is
implied. The present finalization API supports one last unresolved parent under one
negotiated run profile; broader parent/descendant composition remains the next slice.
