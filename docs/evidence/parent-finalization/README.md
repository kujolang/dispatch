# Parent finalization validation

This receipt covers experimental finalization of the last unresolved protected
parent on a retained trusted host. It proves SQLite effect completion with a real
retained Workcell Git environment; it does not claim universal sink finalization.

`validation.json` records starting and tested source commits, exact commands,
results, explicit skips, warnings, toolchain pins and SHA-256 artifact identities.
The later receipt commit adds documentation and evidence only. Final pushed heads
are recorded in the consolidated Strata handoff.

The preservation binding retains exact original Workcell document bytes and
separately binds authorized reference metadata and content. Historical commitment
vectors and execution-result/v1 remain unchanged. New portable vectors are checked
by independent Kujo, TypeScript, Python and Go implementations.

The parent process proof exercises separately admitted C and D, fresh assessment,
exact required outputs, evaluation policy, preservation, anchored child topology
and an explicit operator decision. Negative cases reject unknown/pending effects,
cancelled required work, missing or changed outputs, stale evaluation/authority,
unresolved descendants, unauthorized review and changed state revisions.

## Authority and crash review

Assessment grants no authority. Finalization acquires the existing run lock,
revalidates the candidate against current source state, and rechecks bindings after
prerequisite artifact I/O immediately before publishing the immutable control event.
Terminal state is published last. The two fresh contenders each assess eligibility
before racing through the actual authoritative lock; only one terminal event wins.

A crash before the event leaves a nonterminal parent. A crash after the event but
before index/state publication permits exact mechanical reconstruction through
existing retained-host reconciliation. Terminal reply loss is resolved by reloading
terminal state. Recovery never infers a decision from completed prerequisites.
Original indeterminate results remain unchanged, and permanent consumption claims
remain present. `independent-artifact-audit.json` checks these facts and confirms no
extra SQLite mutation in successful and recovered runs.

These boundaries assume the existing trusted-host ownership model. They do not
provide cross-sink atomicity or protection against a malicious host changing source
material outside its authoritative mechanisms.

## Evidence interpretation

`development-corrections.md` retains actual review corrections, including the
anchored optional-child topology defect, and explains two deliberately interrupted
canonical attempts. Their exit 143 is not reported as a passing gate. The final
canonical log is the complete successful run; no failed assertion was suppressed.

Files in `samples/` are historical audit exports, **not restore authority**. They
include host-specific references and cannot grant admission or reconstruct a run
without its surviving authoritative store and explicit reconciliation.

See [the protocol](../../contracts/parent-finalization/protocol.md) for exact
prerequisites and ownership, and [the Wave F crosswalk](../../contracts/parent-finalization/wave-f-crosswalk.md)
for the next bounded producer/consumer composition proof. General scheduling,
remote trust, machine-loss recovery, mixed profiles, legacy selected-state migration,
compensation, exactly-once, universal rollback and a stable public SDK remain outside
this proof.
