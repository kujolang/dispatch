# Wave D external Python adoption — 2026-09-27/28

Experimental `kujo.interop-handoff/v1alpha1`, Workcell Git profile `1beta1`.
Independent Python adoption of the native generic core; no assurance, replay,
execution-result, generic schema or previous participant implementation changed.
Validation evidence is retained under [wave-d-python](../evidence/wave-d-python/).

## Baselines and scope

| Repository | Fetched main before work |
|---|---|
| Dispatch | c944b079b2744fdd96792e50158cc82b72eeea4d |
| Kujo | 254326f3d01d1e21cb285575b40dacd536c1da8d |
| Workcell | 1940da0639b70b702c1b1077dda51ca39b065216 |
| Ability | d6c970785f8d8bea04de0dce37920c2d0ca1c067 |
| MCP | a7ec0dd8e6bcae303ab1431b4586dfe3e91f3a5a |
| Agents SDK | af0aa28f5960232cbafa7cf528a32db8cb36c7a9 |

Required Dispatch ancestry7299c28,19ca2b0,4ec5344,ee9fe273 verified. Supporting
repositories are read-only; unrelated untracked SDK maintenance work preserved.
Only Dispatch implementation fixtures/package and Kujo architecture docs change.

## Independent implementation and interpretation

[Standalone project](../../interop/python-participant/README.md) uses Python3.10.5,
stdlib and jsonschema4.23.0. Six exact wheel dependencies and all cross-platform
wheel hashes are pinned in requirements.lock. No source distribution installation.
A batch OSV query found no reported vulnerabilities for these six exact versions
at the recorded query time; this is not a comprehensive supply-chain assurance.

[Pre-code interpretation](../../interop/python-participant/docs/interpretation.md)
was recorded before codec implementation. It used published generic/core/portable
material, not prototype parsers. TypeScript README described its black-box API;
its codec/participant/host implementation source was not read or translated.
No implementation imports from Dispatch, TypeScript, Workcell, Ability, SDK, MCP
or HTTP exist in the Python package. Owner effect invocation is a configured CLI,
not an import or replacement of Git assurance. The published `example.job`
registration example confirms the host callback boolean convention; it was checked
during review, without consulting the generic reader implementation.

No normative ambiguity or clarification was required. Existing namespace-specific
rules require an owner registration; they do not imply every codec accepts every
other owner. Parity therefore substitutes only the deliberately different owner
namespace/schema tokens before testing each implementation, then projects them
back when comparing accepted canonical bytes and normalized semantics.

## Closed Python extension and native generic output

Owner namespace `kujolang.python-process`; participant schema
`kujolang.python-process-correlation/v1alpha1`. Closed values are `call_id` and
`process_instance_id`, each1–128 ASCII identifier bytes. They are distinct from the
host-allocated invocation ID, Dispatch run/step/action attempt/effect, Workcell
alias and transaction commitment. Process identity is attribution, not OS authority.

The eight-field generic wire is emitted directly. No legacy handoff is created.
Required exact execution-result reference and nullable selected assurance reference
are content addresses. Optional existing Git correlation extension holds alias and
transaction commitment only. Git target/scope/key/request/precondition remain in
Workcell assurance. Example exact retained artifacts are linked in the manifest. These are historical
proofs, not renewable admission credentials; original validity is not extended.

Unknown participant completion persists after SIGKILL regardless of whether Git
readback shows not_started or committed. A usable terminal error can be reported;
reported does not mean success. Neither process exit status establishes effect truth.

## Portable codec, vectors and parity

20/20 frozen published generic commitment vectors reproduce exact preimages, hex
and SHA-256. Python performs strict duplicate-key detection, safe integer bounds,
float/negative-zero/nonfinite rejection, scalar Unicode validation, no normalization,
ASCII key sorting and prescribed escapes. Canonical byte equality rejects alternate
escapes, whitespace, key reordering, BOM and trailing newline. Schema validation
supplements explicit byte/identity/owner checks; it is not the sole validator.

28 runtime-neutral parity cases plus22 isolated parser checks compare acceptance, owner-projected canonical bytes,
content addresses and normalized semantics against the documented TypeScript API.
Cases include duplicate members/extensions, reordered/whitespace/escaped wire,
Unicode/surrogates, newline/oversized identifiers, oversized/nested/unknown/missing
extensions, malformed/swapped references, subject substitution and completion
knowledge. Swapped well-shaped references are denied by expected-host correlation,
not confused with a syntax error. Integer/Unicode/container cases also exercise the
independent portable encoders. Expectations come from the corpus, not either codec.

