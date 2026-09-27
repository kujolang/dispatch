# Effect assurance beta contract review

Historical review outcome below. The subsequent [portable commitment and migration implementation](contracts/beta-migration.md) closes B1–B3 for its explicitly bounded candidate domain; it does not rewrite this review or promote stable assurance.


Review date: 2026-09-27. **Decision: retain alpha; one more bounded contract
hardening and migration rehearsal is required.** No beta schema is registered or
accepted by this change. Runtime, execution-result/v1, default admission and the
three adapters are unchanged. This is a design review, not a beta release claim.

An independent implementer cannot yet reproduce all commitments from the previous
documentation alone. The principal gaps are portable digest recipes, profile
predicate specifications, and a tested alpha-to-beta conversion boundary. Green
alpha integration tests do not establish those properties.

The normative shipping rules remain in [compatibility](effect-assurance-compatibility.md)
and [persisted negotiation](persisted-assurance-negotiation.md). MUST/SHOULD/MAY
below state requirements for a future beta proposal, **not new accepted wire fields**.
See the [field inventory](audits/effect-assurance-contract-inventory.md),
[profile template](effect-assurance-profile-template.md), and
[validation evidence](audits/effect-assurance-beta-validation.md).

## 1. Review baseline and scope

| Repository | Fetched main before edits | Use |
|---|---|---|
| Dispatch | 472070ed3e11d31085935df4fb0e57101d11e942 | Admission, persistence, contracts and tests |
| Kujo | 6210eaa171175bda491df437785c5db25d231738 | Roadmap and unchanged result schema |
| Workcell | b34c26c90a8626c988a4234fd2610dcf11df1634 | Git intent and live predicate |
| Ability | f103ac5904c69ad7a1c6dffb262200f986d734d4 | Application authentication, dual commit and digests |
| Agents SDK | bb2202d8b54f44717b1b1f0157a6774f2027cea1 | Receipt projection, not an assurance consumer |
| MCP | 07845898ee9f2662d0e0e364973d77cdaac04762 | Effect hints and Ability gateway, not replay authority |

Required Dispatch and Kujo ancestry was checked against fetched main. SDK's
unrelated untracked maintenance-agent work was preserved. Supporting repositories
were read only. SDK `src/abilities` and MCP `src/abilities` expose application
receipts/effect hints; neither projection authenticates a Wave C issuer. Watchdog
and RunLedger remain observations/receipts, not admission authorities.

## 2. Defects and freeze blockers

**Fixed: optional fallback precedence.** An unknown host-selected profile returned
`compat_profile_unsupported` before parsing the selected sidecar. Optional
`legacy_unavailable` therefore accepted malformed selected JSON as unavailable.
The prose forbade this, but the ordered matrix and source contradicted it.
A failing regression was captured before the fix. Framing, understood closed
alpha shape, freshness and subject bindings now precede unknown-profile fallback.
Unknown envelope interiors remain uninterpreted; they never grant trust. Seven
new common cases run through each real adapter. This is a compatible safety fix,
not a new mode or global enablement.

**B1 — portable commitment specification and vectors.** Exact result bytes are
well-defined; parsed-object hashes are not yet independently specified/tested as
an ecosystem contract. Configuration, policy, SQLite/Git intent and evidence use
Kujo `to_json`. Ability deliberately retains legacy `json_digest` alongside
`json_digest_v2`. They MUST NOT be assumed interchangeable. Publish literal
preimage bytes and expected digests for every recipe, including ordering, escaping,
Unicode, integer limits, empty values and rejection of duplicate object keys.
An independent maintenance verifier must reproduce them without executing the
producer's serializer. Preserve old recipes under alpha identifiers.

**B2 — beta envelope/profile migration not rehearsed.** The flat alpha envelope
mixes generic binding with three mechanisms, two operations and a compensation
placeholder. A schema rename would freeze that accident. A future beta proposal
must exercise the profile boundary below through all three families, historical
bytes, protected run policies and old consumers before registration. Existing
alpha conformance does not test a nonexistent beta implementation.

