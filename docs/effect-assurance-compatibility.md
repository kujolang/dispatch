# Effect assurance compatibility and migration

**Status:** normative experimental compatibility specification; alpha, opt-in,
unreleased. Three local families are validated. This does not enable assurance
in CLI/workflow defaults, stabilize alpha1, or change execution-result/v1.

MUST/MUST NOT are interoperability requirements. SHOULD is a strong recommendation
whose exception must be documented; MAY is optional. Sections marked guidance or
future work do not claim deployed behavior. This is the single normative
compatibility authority; earlier audit documents are historical evidence.

## 1. Scope and current implementation

The pipeline remains `kujo.execution-result/v1` + optional assurance sidecar +
operator-configured verifier -> trust resolution -> existing v1 replay policy.
Assurance is an additional condition, never a replacement for capabilities,
intervention authorization, preservation, current-attempt checks or v1 policy.

Sources: `src/core/intervention.kujo::retry_is_effect_safe`,
`src/core/effect_assurance.kujo`, `src/core/runner.kujo::run_workflow_with_admission`,
`src/adapters/{sqlite_effect,ability_assurance}.kujo`, Workcell
`src/evidence/git_effect.kujo`, Ability `src/runtime.kujo` and
`examples/application-assurance/gateway.kujo`.

The historical resolver selects an operator mapping by expected issuer and has
no negotiated profile-version or policy-mode surface. Tool allow/deny policies
in `src/core/tool_policy.kujo` do not express this requirement. The new
`src/core/assurance_compatibility.kujo` is an opt-in **reference evaluator**, not
persistent workflow policy, a new public CLI flag, or a portable admission token.
It covers one external-idempotent action effect; hosts MUST still invoke current
control checks under the run lock and recheck the application at mutation.

Agents SDK `src/agents/abilities/contract.kujo` validates/project receipts;
MCP `src/abilities/{projection,gateway}.kujo` exposes effects, idempotency hints
and receipts. Neither supplies authenticated effect assurance or negotiates this
contract. Those hints MUST NOT become verified predicates. Both remain read-only
consumers in this assignment. Kujo runtime has no negotiation responsibility.

## 2. Three independent compatibility axes

| Axis | Current identifier | Meaning |
|---|---|---|
| Execution result | `kujo.execution-result/v1` | Original effect classification, completion and enforcement references |
| Assurance envelope | `dispatch.effect-assurance/v1alpha1` | Exact subject/result, intent, observation, authority attribution and validity |
| Verifier profile | Exact profile ID + `1alpha1` below | Predicate, evidence construction, scope and enforcement semantics |

Understanding an envelope MUST NOT imply understanding a profile. No version
ranges, prefix matching, semver coercion, newest-version preference or opportunistic
field interpretation are permitted for alpha. A future consumer MUST explicitly
implement each accepted version. Unknown envelope versions MUST NOT be partially
interpreted; only bounded framing and the schema discriminator may be examined.
A known envelope with extra/future fields is invalid, not an extension opportunity.

## 3. Sidecars and discovery

A producer MAY advertise the existence of a sidecar through an existing bounded
artifact/evidence channel or an application handoff. It MUST NOT add unrecognized
fields to execution-result/v1 or repurpose its enforcement evidence reference as
an executable locator. That reference continues to identify enforcement evidence;
it is not a trusted command, credential, filesystem path or automatic URL fetch.

A host MUST select at most one assurance document for this admission from a
controlled store, with independently pinned document digest, authoritative result
bytes and expected invocation context. Conflicting candidates MUST block; a host
MUST NOT try candidates until one passes. Unselected informational attachments
are not selected assurances. Multiple generations may coexist historically, but
selection requires an explicit current host decision, not directory order.

Alpha1 remains a closed envelope. It has `issuer` and `mechanism`; it gains no
`profile` or `profile_version` fields. Profile ID/version live in operator-owned
selection and registry. Producer discovery is advisory only. A mechanism is a
cross-check against that selection, never a dynamic plugin selector. This minimum
fits all three adapters without changing historical result bytes or the envelope.
Future profile versions that need different wire semantics require explicit
negotiation/version design, not silent reinterpretation of an existing mechanism.

