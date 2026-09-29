# Minimum participant protocol and bounded effect-set composition

Status: experimental, unreleased. The existing wire specification remains
[interop-handoff.md](../../interop-handoff.md). This document extracts its minimum
and defines **separate** composition artifacts; it does not revise historical bytes.

## Minimum protocol, not a minimum SDK

An existing handoff is the following closed record (all fields required):

```
Handoff = {
  schema: "kujo.interop-handoff/v1alpha1",
  subject: {run_id: ID, step_id: ID, attempt_id: PositiveDecimal, effect_id: ID},
  participant: {namespace: ID, invocation_id: ID},
  completion_knowledge: "unknown" | "reported",
  execution_result_ref: REF,
  assurance_ref: REF | null,
  participant_extension: RegisteredExtension,
  effect_extension: RegisteredExtension | null
}
ID = ASCII [A-Za-z0-9][A-Za-z0-9_.:-]*, 1..128 bytes
REF = "sha256:" followed by exactly 64 lowercase hex digits
RegisteredExtension = {schema: installed exact schema ID, values: closed owner fields}
```

Whole handoff <=6144 bytes, six-field core <=2048, each extension <=2048,
<=16 flat string/null fields, values <=128 bytes. Wire MUST equal portable-json/v1
encoding; no duplicate members, alternate escapes, whitespace or malformed UTF-8.
References hash original bytes. Registration and effect interpretation are installed
by the host, never selected as executable policy by an input document.
`reported` means a usable report, including an error. It does not mean success.
`unknown` survives loss even if a separate verifier later sees a committed effect.
Capabilities are host registration facts; the current minimal wire has no advertised
capability list. Evidence, observations and result metadata travel as references or
closed owner facts, not a new generic metadata bag.

| Layer | Required responsibility | Not a requirement of that layer |
|---|---|---|
| Wire | identities, exact references, knowledge, closed owner facts | SDK constructor, callbacks, filesystem layout |
| Codec | strict bounded parse, canonical bytes, SHA-256 | evidence lookup, authorization, trust resolution |
| Host adapter | installed registration, current expected snapshot, confined artifact reads, execution, durable acknowledgement | authority inferred from process exit or MCP result |
| SDK | optional encode/parse/match/record convenience | workflow state, storage or replay ownership |
| Dispatch | locked admission, retained authority, current policy and evidence resolution | participant language or MCP-specific policy |
| Harness | fake clocks, subprocess kills, fixture roots and assertions | standardized workflow protocol fields |

Every implementation needed byte rules, immutable identity, explicit unknown,
closed owner validation and host context. None needed Node IPC, Python sockets,
a factory, UUID generation, a package registry or an embedded library. The SDK's
`register`-style factory is startup convenience, not a participant wire command.
Host-assigned IDs work for a CLI. A process exit only answers process termination;
MCP `isError=false` only answers whether the recording tool returned usable output.

## Go/process/MCP proof

`interop/go-participant/main.go` independently implements the codec using only
Go's standard library. Build with Go >=1.22, `GOTOOLCHAIN=local GOPROXY=off go build`.
No TS/Python/Kujo implementation is imported. Its fixed installed owner is
`kujolang.go-process` with extension
`kujolang.go-process-correlation/v1alpha1`, closed `call_id` and
`process_instance_id` identifiers. Optional Git extension retains the existing
closed `workcell_effect_id` and raw `transaction_sha256` vocabulary.

The CLI reads one request from stdin and writes exact response bytes with no
newline. `record`/`parse` validate handoff bytes; `match` accepts
`{wire_hex, expected}` and requires complete equality. `encode`, `canonical` and
`hash` are conformance helpers, not admission operations. Process input is bounded
to 32768 bytes; encoded portable output to 8192; handoffs retain their tighter limits.
Errors return a fixed diagnostic/nonzero status, never supplied secrets.

`mcp` exposes only `record_handoff({wire})` over local newline-delimited JSON-RPC
stdio, with <=32768-byte frames. It negotiates the supported 2024-11-05 revision,
then requires initialization before tool use. Tool text contains the same canonical
wire; `isError` describes codec failure. No resource lookup, execution, network,
credential, ticket or storage API exists. CLI and MCP share **one** Go codec; they
are two transports, not two independent codec implementations. The real crash
fixture passes its lost B report through both and through Dispatch's generic
correlator; forged completion knowledge fails the host's expected snapshot.

