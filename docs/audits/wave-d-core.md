# Wave D correlation core: source audit and implementation record

2026-09-27, pre-implementation audit. Fetched main equals local HEAD: Dispatch
`fbbf8dc2d701e2d35182f65192eccb05a66b5999`, Kujo
`1cec8849f72ff8a32e76ac2bec94ba044ed96a25`, Workcell
`1940da0639b70b702c1b1077dda51ca39b065216`, Ability
`d6c970785f8d8bea04de0dce37920c2d0ca1c067`, MCP
`a7ec0dd8e6bcae303ab1431b4586dfe3e91f3a5a`, Agents SDK
`af0aa28f5960232cbafa7cf528a32db8cb36c7a9`. SDK unrelated untracked maintenance
files are preserved. Only Dispatch implementation and Kujo documentation are
planned changes; participant producers and historical bytes remain untouched.

## Complete field inventory

Source contracts: Agents SDK `schemas/ability-handoff-v1alpha1.schema.json` (19
fields); MCP `schema/mcp-ability-handoff-v1alpha1.schema.json` (21); Ability
`schema/http-ability-handoff-v1alpha1.schema.json` (20); Workcell
`docs/contracts/git-process-handoff-v1alpha1.schema.json` (13).

| Classification | Every applicable field |
| --- | --- |
| Generic controller/evidence | All four: schema; dispatch_run_id, dispatch_step_id, dispatch_attempt_id, dispatch_effect_id; execution_result_ref, assurance_ref |
| Participant identity, legacy spelling retained only by adapters | SDK sdk_invocation_id; MCP mcp_invocation_id; HTTP http_request_id; Git participant_invocation_id → namespaced generic invocation_id |
| Participant knowledge, historical vocabulary | All four outcome fields → conservative reported/unknown knowledge plus original outcome in participant extension |
| SDK participant extension | sdk_run_id, tool_call_id, tool_name |
| MCP participant extension | mcp_server_id, mcp_session_id, rpc_request_id, mcp_request_id, tool_name |
| HTTP participant extension | client_request_id, method, route_id, operation_id |
| Process participant extension | participant_id, participant_call_id |
| Ability effect extension | ability_id, ability_version, definition_digest, ability_invocation_id, receipt_id, receipt_ref, transaction_sha256 |
| Git effect extension | workcell_effect_id, transaction_sha256 |

No generic transaction or receipt exists. Duplicate legacy subject prefixes and
invocation spelling are compatibility representations, not additional identities.
A third generic evidence reference is not justified. Existing result correlation
extensions bind participant/family facts; live assurance owns effect truth.

## Design and ownership decision before coding

Use `kujo.interop-handoff/v1alpha1`, canonical in Dispatch because it owns controlled
correlation; this does not add Kujo runtime behavior. Eight top-level fields:
schema, subject, participant, completion_knowledge, execution_result_ref,
assurance_ref, participant_extension, effect_extension. Exactly one required
participant extension, at most one effect extension; each selected by trusted
registration and validated as a closed flat vocabulary. No arrays of extensions,
arbitrary metadata, remote lookup, registry service or unknown-extension fallback.

Core bytes ≤2048; each extension ≤2048; total wire ≤6144; IDs ≤128 ASCII. Extension
values are flat bounded strings/null, maximum 16 keys, but that resource constraint
alone is NOT acceptance: a trusted closed semantic validator is mandatory. The
core must not know any of the four family names or transaction semantics.

Completion knowledge `reported` means a terminal participant report was observed,
including error receipts; it is not success or an effect commit assertion.
`unknown` means no such usable report was observed. Original outcomes remain in
extensions; no lifecycle state machine is introduced.

Existing parsers live in Dispatch. Keep explicit compatibility adapters there for
this migration to avoid circular imports or forcing producer upgrades. They retain
owner-specific shape/receipt/result-extension checks and delegate common subject,
content-address and single-effect correlation to one core. Future native adapters
belong with their participant owner and supply a trusted closed extension validator;
Dispatch core does not gain another family branch.

