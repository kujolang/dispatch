# Source-blind agent adopter rehearsal — 2026-09-28

This is an **agent-simulated external adopter**, not a human pilot. Human usability
has not been validated. No package was published, API frozen, or remote authority
introduced. The coordinator had implementation knowledge; the adopter did not
receive that context and authored its participant before coordinator integration.

## Frozen inputs and baselines

Dispatch `1110ff77accaa5034b6cf0349c6771410d6079d5`, Kujo
`c1cc06ff67e6b8dc1419e5b91adc259891090aad`, Workcell
`1940da0639b70b702c1b1077dda51ca39b065216`, Ability
`d6c970785f8d8bea04de0dce37920c2d0ca1c067`, MCP
`a7ec0dd8e6bcae303ab1431b4586dfe3e91f3a5a`, Agents SDK
`af0aa28f5960232cbafa7cf528a32db8cb36c7a9` matched fetched main.
The existing Agents SDK maintenance files were left untouched.

The original 39-file bundle was copied, never regenerated. Its manifest remains
[`frozen-inputs.json`](../evidence/participant-adopter-pilot/frozen-inputs.json),
SHA-256 `37ed7e530b573bf0939243cc2c7337d527c1f82238b1ee73ab987b977cfca405`.
That manifest records every README, API reference, design/trust document, schema,
specification, corpus, capability manifest and package/dependency digest. Both
coordinator and adopter verified exact bytes against the committed manifest.
No corrected onboarding revision or private answer was needed.

## Isolation and source independence

A fresh sub-agent was started with **no conversation fork** in
`/tmp/kujo-source-blind-adopter.ed0Hgo`. Its instructions permitted only the copied
bundle, its own files, installed public SDK API and the localhost artifact feed.
It received no Strata/SignalBox memory or existing participant source. The allowed
read list is retained in [consulted-files.json](../evidence/source-blind-adopter/consulted-files.json).
Package implementation was installed as software, not read as onboarding material.

Isolation was procedural on a shared host, **not an OS-enforced sandbox**. The
read audit and separate no-history role support the bounded source-blind claim;
this is not evidence that a malicious agent could not access other files.
Coordinator-owned host code and review used internal source separately, after the
adopter wrote its implementation. No such code was supplied as instruction.

## Comprehension, package acquisition and public API

The adopter recorded [comprehension.md](../evidence/source-blind-adopter/comprehension.md)
before coding. It correctly distinguished SDK encoding/correlation, host admission
and fixed effect execution, Dispatch replay policy, and live effect verification.
It explained that unknown completion can coexist with a committed effect,
reported completion can describe an error, content references are neither paths
nor authority, and process exit does not establish effect truth.

The adopter selected Node `v26.7.0`, npm `11.19.0`, ESM public root imports only.
It downloaded six exact-pinned archives from a localhost-only static feed, checked
SHA-256, then installed with:

```sh
npm ci --prefix consumer --offline --ignore-scripts --no-audit \
  --cache consumer/empty-cache --registry http://127.0.0.1:9
```

No registry fallback or source import was available in that install. SDK
`@kujolang/participant-sdk@0.1.0-alpha.1` archive SHA-256 was
`adacd78bdc2d5b29bea8a1ff2aa26ef7b75f84c6353952ae557b8427a0d0c2fa`;
package-lock SHA-256 was
`7d35964755b6a5f99550f9f80bff9928a2d68374dc6e0a869151b20d2b688585`.
[acquisition.json](../evidence/source-blind-adopter/acquisition.json) records all
six URLs and hashes; [install.log](../evidence/source-blind-adopter/install.log)
records installation. This used the original reviewed archive, not a later build.

The adopter chose `pilot.lantern`, closed schema
`pilot.lantern-correlation/v1alpha1`, with identifier fields `session_tag` and
`exchange_tag`, and **no effect extension**. The host reviews/installs this
registration; it is not a package-provided privilege or caller choice. Public
`createCodec`, `contentRef`, `SDKError`, and `CorrelationError` suffice. The proof
uses provisional, encode/parse/ref/match, terminal and post-readback finalization.
The participant has no effect executor or retry API.

## Questions, friction, conformance and misuse

