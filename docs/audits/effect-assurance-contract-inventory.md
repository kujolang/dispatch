# Wave C alpha contract inventory

Baseline: Dispatch 472070e, Workcell b34c26c, Ability f103ac5, Kujo 6210eaa.
See [beta review](../effect-assurance-beta-review.md) for decisions. Classification:
S stable semantic requirement; C compatibility requirement; I implementation detail;
P prototype restriction; F profile-specific; R redundant; X potentially breaking
if frozen without further specification. Multiple labels are intentional.

## Execution-result/v1 (unchanged)

Source: Kujo `schemas/workflow-control/execution-result-v1.schema.json`, Dispatch
`src/core/control.kujo`, `src/core/intervention.kujo::retry_is_effect_safe`.

| Surface | Classification | Meaning |
|---|---|---|
| schema, result_id, subject.run_id/step_id/attempt_id | S/C | Existing execution identity; string subject distinct from numeric attempt |
| producer.name/version | S | Attribution, not authentication |
| status, classification, attempt, retry.disposition/reason | S/C | Existing execution and retry facts; no assurance-created lifecycle |
| started_at/finished_at | S | Execution timestamps, not assurance validity |
| effects[].effect_id/class/state | S/C | Effect identity, replay class and completion are separate |
| idempotency_key/enforced_by/enforcement_evidence_ref | S/C | Nullable producer/integration references, not automatically attested |
| compensation | S/F | Metadata alone is not verified reversal |
| evidence/output/warnings/summary/workspace_ref/reexecution_descriptor_ref | S/F | Existing result references; no automatic evidence URL resolution |

V1 schema's multi-effect capacity is not the assurance resolver's admitted domain.
The resolver requires exactly one external_idempotent effect and v1 eligibility.

## Assurance envelope: every field

Schema: `schemas/effect-assurance-v1alpha1.schema.json`.
Implementation: `src/core/effect_assurance.kujo`.

| Field(s) | Class | Current contract / beta decision |
|---|---|---|
| schema | C | Exact alpha token; never prefix/version-number matching |
| run_id, step_id, effect_id | S | Exact bounded subject binding |
| attempt_id | S/P/X | Exact action identity; decimal-only relation is resolver restriction |
| result_sha256 | S/C | Exact original UTF-8 result bytes; preserve |
| issuer | S | Attribution checked against external configured authority |
| assurance | P/X | Four provenance labels, not an ordering; propose method terminology |
| operation | F/P/X | create/update only; belongs to profile domain |
| replay_class, reported_state | S/R | Exact copies of authoritative v1 facts; no independent producer discretion |
| observed_state | F/P/X | Only not_started/committed, profile predicate not universal knowledge taxonomy |
| target_sha256, scope_sha256 | F/S | Operator-bound logical resource and namespace |
| key_sha256 | F/S | SHA-256 of exact v1 key string |
| request_sha256, precondition_sha256 | F/S | Intent and expected prior-state commitments |
| transaction_sha256 | F/P/X | Profile recipe; not universally a database transaction |
| mechanism | F/P/X | Closed three-family names; profile/version should own predicate |
| evidence_ref | S/F | sha256-prefixed observation commitment; profile defines preimage |
| valid_from, valid_until | S/P | UTC integer half-open interval; 3600 ceiling is current local limit |
| compensation | R/P | Always not_evaluated; omit from proposed generic beta envelope |

Closed keys; 8192 bytes; ASCII identifiers 1–128; raw SHA-256 lowercase hex;
result max 1048576 bytes. Shape validation is not authenticated verification.
The exported shape helper in this review is an internal reuse API, not new proof.

## Negotiation and configuration: every field

Schemas `assurance-negotiation-v1alpha1.schema.json` and
`assurance-configuration-v1alpha1.schema.json`; sources
`assurance_state.kujo`, `assurance_configuration.kujo`, `assurance_compatibility.kujo`.

| Field(s) | Class | Meaning |
|---|---|---|
| schema (both) | C | Exact independently versioned token |
| mode, fallback (both) | S/C | legacy/optional/required; deny or explicit legacy_unavailable |
| profile, profile_version (both) | S/C | Exact operator-owned selection; not tool authorization policy |
| config_revision (negotiation) | S/I/X | SHA-256 of serialized descriptor; portable recipe needs vectors |
| policy_sha256 (negotiation) | S/I/X | SHA-256 of six other policy fields serialized by Kujo |
| issuer, mechanism (configuration) | S/F | Selected authority and profile implementation |
| verifier_id, verifier_version | S/I | Operator identity/version; not supplied by producer |
| verifier_sha256 | I/S/X | Hash of serialized ordered source-hash array; local installation commitment |
| authority_sha256 | S/F | Operator-owned authority commitment; excludes secrets/raw configuration |

Legacy has empty profile/version/revision and deny fallback. Historical missing
negotiation means historical legacy, not explicit verified policy. No mutation API
for policy. Source manifests contain 1–16 files, each <=1 MiB; persisted policy has
no executable paths. The host resolves exact revision to descriptor, authority,
implementation, verify function, expected context and raw result. Host status
active/missing/revoked is current authority, not a producer assertion.

## Capability/catalog and registry

Schema `assurance-capabilities-v1alpha1.schema.json`, catalog
`schemas/capabilities/assurance-reference.json`.