**B3 — independent profile specifications incomplete.** The template below makes
required content explicit, but each owner's completed, vector-backed specification
is still required. In particular, renewal is not a generic operation: SQLite/Git
hash validity into the persisted intent, and Ability's evidence commitment changes
when its separate receipt becomes available. A profile must say whether evidence
can be renewed, what remains immutable, and when an old run stays blocked. No
current API may silently replace an immutable selected sidecar/configuration.

Opaque action-attempt support is **not required** to ship a clearly scoped beta,
but its unsupported status must be explicit. It must not be silently coerced to
decimal. Do not broaden identity support solely to remove a documented limit.

## 3. Proposed generic envelope boundary

Keep independent execution-result, assurance-envelope and profile versions.
Beta should retain: schema identity; exact action subject and result SHA-256;
profile ID/version; issuer attribution; validity; evidence commitment; and a
bounded, closed profile binding object. The profile/version MUST identify one
normative verified predicate. No extra free-form predicate expression or redundant
predicate selector is necessary. A catalog predicate label is descriptive, not
executable policy. A profile with a different predicate needs a new version/ID.

Move operation, target/scope/key/request/precondition/transaction bindings,
mechanism, observed predicate facts and commit topology into the profile contract.
They remain mandatory wherever that profile's proof needs them; moving their
location must not weaken comparison against trusted expected context. Remove the
fixed `compensation=not_evaluated` placeholder from the proposed generic shape;
compensation support/request/execution/verified reversal are distinct and deferred.
Do not copy profile business payloads into any envelope.

The admitted domain remains **one assurance for the only effect in a one-effect
execution result**, external_idempotent under the existing v1 policy. It is not
selection of one effect from a multi-effect result. Reject zero/multiple effects
and unsupported replay classes. Atomic groups, mixed commits, compensation and
one-sidecar-per-effect aggregation require separate design. A verified predicate
never overrides `retry_is_effect_safe` or the other control gates.

Keep 8 KiB total UTF-8 document, 1 MiB result, 128-byte ASCII identifiers and one
opaque evidence commitment. A future nested profile object needs a closed schema
and explicit depth/field-count limits inside that same total budget; no arbitrary
maps. Do not publish a beta JSON schema until B1–B3 are demonstrated. Alpha schemas
remain the only accepted schemas in this implementation.

## 4. Provenance vocabulary and authority

The four alpha labels are not a total order, permissions, or organizational
independence. `claimed` and `observed` do not satisfy this replay path;
`adapter_attested` and `independently_verified` both require a configured live
verifier. The latter means separate live readback, possibly by the same application
operator. It does not mean an independent audit organization.

For beta, prefer a verification **method** such as `live_readback` over freezing a
misleading strength ladder. It describes how the profile predicate is checked;
issuer/authority authentication remains external. Multiple historical provenance
facts belong in evidence, not an ordered scalar that consumers compare numerically.
Only the live method exercised by these families should be admitted initially.
This proposed rename requires explicit migration tests; alpha labels stay unchanged.

A document MUST NOT authenticate its own issuer, principal, tenant, profile,
executable, roots or credentials. Operator-owned exact profile/version and
configuration-revision selection supplies the verifier and trusted authority.
The document can identify a profile but cannot install it. Conflicting/duplicate
registrations fail; disabled and revoked bindings cannot fall back. Capability
catalogs are advisory, including if a producer copies a valid catalog.

Existing short profile IDs are explicitly owned by the Kujo ecosystem. A future
public profile specification SHOULD use an owner-controlled reverse-domain prefix
within the bounded ASCII identifier grammar. Keep the current IDs as explicit
legacy registrations, not implicit aliases. Namespace ownership is an operator
review assertion, not DNS authentication. Versions are exact strings, not ranges.

The trusted local host model protects against producer self-authorization,
stale/mismatched evidence, result/profile substitution and restart downgrade.
It does not protect against hostile root/operator, a compromised configured
verifier, or simultaneous rollback of every authority and journal by their owner.
Local digest commitments are not signatures. Remote transport identity, signatures,
mTLS and KMS may later implement the external authority boundary, but no remote
assertion is trusted merely because it uses this envelope.