Freeze pre-change readers as test-only decision oracles. Differential comparison
must run on real positive/negative fixtures, not merely identical helper output.
Generic mutation tests cover core and extension changes after normalization.
No replay, beta verification, negotiation, participant production or standalone
behavior changes are authorized by this extraction.

Implementation and validation evidence follows.

## Implemented extraction and compatibility

`7299c28` adds the eight-field core, six closed extension schemas, normative spec
and four legacy adapters. `19ca2b0` adds frozen-reader differential, retained-byte
and bounds/privacy tests and integrates them into the release gate. Producers are
unchanged. The pre-existing handoff return fields remain; `generic` is additive.
The core never parses assurance semantics, chooses a verifier, classifies an effect
or calls replay policy. The existing family adapters retain receipt and profile
commitment checks before the existing persisted beta resolver.

The fifteen retained artifacts in `tests/fixtures/interop_history` are exact bytes
from the previous successful full-gate SDK, MCP STDIO-loss, HTTP response-loss and
Git post-commit runs. They include synthetic fixture receipts only, no credentials
or application payloads. Four `case.json` manifests preserve hashes and trusted
fixture expectations. No historical assurance is renewed or reinterpreted; a
historical correlation success says nothing about its current freshness.

Normalized positive sizes: SDK 1168, MCP 1296, HTTP 1215, Git 870 bytes. Original source
handoffs and digests are unchanged. Old/new boolean decisions agree for each
historical positive and all 46 host-context substitutions, plus exact-byte result
and assurance mismatches. Every live participant test now performs the same
frozen-reader comparison before the existing live verifier. The test-only oracle
reconstructs source hashes from Dispatch baseline `fbbf8dc`; it is never imported
by production code.

## Fresh security and privacy review

Reviewed source diff after extraction for extension confusion, callback authority,
identity/ref substitution, unknown-extension fallback, malformed wire, path escape,
resource limits and accidental effect-truth/replay claims. Findings and fixes:

- Moving common reads after family parsing initially removed the early bound on
  caller-supplied result/assurance strings. Restored 1 MiB/8192-byte guards before any
  family parse, and added over-limit tests. Artifact reads remain confined and hashed.
- Git's old trusted-expectation map could contain additional asserted fields.
  Retained its comparison of every non-core expected field rather than silently
  ignoring them. Core fields are compared in the one shared reader.
- Flat-map resource bounds are not closed semantic validation. The spec and API
  require installed owner validators; legacy adapters bind a validated snapshot.
  Unknown schema/namespace pairs fail. No producer-selected executable or config.
- Schema validation alone cannot establish correlation. Draft 2020-12 validation
  uses maintenance-only Python/jsonschema because Kujo's schema subset lacks
  propertyNames/maxProperties. Production correlation and semantic tests remain
  Kujo-native; the published bounds are enforced directly.

Tests cover every normalized extension value, namespace, invocation, subject,
result/assurance reference (including well-formed reference swaps), unknown schema,
null/array extension, nested value, duplicate JSON key, whitespace, newline ID,
17 members, 129-byte value, 2048-byte extension limit and oversized total input.
A permissive **test-only** callback isolates structural limits from semantic denial.
Forbidden payload-field canaries are rejected and absent from bounded diagnostics.
No raw prompts, payloads, receipt bodies, Git paths, principal bodies or credentials
enter the normalized output. Existing real-path privacy/security tests remain active.

Completion `reported` explicitly includes failure reports and does not imply commit.
The MCP receipt-less `application_failed` outcome maps conservatively to `unknown`.
No downgrade, global assurance enablement, effect-schema change or runtime change.
Trusted host/verifier compromise and total-store rollback remain existing boundaries.

## Fifth-participant and maturity decision

A test-only `example.job` registration successfully correlates the same authoritative
result through one closed participant extension and null effect extension. The core
contains no Ability/Git/SDK/MCP/HTTP branch. A fifth participant can implement the
core plus its owner extension without learning those families. This is evidence
for external adoption, not a production fifth participant or universal lifecycle.

