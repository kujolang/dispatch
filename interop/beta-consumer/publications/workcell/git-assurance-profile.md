# Workcell Git CAS/ref assurance profile

Owner kujolang/workcell; ID `workcell.git-cas`. Exact version `1alpha1` supports
only dispatch.effect-assurance/v1alpha1; proposed `1beta1` supports only v1beta1.
[Metadata](assurance-profile.json), [vectors](../../tests/vectors/git-assurance-commitments.json).
The closed beta [binding schema](bindings-v1beta1.schema.json) MUST also validate.
Generic byte rules and admission are normative in Dispatch's
[portable commitments](https://github.com/kujolang/dispatch/blob/main/docs/contracts/portable-commitments.md)
and [beta migration](https://github.com/kujolang/dispatch/blob/main/docs/contracts/beta-migration.md).
This profile is separate from Workcell preservation and compute admission.

## Verified predicate and domain

The configured dedicated Git repository contains either (a) no exact intent marker
and the target still equals the expected old object, or (b) an exact intent marker
and the target equals the desired new object. Errors, missing target, different
marker or moved target do not prove either predicate. Only operation update,
external_idempotent, one effect in one action result are supported. Old/new Git
object IDs MUST be distinct lowercase40-hex SHA-1 repository IDs; SHA-256-format
Git repositories require a separately negotiated profile. This restriction does
not change the SHA-256 assurance commitment algorithm.

## Portable identity and intent

Bind exact run/step/action-attempt/effect/result identity to current trusted control
state. Attempt is canonical decimal equal to numeric result attempt; evaluator and
opaque IDs are unsupported. Exact original result UTF-8 bytes, including whitespace,
are hashed with SHA-256. Alpha is flat; beta has subject and profile bindings.

Operator-owned target and scope strings identify the logical ref and repository/
account/environment namespace; hash exact UTF-8 bytes without quotes/newline.
Hash the exact v1 idempotency key string for key_sha256. request_sha256=SHA256(new
OID ASCII bytes); precondition_sha256=SHA256(old OID ASCII bytes). Eight-field intent:
operation, target_sha256, scope_sha256, key_sha256, request_sha256,
precondition_sha256, valid_from, valid_until. Compact sorted-key alpha_json encoding
on these ASCII/integer fields is precisely portable-json/v1. transaction_sha256
hashes these bytes. Evidence hashes the compact JSON array
[`git_ref_cas_transaction`, transaction_sha256, observed_state], then receives the
`sha256:` prefix. Beta profile_sha256 hashes the complete portable-json bindings.
Vectors publish the exact strings, preimage bytes and lowercase unprefixed hashes.

Target ref: `refs/kujo-targets/` + target_sha256. Marker ref:
`refs/kujo-effects/` + scope_sha256 + `/` + key_sha256. Marker object is a Git blob
whose body is EXACT intent JSON bytes. Git's own object-ID hashing is Git's object
format, not the assurance transaction digest. No fixture directory is normative.

## Authentication, topology and replay

An operator-installed verifier maps the profile/version/issuer to the dedicated
repository and expected intent; producer JSON cannot select a repository, executable,
credentials or trusted issuer. Registry/configuration revocation is authoritative.
Run Git without inherited configuration/hooks/replacement objects that could change
this predicate; equivalent implementations MUST establish the same trusted command
semantics and bounded output, rather than trusting ambient user hooks.

One atomic ref transaction compares target to old OID, updates it to new OID and
creates the absent marker. The unique marker and CAS bind intent. On replay an
exact marker/new-target pair returns the same logical effect. Concurrent contenders
can yield one success and one CAS failure or a later duplicate success; no second
logical effect. Failed or inconsistent readback is conservative denial. Queries
are not a distributed snapshot; the writer rechecks its CAS admission condition.

Before atomic commit, target/marker remain old/absent (an unreferenced blob is not
the logical effect). After commit both refs survive even if process/result/reply
is lost. Partial/mismatched refs deny. Unknown reported completion remains unknown;
current predicate plus existing v1 enforcement references can permit replay under
retry_is_effect_safe. No exactly-once invocation, automatic rollback or compensation
is claimed.

## Freshness, retention, evidence and failure

Integer UTC [valid_from,valid_until), >0 and <=3600 seconds. Check at final Dispatch
admission and immediately before ref mutation; no skew grace. Keep marker/object
and idempotency scope for the replay horizon. Validity is inside intent identity:
changing it is changed intent, NOT a renewal. A moved target or lost marker does
not authorize reconstruction/replay. No supersession API is supplied.

Live lookup queries only the configured repository. Successful empty marker lookup
may prove absence ONLY with old target still present; query errors never do.
Output bound is8192 bytes and reference command deadline5 seconds. Assurance8KiB,
result1MiB, ASCII identifiers<=128, digest64 lowercase; one evidence reference.
No source contents, raw paths/URLs, credentials, arbitrary ref labels or captured
payloads enter assurance. Export digests and normalized states only.

Stable failure categories: binding_mismatch, freshness_failed, authority_revoked,
verification_failed. Git stderr/exit wording is implementation detail, never a
permission or fallback selector. Missing/corrupt evidence blocks recognized
assurance; read-only historical inspection may remain available.

## Conformance

`dispatch.effect-assurance-conformance/v1` common cases all apply. Extensions MUST
exercise real termination before/after atomic commit, duplicate and concurrent
CAS, changed old/new OIDs, moved target, wrong marker bytes, failed query versus
empty query, expiry and one logical effect. Session/principal-specific and separate
receipt-publication cases are N/A: operator authority and atomic marker/ref commit
are the domain. Beta migration MUST retain alpha interpretation and reject
cross-version artifacts under required runs. Static metadata grants no authority.
