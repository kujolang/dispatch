# Proposed beta assurance and migration contract

Status: **prepared for opt-in beta adoption rehearsal, unreleased**. Alpha remains
supported. This document defines the bounded beta candidate implemented here; it
does not promote a stable release, enable assurance globally or change execution-result/v1.
MUST/MUST NOT/SHOULD are normative requirements within this declared scope.

## Independently versioned surfaces

| Surface | Alpha | Proposed beta |
|---|---|---|
| Execution result | kujo.execution-result/v1 | unchanged |
| Envelope | dispatch.effect-assurance/v1alpha1 | dispatch.effect-assurance/v1beta1 |
| Selected profile version | 1alpha1 | 1beta1 |
| Persisted negotiation | dispatch.assurance-negotiation/v1alpha1 | dispatch.assurance-negotiation/v1beta1 |
| Configuration descriptor | dispatch.assurance-configuration/v1alpha1 | dispatch.assurance-configuration/v1beta1 |
| Required controller feature | effect-assurance-negotiation/v1alpha1 | effect-assurance-negotiation/v1beta1 |
| Common conformance | dispatch.effect-assurance-conformance/v1 | same semantic suite version plus beta extensions |

These identifiers MUST be exact matched independently, never inferred by replacing
a suffix. A profile manifest states precisely which envelope it supports. Catalogs
are advisory, not an installation/authentication path. Namespace ownership for the
three existing IDs is kujolang; external owners SHOULD use an owner-controlled
reverse-domain namespace and explicit operator registration. No DNS lookup grants
trust. No aliases, version ranges or executable selection from documents.

## Beta envelope

Closed schema: [effect-assurance-v1beta1](../../schemas/effect-assurance-v1beta1.schema.json).
Canonical wire encoding is [portable-json/v1](portable-commitments.md), max8192 bytes.

| Field | Semantics |
|---|---|
| schema | Exact beta envelope identifier |
| subject | Closed kind=action, run_id, step_id, attempt_id, effect_id, result_sha256 |
| profile | Closed id/version selecting one documented verified predicate |
| issuer | Attribution that MUST match external configured authority |
| verification_method | live_readback; a method, not an organizational independence claim or strength ranking |
| validity | Closed from/until integer UTC, half-open interval |
| evidence_ref | sha256-prefixed commitment to the profile's current observed evidence |
| bindings | Closed profile facts; operation, target/scope/key/request/precondition/transaction SHA-256, reported_state, replay_class, observed_state |
| profile_sha256 | SHA-256 of portable_json(bindings) |

Profiles own their closed binding schemas, recipes, allowed operation and observed predicate.
The generic envelope only bounds the bindings object (at most16 fields); a valid
envelope alone is insufficient. Consumers MUST additionally validate the installed
profile schema. Unknown profile/version grants no trust and is not partially read. SQLite
and Ability create; Git updates. Mechanism is selected by installed profile/config,
not a generic producer field. The redundant compensation placeholder is removed.
The old provenance ladder is replaced by a precise method plus external authority.
Alpha fields/labels remain exactly alpha; no alpha extras are accepted as beta.

This candidate supports exactly ONE external_idempotent effect in a ONE-effect
execution result, not selection from a multi-effect result. Subject IDs are bounded
ASCII; canonical decimal action attempt must agree with the numeric result/current
control attempt. No opaque/evaluator attempt coercion or new language syntax.
Current profiles retain <=3600-second validity. No renewal API, multi-effect grouping,
compensation framework or remote trust is implied.

A verifier MUST compare subject/result/intent bindings to independently trusted
expected context, resolve current authority, inspect current sink predicate, and
apply existing v1 replay safety. Unknown non-idempotent effects remain blocked.
The external_idempotent + unknown + existing enforcement references exception is
preserved. A predicate does not turn unsafe v1 policy into permission.

## Persisted policy and trusted installation

Only **required/deny** is admitted for NEW proposed-beta runs in this rehearsal.
Alpha legacy/optional-deny/optional-legacy_unavailable/required behavior is retained
unchanged. This deliberate subset does not silently reinterpret optional as required:
unsupported beta policy combinations fail configuration validation. Adding optional
beta fallback would require a separate compatibility review; there is no automatic
forward fallback to alpha verification.

The seven policy fields and eleven public descriptor fields retain their meanings;
beta uses portable_json commitments and distinct schema/version identifiers.
See [negotiation schema](../../schemas/assurance-negotiation-v1beta1.schema.json) and
[configuration schema](../../schemas/assurance-configuration-v1beta1.schema.json).
The revision binds policy/profile/version/issuer/mechanism/verifier identity,
verifier version/content manifest and authority digest. Source manifests are local
installation commitments, not cryptographic proof of execution; pin controller,
runtime and relevant dependencies in operator deployment. New code bytes or changed
authority require a new revision. Persisted run selection remains immutable.

Existing run lock, journal, revision, checkpoint and SQLite authority remain the
only admission authority. Beta state uses required feature v1beta1 and the protected
codec discriminator `DISPATCH_ASSURANCE_STATE_V1BETA1` followed by newline. Alpha
state retains its original codec. This codec is a Dispatch implementation of the
property “incompatible writers MUST refuse mutation,” not a universal storage
format. Missing/revoked exact revision, wrong feature/schema or code substitution
blocks. A weaker process default cannot change that result.