Wave D now has a small experimental correlation core, four compatibility adapters
and two independent effect families. Keep alpha status and explicit opt-in. Next:
external TypeScript participant adoption from published schemas/specification only,
with an independent codec, closed extension and real Dispatch-controlled continuation.
Do not add remote trust, multi-effect, model-provider policy or a generic retry engine.

## Validation record

Runtime: optimized source build `5d72aab4b99e7f8c01e4c208d6c97061934c7447`, binary
SHA-256 `4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93`.
This is not a claim about published npm/native 1.5.0 contents. Node 26.7.0;
maintenance schema validation uses python-jsonschema 4.26.0. No hosted CI claimed.

Early test development exposed unsupported VM nested-index assignment in fixture
mutation code; changed the test to explicit nested-object replacement. The first
gate exposed non-repeatable exclusive writes of normalized test output; the fixture
now overwrites only its own tests/tmp output. A later in-flight gate correctly
returned assurance_verifier_revision_mismatch when a pinned reader was edited during
a running Git fixture. No check was suppressed: source was frozen and the full gate
restarted. Final frozen-source results and retained evidence follow below.

Frozen-source live regression outcomes (each also runs old-reader/adapted-reader
boolean equivalence):

| Path | Correlation negatives | Final invariant | Restart/review |
|---|---:|---|---|
| SDK receipt-commit failure | 14 | 1 business effect, 1 receipt | passed |
| MCP receipt-commit failure | 21 | 1 business effect, 1 receipt | passed |
| MCP STDIO response loss | 21 | 1 business effect, 1 receipt | passed |
| HTTP response loss | 24 | 1 business effect, 1 receipt | passed |
| HTTP pre-commit timeout | 24 | 1 business effect, 1 receipt | passed |
| HTTP explicit application error | 24 | 1 business effect, 1 receipt | passed |
| Git pre-commit SIGKILL | 22 | initially not_started, finally 1 logical effect | passed |
| Git post-commit SIGKILL | 22 | initially committed, finally 1 logical effect | passed |

All 172 existing correlation negatives preserve denial; all corresponding positive
paths preserve correlation and existing live admission. Ability-backed standalone
regressions pass without control callbacks/identities. Existing ticket, forged-input,
privacy, exact-reference, locked replay denial and checkpoint tests remain active.
Workcell owner gate independently reports 4 contenders, 1 admitted, 3 denied, 1 effect.
Historical migration passes in VM and interpreter; independent Draft 2020-12 schema
validation reports 12 accepted instances and 12 unknown-field denials. Frozen-reader
hash verification passes for all 4. Kujo docs validation: cargo fmt --check and
cargo test --test readme_contracts pass. No other repository source was modified.

Commit map: Dispatch `7299c28` core/specification/adapters; `19ca2b0` migration
fixtures, differential tests and gate wiring. Kujo `9c0f6e6` roadmap/changelog.
The following Dispatch evidence/documentation commit retains this audit, API notes
and validation outputs; its exact hash is recorded in the session handoff.

Final frozen-source gate: **PASS**, every focused suite, all 24 shards, VM/interpreter
command-surface smoke and 3/3 bounded workloads (12s). Existing beta migration,
SQLite/Git/Ability assurance, persisted negotiation, durable review, evaluator/manual
control, state-store and legacy regressions all pass. See the retained
[evidence manifest](../evidence/wave-d-core/manifest.json),
[machine summary](../evidence/wave-d-core/validation.json),
[complete release log](../evidence/wave-d-core/dispatch-release.txt) and
[eight real participant proofs](../evidence/wave-d-core/participants.json).

Final review confirms no diff to assurance, intervention/replay policy or trusted
configuration resolution. No unresolved blocker remains for this bounded extraction.
Source repositories for participants are unchanged; their controlled regressions
ran through the full Dispatch gate, with Workcell's owner-specific gate separately.
Optional hosted/remote/OCI environments were not invoked for this correlation-only
change. No hosted CI claim. SignalBox: no captures warranted.
