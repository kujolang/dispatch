# Heterogeneous graph crash and failure matrix

Tests use fresh Kujo processes, real Workcell/SQLite program nodes and the actual
run lock/control journal. Immutable/index gaps are SIGKILLs in a disposable pinned
controller copy immediately after the real immutable write; production has no
ambient environment switch that corrupts journal publication.

| Boundary | Surviving fact | Permitted action | Prohibited inference |
| --- | --- | --- | --- |
| Program output, unresolved effect | Original output/result and consumed/unknown effect facts | Ordinary independent verification and parent review | Producer success or dependent admission |
| Eval raw result, no Eval terminal | Exact subject/config/input evidence | Assess and separately finalize | Eval pass schedules consumer itself |
| Eval terminal, reply lost | Graph-local receipt and immutable control event | Fresh controller loads exact terminal | Fabricate execution-result or repeat program work |
| Human terminal immutable record, index lost | Original decision, request, inputs, exact source-bound orphan | Existing locked operator reconciliation | Guess decision from chat or choose conflicting approval |
| Every node fact exists, no graph decision | Independent immutable node terminals | Inspect eligible candidate; explicitly finalize | Recovery invents graph success |
| Graph finalization before event, SIGKILL | Candidate only | Fresh assessment and explicit decision | Candidate is authority |
| Graph terminal event, state/index lag | Exact source-bound terminal record | Existing reconciliation | Synthesize missing nodes or erase failed outcomes |
| Graph terminal state, reply lost | Graph terminal receipt | Historical inspection only | Re-finalize or resume |
| Two fresh finalizers | Same independently assessed source revision | One existing-lock transition wins | Duplicate graph terminal event |
| Optional cancellation before dispatch | Authorized non-execution record | Continue other dependency-ready nodes | Cancellation counts as successful execution |
| Optional dispatch but no admission yet | Durable dispatch that can be consumed by another controller | Wait/reconcile its node lifecycle | Ignore it and strand an imminent attempt |
| Missing or changed output | Historical terminal remains; current evidence unavailable | Restore exact prerequisite or remain blocked | Substitute new output bytes |
| Stale or revoked human authority | Historical request/candidate | Renew request or restore authorized decision path | Reuse stale approval on a new revision |
| Eval policy requires review | Nonterminal evaluation facts | Existing operator/policy workflow | Fail graph merely because verdict was fail |
| Required node fails/rejects | Durable unsuccessful terminal | Anchored graph failure policy | Rewrite successful upstream facts |

Graph-local terminal records, program parent receipts and graph outcome are distinct
boundaries. The common identity describes each boundary without flattening its facts.
A repaired run still requires ordinary admission. No record can unconsume an attempt.
