# Workcell Git process interoperability

Experimental and unreleased. The controlled process participant invokes existing
`workcell.git-cas` directly: no Ability invocation, gateway, receipt or application
store is involved. It uses required/deny beta negotiation, the existing live Git
verifier, locked review admission and surviving-filesystem checkpoints.

## Execution boundary

The host issues one private, expiring ticket per Dispatch action attempt. The
participant's only caller input is a call ID. Workcell atomically claims the ticket
before calling its existing Git intent-marker/target-ref transaction. A separate
host recorder produces exact-byte v1 result and content-addressed handoff files.
The Node supervisor exists to exercise actual SIGKILL, not to implement Git,
idempotency or replay policy.

`src/adapters/git_participant_handoff.kujo` checks the closed 4096-byte
`workcell.git-process-handoff/v1alpha1` document, exact result bytes, independent
identity domains, the result's `process_correlation`, and selected beta bytes.
It returns correlation status only. The configured host wrapper then invokes the
**existing** Workcell verifier through persisted negotiation. The reader is not
a verifier, policy engine, workflow state store or substitute for live evidence.

The host supplies expected call/participant/Workcell alias and Dispatch subject;
the exact authoritative result binds the generated invocation UUID. The existing
Git beta bindings own target/scope/key/request/precondition/transaction semantics.
No raw ref, repository path or command belongs in the participant handoff.

## Review and replay

Pre-commit and post-commit process loss both produce an indeterminate result and
`completion_lost` handoff outcome. They differ only when the live Git predicate
is resolved: exact old target with no marker proves `not_started`; exact marker
and new target proves `committed`. Both remain subject to the existing v1 replay
policy and required beta verification. Errors or inconsistent external state block.

All participant and initial controller processes exit. A new controller selects
fresh beta evidence without changing historical result bytes, publishes a review
checkpoint, and resumes under the original configuration revision even when the
process default is legacy. A substituted handoff blocks locked admission. That
denial advances control state; restoring a reference does not revive the stale
checkpoint. Publishing a fresh checkpoint is required before retry.

A new admitted process calls Workcell again. After pre-commit loss it performs the
transaction. After post-commit loss it observes the existing marker/postcondition
and deduplicates. There is exactly one logical Git effect, not an exactly-once
process execution guarantee.

## Reproduction

From Dispatch, with Workcell checked out alongside it (or `WORKCELL_ROOT` set):

```sh
KUJO_BIN=/path/to/source-kujo node tests/git_participant_integration.mjs before_commit
KUJO_BIN=/path/to/source-kujo node tests/git_participant_integration.mjs after_commit
```

The release gate includes both. Workcell owns the handoff schema, participant,
recorder, profile and four-process one-ticket contention test. See its
`docs/controlled-git-participant.md`. No new telemetry bus is added; existing
Dispatch lifecycle and control journal records remain observational/auditable.

See [the four-participant comparison and evidence](audits/wave-d-git.md).
