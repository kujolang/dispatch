# Wave D local HTTP/OpenAPI Ability interoperability

Local validation record, 2026-09-27. Experimental, opt-in, unreleased.

## 1. Baselines

Fetched main: Ability `ca9acea544e9a8a806f1f09d42b4ca7b5299bd18`;
Ability Gateway `d7934e267826aba2525c042e56cc6e74a460e547` (read-only);
MCP `a7ec0dd8e6bcae303ab1431b4586dfe3e91f3a5a` (read-only);
Dispatch `36965677fa1fd752dd24c0098097a1f72c4c7037`;
Kujo `4af979a30e48c8e28eec7502846300355dc059cb`.
Agents SDK stays `af0aa28f5960232cbafa7cf528a32db8cb36c7a9`; unrelated untracked
maintenance files are preserved. Runtime source `5d72aab4b99e7f8c01e4c208d6c97061934c7447`,
optimized binary SHA256 `4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93`;
Node26.7.0. No Kujo runtime change.

## 2. Existing HTTP lifecycle

MCP already invokes authenticated application gateway routes with input/invocation,
X-Request-ID and Idempotency-Key, bounded fetch response and1..60s abort deadline
(default30s), no retry loop. The separate Workers Ability Gateway exposes OAuth/D1
/v1/invoke for seeded fixtures; it explicitly does not execute the proven SQLite
publication backend. Changing that gateway would introduce a new backend/trust task.

The existing Kujo application-assurance gateway owns publication, session DB auth,
normalized requests, unique business key, independent receipt commit and live readback.
This slice wraps it in a bounded local HTTP test transport; no new business server
implementation. Node supplies actual socket fault/concurrency controls, not application
logic. Pre-code audit and justification: Ability `docs/audits/wave-d-http.md`.

## 3. Ownership

HTTP owns method/route/operation, client attribution, host request correlation and
bounded evidence transport. Ability owns authenticated principal/tenant, invocation,
request/key, business transaction and receipt. Dispatch owns run/step/action attempt/
effect, immutable negotiation, review and replay. Client headers/body own none of
the trusted authority. Application surface remains `sdk` in the established beta
profile beneath the HTTP transport; no SDK/MCP participant runs here.

## 4. Controlled contract

Ability publishes `http.ability-handoff/v1alpha1`, closed20 fields,4096-byte canonical
JSON, ASCII128-character IDs, fixed POST/publication route/operation, SHA256 exact-byte
references, nullable receipt/assurance. Host ticket binds whole normalized invocation,
method/route/operation, request attribution, current control attempt and expiry.
Exclusive fsynced claim precedes mutation; the live current ticket/expiry is rechecked.
The client cannot choose root, executable, verifier, profile, configuration or principal.

Dispatch reader does confined no-symlink digest reads, exact authoritative result and
receipt/transaction/sidecar correlation; matching evidence is not admission. Existing
locked beta resolver/live Ability verifier and v1 replay policy make that decision.

## 5. OpenAPI

Ability `examples/controlled-http/openapi.json` is one OpenAPI3.1 operation:
POST `/v1/abilities/publication/create/run`, `publication_create`. It documents closed
input/invocation body, bearer application session, request/key headers, bounded controlled
references and standalone private Ability receipt response. Review removed overlap in
the oneOf response branches by requiring receipt in standalone. Metadata never proves
authentication or idempotency. No importer, arbitrary destination or remote trust added.

## 6. Response-loss path

Fresh Dispatch controller installs required/deny beta configuration and host ticket.
Fresh client starts loopback server; concurrent valid deliveries race; one claims.
Actual Kujo application commits business and receipt. Server destroys the socket before
reply. Client records `response_lost` with durable private evidence; Dispatch pauses at
review. Processes exit. Fresh controller resolves live authenticated Ability evidence,
selects exact beta sidecar, checkpoints, admits a fresh attempt and runs a new client/
server. Ability replays its durable receipt; descendant runs. Business1/receipt1.

## 7. Duplicate delivery

Every controlled attempt issues two concurrent network requests. Exactly one is denied
and one admitted; one durable ticket claim exists. Fresh-process repeated delivery is
also denied. Duplicate delivery does not acquire another Dispatch permission. Standalone
requests replay the same application receipt using the existing idempotency mechanism.

## 8. Errors and timeouts

Pre-commit client timeout100ms closes the socket before the400ms delayed server mutation;
server fences it and live readback finds zero effects. Explicit application handler
failure returns a failed private receipt and `application_error`, with zero effects.
Committed-response-loss starts with one effect. All three are distinguishable and end
with one effect/receipt after verified continuation. Initial execution remains
conservative/indeterminate; HTTP status does not prove business absence or success.
Gateway subprocess failure is unavailable, never inferred absence. No transport retries.

