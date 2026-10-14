# Dispatch 1.4 release checklist

This checklist governs 1.4.0. The [1.3 receipt](audits/dispatch-1.3.0-release.md)
remains historical evidence, not validation of this release.

- [x] Package, CLI, telemetry and installer manifests identify 1.4.0.
- [x] AI SDK dependency remains pinned; validation companions are separately identified.
- [x] Tagged verification installs the experimental operator dependencies.
- [x] Full candidate gate and pinned SDK checks pass.
- [x] Previous-release filesystem/SQLite upgrade, restart and backup rollback pass.
- [x] Linux/macOS hosted gates pass on the candidate.
- [x] Exact tagged artifact, provenance and clean installation pass.
- [x] Kennel publication and downloaded package verification pass.

See [release notes](RELEASE_1_4_0.md) for experimental and deployment boundaries.

Published on 2026-10-14. The [execution receipt](audits/dispatch-1.4.0-release.md)
records exact source, artifacts and acceptance. This is a post-publication
documentation update; the tag and released archives remain unchanged.