| Field(s) | Class | Meaning |
|---|---|---|
| schema, advisory | C/S | Exact type, explicitly non-authoritative |
| execution_results, envelopes | C | Exact supported schema strings |
| max_document_bytes, max_effects, multi_effect | C/P | 8192, 1, false current bounds |
| profiles[].id/version | C/F | Exact profile selection; <=8 entries |
| profiles[].mechanism/predicate | F/P | Closed current mechanisms, descriptive predicate IDs |
| profiles[].live_verification/revocation | S/F | Required live check, profile revocation kind |

In-memory registry entries: profile/version/issuer/envelope/status/assurance/verify
(S/C except verify function I). Duplicate registrations reject; no executable or
trusted root comes from catalog/sidecar. Beta must not freeze callable layout as a
universal transport protocol.

## Persisted fields, guards, journal and checkpoints

Source `assurance_state.kujo`, `assurance_configuration.kujo`, `control_journal.kujo`,
`checkpoint.kujo`, state-store/import/export modules and persisted fixtures.

| Surface | Class | Contract |
|---|---|---|
| assurance_negotiation | S/C | Immutable normalized policy anchored at run creation |
| required_features | C | effect-assurance-negotiation/v1alpha1; unsupported writers refuse |
| assurance_store | I/S | Pinned filesystem/sqlite authority, not weaker process default |
| assurance_selection / assurance_replay | S/I | Source attempt/result/sidecar commitment and admitted next attempt, journal checked |
| DISPATCH_ASSURANCE_STATE_V1ALPHA1 prefix | I/C | Local old-writer exclusion; not universal envelope encoding |
| control-event schema/sequence/event_id/previous_sha256/event_sha256 | C/S | Existing hash-linked journal, not a second assurance log |
| run_id/state_revision/subject/record_ref/refs/details/occurred_at/kind | S/I | Existing event framing; redacted bounded details |
| assurance_policy_selected | S/I | policy, storage, workflow_sha256, input_sha256 |
| assurance_sidecar_selected | S/I | step_id, attempt_id, result_sha256, sidecar_ref, sidecar_sha256 |
| assurance_replay_admitted | S/I | policy_sha256, config_revision, resolution, replay, decision |
| assurance_resolution_denied | S/I | bounded code, policy_sha256, config_revision |
| review checkpoint schema/id/scope/run_id/state_revision/boundary_id | C/S | Existing-run-store continuation, not portable machine snapshot |
| state_ref/state_sha256/input_sha256/workflow_sha256/control_policy_sha256/journal | S/I | Entire canonical state except health binds negotiation; no duplicate policy field needed |

State reads 8 MiB; journal reads 8 MiB; individual journal records 1 MiB; checkpoint
manifest 64 KiB. Journal hash uses serialized redacted unsigned event. Checkpoint
hash uses serialized state excluding health. These are local Dispatch commitments,
not cross-language signed-message formats. Bundle signature alone is not rollback
protection; surviving authority/journal is required. Secondary JSON is not authority.

## Profile digest/predicate inventory

Sources: Dispatch `src/adapters/sqlite_effect.kujo`, Workcell
`src/evidence/git_effect.kujo`, Ability `examples/application-assurance/gateway.kujo`
and `src/internal.kujo`, Dispatch `src/adapters/ability_assurance.kujo`.
All values below are F/S; serializer-dependent recipes additionally X.

| Profile | Exact current recipe and predicate |
|---|---|
| SQLite | Intent includes operation/target/scope/key/request/precondition/validity. Transaction=SHA256(Kujo to_json(intent)). Unique(scope,key) plus logical effect/request atomically recorded. Evidence=SHA256(to_json([sqlite_unique_transaction, transaction, observed_state])). |
| Git | Same intent commitment; operation update. Precondition/request hash exact old/new OID strings; prototype supports 40-hex Git OIDs. Marker contains exact intent; target satisfies CAS postcondition. Evidence uses [git_ref_cas_transaction, transaction, observed_state]. |
| Ability | Legacy json_digest binds tenant/principal/key and normalized Ability/version/definition/input/principal request. v2 explicitly serialized sorted-key JSON binds principal/profile/transaction. Input hash is exact body string; transaction is profile before transaction field. Dispatch scope=principal hash, key=SHA256(key digest string), request=request digest, precondition=SHA256(Kujo to_json(full profile)). Evidence v2 hashes profile/business_state/receipt_sha256/verification. |

SQLite/Git validity is inside transaction identity; renewal is not free. Ability
receipt changes may alter evidence identity after business commit. The current
resolver requires evidence_ref equal to the original result's enforcement reference.
Do not promise arbitrary historical renewal without satisfying that equality and
persisted immutable selection. JSON helper names alone are not portable byte specs.

Ability profile document fields (`ability.application-assurance/v1alpha1`) are
ability_id, ability_version, definition_digest, surface, principal_sha256,
tenant_sha256, key_digest, request_digest, input_sha256, intent_sha256,
target_sha256, operation and transaction_sha256, plus schema. These are profile
bindings (F/S), not new generic envelope requirements. The verifier checks the
configured authenticated session; JSON tenant/principal are not authentication.

## Reason/error surfaces

See [machine-readable source inventory](evidence/beta-review/reason-codes.json).
It inventories literal codes and source paths; inclusion does NOT grant beta
stability. Assurance resolver outcomes are ok/code plus verified metadata;
compatibility outcomes are ok/action/code/assurance_verified. Actions verified,
legacy, blocked, configuration_error remain explicit. Never infer permission from
an error-code substring. Future beta categories are proposed in the review; exact
internal exceptions/process diagnostics remain implementation details.