## 4. Operator registry and authority

A registry binds the exact tuple **(profile ID, profile version, issuer binding)**
to an installed verifier, supported envelope, assurance provenance and authority/
scope configuration. Multiple issuer bindings for one profile are permitted only
when distinct, explicitly authorized and selected by host expected context.
Duplicate tuples (even identical duplicates), ambiguous authorities and malformed
configuration MUST be configuration errors. A known selected profile with no
configured verifier MUST be a configuration error, not unsupported fallback.
Disabled entries are configuration errors; revoked entries block. Their status
MUST be checked before absence/unsupported fallback. No alpha version ranges.

The reference API accepts at most eight registry entries, each with exactly
`profile`, `version`, `issuer`, `envelope`, `status`, `assurance`, `verify`.
Identifiers are 1–128 ASCII identifier characters. `verify` is an installed host
function, not JSON code. Authority credentials, roots, scope and executable
versions are captured by that host function; they are never producer-selected.

A consumer MUST NOT authenticate an issuer from its label. Distinguish:

- **Named issuer:** attribution in the document and v1 effect.
- **Configured verifier:** executable host code selected outside that document.
- **Authenticated authority:** the trusted sink/application behind the verifier.
- **Transport identity:** peer/channel authentication; not necessarily application identity.
- **Application principal:** authenticated tenant/user/session, where applicable.
- **Operator trust:** authority to install/configure those mappings and permissions.

Metadata and hashes cannot bootstrap authority. Capability descriptions also
cannot install a verifier or grant trust. Hosts MUST load the current configuration
at admission, pin executable/dependency versions, and associate the effective
configuration revision/digest with the admission audit. A changed verifier version
invalidates cached verification: perform new live resolution. A previous success
MUST NOT survive revocation or a configuration change as an admission token.
Persistent configuration revision/audit integration is future work, not implemented
by the stateless reference evaluator. Its caller supplies the current snapshot.

## 5. Profile predicates and bindings

An assurance label describes provenance, not a universal ranking or `safe=true`.
Each profile MUST define the exact predicate, trust assumptions, digest recipe,
absence proof, commit topology, retention, concurrency and replay obligations.
`independently_verified` in these fixtures means separate live readback of a trusted
local store, not an independent organization or remote cryptographic attestation.

| Profile ID / version | Envelope mechanism | Verified predicate and limits |
|---|---|---|
| `dispatch.sqlite-unique` / `1alpha1` | `sqlite_unique_transaction` | Exact scoped key/intent and logical transaction agree in one SQLite transaction; successful absence queries establish not_started. A failed query establishes no absence. |
| `workcell.git-cas` / `1alpha1` | `git_ref_cas_transaction` | Exact intent marker and expected CAS target postcondition agree, or both are absent as defined by the adapter. Later target movement rejects. SHA-1 Git object profile only; no ABA/history or remote-service guarantee. |
| `ability.application-gateway` / `1alpha1` | `ability_application_gateway` | Authenticated application principal/request/key maps to exact business transaction, private input commitment and replay-receipt state. Business and receipt commits are separate; current session authorization and owner fencing remain enforced. |

Common semantic fields: schema, run/step/action-attempt/effect IDs, exact result
SHA-256, reported completion, replay class, provenance, issuer attribution,
validity, observed completion and evidence identity. Profiles define operation,
target/scope/key/request/precondition/transaction digest recipes and evidence
construction. Those recipes MUST NOT change under the same profile version.
A digest being well-formed does not establish its meaning or truth.

SQLite/Git retain their existing bounded intent serialization and transaction
recipes; source and golden fixtures freeze these, not a newly invented universal
JSON canonicalizer. Ability preserves v1 request/key digests, adds its separate
v2 canonical intent/profile commitment, and hashes its Ability key digest as the
outer v1 opaque idempotency key. The Ability evidence includes nullable receipt
SHA-256. Git SHA-1 object IDs MUST NOT be confused with outer SHA-256 digests.

## 6. Modes and downgrade rules

