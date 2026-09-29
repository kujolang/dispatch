# Node composition failure boundaries

The committed tests and validation manifest report the actual outcomes for this
matrix. All recovery is retained-host only; a mechanical repair is not execution.

| Boundary / failure | Durable authority | Allowed next action | Prohibited inference |
| --- | --- | --- | --- |
| Producer output exists, producer pending review | Original result/output observations | Resolve effects, evaluate, explicitly finalize | File existence satisfies dependency |
| Producer uncertain / Eval needs changes | Existing review and effect state | Ordinary independent verification/review | Graph edge overrides policy |
| Producer Eval fails | Existing policy may finalize `failed` | Inspect failure; dependent remains blocked | Failed terminal is successful dependency |
| Producer cancelled or execution fails | Node-owned cancellation/failure | Operator inspection | Consumer executes from an output claim |
| A finalized, controller dies before B binding | A exact terminal; no B binding | Fresh graph runner reassesses B | A finalization already admitted B |
| B binding persisted, controller dies | Immutable binding and raw references | Fresh controller validates same binding and separately admits | Binding is a reusable execution ticket |
| Graph start request persisted, child not admitted | Exact dispatch and binding | Start same child attempt once | Allocate unrelated attempt |
| Initial admission consumed, process dies before action | Permanent claim and admission record | Review/reconcile retained state | Admitted means executed, or absent output permits replay |
| B mutation/observation survives, parent not finalized | Selected-effect consumption and observation | Independent readback, explicit finalization | Effect completion finalizes B |
| Immutable input event written, journal append lost | Exact orphan record and retained raw inputs | Existing revision-bound repair, then separate graph drive | Recovery executes B |
| Producer terminal observation orphaned | Exact source-bound terminal observation | Reconcile graph projection | Artifact alone supplies missing terminal decision |
| Unreferenced raw output | Content exists without control binding | Operator review | Recovery invents a data edge |
| Changed/missing input bytes or stale authority | Historical binding still exists | Restore exact current prerequisites or remain blocked | Consume replacement bytes under old attempt |
| Competing fresh controllers | Existing graph lock, child lock, permanent claim | One admission; loser observes locked/consumed state | Independent eligibility grants duplicate execution |
| Consumer fails | Producer receipt unchanged | Apply existing consumer policy | Rewrite producer terminal history |

The initial node attempt, later effect attempt, node finalization and outer graph
terminal observation are distinct records. Each can survive without a later one.
The public-ish binding schema is `schemas/node-input-binding-v1alpha1.schema.json`;
portable vectors are additive and do not change parent-finalization/result bytes.
