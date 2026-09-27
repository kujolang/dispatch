# Pre-implementation interpretation (2026-09-27)

Written before this consumer's source. Inputs: portable-commitments.md,
beta-migration.md, three owner profile specifications/manifests/binding schemas,
beta envelope/configuration/negotiation schemas, execution-result/v1 schema, and
persisted-assurance-negotiation.md for the documented installed-host boundary.
No assurance implementation or prior independent checker is consulted in this task.
The implementing agent has prior project context; this is implementation independence,
not a claim of organizational blindness or a different human author.

The envelope is canonical portable JSON, at most8192 UTF-8 bytes. It binds an action
subject to the SHA256 of exact original v1 result bytes (at most1MiB). One result
must contain exactly one external_idempotent effect; canonical decimal attempt
must agree with the numeric action attempt. Closed selected profile bindings have
their own portable commitment. Alpha is unsupported by this beta-only consumer;
legacy inputs do not gain beta policy implicitly.

Policy is persisted beta required/deny, immutable and externally authoritative.
Hash the six non-self policy fields. Resolve only the exact installed revision:
hash all eleven public configuration fields, compare current installed implementation
manifest and authority commitment, and check live revocation. Never derive authority
from issuer or a manifest. Profile ID/version/envelope are independently exact matched.
Portable JSON sorts ASCII keys, retains Unicode scalar string values without Unicode
normalization, rejects floats/negative zero/duplicate keys, and enforces published
depth/count/encoded-byte limits. Result bytes are not canonicalized.

Validity is half-open integer UTC, at most3600 seconds, rechecked at admission.
Live results must come from an operator-owned channel and match exact current
subject, expected intent, observed state and evidence commitment. This consumer
returns a fact-validation decision, not workflow admission or a retry engine.
The host retains locks/current control authority and rechecks at mutation.

SQLite proves scoped intent/key uniqueness plus absence or one matching transaction.
Git proves exact marker and CAS target postcondition (or old target/absent marker).
Ability proves authenticated application identity, business transaction and consistent
request/receipt state; receipt failure is not business failure. Published recipes
permit independent reconstruction without querying private backend internals.

Local interface choice (not a new ecosystem wire contract): an operator supplies
current subject, expected bindings, observed evidence and current installation
status through a trusted fixture channel. Fixtures may retain authenticated readback
at a recorded time; replaying those files is test evidence, never current live trust.
No document may select executable paths, roots or credentials. Schema and manifest
files are installed locally, never fetched from producer references.

Open interpretation questions will be recorded rather than answered from source.