Bounds: body4096; headers4096/16pairs; response8192; inflight4; body/header2s;
application20s; request25s; client30s; controller90s. No unbounded stream buffering.

## 9. Trust isolation

Forged internal headers, wrong request/key, changed body with same key, wrong method/
route/query, fake bearer/principal, duplicate/oversized headers, malformed JSON/UTF8,
oversized body and wrong content type deny before claim/application. Twenty-one such
requests precede each valid attempt; no claim exists afterward. Authority remains
operator-installed, not JSON or headers. Actual application session DB still authenticates.

## 10. Restart/replay

Controller/client/server all exit; only persisted artifacts and authoritative state
survive. Actual locked resume denies substituted method correlation with no business
change; that audit invalidates the old checkpoint. Restoring evidence alone cannot
reuse the checkpoint. A fresh checkpoint then admits verified continuation. Expired,
stale, spent tickets and twenty-four handoff/schema/integrity substitutions reject.

## 11. Standalone

Fresh standalone server uses normal authenticated configured application invocation,
without tickets/Dispatch context/control callbacks. Two actual HTTP requests return
the same receipt identity; business count remains one. This is a single configured
action, not an arbitrary multi-application router.

## 12. Privacy/telemetry

Canaries cover actual controlled HTTP response bodies/headers, public participant
output, handoff and control journal. None contain payload/token/principal. Private
receipts remain in host-owned artifacts, never copied to controlled responses.
There is no HTTP-specific Watchdog exporter in this local application fixture.
Existing Dispatch lifecycle telemetry observes execution/review/continuation without
adding bodies/headers; no new event bus or telemetry authority is introduced.

## 13. Security review

Review tightened method/route/operation constants and nullable receipt identifier
validation, clarified OpenAPI branch separation, added duplicate/oversize header and
invalid UTF8 checks, and preserved uncertain completion if the gateway process fails.
Receipt/result/assurance/transaction/Dispatch/HTTP substitutions, tampered raw bytes,
URL/path refs, symlink artifacts and oversize handoffs are denied. Configuration remains
outside client control. Published identifier schemas additionally reject terminal newlines (the parser already
rejected them). No new replay engine, circular dependency or automatic retry.
Local operator/storage/verifier trust remains; hostile root and total-store rollback
are outside the guarantee. No exactly-once, multi-effect or universal rollback claim.

## 14. Validation

Canonical commands, gate logs and three real machine proofs are retained in
`docs/evidence/wave-d-http/`. Ability full release verification, Dispatch full release
gate (including SDK/MCP and Wave C regressions), Kujo fmt/readme contracts and syntax/
diff checks are required. All listed gates passed; final observed outcomes are recorded in validation.md.
No hosted CI is claimed. CI pins the reviewed Ability participant code.

## 15. Commit map

Ability: `29f3909` pre-code audit; `6c5efeb` local HTTP fixture/schema/OpenAPI/tests/docs;
`e2517da` failure semantics; `d6c9707` terminal-newline schema regression.
Dispatch: `21d156a` correlation/integration/gate; `fcc880a` strict domain/schema negatives; `f6c919f` failed-execution/receipt distinction.
Subsequent documentation/evidence commits retain this report and final gate results.
Kujo documentation commit updates roadmap only. MCP/SDK/Workers Gateway source unchanged.

## 16. Cross-participant comparison

Full mapping: `docs/http-ability.md`. Genuine common mechanisms are exact immutable
result/sidecar references, explicit controller subject correlation, bounded transport
attribution and exclusion of trust configuration. Ability identity/version/definition/
invocation/receipt and application transaction fields repeat because all three invoke
Ability; they are not yet universal. SDK call, MCP session/RPC and HTTP method/route
are distinct. Uncertainty is common but outcome enums retain participant semantics.
No generic envelope extracted.

## 17. Maturity

Three structurally different participants now use one evidence/control pattern while
leaving admission in Dispatch. This supports framework independence within one real
application family; it is not arbitrary API support or general remote trust. Wave C
beta stays experimental opt-in/unreleased; alpha and execution-result/v1 unchanged.

## 18. Next task

Continue participant validation: expose one existing Workcell Git CAS action through a
bounded participant without an Ability receipt, reusing its existing beta verifier.
Test whether result/sidecar/controller references remain sufficient before extracting
a generic handoff core. Another language wrapper around Ability would provide less
new evidence about which fields are truly application-independent.


Application-error detail: the unchanged Ability gateway persists successful replay
receipts only. Its failed handler therefore also encounters receipt-finalization
failure: the returned code is `ability_idempotency_commit_failed` with
`error.details.execution_status = failed`. The HTTP fixture preserves that private
receipt, reports application error, and independently verifies `not_started`; it
never treats the commit-failed code alone as evidence of business absence. The
focused regression asserts all three facts.
