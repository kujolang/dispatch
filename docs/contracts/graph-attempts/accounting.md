# Explicit attempts and reservations (implementation contract)

This is the opt-in implementation contract. The validation record distinguishes
focused proofs from the complete release gate. Existing static-policy runs retain
their original bytes and dispatch behavior.

## Authority and units

The anchored graph definition declares a maximum number of program dispatches.
Each program has one or two predeclared execution run identities. A logical node
remains the same DAG step across those instances. The child action attempt and its
effect attempts remain independent identities; neither is a reusable graph slot.

A graph reservation holds one program-dispatch unit. `node_start_requested`
permanently consumes it before calling the installed host. Consumption describes
Dispatch's durable dispatch decision, not delivery, execution, mutation or success.
A lost callback reply cannot establish which of those later boundaries occurred.
The controller must not redeliver a consumed dispatch automatically.

Available units equal the immutable ceiling minus held reservations minus consumed
dispatches. Released reservations remain in history but no longer hold capacity.
Read-only assessments, denied stale requests, branch activation and group receipts
consume no program unit. Subgraph members count individually, once per dispatch.
Inactive branches reserve and consume nothing. Evaluation terminal instances and
human decision requests are reported separately; they are not program dispatches.
Unknown runtime, token or monetary measurements remain unknown.

## Mechanical transitions

Reservation, release and retry use the existing graph lock and source-bound control
journal. Operator candidates bind current revision, journal, source state, anchored
workflow and installed authority. Apply revalidates after acquiring the lock and
records the actor. It does not start execution. Ordinary DAG advancement may reserve
and dispatch an eligible first attempt under its existing authority.

Release requires the graph lock followed by the child lock. The child must still be
pending, have no admission claim or event, no execution/result, and no refusal or
terminal event. The graph must contain no dispatch for this reservation. A released
never-dispatched child may be reserved again; a dispatched child may never be refunded.

Retry requires a sealed, independently reloaded pre-admission refusal. The initial
closed refusal reason is an installed resource-availability preflight rejection.
The dispatcher records it before creating an admission claim or invoking work. An
exception, missing reply or ordinary failed execution is not such a refusal.
A refusal seals that child permanently. A new predeclared child obtains its own
binding and admission; the prior refusal and all consumed dispatch units remain.

The new child binds the exact logical inputs, predecessor terminals and policy
receipts used by the original attempt. Only consumer execution identity and explicit
retry lineage differ. A newer producer output cannot silently replace an old input.
No dependent dispatch/binding, activated branch or finalized group may already have
used the prior attempt's terminal decision. Retry cannot invalidate downstream truth.

## Outcome and recovery

An explicitly retryable failure with remaining attempt allowance remains blocked for
an operator choice. Budget availability supplies no effect-safety evidence. Exhausted
node allowance exposes the failure to existing outcome policy. Required unfinished
work at a graph ceiling remains blocked. Already consumed work may still complete,
and a graph with all required terminal facts may finalize with zero available units.
Held reservations prevent sealing the graph, including reservations for optional work.

Graph finalization binds the exact accounting projection. Recovery folds durable
reservation, release, retry, dispatch and terminal events, validates their identities,
and compares the derived view. It does not infer missing dispatches, erase old
attempts, refund consumed units, decide retry safety or invent graph finalization.

## Remaining boundaries

Only retained trusted-host authority is covered. Ceiling extensions, post-admission
retries, evaluator retries, monetary/token accounting, elapsed-time enforcement,
dynamic topology, distributed workers, remote authentication, machine-loss recovery,
mixed profiles, compensation, exactly-once effects and universal rollback remain
outside this contract. RunLedger and Watchdog may report these facts; neither owns
a reservation, refund, retry or admission decision.

The graph terminal decision references the exact internal ledger by SHA-256 over its
retained JSON bytes. The ledger is not serialized as one portable participant
commitment: a multi-node history legitimately exceeds that codec's 8 KiB bound.
The bound and all historical portable encodings remain unchanged. Only the compact
input-binding/v1alpha4 addition crosses the existing portable codec boundary.
