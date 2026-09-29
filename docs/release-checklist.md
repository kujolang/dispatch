# Dispatch 1.3 release checklist

This checklist governs the official 1.3.0 release with Kujo 1.6.0. The
[earlier candidate checklist](audits/release-checklist-pre-1.6.md) and
[1.2 checklist](release-checklist-1.2.md) are historical evidence, not validation
of this candidate. The official release is published. [Final execution receipt](audits/dispatch-1.3.0-release.md) records the exact tagged source and public verification. This checklist update is post-publication evidence; it does not change the tag or archive.

## Identity and dependencies

- [x] Package, CLI, README and telemetry version: **1.3.0**; minimum Kujo **1.6.0**.
- [x] `release/dispatch-v1.3.0.refs` pins the installation closure.
- [x] `release/dispatch-v1.3.0-validation.refs` pins released AI SDK, Agents SDK,
  Workcell, Ability and MCP companions used by the integration gates.
- [x] Kujo runtime source is `44af277848173664f72ca85f2a1b3b98d634ecdd`;
  published installer source is `fc53093f35e4236682bbbf5ab1ccc8d2b4df990c`.
  These identify different reviewed artifacts deliberately.
- [x] Upgrade documentation requires stopping old workers and retaining a backup;
  rollback must not mix old and new locking/state formats.

## Candidate validation

- [x] Full release gate on Linux and macOS at the final candidate revision:
  runtime contracts, locks, webhooks, 24 contract shards, restart/review, bounded
  workloads, Wave C profiles and Wave D participant integrations.
- [x] Pinned AI SDK and Agents SDK offline gates, including installed dependencies.
- [x] Installed source closure, legacy upgrade on both state backends, scale checks.
- [x] Participant package/private-distribution/automated adopter gates. Packages
  remain unpublished; no human usability claim follows from agent fixtures.
- [x] Approved local HTTP provider-route check and failure/restart/soak evidence.
  A localhost fixture validates transport, not a remote provider deployment.
- [x] External sink idempotency demonstrated by the real SQLite/Git/Ability paths.
- [x] Sealed security review, reportable findings resolved with regressions,
  and ShipCheck against the candidate.
- [x] Reviewed commits pushed; clean tree; both hosted OS gates green.

## Publication (authorized by the release request)

- [x] Tag `v1.3.0` targets the tested source.
- [x] Source archive/checksum, provenance and attestation published; downloaded
  bytes verified; released-tag clean installations pass on Linux and macOS.
- [x] Kennel catalog reconciled; install defaults and public documentation updated
  only after the release artifacts exist.

Deployment-specific capacity, retention and live-provider certification remain
operator responsibilities. Dispatch is a trusted-local workflow controller, not
a multi-tenant service or distributed lock manager. Wave C beta and Wave D alpha
remain experimental. Read-only effect-set diagnostics do not grant multi-effect
replay permission. See [release notes](RELEASE_1_3_0.md) for the supported scope.
