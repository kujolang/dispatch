# Independent beta consumer adoption rehearsal

2026-09-27. Decision: **YES**, within the existing bounded domain. No contract
clarification, accepted/rejected semantic change, new profile, global enablement or
alpha removal was needed. Beta is suitable for new **experimental opt-in** integrations;
this is not stable release or production certification.

## Baselines and contract inputs

Fetched main and clean trees matched:

| Repository | Commit |
|---|---|
| Dispatch | c6680ca36b1c3483cc77d4fd17317d8572de2af8 |
| Kujo | 4ccd023c150835c46acc1a023cf8cffc897939fa |
| Workcell | e66689a8cac6577c22dfaa6c8c5401123f362ce6 |
| Ability | ca9acea544e9a8a806f1f09d42b4ca7b5299bd18 |

Inputs: execution-result/v1; assurance, negotiation and configuration/v1beta1;
three exact profile versions 1beta1; portable-json/v1;
dispatch.effect-assurance-conformance/v1. No schema identifier was promoted or
renamed. Owner repositories were read-only. Agents SDK bb2202d8b54f44717b1b1f0157a6774f2027cea1
was read for the next-target recommendation; unrelated local work was preserved.

## Independent implementation and evidence

[Standalone project](../../interop/beta-consumer/README.md) contains Python3.10+
source, pinned generic JSON Schema dependencies, immutable publication snapshots,
content-light observations and reproduction commands. The pre-code interpretation
was committed as 41cd708. No ecosystem assurance/parser/registry/compatibility/digest
or backend verifier implementation was imported or translated. The author has prior
project context; no claim of organizational independence or literal amnesia is made.

Only generic JSON Schema validation is delegated. Portable byte emission, commitment
calculation, selected profile checks, exact-result binding, policy/configuration
commitments, freshness and live-fact comparison are new code. An AST import audit
and isolated temporary copy prove the consumer does not need ecosystem implementation
source on its import path. The source corpus is hash-pinned in PROVENANCE.json.

| Proof | Result |
|---|---|
| Frozen commitments | All 58 typed inputs, exact UTF-8/hex, SHA256 and distinct pairs agree |
| Encoding negatives | Floats/negative zero in portable wire, invalid Unicode/UTF-8, duplicate keys, unsafe integers, depth/count/byte limits reject |
| Historical corpus | Six real alpha/beta artifact schemas and byte/binding commitments checked; alpha never parsed as beta |
| Profile reconstruction | Full SQLite and Git bindings from raw published inputs; Ability request/key/application profile/transaction reconstructed |
| Real observation adoption | SQLite, Git and Ability independently verify at recorded live observation time |
| Negative matrix | 42 cases per profile,126 total; no granted permission |
| Restart | Two fresh processes per positive packet produce identical decisions |
| Delayed restart | Fresh processes reject expiry and revocation for every profile |
| Privacy | Real workload canary absent from retained observations; injected payload absent from stdout/stderr |

Source independence is narrower than backend independence: the real adapters still
produce effects and their installed verifiers run in the existing migration fixture.
The separate capture bridge requires the fixture's successful result-bound beta
conformance attestation and checks actual stores again before retaining observations.
SQLite uses a read-only consistent transaction; Git checks marker bytes and target;
Ability checks authenticated session mapping plus exact business/request/receipt
state. Backend table/CLI layouts are test-transport details, not information the
independent consumer needs. No body, token, principal, raw receipt or private path
is exported. Installation code commitments identify the actual fixture verifier;
the bridge is auxiliary observation/provenance collection, not a substituted verifier.

The operator-run fixture is the trust path for its attestation, not an ok:true label.
An arbitrary producer cannot submit host/live authority to a deployed consumer.
The CLI accepts trusted test packets only and performs no workflow mutation. It is
not a remote verifier or general retry engine. Generic v1 external-idempotent
policy is implemented from published rules; Dispatch retains all other workflow
and intervention admission authority.

## Operator pinning and migration

The recorded policy is independently recomputed and checked against protected
persisted Dispatch state. The authoritative run matches the result subject.
All eleven configuration fields participate in the revision; all six non-self
policy fields participate in policy_sha256. Exact revision resolution remains
mandatory. Changed installed code/authority, revoked/missing revision and an R2-only
registry deny. R1 plus unrelated R2 and a weaker default still uses R1.

