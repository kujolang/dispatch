# Private participant SDK distribution rehearsal

Experimental alpha, unpublished. This is a local artifact-distribution rehearsal,
not remote participant authentication or an SDK stability promise.

## Baselines and reviewed artifacts

Fetched `main`, exact baseline commits:

| Repository | Commit |
|---|---|
| Dispatch | c6edf00bf3509177ef05eb3a9d0c5fd9fe84e1ec |
| Kujo | b56c1539b1e4fc256da2bb9b2ca664abf44d8d51 |
| Workcell | 1940da0639b70b702c1b1077dda51ca39b065216 |
| Ability | d6c970785f8d8bea04de0dce37920c2d0ca1c067 |
| MCP | a7ec0dd8e6bcae303ab1431b4586dfe3e91f3a5a |
| Agents SDK | af0aa28f5960232cbafa7cf528a32db8cb36c7a9 |

Artifacts are the **same reviewed bytes** from the packaging rehearsal:

| Package | Archive SHA-256 |
|---|---|
| `@kujolang/participant-sdk@0.1.0-alpha.1` tarball | adacd78bdc2d5b29bea8a1ff2aa26ef7b75f84c6353952ae557b8427a0d0c2fa |
| `kujo-participant-sdk==0.1.0a1` wheel | dbd3a2ab270b34c9d86f171f8906c51a705cecc7cff2907ae80fcee3c68732cc |

No new public package, tag, name reservation or upload. The reviewed sdist remains
retained packaging evidence, but is deliberately not a runtime distribution input:
consumers install wheels only, with no build backend execution.

## Channel and acquisition

`tests/participant_distribution.py` stages an isolated feed outside all checkouts.
A temporary HTTP server binds only `127.0.0.1`, serving exact reviewed SDK archives,
five npm production dependency archives and the available hash-pinned Python wheel
closure. Only feed preparation contacts the npm registry, verifying each archive
against the already-reviewed SHA-512 lock. Python wheels come from the existing
hash-pinned wheelhouse. Neither registry discovery nor public fallback occurs in
consumer installation.

The operator delivers `reviewed-pins.json` out of band. It pins package identity,
version, archive SHA-256, asset-manifest SHA-256 and every distribution file,
including both dependency locks. Feed metadata never creates trust. A changed pin
file requires operator review, not automatic acceptance from the server.

The copyable consumer `acquire.py` accepts only a localhost feed, rejects redirects,
ignores proxy settings, bounds downloads to 16 MiB, checks every exact digest and
uses exclusive file creation. All acquisition must complete before installation;
partial failed acquisitions are never admitted or installed. This is not a secure
remote transport design. It assumes a trusted operator, local host and pin channel.

npm installs from a fresh cache using `npm ci --offline --ignore-scripts`, a lock
whose complete closure points to downloaded local archives, and an unreachable
registry configuration. Python uses a fresh venv, `--no-index`, `--no-cache-dir`,
`--only-binary=:all:` and `--require-hashes`. Missing files fail rather than resolving
from npm/PyPI. No source-directory fallback, install scripts or dynamic plugins.

## Consumers and public API

Consumers occupy separate temporary directories from the feed, source packages
and repository. Only the SDK artifact and declared dependencies are installed.
Their examples use the documented root exports; no private imports. Workers reuse
the proven local IPC fixture with consumer-owned registrations. This is a
distribution proof, not a claim of an independently implemented host protocol.
`tests/distribution-consumers/interpretation.md` records the pre-implementation
reading of packaged README/API/design material. No undocumented SDK behavior or
normative clarification was needed. Local host IPC is fixture infrastructure,
not an SDK promise.

New registrations:

- `example.private-ts-consumer`, extension
  `example.private-ts-consumer-correlation/v1alpha1`.
- `example.private-python-consumer`, extension
  `example.private-python-consumer-correlation/v1alpha1`.

Each extension closes `call_id` and `process_instance_id` as identifiers. The
optional existing Workcell effect extension remains separate. These names are
example-owned fixture namespaces, not registered public names. The SDK packages
contain neither registration. The trusted host installs them explicitly and binds
namespace/schema, installed code/assets, worker selection and pin/lock files into
its existing installation inventory/configuration revision. Altering owner identity
cannot reuse that revision. No new Dispatch correlation reader or production
configuration algorithm was introduced.

Both examples exercise provisional unknown, content reference, parse, expected
snapshot matching, terminal reported and readback finalization. Finalization
preserves unknown when completion was lost. None executes an effect. Correlation
is never admission, verification or replay permission.

## Real adoption and offline operation

