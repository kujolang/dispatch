# Dispatch 1.2 Release Checklist

Run this checklist from a clean Dispatch checkout with the intended Kujo runtime on `PATH`.

## Package and Documentation

- [ ] `kennel.toml`, `kujo.toml`, the README badge, and `dispatch version` agree on `1.2.0`.
- [ ] `CHANGELOG.md` contains the dated 1.2.0 entry and `docs/UPGRADING_TO_1_2.md` describes adoption and rollback.
- [ ] `HOWTO.md`, `BLOG_ROUTER.md`, and the routed example use supported field names and copyable commands.
- [ ] `release/dispatch-v1.2.0.refs` pins Kujo, Dispatch, AI SDK, and Agents SDK; `install.sh --package dispatch --release-manifest ...` installs only that closure and supplies location-independent shim paths.
- [ ] Confirm the pinned Kujo commit is public, reports package version `1.0.2`, and contains the installer used by the release workflow.
- [ ] Confirm the pinned AI SDK and Agents SDK commits are reachable from their public repositories and their own gates pass at those exact revisions.

## Deterministic Verification

```bash
kujo check dispatch.kujo
kujo test-run tests/routing_tests.kujo -v
DISPATCH_OFFLINE_FIXTURE=true bash scripts/run_release_gate.sh
```

- [ ] The VM and interpreter help/version commands write no diagnostics to stderr.
- [ ] The routed fixture validates, explains, completes, and persists route evidence without secrets.
- [ ] Retry, fallback, malformed output, credential failure, timeout/rate-limit classification, no-route, catalog-hash, and deterministic tie-break tests pass.
- [ ] Routed human review pauses and a separate process completes it with a bound `resume-decision` payload; replay is idempotent.
- [ ] Model-directed tools execute only requested/authorized calls and stop at configured call/round bounds.
- [ ] Workflow budgets, provider circuits, run locks, schema migration, SQLite revision conflicts, parallel-safe DAG work, streaming artifacts, OTLP JSON, and webhook dead-letter replay tests pass.
- [ ] Unsigned/oversized bundles, unapproved provider origins, and unsigned/unapproved webhooks fail closed; live runs with no explicit tool profile receive the production profile.

## Integration Verification

- [ ] AI SDK release quality gates pass, including reliability, redaction, schema, benchmark, and live-smoke handling.
- [ ] Agents SDK Dispatch conversion and offline/no-network contract suites pass.
- [ ] At least one approved route completes through a real provider or approved local subscription/proxy; record only provider/model and non-secret receipt metadata.
- [ ] AI Chat's local Codex profile completes one authenticated subscription-backed request when it is part of the test environment.
- [ ] A fresh temporary pinned package install runs `dispatch version`, validates the routed example, and completes the fixture from a working directory outside the installed source tree on Linux and macOS.
- [ ] Run representative failure/restart and fixture soak workloads; record pass count, wall time, and artifact paths without credentials or prompts.

## Security and Release Readiness

- [ ] Complete a repository-wide Codex Security review of the tagged revision and resolve all reportable findings.
- [ ] Run ShipCheck against the final clean revision and resolve release blockers.
- [ ] Confirm generated run artifacts, temporary credentials, and local test outputs are not staged.
- [ ] Commit in small changes, push the release candidate, and verify the remote revision before creating the tag/release.
- [ ] Push `v1.2.0` only after all pinned dependency commits are public and protected; verify the release workflow publishes the source tarball, checksum, provenance JSON, GitHub build-provenance attestation, and passes clean-install jobs on both operating systems.

Publishing a tag or public release remains a separate explicit action after every checkbox is backed by current evidence.
