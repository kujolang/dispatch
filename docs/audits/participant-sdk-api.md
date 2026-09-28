# Generic participant SDK API rehearsal — 2026-09-28

Experimental, alpha, unreleased and unpublished. Canonical source comparison and
language-neutral input/output/trust matrix: [SDK design](../contracts/participant-sdk/design.md).
Independent codecs remain. Only external TypeScript/Python adopt this prototype;
Dispatch production code, replay policy, generic schema and four legacy participants
are unchanged.

## Baselines

Dispatch fetched main `0ca34ec9769b07254c1f4db385cecae6efbfd6d5`; Kujo fetched main
`6ab4121a1e43a93353d10a74a754d4e9e3a5c094`; read-only Workcell
`1940da0639b70b702c1b1077dda51ca39b065216`. Unrelated Agents SDK maintenance work
is preserved. Runtime source/binary and toolchain match the retained
[Python adoption toolchain](../evidence/wave-d-python/toolchain.json).

## Proposed common API and language surfaces

Source comparison distinguished exact-byte codec operations, closed installed
owner validation and snapshot correlation from Node IPC/Python socket framing and
host-owned execution. Neither runtime requires admission/retry inside its SDK.
Two layers therefore comprise pure codec functions and pure recording helpers,
not an execution orchestrator with callbacks.

| Language | Factory/error | Exact-byte operations | Recording helpers |
|---|---|---|---|
| TypeScript | `createCodec(registration)`, `SDKError.code` | `encodeHandoff`, `parseHandoff`, `contentRef`, `matchExpected` | `provisional`, `terminalReport`, `finalizeAfterReadback` |
| Python | `create_codec(registration)`, `SDKError.code` | `encode_handoff`, `parse_handoff`, `content_ref`, `match_expected` | `provisional`, `terminal_report`, `finalize_after_readback` |

TypeScript uses `Uint8Array`; Python requires `bytes`. Legacy codec proof APIs remain.
An instance-local, copied closed registration replaces hardcoded owner validation
for SDK calls. There is no global mutable plugin table. Trusted composition installs
one participant namespace/schema/field set and optional effect schema. Current owner
registrations live in `installed-sdk` modules. The shared test uses `example.recorder`,
proving the library is not restricted to TS/Python namespaces or Git field names.

Correlation validates both operands and returns only boolean `true`/`True` on
match. A mismatch raises `CorrelationError` with a bounded code; malformed inputs
raise codec `SDKError`. The review replaced the initial truthy-string return design,
so a mismatch cannot accidentally pass `if match_expected(...)`. Even a true match
is only correlation; Dispatch still decides admission. No replay errors enter this API.

## Completion lifecycle and host responsibilities

The host consumes current one-use admission, supplies expected controller context,
durably records provisional `unknown`, then invokes its configured Workcell effect.
A usable terminal report is `reported`, including errors. On disappearance the host
independently observes state and finalizes the authoritative result. A fresh
recording-only worker receives the new snapshot and emits new `unknown` handoff
bytes; it cannot execute effects. Selecting assurance later creates another artifact.
Neither helper changes knowledge or references implicitly. Original process survival
is unnecessary; process exit status is never effect truth.

The SDK never resolves evidence, authenticates principals, selects effects, installs
verifier trust, consumes tickets, retries, launches processes or performs readback.
Durability acknowledgement/storage remain host-owned. “After readback” describes a
host prerequisite, not an operation the helper verifies. Callbacks/transport are
outside this pure surface; no `executeEffect(config)` convenience was introduced.

## Conformance and packaging

`kujo.participant-sdk-conformance/v1alpha1` is separate from the unchanged wire
version. The shared corpus has 45 operations covering codec/reference, registration
copy isolation, unknown/closed extensions, subject/reference/invocation correlation,
provisional/terminal/readback, bounds, duplicates, alternate escapes and Unicode.
The independent runners compare exact bytes, content addresses, normalized values
and error/correlation categories. Existing 20 vectors per codec plus 28 cross-runtime
cases and 22 separate parser checks remain mandatory.

