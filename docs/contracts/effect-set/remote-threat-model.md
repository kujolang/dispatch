# Remote participant threat model — design only

Assets: Dispatch admission authority, exact attempt/effect bindings, retained
history, sink credentials, tenant isolation and evidence integrity. Trust roots
are the operator-installed host, policy registry and verifier configuration.
Participants, networks, transported evidence and remote hosts may be malicious.
Local process fixtures do not establish any remote trust claim.

| Threat | Required boundary / future proof |
|---|---|
| Participant impersonation / MITM | Authenticated encrypted transport, endpoint binding and issuer-key registration outside input; test wrong server/key/audience |
| Replay of a valid signed statement | Host-generated one-use nonce/challenge bound to run/step/attempt/effect, request digest, audience and deadline; durable consumption under lock |
| Cross-tenant use | Bind authenticated principal, tenant, environment, intended verifier and sink key scope; payload spelling alone is insufficient |
| Evidence substitution | Sign canonical domain-separated statement and exact evidence references; confined authorized fetch, bounded size, rehash; no producer-controlled URL execution |
| Stale registration / key rotation | Immutable registration revisions, live revocation checks and explicit overlap policy; old signatures retain historical attribution but do not authorize new effects |
| Compromised participant key | Signature cannot distinguish honest from malicious key use; independent sink verification remains necessary |
| Malicious participants / repeated claims | Preserve contradictions and uncertainty; no consensus-by-count or trust score derived from repetition |
| Remote host compromise | Host can fabricate both execution and readback; require an independently governed verifier/sink or explicitly reject the assurance claim |
| Stale resource / changed Git ref / deleted row | Read the current predicate at admission, scope any lease, and check final mutation preconditions; signed old truth is not current authority |
| Local authority compromise / total store rollback | Outside current model; local hashes cannot detect wholesale coherent replacement; external anchoring would need separate design |
| Resource exhaustion / decoder attacks | Bound frames, depth, arrays, strings, fetches, retries and deadlines before acting; redact errors |
| Multi-host split brain | No current solution; requires one defined admission authority and fenced mutation semantics, not several agreeing participants |

A signature proves that the holder of a key signed particular bytes. Attribution
depends on key custody and registration. It does not prove that the represented
external effect occurred, persisted, belongs to the right tenant, or remains safe
to replay. A signed observation is still a claim until the installed verification
policy supplies the required independent evidence.

The next possible authentication slice is a local transport challenge envelope
around **unchanged handoff bytes**: host-generated nonce, exact handoff digest,
audience, principal/tenant, registration revision and expiry; consume once under
the existing Dispatch run lock. Test replay, wrong audience/tenant, stale revision,
key rotation and loss before/after durable consumption. Keep effect verification
separate. No signing implementation, PKI, remote verifier, A2A integration or
cryptographic authorization is introduced in this session.
