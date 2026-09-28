# Experimental interoperability correlation core

`kujo.interop-handoff/v1alpha1` is opt-in, experimental and unreleased. It extracts
correlation common to four participants across Ability and Workcell Git. It is
neither an agent protocol nor a workflow lifecycle, receipt ledger, telemetry event
or assurance envelope. MUST/MUST NOT are interoperability requirements.

## Core contract

The [structural schema](contracts/interop/kujo.interop-handoff.schema.json) has eight
required properties, no others:

| Property | Meaning |
|---|---|
| `schema` | Exact `kujo.interop-handoff/v1alpha1` |
| `subject` | Closed `run_id`, `step_id`, `attempt_id`, `effect_id` from the current Dispatch action boundary |
| `participant` | Closed `namespace`, `invocation_id`; participant identity, not workflow authority |
| `completion_knowledge` | `reported` or `unknown`, as defined below |
| `execution_result_ref` | Required exact content address of authoritative `kujo.execution-result/v1` bytes |
| `assurance_ref` | Exact content address of selected assurance bytes, or null when none selected |
| `participant_extension` | Exactly one registered closed participant extension |
| `effect_extension` | One registered closed effect-family extension, or null |

Subject and participant IDs are 1–128 ASCII bytes matching
`[A-Za-z0-9][A-Za-z0-9_.:-]*`; no newline. A namespace is an operator-registered,
owner-qualified name such as `agents-sdk.tool`. Registration, not a producer's
spelling, establishes ownership. New owners SHOULD use a domain-qualified namespace
to avoid collisions. Conflicting/unknown registrations MUST fail, never fall back.

The current Dispatch consumer supports exactly one effect in the result. The
subject attempt identifies the **action** attempt and must equal both the result's
subject attempt and the decimal rendering of its numeric `attempt`. Evaluator,
opaque and multi-effect attempts are outside this consumer's domain; no implicit
conversion is permitted. This does not introduce a global participant attempt model.

`reported` means a usable terminal participant report was observed, including an
error report. `unknown` means no usable terminal report was observed. Neither means
that the external effect committed, failed, was compensated, or is replay-safe.
A receipt-commit error may be `reported` while business completion remains uncertain.
Lost HTTP responses and killed Git processes remain `unknown` even after a live
verifier proves a commit. The original outcome remains in the owner extension.
Consumers MUST NOT derive admission, retry, effect class/state, or assurance strength
from either value.

## Wire and resource rules

Wire is UTF-8 compact sorted-key JSON, matching the string/object/null subset of
[portable-json/v1](contracts/portable-commitments.md). No whitespace outside strings, duplicate
keys, alternate escapes, or reordered keys are accepted. Consumers MUST compare
canonical encoding with original bytes; parsing and normalizing malformed wire
into acceptance is forbidden. Historical source wire is validated by its original
contract, not rewritten into this encoding.

Limits are UTF-8 **bytes**, not characters: whole document 6144; core projection
(the first six properties, excluding both extensions) 2048; each extension 2048;
each identifier/value 128. Exactly one participant extension and at most one effect
extension are permitted. Each extension is `{schema, values}` with no other keys;
`values` is a flat object of at most 16 string/null fields. Its key vocabulary and
value semantics MUST additionally pass the registered owner's **closed** schema
and semantic validator. Structural schema success alone is never correlation success.
No nested maps, arrays, free-form metadata, payloads, commands, paths, URLs,
credentials, principal bodies or receipt bodies are permitted.

References are `sha256:` plus exactly 64 lowercase hexadecimal characters, hashing
**exact original bytes**, not parsed objects. They are neither paths nor tokens.
Consumers MUST use host-authorized confined content storage, reject symlinks/path
escape, enforce read bounds and rehash on read. Dispatch uses `artifacts/<hex>.json`
under the host root (an implementation layout, not wire authority), up to 1 MiB for
execution results and 8192 bytes for selected assurance. Missing/tampered artifacts
fail correlation. Null assurance is accepted only when the caller selected none;
selected-but-unreadable assurance MUST NOT become null. No third generic evidence
reference or generic transaction field is justified by these four participants.

## Owner extensions and migration

All extensions are required when present; there is no optional/unknown-extension
fallback. The trusted host selects namespace, extension schema pair and validator.
An untrusted document cannot select executable code or confer trust by returning
`ok: true`. Schemas are published in [contracts/interop](contracts/interop).

| Source | Core invocation | Participant extension and retained fields |
|---|---|---|
| `agents-sdk.ability-handoff/v1alpha1` | `sdk_invocation_id` | `agents-sdk.tool-correlation/v1alpha1`: sdk_run_id, tool_call_id, tool_name, outcome |
| `mcp.ability-handoff/v1alpha1` | `mcp_invocation_id` | `mcp.stdio-tool-correlation/v1alpha1`: mcp_server_id, mcp_session_id, rpc_request_id, mcp_request_id, tool_name, outcome |
| `http.ability-handoff/v1alpha1` | `http_request_id` | `http.operation-correlation/v1alpha1`: client_request_id, method, route_id, operation_id, outcome |
| `workcell.git-process-handoff/v1alpha1` | `participant_invocation_id` | `workcell.process-correlation/v1alpha1`: participant_id, participant_call_id, outcome |

