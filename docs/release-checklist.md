# Dispatch 1.3 release-candidate checklist

This is the active release authority. The [1.2 checklist](release-checklist-1.2.md)
is retained as historical evidence. Checking a box requires evidence from the
final revision; local fixture success alone does not qualify as a public release.

## Contract and dependencies

- [ ] `kennel.toml`, `kujo.toml`, the badge, `dispatch version`, and OTLP scope version agree on 1.3.0.
- [ ] `release/dispatch-v1.3.0.refs` pins public Kujo 1.4.0, AI SDK, Agents SDK, and the eventual Dispatch tag; the Kujo runtime exposes `file_lock`/`file_unlock` on Linux and macOS.
- [ ] Quiesce pre-1.3 workers before replacing age-reclaimable lock files; validate resumed legacy runs and document rollback without mixing lock protocols.
- [ ] The installer handles both the legacy root bridge path exported by the pinned shim and the `src/bridge/` source layout without enabling arbitrary config paths.

## Deterministic and adversarial gates

```bash
kujo check dispatch.kujo
KUJO_BIN=kujo AI_SDK_PATH=/path/to/pinned/ai-sdk DISPATCH_OFFLINE_FIXTURE=true bash scripts/run_release_gate.sh
```

- [ ] Linux and macOS pass the exact pinned full CI gate: SDK, routing, SQLite, policy, operational, hardening, 24 contract shards, warning-free VM/interpreter smoke, and bounded 3/3 workload.
- [ ] Process-owned run-lock contention, backdated metadata, crash recovery, stale-release and long-running-resume tests pass; no second owner can perform tool/state side effects before the first exits.
- [ ] Concurrent webhook JSONL sink test preserves every event and exact framing; signed network webhook/outbox regression stays green.
- [ ] From outside the package, run installed `dispatch version`, validate the bundled routed workflow, execute its fixture, and exercise the bridge's origin rejection and redacted failure path.
- [ ] Repeat throughput and peak-RSS measurements at small and large catalog/state/trace sizes; record bounds and lossless cleanup/recovery tests without claiming an unmeasured SLA.
- [ ] Fresh-user commands in `docs/first-workflow.md` and the scoped plugin sample run without credentials.

## Integrations and release decision

- [ ] Pinned AI SDK and Agents SDK pass their own release gates on Linux and macOS; validate the full installation closure at immutable revisions.
- [ ] Complete a representative failure/restart and fixture soak, then a real approved provider or approved local proxy route; record only non-secret provider/model and outcome metadata.
- [ ] Complete a sealed repository-wide Codex Security scan on the final revision and resolve reportable findings; run ShipCheck against the same revision.
- [ ] Stage only reviewed source and documentation, commit in small pieces, push, and verify both CI operating systems and a clean remote revision.
- [ ] After explicit release authorization, verify a protected 1.3.0 tag, source tarball/checksum, provenance and attestation, and Linux/macOS clean-install jobs.

The 1.3 development line is not a certified multi-tenant or distributed-lock
service. It assumes trusted workflow/plugin code and operator-managed isolation,
credentials, and network controls. Do not publish the 1.3 release or change
these boundaries until the relevant checks are backed by receipts.
