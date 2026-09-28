# Experimental participant SDK packaging

Status: alpha, unpublished; packaging rehearsal, not API stabilization. No remote trust or effect SDK.

## Baselines

Dispatch `fe5a16b23788f1531909d536c2964f82e672d25f`, Kujo
`6ca0e65fedd129988bc4283b10f8f9ec98fa1cb5`, Workcell
`1940da0639b70b702c1b1077dda51ca39b065216`; fetched main, clean at start.
Supporting participant repositories remain unchanged. The unrelated Agents SDK
maintenance-agent working files were preserved.

## Packages and API

`@kujolang/participant-sdk@0.1.0-alpha.1` is ESM-only, Node >=22, private.
`kujo-participant-sdk==0.1.0a1` supports Python >=3.10. Neither was published.
Root exports are CONFORMANCE, SDKError, CorrelationError, contentRef/createCodec
(TypeScript) or content_ref/create_codec (Python). Public TS field/registration
types and Python structural codec typings accompany the runtime surface.

Codec methods: encode/parse, match expected, provisional unknown, terminal reported,
and finalize after readback. See each package's API.md and the committed declaration
snapshots. Correlation mismatch throws a bounded error, never a truthy decision.
A match is not authorization. Finalization neither reads state nor executes work.

Private codecs derive from the two independently implemented, validated prototypes.
Fixed TS/Python/Git owner branches were removed; installed closed declarations are
caller-independent host composition. No cross-language translation occurred.
The old proof projects remain intact and continue their canonical regressions.

## Distribution boundary

Npm ships compiled JS/declarations, core/spec/conformance/capability assets, README,
API, license and a copy of the dependency lock. Python wheel ships only its package,
typings/assets and standard distribution metadata; sdist additionally carries build
metadata and source. No test runner, host, admission ticket, Git executor, Dispatch
client, repository path or owner-specific schema ships. The shared corpus is inert
conformance data, not executable fixture machinery.

Empty external projects install the tarball or wheel and declared dependencies.
Runners import only public package roots. Package content allowlists, API snapshots,
source/build hashes, exact cross-runtime results and installed module inventories
are retained. No checkout import path or source-directory fallback is used.

## Installed integration

Integration-only workers under `tests/package-consumers` import installed libraries.
Operator fixture configuration selects worker paths and a pinned installation
inventory. The existing Dispatch configuration digest commits that inventory;
resolution verifies installed text bytes before admission. Production digest,
generic reader, assurance verifier and replay policy are unchanged.

Real SIGKILL before CAS yields participant unknown/live not_started. SIGKILL after
CAS yields participant unknown/live committed. Fresh recording processes finalize
references; fresh Dispatch controllers resolve persisted required/deny policy,
review checkpoints and Workcell live verification. Reviewed continuation/replay
preserves one logical effect. Four processes contend for one ticket: one admitted,
three denied. Installed SDK/asset replacement is rejected before replay.

## Security review

Closed root exports avoid accidental parser/fixture API. Python private modules are
conventions, not a sandbox. No package-supplied plugins, schema URLs, arbitrary asset
paths, install scripts, effect callbacks or retry helpers. Pinned asset manifests
are themselves committed in codec bytes and checked again at codec construction.
Malformed wire diagnostics contain codes, not input. Host workers use empty process
environments; Python uses `-I`. Existing canary and trust-input regressions apply.

Registry lookups found no public package under either proposed name (404 at review),
which is not reservation or proof of namespace control. Consumers install reviewed
artifact bytes, not names. npm production versions/integrities must match the lock;
Python installation is wheel-only/hash-pinned, followed by pip check. Advisory scans
are point-in-time checks, not a supply-chain guarantee. Host/root compromise,
malicious trusted dependencies and mutation of an entire trust root are excluded.

The trusted operator must pin artifacts/locks and protect installed directories.
Artifact hashes alone are not authentication. Readable schema assets do not select
an executable verifier. Package capability metadata claims no effect profiles,
remote trust, retry safety or assurance authority.

## Reproducibility and scope

The gate builds npm and wheel twice with a fixed SOURCE_DATE_EPOCH and compares
exact bytes. Setuptools sdist retains timestamps and is reported non-reproducible;
its actual artifact digest remains recorded. Extracted file contents match; seven
member timestamps differ between the final two sdist builds. No reproducible-sdist
claim is made.
The existing local runtime candidate is used for ecosystem gates; no hosted CI claim.