## 5. Identity and digest rules

Subject IDs compare exactly, case-sensitively, without Unicode normalization,
trimming or numeric coercion. The current domain is action execution. Evaluator
attempt counters are not action attempts. Reexecution creates a new action result
and subject even when the business key remains stable. Alpha additionally requires
canonical decimal subject attempt equal to numeric result attempt/current control
attempt. Retain this restriction until an authenticated lossless opaque-ID mapping
is implemented and independently tested; do not rewrite historical result IDs.
A future generic subject can explicitly name the action namespace, but adding a
field alone does not create that mapping.

SHA-256 remains the concrete beta design guarantee. Algorithm-tagged agility adds
no demonstrated value here. All `_sha256` values are raw lowercase 64 hex; opaque
evidence refs are exactly `sha256:` followed by that form. Reject alternate case,
algorithms and ambiguous prefixes. SHA-256 identifies bytes; it does not authenticate.

Result SHA-256 hashes the **exact retained authoritative UTF-8 bytes**, including
whitespace, escape spelling, property order and any trailing newline. No BOM
stripping, newline conversion, reserialization or canonicalization. Sidecar transport
SHA likewise hashes exact selected bytes. Equivalent JSON is a different artifact.
Retain originals for the replay horizon. Missing originals cannot be reconstructed
and called historical bytes. Profile/config/policy hashes instead hash their
specified preimages; the inventory records today's recipes and B1 requires portable
vectors before freezing them. Reject duplicate keys in a future beta reader before
semantic interpretation; current alpha parsing is not a portable duplicate-key
contract. Do not change runtime JSON parsing for this review.

## 6. Freshness, retention and dual commits

Validity is integer UTC seconds, half-open [valid_from, valid_until), no implicit
skew grace. Trust the host clock, not producer time; invalid/unavailable clocks
block. Final locked Dispatch admission reloads authoritative policy, exact installed
revision, current revocation and live evidence. The application also checks at
its actual mutation boundary. Validation at load/review time is insufficient.
Separate locks cannot give a distributed atomic revocation guarantee; a later
application rejection remains a controlled failure, not permission to bypass it.

The 3600-second ceiling is the current local admission limit, not a universal
property of idempotency. A future beta validity bound must be the minimum of the
profile guarantee and operator limit; existing families retain 3600 unless new
evidence supports a change. Enforcement/key retention is separate from document
validity. Expiry never authorizes key recycling. Long reviews may remain blocked.

SQLite publishes business effect and receipt atomically. Git atomically updates
its marker/ref, with conservative readback checks. Ability has separate business
and replay-receipt commits. A failed receipt publication is not a failed business
mutation. Profiles MUST state the exact live predicate for absence, committed,
contradictory and unqueryable states. Absence requires an authoritative observation
and admission enforcement; a missing/query-failed receipt alone is never absence.

Evidence loss/corruption, unavailable sink/verifier, unknown original bytes or
unqueryable business state block recognized assurance in required and optional
modes. Existing review policy may route the denial; no new lifecycle is introduced.
Read-only historical inspection remains possible with an unverified label. A new
sidecar may attach to retained historical result bytes only if current profile
semantics and persisted selection rules allow it; no implicit renewal or supersession
operation is added here.

## 7. Configuration revision and writer compatibility

Persisted mode/fallback/profile/version/revision is immutable for the run. The
revision commits to issuer, mechanism, verifier identity/version/source manifest,
authority identity and policy. Current exact-byte source manifests pin a local
installation; they do not prove code quality or that a malicious host executed it.
Beta must distinguish this local installation commitment from the portable profile
predicate. A changed verifier artifact, including a rebuild with different bytes,
needs a new revision under this local model. Claimed semantic equivalence cannot
reuse R1. An old run needs its exact R1 installed and unrevoked; R2 cannot substitute.
Host/runtime/dependency pinning responsibilities must be recorded with deployment
provenance; source hashes alone are not a complete binary supply-chain attestation.