Envelope, profile, policy and configuration versions are compared independently.
Alpha and legacy policy are unsupported by this beta-only consumer; no automatic
upgrade or fallback exists. Cross-profile, wrong version, changed result bytes,
recomputed-but-wrong binding and malformed/noncanonical wire all deny. Multiple
effects, non-idempotent class and consistently rebound opaque attempt IDs deny.
A verifier response with only ok:true, stale read time, wrong transaction/revision/
predicate or unavailable status denies. These are explicit field comparisons, not
reason-string permission inference.

Recorded observations are historical test evidence. Restart passes the explicit
recorded time to establish reproducibility; it does not assert that the observation
is live now. A later real Ability readback after receipt publication rejects the
old evidence, as the dual-commit profile requires. SQLite/Git were also re-read
successfully while still within their validity. No renewal or historical-byte
rewrite was used to make the fixture pass.

## Contract ambiguities and security review

No normative ambiguity needed an implementation workaround. No specifications or
schemas were changed to produce agreement. The live callback packet is an explicitly
local test interface, not a proposed ecosystem wire protocol. Its exact checked_at
comparison models fresh admission; the embedding owns real clock/lock semantics.

Fresh review checked: external host versus producer authority; pin substitution;
canonicalization/algorithm/version confusion; all three binding schemas; duplicate
keys; closed fields; schema references; bounds; result replacement; alpha fallback;
stale live facts; profile metadata; payload diagnostics; and import independence.
No document-controlled executable, filesystem root, credential or URL is resolved.
Schemas are locally installed snapshots with local references. Unknown diagnostic
categories never grant permission. Test transport stderr is suppressed rather than
copying raw backend diagnostics.

Two implementation corrections were made before final evidence: generic v1 result
JSON must not inherit portable-wire negative-zero restrictions, and delayed-restart
negatives must exercise newly launched processes. Neither changed the contract.
Early consumer runs deliberately failed while genuine observations were absent;
no mocked success or missing-fixture skip was counted as a pass.

## Validation

Independent gate: `python3 interop/beta-consumer/isolated.py` (eight test groups,
including 126 matrix decisions, subprocess restarts,58 vectors and schema checks).
Runtime: Python3.10.5; jsonschema 4.26.0 with dependencies pinned in requirements.txt.
No network is used by verification. No hosted CI observed.

Ecosystem gate: KUJO_BIN=/tmp/kujo-wave-a-release-candidate-bin,
DISPATCH_OFFLINE_FIXTURE=true, `bash scripts/run_release_gate.sh`. This includes
beta migration, persisted negotiation, three real profiles, legacy assurance,
failure control, durable review and existing legacy suites. Runtime source 5d72aab,
optimized binary SHA256 4ef726d0020b6df0be78da4b7e96a79d099d414efa83874676038da501a72a93.
Workcell/Ability normative files and implementation were not modified, so their
owner gates were not rerun separately; real integration gates were rerun here.
Kujo documentation only: cargo fmt --check and readme_contracts.
Final full Dispatch gate exited0: all24 legacy shards and3/3 workloads passed.
Kujo fmt and readme_contracts passed. Final gate exit statuses and hashed evidence are retained in
[the evidence directory](../../interop/beta-consumer/evidence/).

## Adoption and next target

All ten adoption criteria pass within the declared domain. Prefer beta for new
experimental integrations; keep explicit opt-in and alpha for existing runs.
No stable release or universal effect contract is claimed. Remote trust, multi-effect,
renewal, optional-beta fallback, arbitrary application values/opaque attempts and
hostile total-store rollback remain separate boundaries.

First concrete Wave D target: **Agents SDK's existing Ability gateway Tool boundary**.
Its README Portable Ability Contracts and docs/INTEGRATION_BOUNDARIES.md already
separate receipt-validation callbacks, application authentication and Dispatch hooks.
Add a bounded beta evidence/reference handoff through that boundary, with operator
configuration supplied outside model/tool JSON and Dispatch owning continuation.
Prove one offline SDK tool→Ability action→Dispatch review/replay path with exact
receipt/result/assurance correlation and no fabricated usage. Do not move replay
admission into Agents SDK or make the model a trusted verifier. No Wave D code is
included in this task.

## Commit map

- Dispatch 41cd708: interpretation committed before consumer implementation.
- Dispatch 91c7be2: standalone consumer, captured real observations, independent tests and evidence.
- Kujo 6f06e41: roadmap/direction status only.
- Final Dispatch audit/evidence commit: this document and final gate manifest.

All changes are separate from core admission implementation.