Modes are chosen by the operator for the replay boundary, never by a producer.
Existing workflows have **legacy** behavior; no new default is installed.
An assurance requirement MUST survive persistence, restart, controller replacement
and intervention. A producer or transport error MUST NOT change required to optional
or legacy. Future mode changes require an authorized, explicit, audited policy
change before admission; manual review does not automatically waive a requirement.

| Mode | Meaning |
|---|---|
| `legacy` | Do not inspect selected assurance; use v1, recording no assurance trust. |
| `optional`, fallback `deny` | Resolve when available; otherwise block this opt-in path. |
| `optional`, fallback `legacy_unavailable` | Only absence or unsupported envelope/profile may fall back to v1, visibly and with assurance_verified=false. |
| `required`, fallback `deny` | Assurance is mandatory for this external-enforcement replay boundary. Every unavailable/invalid/unverified case blocks. |

The fallback field is mandatory and closed. Required/legacy with
`legacy_unavailable` is a configuration error. Optional fallback NEVER applies to
malformed/oversized documents, digest/identity/profile mismatches, unknown fields
in a known envelope, expiry, future validity, revocation, contradictory evidence,
missing evidence, failed verification, unavailable executable/sink, or bad registry
configuration. These are recognized verification failures, not harmless absence.

In the reference API, null means no sidecar was selected or expected. A host MUST
NOT convert a failed read, missing selected artifact, digest error or verifier
failure into null. Keep the controlled artifact association so deletion cannot
masquerade as absence. Those failures block before calling optional fallback.

Optional mode intentionally retains the operator's legacy trust assumptions for
unsupported metadata; selecting it accepts this limited downgrade. It cannot
meet an assurance-required security objective. Even when fallback occurs, no
attestation is fabricated and a v1 denial remains a denial. Operators SHOULD use
required mode when trusting producer enforcement strings is unacceptable.

The reference evaluator covers one external-idempotent action effect. Hosts SHOULD
select this domain before calling it. `none`/local-reversible effects retain their
separate legacy admission path unless a future policy explicitly changes it;
non-idempotent/destructive effects cannot be authorized by this assurance profile.
Multi-effect input to a nonlegacy reference call is blocked, even if v1 allows it.

## 7. Consumer decision matrix (ordered, exhaustive categories)

`V1 allow` means only that retry_is_effect_safe accepts; all other control and
capability gates still apply. `Block` means no mutation/continuation; existing
workflow policy MAY route that denial to review. This specification adds no lifecycle.
Rows are evaluated in order; later rows cannot override an earlier denial.

| Condition | Legacy | Optional deny | Optional legacy_unavailable | Required |
|---|---|---|---|---|
| Malformed policy or invalid execution result | configuration error / block | same | same | same |
| Valid result; legacy explicitly selected; any sidecar | v1 decision, unverified | — | — | — |
| Authoritative exact-result digest differs (before any fallback) | — | block | block | block |
| v1 denies | — | block | block | block |
| Out-of-scope class or multiple effects | — | block | block | block |
| Malformed/duplicate registry; disabled binding; known profile lacks verifier | — | configuration error | configuration error | configuration error |
| Selected configured binding revoked (even if sidecar absent) | — | block | block | block |
| Selected profile/version unsupported | — | block unsupported | v1 fallback, unverified | block unsupported |
| Supported profile/binding; sidecar absent | — | block missing | v1 fallback, unverified | block missing |
| Bounded JSON object; unknown envelope version | — | block unsupported | v1 fallback, unverified | block unsupported |
| Known envelope, mechanism differs from host profile | — | block mismatch | block mismatch | block mismatch |
| Known envelope extra fields, malformed, oversized, conflicting documents | — | block invalid | block invalid | block invalid |
| Recognized, but expired/future/revoked/live verification fails or evidence unavailable | — | block | block | block |
| Recognized, correct binding/current authority/live predicate verified; v1 allows | — | verified v1 eligibility | verified v1 eligibility | verified v1 eligibility |