The feed is stopped and deleted **before** conformance, examples or Git execution.
The existing host fixtures then invoke only the fresh installed consumer workers.
For each runtime, pre-CAS SIGKILL leaves Workcell `not_started`; post-CAS SIGKILL
leaves Workcell `committed`. Both leave participant knowledge `unknown`. Durable
review, a fresh controller, live Workcell beta verification and a newly admitted
participant process complete/deduplicate the effect. Four concurrent deliveries
produce one admitted, three denied, one logical Git effect.

The host fixture allows operator-installed names in its existing closed owner
callbacks; it retains the original names as defaults for historical regressions.
The same generic core checks all subjects/references. Workcell remains the Git
predicate verifier; Dispatch remains replay/admission authority.

## Distribution security cases

Acquisition rejects same-version archive replacement, wrong package/name collision,
altered wheel, repacked schema and manifest assets, substituted dependency archive,
changed dependency version, missing npm lock/integrity, missing Python hashes,
registry-fallback URL, older/newer lock candidates and unavailable artifact.
These fail before a controller context or admission ticket exists. Candidate
version tests deliberately mutate explicit selection rather than asking a resolver
to pick a version. There is no floating selector to upgrade.

Fresh caches, exact archive integrity, local-only locks and complete acquisition
address accidental cache/registry substitution. Installed package asset checks and
admission-time inventory checks remain active. The fixture tests installed module,
schema, worker, namespace and schema-registration substitution. A compromised
operator who can replace pins and configuration authority is outside this model;
this is not an independent trust root or a supply-chain security guarantee.

Privacy and effect-safety regressions retain canaries, input denials, exact-byte
checks, symlink rejection and one-use tickets. No header, path, Git body or private
configuration enters the handoff. No SDK, assurance, historical wire, runtime or
replay-policy change.

## Reproduction and retained evidence

With the reviewed artifacts retained under `.ci/participant-packages/artifacts`
and existing runtime/dependency prerequisites installed:

```sh
KUJO_BIN=/path/to/kujo bash scripts/run_participant_distribution_gate.sh
KUJO_BIN=/path/to/kujo DISPATCH_OFFLINE_FIXTURE=true bash scripts/run_release_gate.sh
```

The first command prepares the localhost feed and fresh consumers, runs installed
conformance and sequential real crash/replay/contention. Preparation may fetch
locked npm dependency archives; consumer installation and all execution are offline.
Do not run these integration gates concurrently: substitution regressions briefly
change shared pinned fixture files and restore them.

The complete 16-file acquired SDK/dependency/lock closure was rehashed and retained
locally in `.ci/participant-distribution/retained`, separately from the deleted
served feed. It is not consulted by running consumers.

Machine evidence records archive, lock, schema/spec-manifest, installation inventory
hashes, tool versions, conformance and real-flow outcomes. The original packaging
allowlists/API snapshots and source/package parity are also rechecked. Full local
logs are retained separately; no hosted CI is claimed.

## Decision

**YES WITH DISTRIBUTION CONTROLS.** Both distributed installations passed 45/45
conformance cases with exact cross-language parity, all 15 acquisition negatives,
new-owner lifecycle examples, pre/post-CAS SIGKILL, fresh-controller replay and
four-process contention (one admitted, three denied, one logical effect). The
original packaging gate passed, including package contents/API snapshots, clean
installs, identical reviewed npm/wheel hashes and installed-package real flows.
The full Dispatch release gate passed all 24 contract shards and 3/3 workloads,
including Wave C and all six prior participant paths. Workcell effect assurance,
Kujo formatting and the README contract test passed. No hosted CI was claimed.

[Machine results](../evidence/participant-sdk-distribution/results.json),
[reviewed pins](../evidence/participant-sdk-distribution/reviewed-pins.json) and
[release outcomes](../evidence/participant-sdk-distribution/release-outcomes.txt)
retain the detailed evidence.

Required controls for any selected-adopter pilot are out-of-band
reviewed pins, complete dependency closure, no registry fallback, immutable retained
artifacts, host-installed registrations and independent Dispatch admission. These
controls do not permit public publication, stable API claims, remote trust or A2A.


## Commit map and next task

| Repository | Commit | Purpose |
|---|---|---|
| Dispatch | `0bfc0dd37ad9c3cb1c8b447da74825c68f70ef71` | Bind fresh consumer registrations to installation revisions; preserve default historical owners. |
| Dispatch | `5eb21d446f17658aa648ce2623aa5e795d3bf1d2` | Private feed acquisition, independent consumer projects, negative cases and gate. |
| Kujo | `c1cc06f` | Roadmap status and limited external pilot recommendation. |

This audit and machine evidence are committed separately after gate completion.
Recommend **a limited external adopter pilot** using these exact artifacts and
controls. Automated source-free adoption is proven; a selected developer following
only the package docs is the next useful evidence. No remote-trust or A2A work,
API freeze, public publication or global enablement is authorized by this result.
