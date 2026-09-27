# First Wave D Ability Tool interoperability — 2026-09-27

## 1. Baselines

Fetched main matched before edits: Agents SDK
`bb2202d8b54f44717b1b1f0157a6774f2027cea1`, Ability
`ca9acea544e9a8a806f1f09d42b4ca7b5299bd18`, Dispatch
`5fc27fe7c4a7a0bd20e896ce49d5a96b3c067d54`, Kujo
`6f06e41bfcabc67c0e1669a493f941863a2bf865`. SDK work used an isolated
worktree to preserve unrelated untracked maintenance-agent work. Ability remains
unchanged. MCP recommendation inspected at `07845898ee9f2662d0e0e364973d77cdaac04762`.

Runtime: optimized source `5d72aab4b99e7f8c01e4c208d6c97061934c7447`, binary SHA-256
`4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93`.
SDK participant uses its documented interpreter execution; Dispatch uses VM.
No hosted CI result is claimed.

## 2. Existing lifecycle

SDK `src/agents/abilities/contract.kujo` already projects canonical Ability
schemas, creates invocation/key from host metadata, calls a gateway, validates
receipt identity and successful output, and carries private receipts. Registry
wraps handler errors and enforces approval/guardrails; runner calls each emitted
tool once. `max_tool_retries` does not create a retry loop. Existing lifecycle and
Watchdog adapters already provide content-light observations. The pre-code SDK
`docs/audits/wave-d-ability.md` maps source fields, tests and ownership.

## 3. Ownership

SDK owns tool presentation, model-call attribution, its run/tool-step IDs and
callbacks. Application/Ability owns authenticated principal/tenant, normalized
request/key, business transaction, idempotency store and receipts. Dispatch owns
run/action/attempt/effect, immutable negotiation, review and continuation. Model
fields are assertions; Watchdog observations and handoffs grant no authority.

## 4. Additive contract

SDK `agents-sdk.ability-handoff/v1alpha1` is a closed 19-field, 4096-byte reference
object. It carries distinct identities and exact receipt/result/assurance digests,
nullable receipt and initially nullable assurance, bounded outcome and transaction
digest. No provider policy, payload, path, principal, verifier or configuration
is copied. `docs/CONTROLLED_ABILITY.md` and its schema are SDK-owned. Dispatch's
correlation helper consumes it before existing live beta resolution; it does not
implement another verifier or replay policy. There is no circular package import.

## 5. Correlation

The retained machine evidence is `../evidence/wave-d-ability/rehearsal.json`.
`model-call-1` is distinct from SDK `step-7`, the SDK run, stable Ability
`application-publication`, Dispatch action attempt `1`, `effect-1`, receipt ID and
business transaction. Replay creates a new SDK run and Dispatch attempt `2` while
retaining the application invocation/key. Exact bytes of both results, selected
assurance, private receipt and immutable handoff are independently compared.

## 6–8. Golden, uncertainty and replay paths

A real SDK runner with deterministic model output invokes the real authenticated
Ability SQLite publication gateway. A receipt INSERT trigger fails after business
commit. Ability returns `ability_idempotency_commit_failed`; SDK records a failed
receipt and indeterminate execution result. The business row count is one and
receipt count zero. No hidden retry occurs despite max_tool_retries=5.

SDK and Dispatch exit. Fresh processes read durable state, create beta assurance,
attach a new immutable handoff and publish a review checkpoint. Required/deny
negotiation resolves the exact pinned operator configuration and live Ability
predicate. The locked continuation rejects a substituted tool-call reference;
its audited denial makes the old checkpoint stale. Restoring evidence does not
revive that checkpoint. A newly published checkpoint permits a later verified
retry. Only the admitted Dispatch action runs the fresh SDK participant, fences
the old Ability owner and safely retries. One business row and one receipt remain;
the descendant executes. Five SDK processes cover initial execution, duplicate
admission denial, evidence attachment, admitted replay and standalone replay.

This uses real process exits and durable receipt failure, not a single in-memory
mock or a synthetic success. It does not claim arbitrary crash recovery.

## 9–12. Retry, trust, standalone and telemetry

Controlled registration requires installed `admit` and `record` callbacks; neither
comes from model input. The sample host checks actual input against its admitted
invocation and atomically claims a one-use ticket. A duplicate model call cannot
reach the gateway. SDK approval can deny, never authorize Dispatch replay.