Pinned MCP references: [lifecycle](https://modelcontextprotocol.io/specification/2024-11-05/basic/lifecycle)
and [tools](https://modelcontextprotocol.io/specification/2024-11-05/server/tools),
consulted 2026-09-29. This is a bounded local tool proof, not remote certification.

Rust evaluation: UTF-8 strings, serde's duplicate-key behavior, integer domain and
canonical string escaping need the same explicit checks as Go. Rust is viable,
but a fourth codec is deferred; it would not resolve the more valuable missing
locked partial-continuation proof. No four-SDK promise or public package is made.

## Additive effect-set artifacts

The existing v1 parent result retains all effects and its original status. The new
assessment never collapses partial effects to parent success/failure. This prototype
supports 1..8 effects, in serial order. Result v1 still allows its existing 1000;
the prototype's smaller bound is an explicitly separate consumer profile.

```
Plan = {
  schema: "dispatch.effect-plan/v1alpha1",
  subject: exact parent result subject,
  config_ref: REF, registration_ref: REF,
  preserve_until: UTC integer seconds,
  effects: [Entry, ...] // 1..8, unique effect_id, exact result effect order
}
Entry = {
  effect_id: ID, operation: ID,
  target_ref: REF, scope_ref: REF, request_ref: REF, key_ref: REF,
  profile: ID, profile_revision: ID, authority: ID
}
Set = {
  schema: "dispatch.effect-set/v1alpha1",
  result_ref: REF, plan_ref: REF,
  observations: [REF | null, ...] // exactly one slot per ordered effect
}
Observation = {
  schema: "dispatch.effect-observation/v1alpha1",
  result_ref: REF, plan_ref: REF, effect_id: ID,
  state: "committed" | "not_started" | "unknown",
  observed_at: UTC integer seconds, valid_until: UTC integer seconds,
  evidence_ref: REF
}
```

All records are closed, canonical portable-json/v1, <=8192 bytes. A result is
<=1 MiB and hashes exact original bytes, including permitted noncanonical formatting.
Profile/authority and target/scope/request/key semantics belong to the installed
application verifier. The plan commits their full identities and configuration/
registration revisions. The result supplies the original effect class/state and
attempt; no new operation enum replaces the v1 replay classes. Ordering is array
position, so no redundant ordinal is added. Repeated authority/target/scope/key
tuples reject as ambiguous even when effect IDs differ; key spelling is not a
proof that two separately named effects occurred. A missing observation is unknown,
not proof of absence. `blocked` is a control condition for a later unstarted effect,
not a new execution-result state. Assessment rows expose `blocked_by` as the
first incomplete prefix effect ID (or null), independently of their own observed
state and freshness. Compensation is untouched in the original result;
this assessor neither verifies compensation nor uses it as replay permission.

The host MUST supply its current immutable plan, confined artifact reader and
installed live verifier. Input bytes cannot supply those functions. The verifier
MUST reconstruct the exact observation from authorized readback under the selected
profile, not echo a producer label. This API is read-only and does not acquire a
run lock or return a usable execution ticket. Production integration MUST reload
state, select current installed authority under lock, revalidate preservation,
and enforce sink admission at mutation time. That integration is the next proof.

Claims are original reported states/participant facts. An observation is an
artifact of a measurement. An attestation identifies an accountable issuer;
independent verification resolves a specific predicate through a trusted method.
Admission is a separate Dispatch decision. No ordinal trust score or vote count
appears. Three repeated claims do not call a verifier three times or create trust.
Historical observation fields describe retained artifact content; authenticity
still depends on the surviving host journal/store and prior trusted recording.

For the real four-effect fixture:

```
A: original unknown, independently observed committed
B: original unknown, no installed independent verifier -> unknown
C: original not_started, observed not_started, blocked by B
D: original not_started, observed not_started, blocked by B/C
parent: indeterminate; replay prohibited; review required
```

Only a freshly observed not_started effect whose original state is not_started and
whose entire serial prefix is currently observed complete is labeled
`candidate_for_locked_admission`. It is not authorized. Even an all-complete set
retains `parent_replay=prohibited` and `continuation=review_required`.

Existing single-effect handoff/assurance consumers keep their single-effect checks.
The crash proof records B separately as a truthful child result and correlates that
record with the Go handoff. It never passes the multi-effect parent into the old
consumer or claims beta assurance of the set. New sidecar identities are not
alpha-to-beta migrations. Historical alpha/beta mode/profile/configuration gates
still govern historical runs. No execution-result/v2 is required.

## Freshness and renewal

Observation validity is half-open `[observed_at, valid_until)`, integers in
0..253402300799, maximum interval 3600 seconds. Future, expired, revoked,
unavailable or mismatching live facts do not authorize continuation. At expiry
`historical_observation=committed` remains in the result, while current
`observed_state=unknown` and `freshness=stale` prevent reuse. Live disagreement is
`unconfirmed`, never a rewritten historical failure. Preservation expiry is its
own `preservation_expired` condition. Changed config, registration, target,
authority or attempt fails exact plan/result binding.

No `renew_after` is needed yet: scheduling renewal is host policy. Method is the
installed profile, authority is committed in the plan, and subject/scope are
already bound. Renewal performs a new readback, emits a new Observation and Set,
and appends their references through the existing control journal. Old artifacts
are never overwritten. Renewing an observation does **not** extend a sink's
idempotency window, restore a credential, refresh a registration or change the
historical beta envelope. Those require the respective owner's current policy.

A fresh controller requires surviving plan, result, immutable artifacts and
journal/state agreement. Missing records, torn tails or mismatched cursors require
review; content hashes alone do not restore authority. The fixture uses existing
atomic writes, directory sync and control events. It tests process loss only,
not power-loss guarantees, hostile full-store rollback or machine-loss recovery.
