# Dispatch SQLite unique transaction assurance profile

Owner: kujolang/dispatch. ID `dispatch.sqlite-unique`. Exact versions `1alpha1`
(alpha envelope) and proposed `1beta1` (beta envelope); no ranges or implicit aliases.
[Metadata](assurance-profile.json), [portable byte rules](portable-commitments.md),
[vectors](../../tests/vectors/sqlite-commitments.json). The closed beta [binding schema](bindings-v1beta1.schema.json) MUST also validate.
This is a local idempotent
logical-effect profile, not arbitrary SQLite/database transaction assurance.

## Predicate and bindings

Successful live verification proves that the configured SQLite store either has
no scoped key and no matching logical effect, or contains the exact eight-field
intent under its unique (scope,key) constraint and exactly one matching logical
effect transaction/request. The writer MUST enforce the same predicate/uniqueness.
Absence is not inferred from a failed query. The only operation is create and
replay class external_idempotent. Original reported completion stays unchanged;
observed state is not_started or committed. No compensation claim.

Run, step, action attempt, effect and exact result SHA-256 MUST match trusted current
Dispatch authority. Subject attempt is canonical decimal equal to the result's
numeric action attempt; opaque/evaluator IDs are unsupported. The result contains
exactly one effect. The beta envelope carries these in subject and profile-specific
facts in bindings; alpha uses its original flat fields. The predicate is unchanged.

Operator configuration owns logical target and account/environment scope strings;
hash their exact UTF-8 bytes. key_sha256 hashes the exact v1 idempotency key.
request_sha256 hashes exact normalized business input bytes supplied by the
application; normalization MUST be specified and retained by that application.
The reference domain uses a UTF-8 string, without added newline. precondition_sha256
hashes the exact `empty` string for creation. The eight-field intent is operation,
target_sha256, scope_sha256, key_sha256, request_sha256, precondition_sha256,
valid_from, valid_until. transaction_sha256 hashes alpha_json(intent).
Evidence hashes alpha_json([`sqlite_unique_transaction`, transaction_sha256,
observed_state]); add the `sha256:` prefix. Beta profile_sha256 hashes portable_json
of its ten-field bindings. All recipes have literal vectors; validity is part of
transaction identity and cannot be renewed in place.

## Authority, commits and replay

Only an operator-installed verifier with a configured store/authority and exact
configuration revision may establish this predicate. No path, key, issuer or
catalog provided by the producer installs that verifier. The database is operator
owned. Separate producer JSON is attribution, not authentication.

Writer admission uses a write transaction and unique(scope,key). A different intent
under the same key conflicts. Logical effect and key record commit atomically;
replay inserts no second logical effect. Before commit, termination rolls both
back; after commit, both survive even if result/reply is missing. Inconsistent key,
transaction or request records deny. Readback must use consistent authority;
concurrent state changes may conservatively deny, never infer success. Competing
writers are serialized by the database constraint, not by a test harness.

Replay still needs v1 retry_is_effect_safe: external_idempotent + unknown reported
state can qualify only with its existing enforcement references and current
verified predicate. Not_started is knowledge, not a blanket permission. No
exactly-once invocation or rollback guarantee is made.

## Freshness, failure and limits

UTC integer half-open interval, <=3600 seconds; recheck at locked Dispatch admission
and writer mutation. Registry/revision revocation blocks even with existing evidence.
Keep keys/intents/logical records for the replay horizon, not merely the validity
interval. Expired intent remains retained but cannot authorize a new mutation.
No automatic renewal or deletion is part of this profile.

Evidence queries use the configured local database, no producer URLs or paths.
Missing/corrupt/unavailable store, query failure or contradictory rows means
verification_failed, not absent effect. Generic stable categories are binding_mismatch,
freshness_failed, authority_revoked and verification_failed; SQL diagnostics are not
portable reason codes. Assurance/result bounds are 8192/1048576 bytes, identifiers
128 ASCII bytes, hashes lowercase64; no workload text, raw paths, credentials or
arbitrary labels may enter exported assurance. Only digests/normalized states do.

Conformance: `dispatch.effect-assurance-conformance/v1` common identity, authority,
freshness, downgrade, bounds, privacy and result-byte cases all apply. Profile
extensions require real before/after-commit termination, scoped-key changed-intent
conflict, duplicate/concurrent writes, contradictory record rejection and one final
logical effect. Principal/session and separate receipt-commit tests are N/A because
this profile has one operator authority and one atomic business/evidence commit.
