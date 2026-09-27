# Local MCP STDIO → Ability → Dispatch

Experimental, opt-in, unreleased. MCP transports evidence; Dispatch alone admits
replay through immutable beta negotiation, the live Ability verifier and existing
v1 replay policy. There is no remote MCP authentication or global enablement.

## Contract and identities

MCP owns `mcp.ability-handoff/v1alpha1`; its normative shape and embedding API live
in MCP `schema/mcp-ability-handoff-v1alpha1.schema.json` and
`docs/controlled-ability-stdio.md`. The host publishes canonical, closed JSON of at
most 4096 UTF-8 bytes. IDs are bounded ASCII (128 characters), references are exact
lowercase SHA-256 content addresses. No arguments, application results, receipt
bodies, principal details, paths or verifier configuration belong in the handoff.

Client JSON-RPC ID is protocol attribution. Host server/session identity, generated
MCP request UUID and distinct invocation UUID do not authenticate application or
workflow authority. The request UUID also correlates the gateway request header.
Ability invocation/key remain stable across a Dispatch-admitted retry; MCP session,
request and invocation change. Dispatch supplies run/action attempt/effect via an
operator-owned one-use ticket. Receipt and transaction identities belong to Ability.

`src/adapters/mcp_ability_handoff.kujo` accepts host root, expected correlation,
authoritative result bytes and selected assurance bytes. It uses bounded confined
no-symlink reads, checks exact hashes/bytes and correlation through the receipt,
execution result and sidecar. Success is correlation only. The fixture installs it
inside the existing locked verifier callback; it cannot replace live verification
or `retry_is_effect_safe` and introduces no workflow lifecycle.

The existing Ability application profile fixes its application API surface to
`sdk`. The outer MCP transport calls that unchanged authenticated gateway; no
Agents SDK process is involved. This does not claim a new native `mcp` application
assurance surface. Execution-result/v1 and both alpha/beta assurance remain intact.

## Host installation

MCP's existing Node STDIO bridge exports `startAbilityMcp({control,
gatewayTransport})`. Only application code installs callbacks. Client JSON cannot
select a callback, executable, root, profile, principal or configuration revision.
The optional host transport preserves the existing HTTP default. The real offline
embedding uses Ability's authenticated Kujo subprocess and SQLite stores.

The controller claims a durable one-use ticket atomically before execution, with
current-attempt/expiry checks again before the gateway call. A spent ticket cannot
be reused after process exit. Failure consumes admission; only Dispatch may issue
a fresh retry. MCP/client machinery performs no automatic retries. Controlled
STDIO bounds incomplete frames to 8192 bytes, input to 4096 and inflight requests
to eight. Standalone behavior and numeric JSON-RPC IDs remain unchanged.

## Rehearsal

```sh
KUJO_BIN=/path/to/kujo MCP_ROOT=/path/to/mcp ABILITY_ROOT=/path/to/ability \
  node tests/mcp_ability_integration.mjs
KUJO_BIN=/path/to/kujo MCP_ROOT=/path/to/mcp ABILITY_ROOT=/path/to/ability \
  node tests/mcp_ability_integration.mjs --lost-response
```

Both tests run real separate controller, STDIO server and application/verifier
processes. The first commits publication but fails receipt persistence. The second
commits both business and receipt, then exits the MCP server before its reply.
Both leave an indeterminate authoritative execution result and review checkpoint.
Fresh controllers load persisted references, attach a freshly verified beta sidecar,
and use required/deny admission before issuing a new MCP ticket. One business row
and one final replay receipt remain; the descendant executes.

Twenty-one correlation/integrity negatives, expired/stale/duplicate admission,
client authority injection, an actual locked denial and standalone replay are
asserted. A denial is not permission to ignore the checkpoint's state revision:
after an audited denial the fixture obtains a fresh checkpoint. Privacy checks scan
handoffs, public JSON-RPC responses, telemetry and journal for the business canary.
Existing Watchdog lifecycle records remain observations with unavailable usage null.

## Limitations and next boundary

Trusted local host configuration/storage and the authenticated application gateway
remain the trust root. This is not protection against a hostile operator, total
store rollback, remote impersonation, multi-effect execution, universal rollback
or exactly-once external effects. STDIO loss can also lose telemetry; missing
telemetry is never evidence that no effect happened. Correlation failure blocks
admission and must not trigger transport retry.

The next useful target is one operator-configured local HTTP/OpenAPI action using
the existing Ability HTTP gateway contract. It should reuse bounded references and
Dispatch admission while testing HTTP timeout/duplicate-delivery behavior; remote
identity and broad provider adapters remain separate work.
