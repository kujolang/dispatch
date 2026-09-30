# Heterogeneous node and graph-outcome audit

The pre-implementation [crosswalk](../contracts/heterogeneous-nodes/decision.md)
records the source-owned facts before the new contract. The [protocol](../contracts/heterogeneous-nodes/protocol.md)
and [crash matrix](../contracts/heterogeneous-nodes/crash-matrix.md) define the bounded
result. Exact source pins, commands, counts, warnings, skips and development failures
are published in [the validation manifest](../evidence/heterogeneous-nodes/validation.json).

## What this proof changes

Three different terminal paths now compose in the existing static DAG: independently
finalized program runs, exact Eval judgments and authorized v2 human decisions.
Program lifecycle contracts are reused unchanged. Eval/human nodes do not acquire
processes, Workcells, external effects or synthetic execution-results. A consumer
still owns its initial admission, effects, evaluation and finalization.

The common terminal identity is deliberately small: configured contract, node and
variant-specific subject/instance, exact facts, outcome, authority and finalized
revision. It is not a universal execution schema. Graph assessment binds exact node
identities and immutable required/optional membership. Graph finalization is a separate
operator-authorized, revision-bound transition under the existing run lock.

## TOCTOU and recovery review

| Boundary | Check |
| --- | --- |
| Facts → local input binding | Existing run lock, actual successful predecessor terminals, typed content/result identity, anchored graph definition |
| Eval → node candidate | Exact original producer subject/result/output digest, pinned evaluator config, existing policy mapping |
| Human → node candidate | Durable request, exact subject/input binding, current revision and installed actor authorization |
| Candidate → node terminal | Reload/revalidate under lock; retain evidence; repeat live checks before immutable event |
| Optional cancellation | Graph-then-child locks, no dispatch, no claim/admission, pending child, explicit authorized actor |
| Graph assessment → graph terminal | Exact source state/journal/definition, required outcomes, live artifacts, current authority; no unfinished dispatch or admission |
| Journal gap → repaired state | Existing source-bound pure projection and operator repair; no invented decisions or replay |
| Competing finalizers | Existing graph run lock and current-source comparison; one durable event |

A source review identified that optional work may have a durable dispatch without
a claim yet. It is unsafe to finalize over that gap because a fresh child controller
may be about to consume its attempt. The policy therefore blocks on outstanding
dispatches as well as consumed work. A real process crash at that boundary proves it.

The initial optional-cancellation test exposed a readiness defect: observing a later
terminal moved the saved cursor past an earlier pending node. The opted graph now
scans its static DAG from the beginning using the same runner/dependency machinery.
This preserves independent/out-of-order terminal decisions without a second scheduler.
The original failed test logs are retained rather than omitted.

Development also caught a fixture source-manifest size limit and an overlapping
variable name. The fixture now stays within the existing 16-file verifier limit;
unchanged related components remain pinned by repository commit. No safety limit was
relaxed. Evidence captures all development corrections and final results.

The first final canonical attempt stopped at offline Python package isolation because
the private worktree lacked the baseline checkout’s ignored wheelhouse. The failure
was retained, the existing pinned wheels copied, and hash-enforced isolation passed.
The complete gate was then rerun on the same frozen source commit.

## Limits

Only static serial trusted-host graphs up to eight nodes are proved. Optional omission
is allowed only for never-dispatched work; optional cancellation is explicit and
never equals success. Required unsuccessful nodes can produce a failed/cancelled
graph candidate, but unresolved consumed program work blocks terminal publication.
Eval policy requiring review stays nonterminal. Review refresh is explicit and cannot
replace a terminal decision. Historical facts remain intact after failure.

This is a filesystem-backed integration proof; the existing SQLite state-store gate
remains compatibility coverage. No new standalone related-repository gate is claimed:
Workcell, Eval, Agents SDK, Leash, Scent, RAG and RunLedger remain unmodified. Their
existing contracts are read or used through Dispatch's real integration path.

Next substantial phase: graph failure strategy and bounded conditional branches or
subgraphs with explicit outcome/budget requirements. No arbitrary dynamic topology,
distributed execution, remote trust, machine-loss recovery, mixed profiles,
compensation, exactly-once, rollback, public/stable SDK or new language syntax.