An unknown **host-selected profile** is unsupported. An unknown or different
**producer mechanism under a known host selection** is a mismatch, not a way to
trigger fallback. Unknown envelope handling never borrows recognizable interior
fields. An invalid known envelope cannot downgrade itself by adding a future field.
In optional fallback an entirely unknown envelope grants zero trust; the old v1
assumptions alone account for any eligibility.

New consumer + old producer follows its host mode: legacy unchanged, explicitly
optional fallback possible, required missing assurance blocked. Old consumers MAY
ignore sidecars, preserving their pre-existing v1 behavior, but cannot enforce new
requirements. Hosts MUST NOT schedule assurance-required continuations onto such
consumers, including rollback deployments. Producer-supplied strings remain
historical integration assertions, never retrospectively verified facts. A new
producer MUST keep v1 effect class, completion and enforcement references truthful
under v1 assumptions independently of sidecar support. It MUST NOT label an
otherwise unsafe effect external_idempotent merely because a newer consumer is
expected to apply additional policy. Consumer ignorance cannot supply enforcement.

## 8. Exact bytes, history and upgrade

Outer result identity is SHA-256 of the exact authoritative UTF-8 result bytes,
lowercase 64-hex. It is **not** SHA-256 of a parsed or canonicalized JSON object.
Whitespace, property order, escapes and trailing newline changes produce a different
identity, even when the parsed result is schema-valid and semantically equal.
No BOM removal, newline normalization or reserialization is allowed before hashing.
The confined current reader rejects non-UTF-8 input; non-UTF-8 is unsupported.

Hosts MUST retain the original bytes, independent digest and controlled evidence
association for the replay horizon. The prototype compares parsed state to result
content as an additional authority check; that comparison is not proof that a
reserialized state snapshot contains the original result bytes. If original bytes
are missing, the system MUST NOT invent them and claim historical byte identity.
Required admission blocks; optional recognized verification failure also blocks.
Explicit legacy selection may still apply old policy without claiming assurance.

Later verification MAY create a new sidecar bound to retained historical bytes,
current live authority and a new validity interval. It MUST NOT mutate or relabel
the historical result, original enforcement strings or old sidecar. Upgrading a
sidecar requires a supported destination profile/envelope, fresh verification and
new independently recorded document digest. Preserve old artifacts and record
supersession outside them. Do not mechanically rename schema/version or copy a
provenance label. Tampering, equivalent reserialization and replaced bytes invalidate
assurance. A new action attempt requires its own result and assurance bindings.

## 9. Attempt identity

V1 permits a string subject attempt ID and a numeric `attempt`. The prototype
requires the canonical decimal `to_string(result.attempt)` to equal subject and
expected attempt, and current `control_attempt` for continuation. Leading-zero,
opaque or differently namespaced identifiers do not satisfy this profile. They
MUST NOT be guessed, parsed into another ID, or silently aliased.

Action/control attempt, evaluator attempt and reexecution are distinct. Assurance
here describes the action execution result. Evaluator-only retry MUST preserve
its existing policy and MUST NOT treat an evaluator counter as proof of action
execution. Reexecution increments the action/control attempt and needs new subject
binding; the business idempotency key may legitimately remain stable.

No typed namespace field is added now: current enclosing action result plus exact
control binding is sufficient for this bounded prototype. An adapter with opaque
attempt IDs retains its original result and is unsupported for this assured path;
it may use explicit legacy policy or remain blocked. Future migration requires
an authenticated lossless mapping recorded as new evidence and a negotiated
profile/envelope change. Arbitrarily rewriting old subject IDs is forbidden.

## 10. Freshness, revocation, retention and failure

Alpha validity is integer UTC seconds, `0 <= valid_from < valid_until <=
253402300799`, interval at most 3600 seconds, half-open [from, until). Hosts MUST
supply a trustworthy current clock at final admission; future/not-yet-valid and
expired documents fail. No implicit grace window or clock-skew extension exists.
Untrusted timestamps from producer content cannot replace the host clock.

Load-time validation is insufficient. Under Dispatch's run lock, reload current
state, effective requirement and live registry; resolve the exact sidecar, current
scope/authority and predicate immediately before continuation publication. The
adapter MUST independently recheck enforcement and applicable authorization at
its actual mutation admission boundary. No cached `ok` or label may bypass either.