Each copyable project includes source, pinned schema/spec/corpus assets, hash manifest,
SDK capability manifest and unchanged dependency lock. Python isolation installs
cached hash-pinned wheels into a fresh external virtualenv without network. TypeScript
isolation copies installed generic dependencies (no checkout symlink) and exercises
the SDK corpus outside the ecosystem. No cross-language or Dispatch runtime imports.
Real host integration fixtures still require Workcell/Dispatch; pure packages do not.

## Security/API review

- No effect callback or retry API. Recording-only separation is structural, not an
  execution method hidden behind a mode flag.
- Registration source mutation cannot alter a live codec. Unknown namespaces/schema
  IDs, arbitrary field types, nested metadata and private payload fields reject.
- Expected snapshots also validate. The SDK cannot authenticate context; trusted host
  provenance remains essential. Hostile same-UID/operator control is not covered.
- References hash exact bytes; never fetch paths/URLs or imply authorization.
- Python verifies packaged schema hashes before caching validators, including direct
  library imports. CLI bootstrap failures remain content-light.
- New SDK/registration code is included in the existing fixture's persisted verifier
  configuration commitment. Actual SDK-byte substitution blocks admission; restoring
  bytes recovers it. No production configuration algorithm was changed.
- New bytes/detached parsed values preserve original artifacts. Knowledge remains
  separate from commit truth, including when a live verifier establishes a commit.
- Correlation mismatches throw a distinct bounded error rather than returning a truthy category.

A new Python SDK-byte substitution probe initially reused the result-byte assertion
variable. The full gate caught that test-only collision; the probe now keeps separate
source/result variables and the affected regression passes.

Initial parallel TypeScript integration invocations overlapped deliberate shared-code
tamper probes and produced a configuration denial. The pre-commit fixture passed
when rerun in isolation. These probes must run sequentially, as the canonical release
gate already does. No control was relaxed to obtain a passing result.

## Validation, readiness and next task

**Decision: ready for experimental packaging.** Final source
`2f7bf303f738eb5c37f662dcc74043f84b770369` passed the full local Dispatch release
gate (exit 0): all 24 contract shards, command smoke and three bounded workloads.
No hosted CI is claimed. Exact outcomes, source hashes and retained process artifacts
are in the [evidence manifest](../evidence/participant-sdk-api/manifest.json).

| Check | Result |
|---|---|
| Shared SDK conformance | 45/45 in both languages; exact bytes/hash/value/category parity |
| TypeScript package | 45 tests pass, including external copied-package SDK use |
| Python package | 14 test methods pass, including 45-case SDK corpus |
| Existing portable/parity suites | 20 vectors/runtime; 28 cases plus 22 parser comparisons pass |
| Python package isolation | Fresh virtualenv, offline hash-pinned wheels, schema substitution denial |
| Real TS/Python pre/post-CAS loss | SIGKILL, fresh controller/checkpoint/replay pass; one effect |
| Contention in each runtime | Four contenders: one admitted, three denied, one effect |
| Legacy SDK/MCP/HTTP/Git and beta/persisted control | Full release-gate regressions pass |
| Workcell | Relevant real Git effect-assurance gate passes |
| Kujo docs | `cargo fmt --check` and `cargo test --test readme_contracts` pass |

Remote trust, multi-effect, hostile operator/total-store rollback and API stability
remain outside scope. No known blocker remains for the bounded packaging task.

Next bounded task: **package TypeScript/Python participant SDKs**
experimentally, with explicit host composition, common conformance, isolated package
tests and pinned assets. Do not publish automatically or freeze the alpha API.


## Commit map

| Repository | Commit | Purpose |
|---|---|---|
| Dispatch | `f966c8bda504b4562e05598c043309513d3860c6` | Language-neutral design, independent SDK facades/recorders and conformance |
| Dispatch | `26417757c32097ae1f5fbf211b07a781233e2c54` | Shared gate and persisted SDK code commitments |
| Dispatch | `083b62cec00c1c404722bec95d3c95bbe03b92f8` | Correct substitution probe's result-byte preservation |
| Dispatch | `2f7bf303f738eb5c37f662dcc74043f84b770369` | Replace truthy mismatch returns with bounded correlation exceptions |
| Kujo | `6ca0e65fedd129988bc4283b10f8f9ec98fa1cb5` | Roadmap and architecture status |

Audit/evidence is committed separately after verification. Exact final commit identity
is recorded in the session's Strata handoff; the report cannot self-hash its own commit.