The next bounded task, if final gates pass, is private package-distribution rehearsal.
No public registry upload, API freeze, remote authentication, A2A or effect expansion
is part of this task. Wire/assurance contracts and historical handoff bytes stay intact.

## Installed package evidence

Both final artifacts pass 45/45 shared cases with exact bytes, hashes, values and
error-category parity. All four source/installed runners also produce identical
45-case results. External TypeScript declarations compile. Clean imports
expose exactly five runtime symbols; private TS subpath import is refused.
Four import-time asset substitutions and two post-import factory substitutions
reject. Registry production dependency integrity matches the committed npm lock;
Python uses the hash-pinned wheel-only closure and pip check passes.

Both final runtime packages pass pre/post-CAS SIGKILL and fresh-controller reviewed
replay; four contender processes yield 1 admitted / 3 denied / 1 logical effect.
TS has 15 correlation negatives, 13 trust denials, five source/installed-package
substitution probes and worker-selection substitution. Python retains its identity,
trust, environment, privacy, stale-ticket and installed module/asset/worker probes.
All denied substitutions leave authority unchanged. Exact proof JSON and installed
file hashes are in `docs/evidence/participant-sdk-packaging`.

Review fixes: bind worker selection as well as inventory bytes; bundle the Python
API reference in the wheel and rerun its installed integration. No unresolved
security finding was identified within the trusted-local-host boundary.

Final artifacts are retained locally under `.ci/participant-packages/artifacts`
(ignored, never uploaded). Full file lists, source hashes, schema hashes, dependency
lock hashes and exact archive hashes are in `package-manifest.json`. npm 11.19.0,
Node 26.7.0, TypeScript 5.9.3, Python 3.10.5, build 1.3.0, setuptools 80.9.0, wheel
0.45.1 and jsonschema 4.23.0 were used. Runtime source and binary provenance are
recorded in the manifest. Only this local environment is claimed.

The initial package-gate log predates the final wheel API-document addition; final
wheel integration proof and final artifact hashes supersede that artifact identity.
The TypeScript tarball is byte-identical across these rehearsals.

## Commit map

- Dispatch `ce26fa180d72181313830430c0fc6b00e00f92c7`: package implementations,
  exact public surfaces, metadata, isolated install/conformance harness.
- Dispatch `1e3763426a5ae883432166a9f97272bbe806f73a`: installed worker/inventory
  binding and real controlled crash/replay fixtures.
- Dispatch `b63680a91bd111c5b01d719b1e9a3c7ded812588`: bundled wheel API reference
  and final distribution-content assertion.
- Dispatch `5ff1ed45ba2942d500b1067e73a4f0a6efca4f0e`: exact installed/source
  four-runner conformance comparison.
- Kujo `b56c153`: docs-only roadmap/architecture update.
- Final documentation/evidence commit follows; runtime and supporting repositories
  remain unchanged.

## Final validation and decision

**YES: technically ready for a private/experimental distribution rehearsal.**
Both packages remain alpha and unpublished; the API is not frozen. No task blocker.

- Full Dispatch release gate: exit 0; all focused Wave C/D suites, 24 contract
  shards, VM/interpreter command smoke and 3/3 bounded workload runs passed.
- Source TypeScript: 45 tests; source Python: 14 methods. Shared SDK conformance
  and exact installed/source parity: 45/45 per runtime.
- Clean tarball/wheel install, package-content/API snapshots, external typings,
  asset/package/worker substitution and real installed pre/post-CAS SIGKILL,
  fresh-controller review/replay and contention passed.
- Workcell effect-assurance gate: exit 0, including four-process contention.
- Kujo docs: cargo fmt --check and readme_contracts passed. Runtime unchanged.
- npm audit: zero reported vulnerabilities; six pinned Python runtime packages
  returned no OSV advisories at review. This is not a guarantee about dependencies.

Exact logs/digests and artifact inventories are retained beside this audit.
The next task is **private package-distribution rehearsal**, with explicit artifact
pins and fresh independent consumers. No automatic npm/PyPI publication, remote
trust, A2A or API stabilization is authorized by this completion.

SignalBox: no captures warranted; review findings were resolved and the sdist
timestamp limitation is explicitly accepted for this bounded packaging task.