Revocation can apply to registry binding, issuer authority or profile-specific
session/principal. Registry revocation is required for all families; application
session revocation is additionally tested by Ability. Revocation is not rollback
of work already admitted. Dispatch and application locks do not form a distributed
transaction: revocation after control publication may deny the business mutation
and produce another controlled failure. Preserve that outcome and uncertainty.

| Missing or changed dependency | Required / recognized optional behavior |
|---|---|
| Evidence artifact removed/corrupted; historical result unavailable | block; review may be requested |
| Sink temporarily unavailable or query fails | block; bounded operator retry may reverify; never infer absence |
| Receipt exists but business state cannot be queried | block, not proof of business success or failure |
| Verifier executable unavailable or identity changed | block; reinstall/reconfigure explicitly, then live reverify |
| Registry disabled/revoked | configuration error / blocked respectively |
| Verifier version changed | discard cached verification; apply reviewed current mapping and regenerate sidecar if predicate/evidence changes |

Expiry does not permit forgetting idempotency keys or recycling intent markers.
Profiles MUST document enforcement retention separately from sidecar validity.
Temporary verifier failure MUST NOT convert a recognized sidecar into “absent”.

## 11. Commit topology and multi-effect boundary

Every profile MUST declare whether its verified predicate covers one atomic
business/evidence commit, multiple durable commits, or eventually published receipts.
Receipt existence alone does not prove business commit; missing receipt does not
prove business absence. Ability commit_failed can mean business absent, committed
or unqueryable. Exact live business state and replay enforcement determine eligibility;
uncertainty is retained in the original reported state. Eventually consistent receipt
profiles are not implemented: until their predicate is verifiable they remain blocked.

Alpha1 resolves exactly one effect. A whole-result `safe=true` cannot represent
independent commits, partial success, differing scopes or mixed replay classes.
Future design SHOULD compare one assurance per effect against a verified atomic
effect group with explicit membership and group transaction identity. Membership
must bind all effect IDs and result bytes, with no missing/duplicate members.
Atomicity MUST be proven by a profile, not inferred from shared transaction strings.
All-idempotent groups still require compatible current evidence for every member;
non-idempotent uncertainty cannot be averaged away by stronger neighbors.
Compensation supported/requested/executed/verified reversal remain separate facts.
No group representation or multi-effect admission is implemented here.

## 12. Migration stages and adapter checklist

| Stage | Deliverable and deployment rule |
|---|---|
| 0: legacy v1 | Existing trusted integrations and effect references; no fabricated assurance. |
| 1: controlled sidecars | Current three-family prototype: opt-in host mappings, exact retained bytes, real failure tests. |
| 2: explicit negotiation | This specification/reference evaluator and advisory catalog; next implement persistent operator selection, config revisions and downgrade-resistant restart/rollback behavior. |
| 3: required deployments | Only after mixed-version/controller migration tests, operators explicitly require assurance for selected external replay boundaries. Never globally enable implicitly. |
| 4: broader conformance | Independently maintained adapters/consumers pass conformance and security review; remote trust remains separate work. |

Adapter migration checklist (MUST satisfy before claiming compatibility):
1. Inventory current effect class, completion and v1 exception assumptions.
2. Identify the actual enforcement mechanism, not merely a supplied key.
3. Establish external authority, authentication and operator configuration boundary.
4. Write the exact verified predicate, absence proof and commit topology.
5. Freeze scope/target/key/request/precondition/transaction digest recipes and vectors.
6. Retain exact result bytes and define sidecar/evidence association and limits.
7. Specify half-open validity, clocks, enforcement retention and live recheck points.
8. Implement registry revocation and applicable application/session revocation.
9. Resolve evidence through bounded controlled stores; never producer-selected egress.
10. Prove crash, contradictory-state, duplicate/concurrent retry and privacy behavior.
11. Run common and profile-specific conformance; pin implementation/configuration versions.
12. Test old/new producer-consumer mixtures, required policy persistence, disabled/revoked
    profiles and deployment rollback before production required-mode adoption.

