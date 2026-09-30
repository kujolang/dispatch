# Operator workflow and authority

The bounded installed API extends `graph_policy_operation` with `kind: "attempt"`,
`id: <logical-node>`, and `action: "reserve" | "release" | "retry"`.
`operation: "assess"` returns an informational, revision-bound candidate.
`operation: "apply"` requires that exact candidate and an actor accepted by the
installed `authorize_graph` mechanism. A successful apply returns
`continuation: "not_authorized"`. Normal DAG advancement is a separate operation.
There is no force mode and no increase-budget operation.

| Fact or transition | Information producer | Validator / authority | Durable prerequisite |
| --- | --- | --- | --- |
| Logical node and ceilings | Host workflow author | Dispatch anchored definition | Negotiation and original workflow digest |
| Input identity | Producer and installed artifact reader | Existing Dispatch input validator | Producer terminal, exact artifact/schema/digest and predecessor receipts |
| Reservation | Dispatch runner or authorized operator | Existing graph run lock | Source-bound control record before child dispatch |
| Dispatch consumption | Existing DAG runner | Dispatch graph journal | Held reservation, exact selected child and binding |
| Preflight resource fact | Installed trusted host | Dispatch child admission path | Current authority and exact input binding |
| Pre-admission refusal | Dispatch only | Child lock, absence of claim | Immutable refusal before any admission or execution |
| Node admission | Dispatch child runner | Existing permanent claim primitive | Own input binding and current child authority |
| Effect admission | Existing effect lifecycle | Dispatch, independently of graph budget | Own selection, evidence, exact authority and one-use claim |
| Release | Authorized operator | Graph lock, then child lock | No dispatch, claim, execution, result or uncertainty |
| Retry | Authorized operator under anchored strategy | Dispatch | Exact sealed refusal, unused declared child, same inputs, unconsumed allowance |
| Terminal observation | Responsible terminal subsystem | Dispatch node validator | Independent parent finalization or exact refusal |
| Graph finalization | Operator plus graph policy | Dispatch graph lock | Exact node facts and accounting history; no held reservation |
| Recovery | Operator-selected mechanical plan | Existing retained-host reconciliation | Valid immutable records, journal continuity and integrity |
| Reporting | Dispatch, RunLedger or Watchdog reader | No continuation authority | References to the above facts |

The API deliberately has no participant-facing reservation or refund request. Neither
an SDK `retryable` flag nor an agent's assertion of failure proves that admission was
never consumed. A resource preflight refusal is recorded by Dispatch at its own
boundary. If the process disappears before that record, absence of a reply remains
unknown and cannot be turned into a refusal.

The portable addition is input-binding/v1alpha4: the existing exact binding plus an
attempt ordinal and prior-terminal reference. It retains the original logical graph
node while changing the consumer execution run. Alpha1/2/3 inputs, existing terminal
receipts and old participant commitments remain historical. Accounting records remain
Dispatch-internal; this does not create a public participant accounting API.

`kind: "accounting", operation: "assess"` returns a versioned informational report
with budget, reservation history, current child admission/work readback, exact
terminal references, and separate evaluation/decision instances. A readback failure
is `unknown`. `result_recorded` is not proof of effect completion. Multiple released
reservations can refer to one still-never-dispatched execution identity; the ledger
retains them without charging duplicate execution attempts. There are at most sixteen
reservation records per logical node in this bounded storage contract.
