# Unpublished experimental participant packages

- TypeScript: `@kujolang/participant-sdk@0.1.0-alpha.1`, ESM, Node >=22.
- Python: `kujo-participant-sdk==0.1.0a1`, Python >=3.10.

These are local distribution candidates, not registry releases or stable APIs.
Neither package has admission, execution, retry, verifier or reference-resolution
capabilities. The original independent codecs remain in the adoption projects;
package-private codecs remove their fixed owner and effect-family registrations.
Only the five documented root runtime symbols are public. TypeScript's additional
Field/Extension/Registration declarations and Python's structural codec typing
are included. Underscore modules are private, not an isolation boundary.

`api-snapshot.json`, `typescript-api.snapshot.d.ts`, and
`python-api.snapshot.pyi` detect accidental alpha API changes. Wire and conformance
versions remain independent of package versions. Pinned local assets include the
closed core schema, portable encoding rules, SDK design, 45-case corpus and
capability metadata. Capability metadata conveys no trust or effect support.

## Reproduce

From Dispatch, after the existing TypeScript/Python adoption prerequisites:

```sh
KUJO_BIN=/path/to/kujo bash scripts/run_participant_package_gate.sh
```

This builds in the package directories, creates empty external consumer projects,
installs only the npm tarball or wheel plus declared dependencies, compares 45-case
results, tests asset corruption/private exports, and runs both real crash/replay
paths plus four-process contention against installed libraries. The integration
workers live under `tests/package-consumers`; **they do not ship**. The trusted
host and existing controller fixture remain outside the packages. No source SDK
is on the consumer import path. Python workers use isolated `-I`, empty environment,
and the new venv interpreter; Node workers use empty environment and no exec args.

Build tools are wheel-only/hash-pinned in `build-requirements.lock`; runtime Python
dependencies in `requirements.lock` (also bundled). npm's checked lock is bundled
as `dependency-lock.json` because npm excludes package-lock.json from tarballs.
The consumer's resolved production closure must match that lock before an offline
`npm ci --ignore-scripts`. No package install hooks or dynamic plugin loading.
Actual verification requires no network after installation. Initial downloads
and optional advisory/namespace lookups do use network.

## Trust and provenance

Install by exact reviewed artifact digest, not an unreserved package name.
The installation inventory records archive hash and exact installed SDK/assets,
metadata and worker hashes. The fixture commits inventory bytes via Dispatch's
**unchanged** configuration implementation digest and rechecks installed bytes
under admission resolution. Installed module/asset substitution blocks replay.
Archive substitution is rejected before installation against its expected digest.
Dependencies additionally use verified locks; this is not protection from hostile
root, replacement of the inventory plus controller trust root, or compromised
trusted dependencies. No production configuration algorithm changed.

Npm tarball and wheel reproducibility are checked with SOURCE_DATE_EPOCH.
Setuptools source archives retain timestamp metadata and may differ: the report
records both hashes and the actual comparison. Do not call sdist builds reproducible.
Build output and complete inventories remain local; concise hashes and proof
records are retained in `docs/evidence/participant-sdk-packaging`.

The recording lifecycle remains unknown → optional reported observation → fresh
read-only finalization. Finalization never performs the readback itself. Matching
an expected snapshot is correlation, never permission to replay.
