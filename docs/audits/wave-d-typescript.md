# Wave D external TypeScript adoption — 2026-09-27

Status: experimental, opt-in, unreleased. Adoption decision: **YES**, subject to the
bounded local trusted-host domain below. The fifth participant emits the generic
core directly; no participant-specific Dispatch reader, assurance verifier or replay
policy was added. This is independent implementation, not personnel isolation.

## 1. Baselines and contracts

All modified repositories started on fetched clean main. Dispatch's expected generic
core commits `7299c28` and `19ca2b0` are ancestors. Supporting repositories were not
modified; existing unrelated Agents SDK maintenance-agent files were preserved.

| Repository | Starting commit |
|---|---|
| Dispatch | `ce7b4e385a8d47b39177999b8822a844c68489ba` |
| Kujo | `9c0f6e63699d91a98f9fa6d0130ade7059802923` |
| Workcell | `1940da0639b70b702c1b1077dda51ca39b065216` |
| Ability | `d6c970785f8d8bea04de0dce37920c2d0ca1c067` |
| MCP | `a7ec0dd8e6bcae303ab1431b4586dfe3e91f3a5a` |
| Agents SDK | `af0aa28f5960232cbafa7cf528a32db8cb36c7a9` |

Contracts: `kujo.interop-handoff/v1alpha1`, unchanged
`kujo.execution-result/v1`, `dispatch.effect-assurance/v1beta1`, persisted
`dispatch.assurance-negotiation/v1beta1` required/deny, Workcell profile
`workcell.git-cas` version `1beta1`. Alpha support and global defaults are unchanged.
The fixed fixture uses the existing local Workcell adapter and trusted configuration.

## 2. Independent implementation

[Standalone package](../../interop/typescript-participant/README.md): TypeScript
5.9.3, Node 26.7.0, Ajv 8.20.0, @types/node 22.19.0; exact dependency integrity in
`package-lock.json`. Standard crypto, filesystem and process APIs are the only other
runtime dependencies. No network is used by verification fixtures.

The [pre-code interpretation](../../interop/typescript-participant/docs/interpretation.md)
records the published contract reading before implementation. `src/codec.ts`,
`src/participant.ts`, and `src/record.ts` import only their own code, standard Node
libraries and Ajv. No SDK/MCP/HTTP/Workcell participant, Dispatch parser, correlation
helper, portable helper or replay implementation is imported or translated.