Tests reject input attempts to select profile/verifier/config/root/principal/
tenant/assurance/replay/run/effect. Existing gateway receipt validation is reused.
A transport exception canary is retained only privately, with a content-light
uncertainty/ref returned. Record failure does not trigger retry.

Standalone `register_ability_gateway_tool` remains unchanged and replays the
original application receipt without fake Dispatch identities. Existing Watchdog
tool-call started/failed/completed records observe the path; canaries/credentials/
verifier configuration do not appear in handoffs, records or control journal.
RunLedger integration is optional and not added as control state.

## 13. Fresh architecture/security review

Fourteen denial cases cover model-call, SDK invocation, Ability invocation/receipt,
Dispatch run/step/attempt/effect, result/assurance/receipt references, transaction,
raw-byte tampering and symlink substitution. Selected digest paths cannot carry
traversal or URLs. Schema/helper tests reject extra fields, newline IDs, invalid
references and inconsistent nullable receipt identity. Failed inspection preserves
authoritative state bytes and business count; failed actual admission may append
its existing audit/control record and invalidate a checkpoint. No denied attempt
reaches the gateway. No trust is derived from a returned `ok` without the existing
beta profile verifier and v1 policy.

The review caught a metadata regression: adding correlation to all tools violated
an existing unset-preference test. Correlation is now opt-in per controlled tool;
that regression passes. Fixture callback lexical capture and a wrong invocation
field were corrected. Temporary debugging output was removed. There is no new
unresolved security finding. The existing VM early-return issue remains separate;
this slice changes no runtime and relies on tested interpreter SDK paths.

CI review also found a pre-existing contradictory check: the workflow checked out
source runtime `5d72aab` but compared its HEAD with historical release pin
`87fae36`. The checkout assertion now uses `KUJO_RUNTIME_REF`; immutable release
manifest checks remain unchanged. YAML parsing, every run-block shell syntax and
the two distinct pin assertions pass. This is not a claim of hosted CI success.

## 14. Validation

- SDK: 41 canonical offline checks, zero failures; three new controlled test groups;
  module exports and seven example smoke results; context contracts plus 20 paired
  repetitions and 14 VM/interpreter source executions; context token ratchet.
- Ability: full `scripts/verify-release.sh` passed, including owner runtime,
  registry/developer fixtures, consumer conformance and Fence.
- Dispatch: full release gate and focused final locked-denial fixture; detailed
  summary retained in `../evidence/wave-d-ability/`.
- Kujo docs: `cargo fmt --check`, `cargo test --test readme_contracts` passed.

The first SDK gate failure was caused by this change and fixed; it was not waived
or classified environmental. All results are local, not hosted CI certification.

## 15. Commit map

- SDK `3ce8bb1`: source audit before implementation.
- SDK `9fa887c`: controlled projection, correlation context, schema and unit tests.
- SDK `af0aa28`: real participant, ownership/API/telemetry documentation.
- Dispatch `8efbd2a`: bounded correlation reader.
- Dispatch `5070020`: real multi-process fixture and canonical/CI gate wiring.
- Dispatch `e184067`: distinguish current source-runtime CI selection from historic release pins.
- Kujo `297cbfd`: roadmap/direction update.
- This evidence/documentation commit: findings, retained proof and validation.

## 16. Status and limits

First interoperability vertical slice implemented, experimental and unreleased.
Wave C beta remains opt-in; alpha and execution-result/v1 remain unchanged.
The local operator, authenticated application gateway and installed verifier remain
trusted. No hostile-root isolation, remote authentication, multi-effect assurance,
universal rollback, exactly-once, evidence renewal or total-store recovery is
claimed. Broader provider/tool adapters remain unscheduled.

## 17. Next concrete target

Use MCP's existing local STDIO Ability gateway integration
(`integrations/kujo-ability`, `src/abilities/projection.kujo`) as the next participant.
Add one opt-in evidence-reference transport through its existing receipt mapping;
reuse Ability beta and Dispatch authority. Prove lost response, fresh-process
correlation and review/replay without allowing JSON-RPC arguments to select trusted
configuration. Keep remote MCP authentication and other provider frameworks out of
that slice. This builds on an existing effect-gated, authenticated gateway boundary
instead of inventing another tool interface.