The copied standalone package runs its13 unit test methods (with table-driven cases),
20 vectors and Python side of parity in a new virtualenv outside every ecosystem
checkout. Installation uses cached wheels with --no-index/--require-hashes. No network
is required after dependency installation. Manifest hashes pin published assets.

## Host boundary, crashes, contention and restart

Only host-owned setup selects effect executable, repository, target, evidence root,
policy or configuration. The caller schema is exactly `{call_id}` <=512 bytes.
Twelve authority/effect input attempts fail before ticket claim and Workcell access.
Expired/stale ticket and symlink caller-file tests likewise leave the effect absent.

A private inherited socketpair connects parent and Python child. Length-prefixed
frames are bounded to8192 bytes; receive deadline15s. No endpoint or callback selector
is accepted from caller data. Four distinct Python workers contend for one ticket;
host exclusive file creation and fsync admit one, deny three. Host phase checks and
current-attempt/expiry recheck occur immediately before the fixed Workcell action.
No retry loop exists in either participant or transport.

| Case | Actual termination | Live Workcell predicate | Review outcome | Logical effects |
|---|---|---|---|---|
| Before CAS | SIGKILL, returncode -9 | not_started | fresh controller admits execution | 1 |
| After CAS/before report | SIGKILL, returncode -9 | committed | fresh controller admits deduplicated replay | 1 |
| Four contenders | four Python children | one winner | 1 admitted / 3 denied | 1 |

The surviving host retains provisional bytes, observes Git read-only, finalizes the
exact authoritative result and launches a fresh recording-only Python worker. That
worker cannot execute. Unknown completion is preserved. Later assurance selection
creates a new generic artifact referring to the same historical result bytes.
This is local surviving-host/store recovery, not machine-loss recovery.

Initial/fresh controllers are separate actual Kujo processes; initial/replay children
are separate Python processes. Required/deny beta configuration revision remains
unchanged when process defaults are weakened to legacy. Review checkpoint precedes
resume; descendant completion and exact marker intent/new target prove one logical
Git effect. Original result bytes remain unchanged.

## Dispatch integration and compatibility

Only fixture host wiring and a new trusted owner extension callback were needed.
`tests/python_registration.kujo` validates closed owner values against retained host
identities, result participant_correlation and Git transaction commitment. Existing
`correlate_interop_handoff` performs subject/reference checks. No production Python
branch, family reader, generic parser, verifier or replay engine was added.
The test controller's language selection chooses process invocation and installed
registration only; it is operator fixture setup, never producer input.

Eleven correlation substitutions plus exact-byte tampering deny evaluation before
replay admission: subject components, invocation/namespace, result/assurance refs,
call identity, transaction and completion knowledge. Existing beta resolver and
retry_is_effect_safe remain authoritative. All historical wire/schema files remain
unchanged. The full gate re-executes SDK/MCP/HTTP/Git process/TypeScript plus beta,
persisted negotiation and legacy replay regressions through the shared core.

## Trust, privacy and fresh security review

Python is launched with -I and empty environment. Tests inject PYTHONPATH,
PYTHONHOME, PYTHONSTARTUP, sitecustomize/usercustomize and cwd json shadowing; none
execute or leak the environment canary. Absolute operator source anchoring avoids
cwd imports. Installed virtualenv/site .pth content remains trusted operator code;
this does not defend against a malicious installer or same-UID/root attacker.
Only hash-pinned wheels are installed. No dynamic plugin loading exists.

Bounded confined reads reject symlinks; content-address writes are exclusive and
fsynced, and existing bytes must match their digest. Directory ownership is a host
assumption. Workcell stdout+stderr is bounded during collection to8192 bytes with a
15s deadline, not merely checked after unbounded buffering. Private payload, repo
content, host path and environment canaries do not appear in handoffs, journals,
public output or diagnostics. Raw config and target refs never enter the handoff.

