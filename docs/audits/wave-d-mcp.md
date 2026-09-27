# Wave D MCP Ability interoperability record

Local evidence, 2026-09-27. Experimental and unreleased. No hosted CI claim.

## 1. Baselines

Fetched clean main: MCP `07845898ee9f2662d0e0e364973d77cdaac04762`,
Ability `ca9acea544e9a8a806f1f09d42b4ca7b5299bd18`,
Dispatch `e1aabd952eec8b7e9ccd16e5b68818b78bdc81c3`,
Kujo `297cbfd3c4c3c9ece689f6299a2197bd02f23885`.
Agents SDK `af0aa28f5960232cbafa7cf528a32db8cb36c7a9` remains unchanged;
its unrelated untracked maintenance work was preserved. Ability remains unchanged.
Runtime source `5d72aab4b99e7f8c01e4c208d6c97061934c7447`, optimized binary SHA-256
`4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93`.
Node v26.7.0. Application/controller use VM; existing telemetry helper uses interpreter.

## 2. Existing lifecycle

MCP's `integrations/kujo-ability/bin/kujo-ability-mcp.mjs` already supplied local
newline JSON-RPC initialize/list/call/cancel, bounded HTTP responses, timeout,
Ability catalog/schema projection and standalone `_kujo` invocation/idempotency
mapping. `src/abilities/projection.kujo` and `gateway.kujo` own canonical application
projection/receipt mapping; `src/telemetry/watchdog.kujo` supplies lifecycle events.
Neither transport loop automatically retries calls. Pre-code source ownership and
implementation plan are retained in MCP `docs/audits/wave-d-mcp.md`.

## 3. Ownership

MCP owns protocol/session/tool correlation and evidence transport. Ability owns
application identity, externally authenticated session/principal, normalized request,
business transaction, idempotency and receipt. Dispatch owns run/action attempt/
effect, persisted negotiation, review and replay. Client/model fields authenticate
none of these authorities. The host embedding is operator-installed local code.

## 4. Handoff

MCP `mcp.ability-handoff/v1alpha1` is a closed 21-field, 4096-byte document with
opaque IDs, definition/transaction digests and nullable receipt/assurance references.
Result reference is required. References are SHA-256 of exact retained bytes, not
paths or URLs. Receipt content remains private. Attaching assurance creates new
immutable handoff bytes. Full contract: MCP `docs/controlled-ability-stdio.md` and
schema; Dispatch integration: `docs/mcp-ability.md`.

## 5. Correlation

RPC request ID remains client attribution. Server/session IDs come from the host.
MCP request and invocation UUIDs are distinct; request UUID also labels gateway
execution transport. Ability invocation/key persist across admitted attempts;
Dispatch attempt changes independently. A controller ticket binds these identities.
The authoritative result includes content-light MCP correlation; the reader checks
it against handoff, private receipt, exact result and selected sidecar/transaction.
Successful correlation is not replay permission.

## 6. Golden path

`tests/mcp_ability_integration.mjs` runs separate controller, actual STDIO server,
authenticated application and verifier processes. It commits a publication, records
uncertainty, checkpoints at review, exits, attaches live beta evidence from a fresh
controller, admits a fresh MCP ticket, replays the existing logical action and runs
the descendant. Each scenario uses seven MCP server processes, including denials
and standalone regression, plus fresh Dispatch/verifier processes. Final SQLite
counts are one business row and one replay receipt.

## 7. Uncertainty

Default scenario forces receipt-store failure after business commit and preserves
`ability_idempotency_commit_failed`. The lost-response scenario commits both stores
then really exits the MCP server with code 23 before JSON-RPC reply. Public response
absence is `stdio_lost`/completion uncertain; it does not mean no business effect.
Application failure, transport exception, failed receipt and missing evidence have
separate bounded outcomes. Private exceptions/receipts never appear in controlled
public responses. Unit tests cover application HTTP error versus transport error.

## 8. Restart/replay

Both fixtures persist required/deny beta policy/configuration, authoritative state,
checkpoint and content-addressed evidence. Actual locked replay rejects substituted
RPC correlation; the audit changes state revision, so its old checkpoint stays
invalid. A fresh checkpoint, restored exact references and live Ability verification
permit continuation. The application profile's fixed `sdk` surface stays unchanged:
MCP is the outer transport into that application gateway, without an Agents SDK
process. No new native MCP application profile is claimed.

## 9. Retry

Neither bridge nor test client has automatic retry. An atomic exclusive/fsynced
claim consumes the host ticket before application invocation. Repeated RPC calls
and fresh processes cannot reuse it. Expiry/current-attempt are checked at admission
and immediately before the gateway. Only Dispatch can issue the next ticket.

## 10. Trust isolation

Tests deny client profile/config/verifier/root/principal/tenant/Dispatch ID/assurance/
replay overrides before gateway execution. Host admission compares exact application
intent, tool and RPC identity. The client cannot install callbacks or executables.
The correlation reader does not duplicate beta resolution: existing locked live
verification and `retry_is_effect_safe` remain authoritative.

## 11. Standalone

The default CLI, ordinary numeric RPC IDs, existing `_kujo` mapping and normal
receipt/result behavior remain. No control callbacks or fabricated Dispatch IDs are
required. Existing standalone host bridge tests pass; the real application fixture
also replays its durable receipt through a standalone fresh MCP server.

## 12. Security/architecture review

Each scenario passes 21 handoff/correlation/integrity negatives: IDs, tool, receipt,
result/assurance, transaction, exact bytes, symlink, path/URL and oversize. Actual
locked denial preserves the effect count. Expired, stale and duplicate tickets do
not reach Ability. Canary scans cover public response, handoff, journal and existing
Watchdog telemetry; unavailable usage remains null. No circular MCP/Dispatch import,
new event bus, provider assumptions or copied private receipts were introduced.

Review fixed an incomplete-line memory bound: controlled raw framing now rejects
more than 8192 bytes before newline, malformed UTF-8, malformed request objects and
more than eight inflight calls. Subprocess regression proves no application execution.
Trusted host/root remains the boundary; hostile operator, total-store rollback,
remote authentication, multi-effect and exactly-once are not claimed.

## 13. Validation

See `docs/evidence/wave-d-mcp/validation.md` and the two retained machine proofs.
MCP canonical suite, Ability release verification and Kujo fmt/readme contracts
passed. MCP real host-certification rerun passed after installing existing locked
Ability Gateway test dependencies; isolated missing-module reproduction established
the initial environmental failure. No source workaround or suppressed check.
Dispatch full release gate result is recorded in the validation artifact.

## 14. Commit map

MCP: `ed7cc86` pre-code audit; `3963c3f` host-controlled transport;
`14f9d6c` real participant/tests/docs; `f226601` bounded framing/duplicate inflight;
`a7ec0dd` real certification and evidence record.
Dispatch: `2609b05` correlation reader, real multi-process fixtures, gates/CI pin;
following documentation commit retains this report and machine evidence.
Kujo: following documentation commit updates Wave D roadmap; runtime unchanged.

## 15. Status

Two distinct participant families now carry evidence without taking admission
ownership: Agents SDK lifecycle and MCP local STDIO transport. Wave C beta remains
experimental opt-in/unreleased, alpha retained, execution-result/v1 unchanged.
Wave D is not a universal interoperability implementation.

## 16. Next target

One operator-configured local HTTP/OpenAPI Ability action. Existing MCP HTTP gateway
routes/headers provide a concrete application boundary; the next fixture should test
HTTP timeout/duplicate delivery with the same host admission and digest references.
Do not introduce remote attestation or broad provider policy as part of that slice.
