# Static graph policy completion audit

The [source crosswalk](../contracts/static-graph-policy/decision.md),
[policy contract](../contracts/static-graph-policy/protocol.md) and
[crash/authority matrix](../contracts/static-graph-policy/crash-matrix.md) define this
experimental tranche. Validation commands, actual counts, corrections, environment,
source pins and hashes belong to `docs/evidence/static-graph-policy/validation.json`.

## Requirement-to-proof map

| Objective parts | Implemented boundary and authoritative evidence |
| --- | --- |
| 1: source audit | Pre-implementation decision crosswalk at starting main pins; existing control/runner/terminal/recovery code inspected |
| 2: explicit strategy | `failure_strategy`: fail, block, optional continuation, declared route, required authorized review; subgraph integration exercises all five |
| 3–4: static closed branches | `validate_static_policy`, closed terminal/Eval/human predicates; contracts reject expressions, duplicate memberships and unsupported retry |
| 5: Eval branch | Real A/E/B/R/E2/C integration, exact subject/result checks, distinct selected and inactive paths |
| 6: human branch | Real A/H/B/S approve and deny paths; stale/wrong-subject decisions rejected by existing terminal contract |
| 7: durable activation | `graph_branch_activated` source-bound event under existing lock; assessment alone never enables dispatch |
| 8–9: inactivity vs optionality | Inactive nodes retain pending state and `not_selected` explanation; optional fan-out failure retains unsuccessful terminal history |
| 10: active outcome | Required selected and unconditional nodes contribute; inactive nodes do not become successful; conditional join/outcome tests |
| 11: remediation | Failed E selects independent R; E2 evaluates R's exact output; original A attempt remains unchanged |
| 12–13: retry boundary | Same-node retry deferred explicitly; graph retry ceiling stays one; lost-effect reply test rejects replay and uses independent verification |
| 14–16: subgraph | Static one-level group with entries, membership, policy, separate receipt; parent binds receipt and exact output |
| 17–18: budget | Immutable dispatch-reservation ceiling; exhaustion blocks new work but permits consumed work resolution; mutable limit changes reject |
| 19: conditional join | Both Eval branches converge on C; only selected predecessor contributes; no fake success for other path |
| 20: fan-out | A → B/C/D with optional C rejected; required siblings succeed; C and A histories retained |
| 21–22: failure vs block | Explicit fail/block/review cases, ordinary uncertainty/admission gates; missing evidence never becomes permission |
| 23–24: stable choice | Activation binds exact terminal revision and source fact; stale candidate, changed topology and alternate later Eval cannot switch admitted path |
| 25: crash/recovery | Before/after activation, claim consumed before execution, real SQLite mutation/reply loss, immutable index gaps, missing group event and group reply loss |
| 26: contention | Two fresh controller processes for activation and group finalization; one event, durable loser rejection, actual run locks |
| 27: host topology | Anchored workflow and controller feature; no mutation, budget raise, required downgrade, participant validator or topology callback |
| 28–29: contract/explanation | Versioned bounded static policy and schema; additive graph outcome explanation with receipt refs, strategies, active paths and budget facts |
| 30: provenance | Existing typed output/result/content refs → terminal source → activation → exact bound consumer → own effect; group receipt replaces copied internal predecessor list |
| 31: no DSL | Closed predicates and fields, no script/expression evaluator, recursion or second scheduler |
| 32: four shapes | Real Eval branch, human branch, conditional join and program/Eval subgraph all included; no shape omitted |
| 33: gates | Fresh baseline focused checks, focused new suites, full canonical Dispatch gate, affected Kujo format/contracts/locked build and four-language vectors |
| 34: negatives | Stale source/candidate/decision, wrong subject, inactive admission, immutable choice, required failure, optional failure, uncertain retry, fixed budget, missing group event, no inferred activation and contention |
| 35: bounded claim | Static trusted-host graph policy only; no dynamic/universal/distributed execution claim |

## Ownership and review conclusions

Program/agent/tool output remains domain knowledge. Workcell preserves the environment,
Eval supplies judgments and the installed review authorizer validates human decisions.
Dispatch owns static definition, dependency/admission, policy-event publication and
terminal decisions. Retained recovery owns mechanical reconstruction under operator
control. RunLedger/Scent/RAG need no code changes: current externally inspectable
content/result/evidence identities suffice for this slice. No hidden reasoning is stored.

Program consumption, selected effects and parent finalization retain their existing
contracts. The new dispatcher budget counts reservations, not successes, and cannot
refund a lost acknowledgement. Group/branch events do not execute children. Inactive
paths have no execution authority and cannot acquire it through a participant claim.

## Deliberate remaining boundaries

Same-node retries require a new attempt binding/retirement contract. This tranche uses
separate predeclared repair nodes. Groups are disjoint, unconditional and one level;
conditional/nested groups are rejected. Branch sources are unconditional. The existing
eight-node serial bound remains. Model/token/cost and wall-time budgets are not inferred
from incomplete usage; only exact durable program-dispatch reservations are budgeted.

No distributed scheduler, dynamic/agent-owned topology, remote trust, machine-loss
recovery, mixed profiles, compensation, exactly-once, universal rollback, stable/public
SDK or new Kujo syntax. Next major phase: explicit graph attempt/budget accounting and
composition of bounded groups for concrete static use cases. Wave E typed context
lineage remains a separate candidate when a retrieval-backed workflow needs it.
