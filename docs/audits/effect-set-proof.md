# Coordinated Wave C/D effect-set proof — 2026-09-29

Status: completed bounded **read-only** local proof; experimental and unreleased.
Production partial-effect continuation is not implemented. Kujo core, existing
single-effect assurance, generic correlation and historical contracts are unchanged.

## Starting-state audit and ownership

The pre-code [decision](../contracts/effect-set/decision.md) records the inspected
baseline and ownership. The [formal contract](../contracts/effect-set/protocol.md)
contains the multi-effect representation, minimum participant protocol, SDK/codec/
host split, freshness rules, renewal and compatibility analysis. The
[remote threat model](../contracts/effect-set/remote-threat-model.md) is design only.
Kujo `docs/WAVE_CD_EFFECT_SET_PROOF.md` is the coordinated audit, failure matrix,
remaining-boundaries record and exact next-agent prompt.

Source checks found v1 multi-effect representation already exists, while
`effect_assurance.kujo`, `effect_assurance_beta.kujo` and `interop_handoff.kujo`
explicitly consume one effect. Their constraints are retained. Workcell verifies
live Git targets and evidence markers, not mere participant reports. Agents SDK
installs host admission callbacks. Watchdog, RunLedger, Eval, Scent/RAG, MCP and
Leash retain observation, evidence, evaluation, context and transport ownership.
None gains replay authority from this work.

All work began on current main. Fetched Kujo, Dispatch and Workcell matched local
main. Agents SDK's local af0aa28 is seven release commits behind fetched 978354a;
its controlled Ability source is identical across that range, and current fetched
README states 1.1.2. Its unrelated untracked maintenance-agent work was preserved.
The initial Kujo SSH fetch timed out; a bounded retry succeeded before commits.

## Implemented and reviewed

`src/core/effect_set.kujo` binds original result bytes to an installed plan and up
to eight distinct ordered effect slots. It checks exact observation artifacts,
half-open validity, current preservation deadline and full independent live
reconstruction. Plan commits include target, scope, request, key, profile,
configuration, registration and authority identities. Duplicate logical sink keys
reject as ambiguous, even when effect IDs differ. Each output retains original
state, historical observation, current observation, freshness and the first
blocking predecessor. All outputs prohibit parent replay and require review.

Claim/observation/attestation/verification/admission are distinct. Historical
artifact content is not authenticated merely by hashing it. The surviving trusted
host store, journal and installed verifier are explicit assumptions. A malicious
host callback can lie; this experiment is not a sandbox against its operator.
No callback, authority label, filesystem path or live verifier arrives from wire.

The real SQLite proof commits A, commits B then loses its report to SIGKILL, kills
the controller after durable recording, and assesses in fresh processes. B has no
installed independent application verifier, so it remains unknown even though
the test harness knows how its fixture sink behaves. C/D are unstarted and
explicitly blocked by B. A is confirmed by the existing independently invoked
sink readback. Two real contenders preserve one A row; actual deletion later
makes A unconfirmed. Renewal appends artifacts; old bytes are compared unchanged.
Torn journal data is rejected by the existing reconciler.

Go implements portable bytes and closed handoff parsing independently with only
its standard library. Duplicate keys and lone surrogates are rejected before
normalization. CLI and MCP share one codec and do not execute effects. Both
transports record the real lost B report, which Dispatch correlates with a separate
truthful single-effect child result. Forged completion knowledge fails exact host
expectations. Successful recording still cannot authorize parent replay.

Go reproduces all 58 existing commitment vectors and seven additive vectors, plus
the 28-case / 22-parser historical corpus: 115 checks. MCP has five response checks
and nine additional malformed/initialization checks. The new vector values also
match independent TypeScript/Python encoders and Kujo's portable encoder. No
historical corpus or alpha/beta bytes were edited. Rust was evaluated but not
implemented; a fourth codec would not resolve the missing partial-admission proof.

## Validation and provenance

Machine-readable commands, exact commits, artifact hashes, gate results and
limitations are in [validation.json](../evidence/effect-set/validation.json).
The committed crash proof covers 29 assessments plus real process loss, deletion,
concurrency, child correlation and journal-tamper checks. Freshness uses explicit
host test timestamps; no claim of synchronized remote clocks follows.

The canonical Dispatch release gate exercises existing alpha/beta migration,
frozen historical readers, real Git/Ability/MCP/HTTP participant failures,
persisted revision/downgrade checks and the existing workflow suites. The new
suites are registered in that gate. Final focused reruns cover the last bounded
parser/blocker refinements. The full gate was started before those refinements;
only new suites changed during it, and all affected new suites were rerun against
the committed final source. Unchanged historical suites were not silently relabeled
as independent new implementations.

Kujo's docs-only changes use `cargo fmt --check`, `cargo test --test readme_contracts
--test docs_examples`; the exact optimized runtime was rebuilt with `cargo build
--release --locked`. Existing tiny_http vendor warnings were not suppressed. No
Kujo source change requires another full runtime release sweep. Workcell, Agents
SDK and related repositories were not modified; their full independent release
sweeps were not claimed. Relevant existing adapter paths run through Dispatch.

Initial new harness invocations from the Kujo cwd failed because Dispatch-relative
fixture/build paths were absent. Running from Dispatch, as documented, fixed the
invocation. No assertions or historical expectations were weakened to pass.

## Deliberate remaining boundaries

No production partial-effect admission, general beta multi-effect assurance,
compensation, cross-sink atomicity, exactly-once guarantee, machine-loss recovery,
remote authentication, multi-host authority, remote renewal, public SDK, protocol
freeze or A2A integration. Changed-ref/revocation/remote-expiry new cases are
contract negatives, not live remote certification. The next bounded proof is one
selected unstarted effect under existing locked, persisted, one-use authority,
with competing controllers and kill boundaries; the exact prompt is in Kujo's
coordinated report.

SignalBox: no captures warranted. Deferred architectural scope is documented as
the next proof; it is not an unresolved defect discovered in shipped behavior.