Revocation is live external authority, not a mutable field inside the committed
revision. A hostile authority can lie about it; the trust model does not claim
otherwise. Removed/revoked revisions block. State/journal/config disagreement blocks.

The beta **property** is incompatible-writer refusal, not a mandated filesystem
codec. Dispatch's guarded prefix, required feature, SQLite authority and journal
anchor implement it locally. Unknown feature/codec means controller incompatible;
understood policy with missing verifier revision means configuration unavailable.
Both refuse mutation, but inspection can explain different remedies. Old readers
that ignore additive JSON fields must not receive an unguarded writable projection.

Stale exports, old checkpoints and partial state rollback are checked against
surviving journal/database authority. Bundle signatures authenticate bundle bytes,
not freshness or the existence of surviving admission authority. Imported protected
bundles lacking that authority cannot resume. No claim covers total host rollback,
restoring all authoritative stores together, or general machine-loss recovery.

## 8. Policy and downgrade matrix

Modes are sufficient and stay named: legacy/deny; optional/deny;
optional/legacy_unavailable; required/deny. Optional deny allows a workflow to
express optional availability while refusing this replay when unavailable; it
has the same deny behavior as required at an assurance-applicable boundary.
No policy transition operation is introduced.

| Condition after valid result/current authority checks | Legacy | Optional deny | Optional legacy_unavailable | Required |
|---|---|---|---|---|
| No assurance selected | v1 only | block | v1 only, unverified | block |
| Well-framed unsupported envelope/profile; no understood invalidity | v1 only | block | v1 only, unverified | block |
| Malformed/oversized selected content, read failure | v1 only | block | block | block |
| Recognized schema/binding/digest/time failure | v1 only | block | block | block |
| Revoked/disabled/missing known verifier or bad configuration | v1 only | block/configuration error | block/configuration error | block/configuration error |
| Current predicate verified, v1 permits | v1 only | verified eligibility | verified eligibility | verified eligibility |
| v1 denies | deny | deny | deny | deny |

Legacy deliberately ignores assurance and makes no verified claim. A protected
run cannot switch to that row through defaults or invalid evidence. A sidecar read
error is not absence. Validate framing and understood envelope failures before
unsupported-profile fallback. Never partially interpret an unknown envelope.
The canonical compatibility matrix specifies implementation reason precedence.
The v1 external_idempotent + unknown completion + enforcement references exception
remains truthful as a trusted-integration assumption, never retroactive attestation.

## 9. Migration and mixed versions

1. Preserve legacy result bytes and truthful v1 classes/references.
2. Continue explicit alpha deployments with their pinned revisions and restrictions.
3. Complete B1–B3 and register a separately versioned beta envelope/profile set.
4. Reverify historical bytes live and create a new sidecar with its own digest;
   never rename alpha schema/labels or mutate old records.
5. Start a separately admitted beta run/control boundary with explicit authority.
   Existing alpha runs remain alpha: no in-place policy migration API exists.
6. Rehearse independent producers/consumers before beta adoption; keep alpha support.

| Producer/artifact → consumer/controller | Read/inspect | Verify | Mutate |
|---|---|---|---|
| Alpha → alpha | supported | configured alpha only | existing alpha/v1 controls |
| Alpha → future beta | inspect alpha | only explicitly retained alpha implementation/revision; not beta proof | under persisted alpha policy only; beta-required blocks without new verification |
| Beta → alpha | opaque sidecar/version inspection | unsupported, zero trust | required/optional-deny block; explicit optional-unavailable may use truthful v1 only |
| Beta → future beta | supported only after registration | exact supported profile/revision | live verified predicate plus v1/control policy |
| Legacy → future beta | supported v1 | no invented assurance | legacy unchanged; required applicable replay blocks |
| Beta-required protected run → pre-assurance controller | may fail decoding; separate read-only view allowed | cannot verify | MUST refuse; no unguarded downgrade export |

No forward compatibility is presumed. Current alpha controller rejects beta as
unsupported; this review does not make any beta document admissible.