A copied package containing only source, tests, schemas, specifications, vectors,
manifest, tsconfig and lockfile installs from npm's local cache with `npm ci --offline
--ignore-scripts --no-audit --no-fund`, then builds and passes all 44 tests outside
all ecosystem checkouts. A separate isolation test copies compiled code/assets and
resolves only pinned generic npm libraries. Modified schema bytes reject on load.
The source independence scan is retained with the evidence.

## 3. Generic-core interpretation

The core correlates one host-owned action subject to exact authoritative result
bytes and optional selected assurance. Participant namespace/invocation is
attribution, not authentication. The current consumer's attempt is decimal action
attempt, not evaluator attempt or process retry number.

Canonical UTF-8 wire must exactly equal the independent sorted-key encoder. Duplicate
members, reordered keys, extra whitespace and alternate escapes reject; bad Unicode,
floats and unknown structures reject. Limits are 6144 total bytes, 2048 core/extension,
128 per ID/value, flat <=16-member extensions. Exactly one participant extension and
at most one effect extension are accepted. No arbitrary nested metadata exists.

`reported` means a usable terminal report, including an error. `unknown` means no
usable terminal report. Neither establishes effect completion, trust or retry safety.
SHA-256 references hash exact bytes and are not paths, URLs or capabilities.
Twenty published generic commitment vectors reproduce byte-for-byte and digest-for-
digest in the independent encoder; this is not another effect-assurance verifier.

## 4. Participant extension

Owner namespace: `kujolang.typescript-process`. Closed owner schema:
`kujolang.typescript-process-correlation/v1alpha1`. Its only fields are `call_id`
and `process_instance_id`, each a 1–128-byte ASCII identifier. Core invocation ID is
a separate host-allocated UUID. Process identity is opaque attribution, not a trusted
PID. Call identity is not a Dispatch attempt or one-use authority.

The existing Git effect extension is reused unchanged:
`workcell.git-correlation/v1alpha1`, with an opaque Workcell effect alias and its
intent/CAS transaction commitment. The participant does not interpret the Git
predicate or copy targets, refs, keys, preconditions or repository paths.

## 5. Dispatch integration

The only new Kujo registration is
[`tests/typescript_registration.kujo`](../../tests/typescript_registration.kujo).
It compares the closed owner fields against retained host identities, family
commitment and execution-result correlation. It does not parse generic wire or decide
replay. Test-controller wiring resolves the content address and invokes the existing
`correlate_interop_handoff` with current authoritative inputs and that callback.

**No changes to `src/`, existing schemas, legacy readers or historical fixtures.**
The new integration branch is fixture host installation, not a fifth family-specific
Dispatch reader. A production embedding would install the same callback/API under
its own locked controller boundary. Existing persisted configuration pins the host,
registration, compiled participant/codec/recorder, manifest and lockfile.

## 6. Real effect sequence

The controller creates a required/deny beta run and host-owned ticket containing the
current action context. A separate Node host starts a separate TypeScript process
with private inherited IPC and an empty environment. The caller supplies only call ID.
The host atomically consumes admission, then the participant encodes a native generic
`unknown` handoff before the fixed Workcell action can start.

Workcell performs the existing marker/target CAS transaction in a local bare Git
repository. The host never exposes the repository/ref/configuration to the participant.
Dispatch later consumes the final result/handoff, selects beta assurance, pauses for
review, and publishes a durable checkpoint. Initial processes have exited. Fresh
controller processes load the persisted policy despite a weaker local default, resolve
the original revision, correlate evidence and invoke the existing live Git verifier.
Only Dispatch can admit attempt two; a new host and TypeScript process then run.
The descendant completes. One logical marker/target effect remains.

## 7. Crash paths and evidence ordering

| Boundary | Actual process event | Live Workcell observation | Participant knowledge | Reviewed outcome |
|---|---|---|---|---|
| Before CAS | TypeScript child SIGKILL before Workcell mutation | `not_started` | `unknown` | Fresh admitted attempt commits once |
| After CAS | TypeScript child SIGKILL after real Workcell commit, before reply | `committed` | `unknown` | Fresh admitted replay deduplicates |

The fixture asserts retained termination `signal=SIGKILL`, `phase=executing`, not a
synthetic uncertainty return. A surviving host reads Workcell state and uses a fresh
TypeScript **recording-only** worker to encode the final unknown handoff. That worker
has no effect/admission API. Readback is not replay.

The first trial caught a result/enforcement-reference mismatch: pre-effect provisional
bytes could not represent the final live observation. The fixed ordering retains those
bytes unchanged, finalizes the authoritative result after readback and before Dispatch
accepts it, then references those exact bytes. Later assurance attachment produces a
new immutable handoff; original provisional and selected artifacts retain their hashes.
This required no normative contract change or reinterpretation of historical results.

The proof requires surviving host/root storage. It does not claim recovery from loss of
all host state or death of the recorder before authoritative result publication.

## 8. Concurrent admission

Each crash fixture runs four independent hosts/TypeScript contenders against one
controller-installed ticket: **1 admitted, 3 denied, 1 logical Git effect**. The claim
is exclusive-created and fsynced, including its directory. Old tickets for attempts
one and two reject. Current-attempt and expiry checks repeat before mutation.
The extra contention ticket is a host duplicate-delivery test, not a new workflow
permission generated by the participant. Dispatch action invocations remain under
controller authority; no transport retry loop is implemented.

## 9. Representative handoff

The exact retained example is in `../evidence/wave-d-typescript/after-handoff.json`.
It is native generic wire, not a legacy Workcell process handoff. Its structure is:

```text
schema: kujo.interop-handoff/v1alpha1
subject: host-owned run / action step / decimal attempt / effect
participant: kujolang.typescript-process / independent invocation UUID
completion_knowledge: unknown
execution_result_ref: sha256:<exact final result bytes>
assurance_ref: sha256:<selected beta assurance bytes>
participant_extension: closed call_id + process_instance_id
effect_extension: Workcell opaque effect alias + Git intent commitment
```

No Ability fields, principal, body, path, command, verifier or policy is present.

## 10. Trust isolation and negative matrix

Per real crash path: 15 correlation substitutions reject with authoritative state
bytes unchanged; two installed-code/lock substitutions reject; raw-byte tampering
and a symlink artifact reject. Invalid correlation blocks checkpoint resume; restoring
it requires a fresh checkpoint after the existing denial transition.

Caller attempts to set profile, repository, config revision, four Dispatch IDs,
trusted root, verifier, assurance reference or principal reject before ticket claim.
A stale ticket and expired ticket also reject: 13 such trust denials per path, in
addition to duplicate-ticket and contention checks.

Package tests cover all four subject IDs; wrong/swapped/malformed references;
namespace/invocation substitution; overlong/newline IDs; missing, unknown, duplicate,
nested and oversized extensions; noncanonical/duplicate wire; knowledge substitution
and invalid effect-truth values. Direct execution without a host fails content-light.

## 11. Privacy and security review

- Caller cannot choose callback code, effect/configuration or host storage. Inherited
  IPC is trusted local installation, not producer JSON or remote authentication.
- Exact schema hashes and installed code/lock commitments resist accidental package/
  schema substitution. A hostile operator replacing the whole trust root or dependency
  tree is outside the model; lock integrity alone is not runtime attestation.
- Confined reads use no-follow and bounds; generic Dispatch reads independently rehash
  artifacts. Paths/URLs cannot appear as references. Operator-owned parent directories
  remain required; this is not a same-UID adversarial filesystem sandbox.
- Unknown extension/schema never falls back. The owner callback binds extension and
  knowledge to host-retained result facts, never an untrusted `ok: true` response.
- A new-consumer regex edge case admitted trailing newline through JSON Schema `$`;
  explicit full identifier checks now reject it, with two dedicated tests.
- A helper compared joined key names without first comparing cardinality. Current
  admission field checks already rejected that collision; the helper now checks
  exact own-key membership/count, with a dedicated regression.
- Public codec parse errors are normalized to `interop_invalid`; native JSON parser
  exceptions cannot echo malformed input. Process-level errors were already redacted.
- Initial Ajv 8.17.1 produced a moderate `$data` ReDoS advisory. This integration never
  enabled `$data`, but dependency was nevertheless pinned to 8.20.0; audit reports zero.
- No hidden retry or effect-truth inference exists. SIGKILL remains unknown even after
  readback. Review/assurance stays in Dispatch and Workcell, respectively.
- Input, Git content and host-path canaries do not appear in handoffs, Dispatch journal,
  collected public outputs or diagnostics. Child environment is empty. No telemetry
  framework or provider assumption was introduced.

No unresolved task-specific security defect was found. Local trusted-host limits,
remote trust, multi-effect, total-store rollback, retention/renewal and arbitrary
package compromise remain explicitly outside this experiment.

## 12. Legacy compatibility

All four old participant readers/schemas/fixture bytes remain unchanged. Full gate
runs historical adapter/frozen-reader equivalence and actual SDK Ability, MCP normal/
lost-response, HTTP response-loss/pre-commit-timeout/application-error, and Git
pre/post-commit paths. All five participants use the same generic core before unchanged
beta verification and replay policy. No standalone behavior was changed.

## 13. Validation and reproduction

Evidence is retained in `docs/evidence/wave-d-typescript/`. Assurance samples are
historical artifacts, not renewed admission credentials; rerun the fixtures for fresh
live verification. Final gate outcomes and
provenance are recorded in that directory's manifest and gate transcript.

- TypeScript: 44 unit/schema/codec/package tests, 20 published vector agreements;
  independent copied package offline install/build/test; schema substitution denial.
- New process fixtures: both actual crash boundaries, fresh controller/participant,
  checkpoint, weaker-default resistance, contention, correlation/trust/privacy matrix.
- Workcell: `KUJO_BIN=... bash tests/effect_assurance.sh`; real Git atomic transaction,
  duplicate, input conflict, expiry, moved target, privacy, four-process 1/3 contention.
- Dispatch: `KUJO_BIN=... DISPATCH_OFFLINE_FIXTURE=true bash scripts/run_release_gate.sh`;
  includes all new and prior suites, 101 sharded contracts, command smoke and workload.
- Kujo docs-only: `cargo fmt --check`; `cargo test --test readme_contracts` (1 passed).
- `git diff --check`; source import audit; exact historical tree diff; npm audit zero.
- CI/tag verification bootstrap pins Node and installs the package lock before tests.
  The new harness respects `WORKCELL_ROOT`, including isolated CI checkout layouts.
  Tag verification previously lacked SDK/MCP checkouts and retained older family pins;
  its prerequisites now match the locally exercised participant revisions. YAML and
  bootstrap ordering are checked locally; hosted workflow execution is not claimed.

Runtime used: optimized Kujo source build `5d72aab4b99e7f8c01e4c208d6c97061934c7447`,
SHA-256 `4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93`.
This is local source-runtime evidence, not a published release or hosted CI claim.
No optional cloud/model/container environment is required by this Git fixture.

## 14. Commit map

| Repository | Commit | Purpose |
|---|---|---|
| Dispatch | `4ec5344ee10e579113bb324015e4c63b6fc7790b` | Independent package, codec, owner extension and local host |
| Dispatch | `ee9fe273958cdd16dcab17d6cc4c8ade146239c6` | Real controller/process regressions and gate/CI prerequisites |
| Kujo | `254326f3d01d1e21cb285575b40dacd536c1da8d` | Roadmap/changelog/architecture only |

The separate evidence/documentation commit containing this audit is recorded by exact
ID in the session's Strata handoff and final response; it does not embed its own
future hash. No supporting adapter repository was modified.

## 15. Adoption decision

**YES: the generic Wave D core is independently adoptable in its documented domain.**
The participant implements published wire/extension contracts directly, compiles
outside the checkout, and reaches existing Dispatch correlation through registration
only. No semantic clarification or core redesign was needed. Integration ordering
for final Workcell evidence is documented above, not hidden in an altered parser.

## 16. Wave D maturity

Five participants, two effect families, one generic correlation core, unchanged
controller authority. This proves an external TypeScript process can participate
without learning existing participant lifecycles or implementing assurance/replay.
It does not stabilize the alpha handoff, publish an SDK, enable global assurance,
provide remote trust, grant exactly-once effects or support multi-effect execution.

## 17. Recommended next target

**External Python participant**, implementing the published core and its own closed
extension without importing this TypeScript codec or existing participant code.
Use one existing effect profile and the same generic registration API. Prove strict
wire parity, one-use local admission, process-loss review/replay and historical
regression. This tests a second external runtime before freezing a generic participant
SDK package API; remote authenticated transport would add a different trust model and
is not justified by this local adoption evidence alone.