## 13. Reusable conformance contract

`tests/assurance_conformance.kujo` runs the same reference behavior against the
live verifier mappings of SQLite, Git and Ability inside their real fixtures.
`tests/assurance_compatibility_tests.kujo` compares 60 legacy class/state cases;
`tests/assurance_capabilities_tests.kujo` checks the advisory catalog. Existing
adapter crash/security suites remain necessary; helper-only success is insufficient.

| Category | Mandatory for every profile | Profile-specific additions |
|---|---|---|
| Identity | Wrong run/step/action attempt/effect/exact result; original bytes unchanged | Opaque-attempt mapping only under future negotiated support |
| Intent | Changed target/scope/key/request/precondition/transaction; cross-profile rejection | Git old/new OIDs and target movement; Ability definition/version/principal |
| Authority | Unconfigured/forged issuer, revoked/disabled registry, duplicate config; capability spoofing grants no authority | Authenticated tenant/principal/session revocation where applicable |
| Freshness | Expired, future, load-then-delayed admission; live enforcement recheck | Application authorization at business mutation |
| State | Proven absence, committed, uncertainty, contradiction; v1 denial remains denial | Git marker/postcondition; Ability business/receipt disagreement |
| Crash | Real before/after effect commit and before reply; fresh process verification | Separate receipt commit barriers required for dual-commit profiles |
| Concurrency | Duplicate retries and competing admission; one logical protected effect | Application owner fencing; Git CAS conflict; atomic DB key uniqueness |
| Privacy | Sensitive canary absent from assurance/diagnostics/verifier logs/journal reasons | Private application body may remain only in its authorized store |
| Bounds | Oversize, long/invalid IDs, unsupported version, extra fields, conflicting docs, malicious references | Confined reads/symlink policy; bounded external commands |
| Compatibility | Legacy/no assurance; verified known; unknown envelope/profile; explicit optional fallback; required no downgrade; historical sidecar/new-byte rejection | Document implementation revision and supported predicate |

Tests requiring a separate receipt or principal are N/A only with a documented
profile reason, not a skipped failed check. The current three families pass the
implemented common suite plus their existing real sink suites. A complete generic
adapter certification runner and persistent-policy mixed-version deployment tests
remain future work; “conforms here” is not universal certification.

## 14. Bounded local capability description

`schemas/capabilities/assurance-reference.json` and its closed schema describe
supported result/envelope/profile versions, mechanisms, predicate identifiers,
live verification, revocation kind, 8192-byte limit and multi_effect=false.
The file is at most 8 KiB with at most eight profiles and 128-character labels.
There are no executables, roots, credentials, endpoints or installation actions.
Duplicate (ID, version) declarations are invalid. The catalog is advisory and
MUST NOT substitute for the current installed registry or its authority bindings.
No network discovery protocol or public registry is introduced.

## 15. Maturity gates and remaining work

Remain **v1alpha1**. Specification completion is not ecosystem stability.

Before **v1beta1**, MUST have: the canonical rules and immutable digest vectors;
common suite invoked against all three real families; persistent operator requirement
and registry/configuration revision integration; tested old/new consumers, restart
and rollback without downgrade; negative negotiation/authority cases; documented
profile limitations; and fresh security review with no unresolved admission bypass.

Before **v1**, additionally MUST have: at least two independently maintained
consumer implementations; adapter migration rehearsals with retained historical
bytes; a published compatibility/deprecation policy; stable reason codes and
profile semantics; bounded operational/retention guidance; release artifacts
passing the conformance matrix; and security review of all supported trust transports.
Remote trust and multi-effect support are not implicit prerequisites for a clearly
scoped local single-effect v1, but MUST remain explicitly unsupported until proven.
No stable/promoted claim is made by this assignment.

**Recommended next task:** implement compatibility negotiation in persisted
Dispatch admission paths: operator-owned mode/profile/configuration revision,
reload under lock, downgrade-resistant restart and mixed-version/rollback tests.
Use this reference evaluator; do not add adapters, global enablement, result/v2,
remote PKI or multi-effect execution in that slice.
