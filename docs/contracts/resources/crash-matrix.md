# Resource crash, recovery and contention proof matrix

| Boundary | Durable fact | Allowed next action | Prohibited |
| --- | --- | --- | --- |
| Assessed plan, no apply | Informational candidate only | Reassess | Treat candidate as capacity or admission |
| Reservation committed before dispatch | Held exact Eval/program capacity | Explicit release if never dispatched | Infer work or auto-resume |
| Immutable reservation, index missing | Source-bound orphan control record | Existing mechanical reconciliation | Invent another reservation |
| Eval dispatch before worker | Permanently consumed Eval unit | Exact readback if evidence exists, otherwise remain unknown | Refund or redeliver from silence |
| Worker admitted | Exclusive retained claim | Finish the same invocation | Invoke worker twice |
| Worker result produced, reply lost | Consumed dispatch/claim; host retains exact attempt response | Independent result readback, ordinary terminal decision | Re-execute evaluator or producer |
| Conclusive worker infrastructure failure | Consumed failed Eval attempt | Explicit new bounded attempt with same input | Reuse old identity, rerun subject program |
| Eval fail verdict | Exact completed evaluation judgment | Existing fail/branch/review policy | Reclassify judgment as infrastructure retry |
| Measurement retained, journal append lost | Exact source bytes and immutable observation record | Reconstruct source projection | Fabricate zeros, alter provenance class |
| Source artifact/hash corruption | Invalid evidence | Fail closed / operator investigation | Enforce policy from unverified bytes |
| Usage missing or estimated-only | Unknown reported usage | Supply missing exact evidence; review | Assume zero or promote estimate |
| All capacity consumed, work resolved | Exact results and receipts | Record sources, finalize nodes/graph | Reject truthful completion because no new capacity exists |

Two fresh controllers use the existing run lock for final program capacity, final
Eval capacity, competing plans, and release. Candidates bind exact state, revision,
journal, workflow, operator and installed source authority. No test-only global mutex
or secondary scheduler lock supplies correctness. Plans for unselected branches
reject. Subgraph member reservations count by dimension, with no charge for receipts.

Claims are retained under `eval-admissions/`. A missing claim for a completed Eval
or conflicting claim bytes fails reload. A consumed dispatch without a claim still
counts as consumed: absence of an acknowledgement is not permission to dispatch again.

The validation record identifies which cases have run and their source pins. This
matrix is a contract, not a substitute for the executable test results.
