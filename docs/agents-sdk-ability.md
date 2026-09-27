# Agents SDK → Ability → Dispatch (experimental)

The SDK is an execution participant. Dispatch remains the sole owner of effect
replay admission, persisted assurance negotiation and review continuation. This
slice uses the existing beta Ability profile and unchanged execution-result/v1.
It adds no workflow policy to Agents SDK and changes no global assurance defaults.

## Contract and ownership

The SDK owns `agents-sdk.ability-handoff/v1alpha1` and its schema/specification in
`kujolang/agents-sdk` (`docs/CONTROLLED_ABILITY.md`). It is a bounded digest/reference
object, not a generic event envelope. The operator embedding persists private
receipts, execution results and immutable handoffs. Model payloads cannot install
callbacks, select verifier roots/configuration or authenticate principals.

`src/adapters/agents_ability_handoff.kujo` consumes an operator-owned root, expected
correlation, authoritative exact result bytes and the selected assurance bytes.
It performs confined, bounded, no-symlink content-addressed reads. It checks SDK
run/model-call/invocation, Ability identity/invocation/receipt, Dispatch subject and
effect, exact result bytes, transaction and exact sidecar. A receipt with a failed
commit remains evidence of failure to store the receipt, not proof of no effect.

Successful correlation MUST be followed by the existing locked persisted beta
admission and live authenticated Ability verification. This helper never returns
`safe`, never calls replay, and cannot replace `retry_is_effect_safe`. The fixture
composes it inside the operator-installed verifier callback, so pause/restart,
revocation, freshness and selected-sidecar checks remain in the established path.

## Identity relationships

The model tool-call ID is attribution. The SDK tool-step ID identifies a distinct
SDK invocation. A controller-issued, single-use ticket binds that invocation to
one Dispatch run/action/control attempt/effect. The SDK run changes on replay;
the Ability invocation/key remains stable so its original receipt can be replayed.
Ability's authenticated gateway owns principal, normalized request, business
transaction and replay store. Those are verified by its existing beta predicate.
The handoff supplies correlation, not authentication.

The current local handoff domain is one effect and one transaction with ASCII IDs
at most 128 bytes. Handoff bytes are at most 4096; receipts/assurance at most 8192;
result reads at most 1 MiB. Digests are lowercase SHA-256 of exact retained bytes.
No model payload chooses a path: reference lookup is `artifacts/<digest>.json`
below the host root. Unknown fields/noncanonical handoff bytes are rejected. The
SDK schema includes additional semantic ID/reference pairing checks in its API.

## Real offline rehearsal

Run from Dispatch with sibling reviewed Ability and Agents SDK checkouts:

```sh
KUJO_BIN=/path/to/kujo AGENTS_SDK_ROOT=/path/to/agents-sdk \
  ABILITY_ROOT=/path/to/ability node tests/sdk_ability_integration.mjs
```

The test creates a private SQLite application, authenticated application session
and publication invocation. A real SDK runner emits one deterministic tool call.
An injected receipt-store constraint fails after the business commit. The SDK
retains the failed receipt privately and reports uncertainty. Dispatch pauses at
review under persisted beta required/deny negotiation. Both processes exit.

Fresh processes produce live beta evidence and a new immutable handoff referring
to that sidecar. Dispatch evaluates, publishes a checkpoint, rechecks admission
under lock and resumes. Only its admitted action invokes the fresh SDK participant.
Ability recovery fences the old owner; its unique business key prevents another
logical publication, and the receipt then commits. A descendant executes. A normal
standalone SDK call replays the receipt without constructing Dispatch identity.

The test also attempts a duplicate SDK ticket before review; admission denies it
without another gateway call. Correlation substitutions, raw-byte tampering and
symlink substitution deny verification without changing authoritative state or the
business effect count. Existing Watchdog tool start/finish categories remain
observations only. Private canaries are absent from handoffs, telemetry and journal.

## Limits

This is trusted local operator embedding, not a hosted gateway, remote identity,
sandbox or universal SDK adapter. Receipt bodies remain private local artifacts;
retention/access control belongs to the host. Lost evidence blocks continuation.
There is no new exactly-once guarantee, rollback, multi-effect assurance, automatic
migration, machine-loss recovery or SDK replay engine. RunLedger remains optional
and is not introduced as control state. Existing SDK approval may deny or render a
review UI; it does not authorize Dispatch continuation.
