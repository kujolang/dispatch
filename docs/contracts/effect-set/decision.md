# Coordinated Wave C/D decision — 2026-09-29

Status: experimental local composition proof, not a release or production resume
policy. Written before implementation. Baseline Dispatch 955996b, Kujo 59b9c53,
Workcell 1940da0, Agents SDK af0aa28, all on main. Agents SDK has unrelated
untracked maintenance-agent work; leave it untouched.

## Ownership and decision

Participants -> claims / observations / references -> installed independent
verification -> Dispatch policy -> host execution / Workcell preservation.
Every arrow crosses a binding check; none transfers admission authority.

| Concern | Owner and source evidence |
|---|---|
| Capability enforcement | Kujo runtime, docs/NATIVE_API_SECURITY_POSTURE.md |
| Admission, replay, journal/checkpoint authority | Dispatch, src/core/intervention.kujo, control_journal.kujo, persisted negotiation |
| Environment retention | Workcell, src/evidence/git_effect.kujo and preservation lifecycle |
| Protocol / codec | Small interop contract; independent implementations, not an SDK API |
| Effect observation and sink enforcement | Application adapter; Dispatch installs the verifier |
| Evidence aggregation | RunLedger notes/references; cannot resolve effect truth |
| Telemetry | Watchdog native observations; cannot admit work |
| Evaluation | Eval checks; a passing score cannot authorize effect replay |
| Context / retrieval | Scent / RAG; retrieved claims remain untrusted input |
| Intervention transport | Leash / adapters; Dispatch still validates a decision under lock |
| Convenience APIs | Agents SDK and language participant SDKs |

The current v1 result already represents up to 1000 effects. Existing assurance
and generic handoff consumers explicitly require one. Do not remove those checks
or silently project a multi-effect result through their single-effect APIs.

Implement a separate bounded effect-set sidecar and read-only Dispatch assessment
for up to eight ordered effects, binding exact existing result bytes and an
operator-installed immutable plan. Independently observed facts are append-only
artifacts. The host supplies a verifier and current plan revision; producer
labels or repeated claims cannot substitute. Existing alpha/beta paths and bytes
remain unchanged. No execution-result/v2 is justified.

The first proof assesses a real local SQLite sequence after participant and
controller termination. It does not install a new production workflow continuation
path. A whole-parent replay is always prohibited by this prototype; individually
unstarted effects can be identified for a future locked admission integration.
This intentionally narrows the initial proof: distributed compensation, automatic
partial-action scheduling and arbitrary machine recovery are not implemented.

Extract the existing minimum handoff protocol, then implement one independent Go
codec with CLI stdin/stdout and MCP stdio transports. MCP transport shares that
Go codec; it is not counted as another independent implementation. Go's standard
library suffices. Rust is evaluated but a fourth codec adds less evidence than
freshness/crash tests in this slice; Kujo, TypeScript and Python remain independent
comparators. No new public SDK, registry or transport authentication is introduced.