The complete structured [journal](../evidence/source-blind-adopter/journal.json)
records consulted documents, commands, assumptions, timestamps, imports and code
size. No undocumented normative fact or internal source was requested. The
adopter constructed representative malformed bytes for named corpus mutations
using the published canonical rules; it did not change expected results.

All **45/45 published SDK cases** passed through the installed package with an
independently authored runner. All **11/11 transport probes** passed, including
record-only, provisional/terminal, EOF with unknown retained, malformed UTF-8,
duplicate top-level/nested members, oversized/truncated input and wrong knowledge.
These transport probes are supplementary, not a replacement for conformance.
The full per-case results and exact evidence hashes are retained beside the journal.

The adopter rejected caller-selected Dispatch IDs, profile/config selection,
correlation-as-permission, participant retries, Git target selection, SDK evidence
lookup and exit-code-as-commit. These answers were recorded before coordinator
correction; none was required. Malformed refs, unknown namespace, wrong extension,
correlation mismatch and noncanonical wire produced bounded documented errors.

| Friction | Classification | Resolution |
|---|---|---|
| LF framing, bounded reads, duplicate-key detection outside SDK | Ergonomic improvement / POST_1_6 | Correctly implemented against frozen host interface; no new SDK authority needed |
| Corpus mutation names require concrete malformed byte construction | Ergonomic improvement / POST_1_6 | Expectations preserved; standalone runner passed all cases |
| Local host must install chosen registration and supply snapshots | Host responsibility, not missing participant API | Coordinator implements public host interface separately |
| Human usability remains unobserved | POST_RELEASE_VALIDATION | Explicitly outside this agent evidence |

No documentation/API fix was required for onboarding. Timing is not a human
benchmark: the initial clock was not recorded; no duration is invented.

## Controlled integration and final decision

The coordinator implemented the already-frozen STDIO interface in
`interop/adopter-pilot/host/runner.py`, retaining the adopter's exact worker and
registration bytes. It installs the owner callback in `tests/pilot_registration.kujo`
and invokes the **unchanged generic correlation reader**. The only existing fixture
change selects this host and its installed validator from pinned operator config.
No production reader, replay policy, assurance implementation or SDK changed.

The host claims the durable ticket before launch, sends a complete unknown
snapshot, checks the returned exact wire, and durably retains provisional evidence
before invoking its fixed Workcell action. It issues actual SIGKILL to the Node
participant before or after CAS, performs read-only Workcell observation and
starts a fresh recording-only participant to correlate the finalized result.
Selected assurance is attached as a new immutable handoff, preserving historical
result bytes. The host never obtains replay permission from participant output.

| Real case | Participant termination / knowledge | Live Git state | Reviewed outcome |
|---|---|---|---|
| Before CAS | SIGKILL, return code -9 / unknown | not_started | Fresh admitted action performs one logical effect |
| After CAS | SIGKILL, return code -9 / unknown | committed | Fresh admitted replay deduplicates, one logical effect |
| Four concurrent host/participant attempts | One claimed ticket, three denied | committed | One logical effect; no manufactured second admission |

Each controller phase is a separate OS process. Review checkpoints persist before
resume; the fresh controller loads the original required/deny configuration revision
even after the process default is weakened to legacy. Missing assurance denies;
valid live Workcell beta evidence enables existing reviewed continuation and its
descendant. The final Git target and exact immutable marker are asserted.

The test rejects 12 untrusted configuration/subject fields before claiming a ticket
or executing an effect, plus expired/stale/symlink input. Installed worker,
registration, SDK code/assets and host-validator mutations deny; changed subject,
namespace/invocation, references, both adopter extension values, knowledge and raw
artifact bytes deny. Host I/O is bounded, environment inheritance disabled and
content storage confined. Repository content/path canaries are absent from handoff,
Dispatch journal and public diagnostics. The Git predicate remains owned by the
existing verifier, even though this participant requests no effect extension.

The private feed was shut down after acquisition; the independently installed
consumer again passed its proof and all 45 cases offline. No package or artifact
was fetched during real control/replay.

**AGENT_REHEARSAL_PASS.** The frozen public surface was sufficient for this
source-blind agent. Human adopter validation remains **unperformed** and is
**POST_RELEASE_VALIDATION**, not evidence supplied by this test.

## Security review and release interpretation