At final locked admission and immediately before execution, reload authoritative
state, reconcile journal, resolve exact installed revision and live revocation,
read/digest-check selected evidence, verify live profile predicate/freshness, then
apply existing intervention and v1 policy. The application rechecks at its own
mutation boundary. No cached verified flag crosses these checks. Separate locks
are not a distributed transaction. No protection against hostile operator/root or
rollback of every store and authority together is claimed.

## Migration rules and real rehearsal

There is NO in-place alpha-run migration operation. Running/protected alpha runs
remain alpha. New beta runs are explicitly created with beta descriptor/policy.
An alpha-created run is still alpha when a beta-aware binary loads it. Historical
legacy runs remain legacy. Old artifacts and their enforcement references remain
producer/integration statements; never relabel them as beta verification.

A retained historical result MAY receive a separately generated beta artifact only
after fresh verification under a supported beta profile. That artifact does NOT
change the alpha run's policy or make it admissible there. Preserve exact result,
old sidecar and selected association. Beta artifact existence is not a migration
operation. If current evidence no longer matches the original result reference,
verification fails rather than rewriting it. Key/intent/receipt retention and
renewal limitations in each profile continue to apply.

| Rehearsal | Result for each SQLite/Git/Ability family |
|---|---|
| Alpha-created run, beta-aware fresh controller | Alpha policy/revision retained; verified replay and descendant |
| New beta-created run, fresh controller | Beta policy/profile/revision retained; verified replay and descendant |
| Protected beta run, actual pre-beta 6cdc364 controller | Refuses load/mutation; authoritative state bytes unchanged |
| Alpha sidecar selected for beta-required run | beta_unsupported_envelope; no second action |
| Beta sidecar selected for alpha-required run | compat_envelope_unsupported; no second action |
| Historical exact result bytes receive beta sidecar | Fresh real verifier checks; original bytes unchanged; no run migration |

Each positive execution retains a checkpoint and one logical business effect.
Denied attempts may append existing bounded audit records; policy and business
invocation remain unchanged. The common negative beta suite additionally rejects
subject/binding/profile/version/method/commitment substitution, extra fields,
noncanonical/duplicate JSON, expired/future validity, changed result bytes and
failed live verification. Existing alpha and legacy gates remain mandatory.

## Reason categories

Beta's reason_category is a diagnostic classification, NEVER permission. Stable
candidate categories: unsupported_envelope, unsupported_profile,
configuration_unavailable, contract_invalid, binding_mismatch, freshness_failed,
authority_revoked, verification_failed, result_policy_denied. Incompatible protected
controllers use the existing assurance_controller_incompatible failure; unresolved
installation/revision failures retain their existing bounded assurance codes.
Internal code remains available for debugging but is not all frozen as beta API.
Unknown codes/categories deny; do not parse substrings to obtain fallback.

## Profiles and conformance

- Dispatch owns [SQLite](sqlite-assurance-profile.md).
- Workcell owns [Git](https://github.com/kujolang/workcell/blob/main/docs/contracts/git-assurance-profile.md).
- Ability owns [application gateway](https://github.com/kujolang/ability/blob/main/docs/contracts/application-assurance-profile.md).

`dispatch.effect-assurance-conformance/v1` names the semantic common suite: exact
identity/intent, external authority, freshness, bounds/privacy, live state, v1 denial,
legacy preservation and explicit unavailable-only fallback. The current alpha
reference has69 assertions; count is evidence, not the version definition. Beta
extends it with closed canonical-wire/profile/version isolation and migration;
the real verifier suite currently has33 assertions. Owners additionally MUST run
their declared crash/concurrency/authentication/dual-commit tests. Codec bytes,
shard count and helper layout are implementation tests, not portable semantics.

Profile manifests are static bounded documents (<=8KiB), closed descriptive fields,
with exact supported envelope/profile pairs, owner, predicate, vector reference,
beta binding-schema reference,
conformance version, live_verification=true and multi_effect=false. Relative vector
references are documentation references, NOT consumer fetch instructions. Operators
must install/review implementations themselves. No hosted registry or discovery
protocol is introduced.

## Portability claim and adoption boundary

Independent Node and Python checkers reproduce all58 frozen vectors. A temporary
clean-room tree contains only specs/schemas/vectors/public examples plus independent
standard-library checkers, and validates six representative alpha/beta artifacts.
That test proves bytes/structure, not current authentication or replay safety.
Actual live SQLite/Git/Ability fixtures prove the latter separately.

The previous B1–B3 blockers are closed for this declared local, bounded value,
single-effect, required-beta domain when the retained gates pass. This prepares the
beta design for **adoption rehearsal**, not a stable release or universal assurance.
Remaining: independent production consumer adoption, remote authenticated transport,
multi-effect semantics, general state recovery, arbitrary Ability value domains,
optional-beta policy design and long-lived evidence renewal. Do not begin Wave D
as a consequence of passing these fixtures.
