# Wave F heterogeneous terminals: pre-implementation crosswalk

Baseline Dispatch `ccfe22810cdfad21b2c5aa101bb1961adb283bb1`; Kujo
`914131732baa8b8f72c3449deb807aa4caa68ede`. Both match current origin/main.
This decision follows source inspection, not prior completion summaries. Baseline
validation is running in the unchanged primary checkout; implementation is isolated.

| Concern | Existing fact / owner | Gap for this tranche |
| --- | --- | --- |
| Execution completion | execution-result/v1; Workcell/tool/agent producer | Process success is not terminal authority |
| Effect completion | selected-effect ledger, independent sink evidence, one-use claims | None; retain unchanged |
| Evaluation completion | Eval `build_evaluation_result`, evaluation-result/v1 subject/config/input_evidence_ids | A first-class evaluator terminal without fictitious execution/effects |
| Human decision | intervention-request/v2, intervention-decision/v2; Dispatch validator plus installed authorization | Graph-local reviewed subject/input binding, not a fabricated parent result |
| Output publication | evidence-ref/v1, original result output, parent terminal content commitment | Reuse typed JSON and immutable consumer identity |
| Executable node terminal authority | Dispatch parent-finalization receipt in independent protected run | Preserve this variant unchanged |
| Scheduling | Existing runner depends_on/readiness and graph lock | Accept verified successful heterogeneous predecessor terminals |
| Graph outcome | Existing all-completed/skipped derived status | Separate explicit source-bound terminal decision over anchored requirements |

Agents SDK results/events and controlled Ability handoffs supply knowledge and
correlation, not Dispatch control. Leash routes v2 review decisions with boundary
and revision identity; its device/transport approval is not a substitute for the
installed Dispatch authorization predicate. No related repository needs modification.
Eval judgments already distinguish pass/fail/warn/indeterminate and completed/error/
blocked. Dispatch `resolve_control_decision` owns disposition: continue, fail,
cancel, require_intervention or retry. Reuse that mapping, not a graph-specific Eval
failure override. RunLedger may report receipts but cannot decide outcomes.

## Bounded design

Opt in through anchored graph-outcome metadata and an additive required controller
feature. Keep the existing static DAG and run-backed program representation. Add
closed terminal-contract variants for graph-local evaluation and human review;
node kind is descriptive only. Neither variant needs a process, Workcell, external
effect or fake execution-result. Data inputs retain exact finalized program output
identities; scheduling prerequisites accept successful terminals of any supported
variant. A new additive input binding version carries heterogeneous predecessor
identities without reinterpreting previous alpha bytes.

Before decision, graph-local nodes bind their exact upstream inputs and predecessor
receipts. Eval is read through a pinned installed resolver and checked against the
exact producer subject, result/content refs and evaluator identity. Human review
uses existing v2 request construction/decision validation, plus an installed actor
authorization predicate and exact graph/node/input subject. Stale requests may be
explicitly refreshed; recorded terminal decisions cannot be replaced. Pending human
review does not fabricate a run-level process boundary.

A graph assessment explains terminal identities, unmet prerequisites, policy outcome
and optional exclusions. It is informational. Only locked final revalidation and an
explicit authorized operator operation append graph terminal authority. All terminal
facts without that event leave the graph nonterminal. Completed/failed/cancelled
reuse existing run outcomes; blocked is an assessment condition, not a new run enum.
Required unsuccessful terminals make an unsuccessful candidate under the anchored
policy. Optional failure does not itself fail the graph, but a consumer that requires
that optional node's success stays blocked. No graph terminal decision may strand a
consumed unfinished executable attempt. Optional never-admitted work can be explicitly
cancelled, preserving history; required work cannot be downgraded after creation.

Pure source-bound projections extend the existing journal/recovery path. No repair
invents human decisions, evaluations, edges or graph completion. Permanent claims
remain consumed. Finalizing a graph never executes or cancels a child implicitly.

## Limits and next evidence

Trusted retained host; static serial topology, at most eight nodes; one profile per
run. Closed variants rather than participant-installed arbitrary terminal validators.
New portable identities get additive four-language vectors. Historical parent/result/
participant contracts and vectors stay unchanged. No dynamic scheduling, remote trust,
machine migration, compensation, exactly-once, rollback, SDK stabilization or syntax.
After the proof, choose graph policy expansion or typed provenance from actual gaps.
