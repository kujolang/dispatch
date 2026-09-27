# Effect assurance profile specification template

Status: proposed beta specification template; not a new registered profile or wire
schema. A profile is incomplete until every item below has a normative answer and
executable evidence. MUST/SHOULD/MAY have their ordinary RFC-style requirement
meaning. Alpha's existing schemas and admission rules remain authoritative.

## Identity and ownership

- Exact identifier, owner/contact authority, exact version, supported envelope and
  execution-result versions. Declare namespace ownership; no implicit aliases,
  version ranges, executable discovery or trust from a profile name.
- State whether this is an alpha legacy mapping or proposed beta implementation.
- Specify one **verified predicate** in plain normative terms: the exact proposition
  established by the live verifier. A profile version MUST NOT mean different
  predicates on different installations. A provenance label is not that predicate.
- List operation domain and replay classes. Current admission supports only one
  external_idempotent effect in a one-effect action result. Explicitly reject all
  other domains; do not select one effect and ignore neighbors.

## Bindings and byte recipes

For EACH field provide: type, required/nullable status, bound, trusted source,
normalization, exact comparison, digest algorithm, literal preimage example and
expected digest. Cover run/step/action attempt/effect/result, target, environment,
tenant/principal if applicable, scope, request, key, transaction and precondition.
Distinguish action ID from ordinal and evaluator counters. State unsupported opaque
IDs explicitly. No lossy coercion, hidden defaults or producer-supplied expectations.

Result hashes MUST use exact retained bytes. Other recipes MUST state ordering,
UTF-8 escaping, integer range, null/absent behavior and duplicate-key rejection.
Supply positive and byte-different negative vectors reproducible independently.
Existing Ability legacy and v2 digests MUST be named separately; do not silently
canonicalize old application identity into a different request.

Provide the closed profile schema, field count/depth and total document bounds.
The envelope plus profile MUST remain within 8 KiB unless a separately reviewed
contract changes that bound. No raw payload, arbitrary dynamic labels, credentials,
customer records, URLs or filesystem paths in exported assurance.

## Authority and evidence

- Identify configured verifier, issuer attribution, authenticated authority,
  transport/local channel, application principal and operator trust separately.
- Describe operator installation and configuration revision commitment, including
  executable/artifact identity and trusted dependencies. Producer input MUST NOT
  select code, roots, credentials or its own authority.
- Specify evidence lookup through authorized bounded stores; read errors are not
  absence. Define path confinement/symlink behavior and maximum response/read size.
- Define exact evidence commitment bytes and how live state reconstructs them.
  An evidence digest alone MUST NOT authenticate the evidence producer.
- State revocation subjects, authoritative store and live lookup. No cached proof
  may survive current revocation checks at final admission.

## Time, retention and renewal

Define clock, integer units, half-open validity, maximum validity, no implicit
skew allowance, final control check and actual business-admission check. Distinguish
sidecar lifetime, enforcement/key retention and business transaction lifetime.

State whether renewal is supported. If changing validity changes transaction
identity, say so. If receipt publication changes evidence digest, explain which
old documents become unusable. Define whether a new sidecar can bind retained
historical bytes without changing original enforcement references. Current
persisted selections/configuration are immutable: do not invent an update API.
Missing evidence/bytes or unavailable verification MUST block recognized assurance;
historical inspection MAY continue, labeled unverified.

## Commit and concurrency semantics

Provide a table for: before business commit, after business commit, before receipt
publication, after receipt publication, before reply, and verifier unavailable.
For each: persisted facts, uncertain facts, verified predicate and v1 replay result.
Mark a receipt boundary N/A only if the profile proves a single atomic commit.
A receipt error MUST NOT imply business absence. Contradictory state MUST deny.

Describe enforcement (unique constraint, CAS, application gateway, etc.), transaction
identity, duplicate behavior, changed-intent conflict and concurrent admission.
Explain quiescence/fencing required for an absence proof. Prove one logical effect
under at least two real concurrent contenders. Never claim exactly-once execution
or universal rollback. Compensation supported/requested/executed/verified are
separate; unsupported compensation is explicit.

## Conformance evidence

All profiles MUST provide:

| Common category | Required evidence |
|---|---|
| Identity | Wrong run/step/action attempt/effect/result bytes; equivalent JSON reserialization rejects |
| Intent | Wrong target/scope/key/request/precondition/transaction; cross-profile reuse |
| Authority | Forged issuer; unknown/disabled/revoked mapping; catalog spoofing grants no trust |
| Freshness | Future, expired, clock invalid, revocation/expiry after review before admission |
| Compatibility | Legacy unchanged; required missing/unsupported deny; optional fallback only true unavailable; recognized invalid never fallback |
| Bounds/privacy | Oversize, extra keys, duplicate-key policy, malicious reference, sensitive canary absent from document/log/reason |
| Effect knowledge | Definitely absent, committed, unknown, contradictory; v1 denial never strengthened into permission |
| Persistence | Fresh process verifier/controller; exact installed revision; missing/revoked revision deny |
| Crash/concurrency | Real termination before/after commit; duplicate and concurrent retries; final logical effect count |
| Migration | Original bytes retained; new live sidecar does not mutate alpha evidence; old consumer grants no beta trust |

Profile-specific mandatory additions:

- SQLite: scoped uniqueness, rollback, atomic business/receipt record consistency.
- Git: marker content, old/new OID recipes, target CAS conflict, ref movement and
  failed read distinguishable from absence; supported repository object format.
- Ability: external session authentication, tenant/principal isolation, changed
  definition/input, separate business/receipt failure, corrupted receipt,
  revocation and application-admission expiry.

Implementation tests (codec prefix, local function return layout, process exit
plumbing, shard counts) remain valuable but MUST NOT be advertised as portable
profile semantics. N/A requires a written predicate-based explanation. Provide
commands, immutable input vectors, raw outcomes and implementation/configuration
revisions. A shared consumer passing its own serializer is not independent proof.

## Acceptance and compatibility statement

List limitations, supported migrations, historical artifact interpretation, stable
reason categories and internal diagnostics. Record security review and owner signoff.
A profile is not beta merely because this template has been filled in; complete
conformance and the envelope migration review first.
