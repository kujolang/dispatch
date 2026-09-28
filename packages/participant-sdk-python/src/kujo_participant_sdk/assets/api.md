# Alpha API snapshot

Public root exports: `create_codec(registration), content_ref(bytes), SDKError, CorrelationError, CONFORMANCE`.

Registration is a detached, host-installed closed declaration:
`{namespace, participant: {schema, fields}, effect: {schema, fields} | null}`.
Field kinds: identifier, sha256, reference, nullable_identifier. No executable
validator, payload registration, plugins or mutable registry. At most 16 fields.

| Concept | TypeScript | Python | Result |
|---|---|---|---|
| Codec | createCodec | create_codec | immutable callable collection |
| Encode | encodeHandoff | encode_handoff | exact canonical bytes |
| Parse | parseHandoff | parse_handoff | detached document |
| Reference | contentRef | content_ref | sha256: lowercase exact-byte digest |
| Correlation | matchExpected | match_expected | true or CorrelationError |
| Provisional | provisional | provisional | requires unknown |
| Terminal | terminalReport | terminal_report | requires reported |
| Finalize | finalizeAfterReadback | finalize_after_readback | preserves explicit knowledge |

Every recording operation accepts a complete host-supplied handoff. None performs
readback, writes evidence, invokes a callback, acquires admission, or reruns work.
Fresh recording-only processes need no effect capability. A new assurance reference
produces new immutable bytes. Old artifacts are never rewritten.

TypeScript bytes are Uint8Array (Buffer accepted); Python bytes are bytes.
Handoff limit 6144 bytes; core 2048; each flat extension 2048/16 fields;
ASCII identifiers <=128; exactly one participant extension, at most one effect
extension. Noncanonical wire, duplicates, floats, bad UTF-8 and unknown fields fail.

Errors expose only bounded `code`, never payloads. Codec codes: invalid_handoff,
bounds_exceeded, unsupported_extension, invalid_registration, invalid_knowledge,
sdk_assets_invalid. Correlation codes: subject_mismatch, participant_mismatch,
result_ref_mismatch, assurance_ref_mismatch, extension_mismatch, knowledge_mismatch.
Asset corruption at import fails before public API creation with sdk_assets_invalid.
This is an experimental snapshot, not a stability promise.