Public terminology conveyed correlation versus authorization correctly. Neither
SDK metadata nor participant fields selected trusted configuration. No participant
retry/effect command exists. The record-only worker receives an explicit snapshot;
it does not infer commit from process status or perform live readback. The host's
bounded stream draining was reviewed before the real run; this coordinator
implementation detail did not require changing frozen public material.

The known VM return-in-loop defect remains separate runtime maintenance. The test
owner callback uses the existing boolean-accumulation workaround, not a failing
runtime path interpreted as a denial. Controller negative tests require normal
machine responses with process exit 0. The source reviewer independently reproduced
the runtime defect; the 1.6 recommendation is therefore **READY_AFTER_BOUNDED_FIXES**,
not an unconditional release claim. See Kujo `docs/KUJO_1_6_READINESS_REVIEW.md`.
Human absence is not the reason for that bounded blocker.


## Validation and reproducibility

No hosted CI, cross-platform release artifact or human usability claim is made.
The commands below were local. SDK archives remained alpha and unpublished.

| Gate | Evidence |
|---|---|
| Independent frozen input verification | 39/39; `input-verification.json` |
| Independent installed-package conformance | 45/45; `conformance-results.json`, repeated offline |
| Independent STDIO/realistic errors | 11/11; `transport-results.json` |
| Real source-blind participant integration | Pre/post SIGKILL, fresh review/replay, 1/3 contention; `real-host-proof.json` |
| Package build/allowlist/API/clean installs | 45/45 each runtime, exact parity; `package-artifacts.json` |
| Installed-package real integrations | TypeScript pre/post loss and Python pre/post loss/contention; `package-*.json` |
| Private distribution gate | 15 substitution/selection negatives, 45/45 each runtime, exact parity, offline installed crash/replay/contention; `distribution-*.json` |
| Workcell effect-assurance gate | Real CAS/idempotency and 1/3 contention; `workcell.log` |
| Dispatch full release gate | Focused Wave C/D suites, 24 shards / 101 source tests, smoke and 3/3 workloads; `dispatch-release.log.gz` |
| Kujo runtime/docs | fmt/check/test; VM/dual/interpreter 149 each, 60 targeted contracts; Kujo `docs/evidence/kujo-1.6-review/results.json` |

Exact public acquisition/verification/install snippets are in
[acquisition-commands.md](../evidence/source-blind-adopter/acquisition-commands.md).
The original adopter source and its hashes are retained in
`docs/evidence/source-blind-adopter/adopter-source/`; copy these files into a fresh
`consumer/` beside the unchanged frozen `onboarding/` bundle and use its verified
package declarations/archives. This preserves the relative corpus path for the
independent runner. Do not import a source SDK to reproduce its result.

The coordinator integration is reproducible with:

```sh
PILOT_CONSUMER=/absolute/reviewed-installed-consumer \
KUJO_BIN=/absolute/reviewed-kujo python3 tests/adopter_pilot_integration.py
```

Without `PILOT_CONSUMER`, the fixture creates a new offline install from the
retained reviewed archive closure and exact adopted worker. The initial proof
used the original adopter-created installation, not that coordinator convenience
path. The independent worker and coordinator harness ownership are explicit in
`interop/adopter-pilot/README.md`.

The Python coordinator is a repository test harness, not a shipping Kujo adapter
or participant SDK dependency. The adopter is a standalone Node ESM consumer.
No existing first-party participant handoff or package API was migrated.

## Commit map and next task

- Dispatch `9e0cd03f2d079dc94074a52aaaa386382c50e0bc`: adopted worker, separately
  authored frozen-protocol host, owner registration and real integration tests.
- Kujo `646fc9b94abec1071e93ea54648fa75f56c0c55b`: 1.6 scope/readiness matrix,
  runtime gate evidence and the independently reproduced bounded VM blocker.
- This audit/evidence follow-up records the completed rehearsal and supersedes
  the historical adopter-selection status; exact final commit is in the session
  handoff / repository history.

Next: fix and regression-test the valid VM loop/return defect, then perform the
bounded 1.6 source/version/changelog/candidate/artifact reconciliation described
in Kujo `docs/KUJO_1_6_READINESS_REVIEW.md`. Keep human validation post-release,
Wave C/D experimental, and public package publication separately authorized.