## 10. Reason taxonomy and conformance

Future beta stable categories: configuration, controller_incompatible, unsupported,
missing, contract_invalid, binding_mismatch, freshness, revoked, verification_failed,
v1_denied. These are categories for design, not newly emitted codes. Current exact
codes remain inventoried in the machine-readable audit. Unknown future codes MUST
fail closed, not be interpreted by substring or treated as unsupported fallback.
An adapter's internal database/process diagnostic is not a stable permission code.
Do not leak payloads in diagnostics; retain bounded codes and redacted references.

The original common suite has 62 checks; this change adds seven fallback-precedence
checks, giving 69 per real profile. Common mandatory assertions are exact identity,
intent commitments, external authority, bounds, time, live verification, retained
bytes, v1 denial and no invalid fallback. Profile-specific mandatory tests cover
actual absence/commit/contradiction, crashes, concurrent enforcement and privacy.
Separate receipt/principal tests are mandatory for Ability, explicitly N/A only
when a profile has no such concept. Storage codec bytes, helper return shapes,
shard counts and exact internal diagnostic strings are implementation tests.
The [template](effect-assurance-profile-template.md) defines conformance evidence.

Current suites exercise real local producers but share one consumer/serializer.
They are not independent interoperability certification. Beta rehearsal must include
literal preimage vectors, unsupported beta-to-alpha behavior, new sidecars over
unchanged historical bytes, and protected alpha/beta policy separation.

## 11. Security findings and readiness

Fresh review covered fallback/version/profile confusion, issuer/catalog spoofing,
result substitution, revoked revision reuse, delayed admission, evidence loss,
checkpoint/import rollback and serializer ambiguity. The concrete fallback defect
is fixed. No authority was moved to producer JSON. Source/configuration commitments
remain trusted-host mechanisms. Duplicate-key interpretation and cross-language
preimages remain freeze blockers, not claims of a demonstrated alpha admission
bypass. Evidence refresh limitations are now explicit rather than silently promised.

| Criterion | Verdict | Evidence or remaining condition |
|---|---|---|
| Three materially different families | PASS | Real SQLite, Git and Ability paths; not three independent consumer implementations |
| Compatibility specification | PASS | Ordered fallback rule corrected and tested |
| Persisted negotiation | PASS | Immutable policy, journal anchor and checkpoints |
| Configuration revisions | PASS | Exact installed revision, code/authority commitment, no replacement |
| Restart protection | PASS | Fresh-controller persisted fixtures |
| Rollback/downgrade protection | PASS | Surviving authority boundary; hostile total-store rollback excluded |
| Mixed-version protection | PASS | Actual pre-assurance controller refusal; beta wire rehearsal still B2 |
| Common conformance | PASS | Three-family alpha suite; beta conversion suite still B2 |
| Historical migration semantics | BLOCKED | Rules specified here; literal conversion/reverification rehearsal needed |
| Stable profile template | BLOCKED | Template drafted; three completed owner specs/vectors needed before freeze |
| Security review | PASS | Local review and regression; no remote-trust claim |
| No unresolved contract ambiguity | BLOCKED | B1–B3 prevent independent beta implementation |
| Remote trust, multi-effect, global enablement | DEFERRED_NONBLOCKING | Explicitly outside local single-effect scope |

The independently reproduced VM loop early-return defect is separate runtime
maintenance. The current admitted alpha paths are exercised by the canonical gate
on the pinned source runtime; the contract does not require the defective path.
Do not fix it in this change or describe a VM defect as assurance evidence. See the
prior persisted-negotiation audit and its isolated reproduction.

**Recommendation: one more Wave C hardening slice.** Complete three profile specs
using this template, publish portable digest/preimage vectors, and implement a
bounded alpha-to-proposed-beta migration rehearsal with an independent verifier.
Do not add an adapter. Accept only when all three existing families reproduce
commitments and old/new required policies cannot cross-downgrade. Then request a
beta design freeze review. No beta schema promotion and no Wave D transition now.