The first three use `ability.effect-correlation/v1alpha1`: ability_id,
ability_version, definition_digest, ability_invocation_id, receipt_id, receipt_ref,
transaction_sha256. Git uses `workcell.git-correlation/v1alpha1`:
workcell_effect_id and transaction_sha256. These commitments have different family
semantics and MUST NOT be interpreted by the core. Target/scope/key/request and
preconditions remain in assurance/profile bindings. Receipt validation remains in
the Ability-specific adapter.

Each source's four `dispatch_*_id` fields map to subject; its two reference fields
map unchanged. Source schema identity selects an explicit trusted adapter; it is
not copied as a second generic schema. Original invocation field spellings are
historical compatibility details; the underlying distinct identity is retained.
All source fields are accounted for by this table and the effect extensions.

Knowledge mapping is conservative: receipt_succeeded, receipt_failed,
application_error and completed map to reported; all other accepted legacy outcomes
map to unknown (including MCP application_failed, which lacks a usable receipt).
A new participant defines its own owner-reviewed mapping without extending a giant
generic outcome enum.

Legacy adapters MUST validate original shape, bytes, participant host bindings,
family evidence and result correlation before exposing normalized output. Formatting
alone (`normalize_legacy_handoff`) is **not validation**. The validated binding
snapshot closes both extensions and knowledge; generic checks then bind current
subject and exact result/selected assurance references. Original artifacts and
hashes MUST remain unchanged. An adapter MAY expose the normalized representation
alongside its original response; existing response fields remain intact.

The four compatibility parsers currently remain in Dispatch, where the existing
readers lived. This avoids producer churn and circular imports. Native producers
and closed extension validators should be participant-owned; Dispatch's generic
core MUST NOT acquire participant-specific branches. Registration is an installed
callback, not a hosted registry or producer-controlled JSON configuration.

## Admission and fifth-participant boundary

The local Kujo API is
`correlate_interop_handoff(root, raw, expected, result_raw, assurance_raw, registration)`.
`expected` is the host's closed `{subject, participant}` snapshot. `registration`
contains exact `namespace`, `participant_schema`, nullable `effect_schema`, and
installed `validate(document, result)` callback. The callback MUST validate the
closed extension vocabulary and its binding to authorized participant/family facts;
it MUST NOT merely echo producer assertions. `result_raw` is the authoritative
result byte string; `assurance_raw` is the selected byte string or empty when none
was selected. Root, callback and authoritative inputs are host arguments, never
wire properties. Production callers remain responsible for using the current
locked boundary; the function does not acquire a workflow lock itself.

`correlate_interop_handoff` returns correlation success or bounded
`interop_correlation_mismatch`. Success grants **no permission**. The caller MUST
still reload authoritative state under the existing lock, enforce persisted
negotiation, resolve the exact installed revision, and perform existing live beta
verification/replay policy. This extraction changes none of those mechanisms.

A fifth participant needs its owner namespace, opaque invocation identity, closed
participant extension and host validator, plus the core subject/references. It need
not know Ability/Git/SDK/MCP/HTTP. Effect extension may be null when no additional
family correlation is needed. The test-only `example.job` registration proves this
without adding another production participant or effect verifier.

Standalone participants do not emit synthetic Dispatch identities. Watchdog remains
observation and RunLedger remains durable receipt/reference storage; neither is
merged with this handoff.

## Evidence and next adoption

See [field audit and validation](audits/wave-d-core.md), frozen pre-extraction
readers and byte-preserved fixtures under `tests/fixtures/interop_*`.
`tests/interop_history.kujo` checks old/new decision equivalence, every host
identity, generic/extension substitutions and byte preservation. All real participant
fixtures compare frozen-reader and adapted-reader booleans on positive and negative
paths before unchanged live verifier/admission. Human diagnostics are not the oracle.

The native [external TypeScript participant](../interop/typescript-participant/README.md)
now implements this core from packaged published contracts with an independent codec
and closed owner extension. The existing generic API accepts its installed validator;
no fifth family-specific reader is required. See [adoption evidence](audits/wave-d-typescript.md).
The independent [Python participant](../interop/python-participant/README.md) now
emits this core natively too; its closed owner validator uses the same generic API.
See [Python adoption and cross-runtime parity](audits/wave-d-python.md). Neither
adopter adds normative wire semantics. Next: design a minimal participant SDK API
from both runtimes, without freezing or publishing it. Remote trust,
multi-effect, stable promotion and universal lifecycles remain outside scope.

Draft 2020-12 schemas are independently checked with
`python3 tests/interop_schema_check.py` after the Kujo historical fixture. This
maintenance-only check uses python-jsonschema 4.x because Kujo’s current subset
validator lacks `propertyNames` and `maxProperties`; production validation remains
Kujo-native and enforces byte bounds and semantic bindings directly.