Source review covered duplicate JSON, Unicode normalization, namespace confusion,
callback substitution, stale/reused tickets, package/schema substitution and
completion/effect-truth confusion. Manifest+configuration commitments bind source
and schema inventory; dependency lock integrity is installation evidence, not a
runtime sandbox. Missing selected evidence fails closed. No trust is derived from
participant fields. Temporary implementation mistakes were fixed before validation:
terminal success uses the existing v1 `success` status with `unknown` classification;
all contenders now start real participant children before atomic host admission.
The final review also added the Python package initializer to the persisted code
commitment: changing its exact bytes now blocks admission, and restoring them
restores verification. Copied-package schema substitution is rejected at startup.
Parser-only comparison found and fixed a Python implementation omission: opaque
attempt IDs were initially accepted by parsing, though host snapshot comparison
denied them. The published positive decimal action domain is now enforced directly.
The permanent parity suite tests parser acceptance separately so correlation denial
cannot hide a codec difference. No normative clarification, runtime defect or
contract change was necessary.

## Cross-runtime SDK surface and next task

TypeScript and Python converge on these concepts: strict encode/parse/reference;
closed owner registration; host-expected snapshot comparison; tiny caller identity;
private host admission; record unknown before effect; host-only execution; record
usable terminal knowledge; read-only finalization after completion loss. These are
candidate concepts, not a frozen SDK API.

| Candidate SDK concept | TypeScript proof | Python proof | Boundary to retain |
|---|---|---|---|
| Canonical codec | string/Buffer interface | bytes interface | Specify exact byte boundaries; no permissive JSON repair |
| Content reference | standard SHA-256 | hashlib SHA-256 | Address only, no lookup authority |
| Owner validation | closed installed callback | closed installed callback | Caller cannot register code/namespaces |
| Host snapshot match | full expected document | full expected document | Correlation only, never replay permission |
| Admission | private Node IPC | inherited socketpair | Host owns one-use ticket and current attempt |
| Completion recording | provisional/final/record-only worker | provisional/final/record-only worker | Participant knowledge stays separate from effect truth |
| Effect execution | fixed Workcell host action | fixed Workcell host action | No effect configuration or retry API in participant input |

Transport differs (Node IPC versus inherited socket framing), runtime isolation differs,
and lifecycle process identities remain owner-specific. A future SDK MUST keep host
admission/effect execution separate from the codec; it must not absorb assurance,
retry, policy, principal authentication or evidence-root selection.

Recommended next task: **design generic participant SDK API**, with equivalent
TypeScript/Python interfaces and conformance requirements derived from these two
implementations. Do not publish or stabilize it yet. Remote trust, A2A, multi-effect,
renewal and total-store rollback remain outside this proof.

## Validation and decision

**Adoption decision: YES.** No normative clarification was required. Final source
`bf7ce63bec146f4fa664becf364e086dac99f2e1` passed the full local Dispatch release
gate: all 24 contract shards, three bounded release workloads, persisted/beta
assurance, and SDK/MCP/HTTP/Git/TypeScript/Python integrations. Python passed 13
unit methods, all 20 published vectors, 28 cross-runtime cases plus 22 independent
parser comparisons, isolated offline installation, real SIGKILL/restart paths and
four-process admission (one admitted, three denied, one logical effect).

Workcell effect-assurance gates, Kujo `cargo fmt --check` and
`cargo test --test readme_contracts` passed. Six pinned dependency versions had no
OSV findings at the recorded query time. No hosted CI is claimed. Exact artifact,
source and schema hashes are in [the evidence manifest](../evidence/wave-d-python/manifest.json).
No global enablement, remote transport or stable promotion is included.

## Commit map

| Repository | Commit | Purpose |
|---|---|---|
| Dispatch | `0dd902f35aebf8e9252a99b7821c375fcb69b250` | Independent codec and local host |
| Dispatch | `ebc7e8c038b8a7521017a9b966d056e718666523` | Parity, crash/replay, isolation and release gate |
| Dispatch | `c00275ef15edb26f6b25e1289c517c0226d7a6ef` | Initializer commitment and schema substitution regression |
| Dispatch | `bf7ce63bec146f4fa664becf364e086dac99f2e1` | Action-attempt grammar and parser-only parity |
| Kujo | `6ab4121a1e43a93353d10a74a754d4e9e3a5c094` | Roadmap and architecture status |

This report and retained evidence are committed separately from executable changes.
