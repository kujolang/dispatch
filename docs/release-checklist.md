# Dispatch 1.3 release-candidate checklist

This is the active release authority. The [1.2 checklist](release-checklist-1.2.md)
is retained as historical evidence. Checking a box requires evidence from the
final revision; local fixture success alone does not qualify as a public release.

## Contract and dependencies

- [x] `kennel.toml`, `kujo.toml`, the badge, `dispatch version`, and OTLP scope version agree on 1.3.0.
- [x] `release/dispatch-v1.3.0.refs` pins public Kujo 1.4.0, AI SDK, Agents SDK, and the eventual Dispatch tag; the Kujo runtime exposes `file_lock`/`file_unlock` on Linux and macOS. The Dispatch tag is only a planned manifest reference, not a published release.
- [ ] Quiesce pre-1.3 workers before replacing age-reclaimable lock files; validate resumed legacy runs and document rollback without mixing lock protocols. The pinned Kujo 1.0.2-to-1.4.0 rehearsal passed both backends on [Linux/macOS CI](https://github.com/kujolang/dispatch/actions/runs/35751227471); representative target staging remains pending.
- [x] The commit-pinned installer handles both the legacy root bridge path exported by the pinned shim and the `src/bridge/` source layout without enabling arbitrary config paths. Real isolated Linux/macOS installations passed at `573dec5`; authorized release-tag installations remain separate.

## Deterministic and adversarial gates

```bash
kujo check dispatch.kujo
KUJO_BIN=kujo AI_SDK_PATH=/path/to/pinned/ai-sdk DISPATCH_OFFLINE_FIXTURE=true bash scripts/run_release_gate.sh
```

- [x] Linux and macOS pass the exact pinned full CI gate: SDK, routing, SQLite, policy, operational, hardening, 24 contract shards, warning-free VM/interpreter smoke, and bounded 3/3 workload. [CI run 35751227471](https://github.com/kujolang/dispatch/actions/runs/35751227471) passed both platforms at `d9fda63`; the subsequent release-evidence edit is documentation-only.
- [x] Process-owned run-lock contention, backdated metadata, crash recovery, stale-release and long-running-resume tests pass; no second owner can perform tool/state side effects before the first exits. Both platforms passed in the same CI run.
- [x] Concurrent webhook JSONL sink test preserves every event and exact framing; signed network webhook/outbox regression stays green. Both platforms passed in the same CI run.
- [x] From outside the package, run installed `dispatch version`, validate the bundled routed workflow, execute its fixture, and exercise the bridge's origin rejection and redacted failure path. Both platforms passed in the CI run above against the pinned candidate commit.
- [x] Repeat offline wall-time and peak-RSS measurements at small and large catalog/state/trace sizes on both platforms; macOS sample values and lossless cleanup caveats are in [benchmarks.md](benchmarks.md), and the CI run above contains Linux/macOS raw summaries. A target-workload capacity and physical-retention policy remain pending.
- [x] Fresh-user commands in `docs/first-workflow.md` and the scoped plugin sample run without credentials. Both platforms passed the showcase gate in the same CI run.

## Integrations and release decision

- [x] Pinned AI SDK and Agents SDK passed their own offline release gates on Linux and macOS; the immutable commit-level full installation closure passed in the CI run above. Live provider and eventual release-tag checks remain pending.
- [ ] Complete a representative failure/restart and fixture soak, then a real approved provider or approved local proxy route; record only non-secret provider/model and outcome metadata. The forced crash/restart fixture and a local 100/100-run offline soak passed; live target evidence remains pending.
- [ ] For consequential tool actions, prove that the external sink enforces the stable `context.effect_idempotency_key` across crash-before-checkpoint replay; the fixture regression intentionally demonstrates a duplicate without that enforcement.
- [ ] Complete a sealed repository-wide Codex Security scan on the final revision and resolve reportable findings; run ShipCheck against the same revision.
- [x] Stage only reviewed source and documentation, commit in small pieces, push, and verify both CI operating systems and a clean remote revision. [CI run 35755836627](https://github.com/kujolang/dispatch/actions/runs/35755836627) passed the documentation-only final tip `b7cf1bd` on Linux and macOS; the working tree and `origin/main` matched afterward.
- [ ] After explicit release authorization, verify a protected 1.3.0 tag, source tarball/checksum, provenance and attestation, and Linux/macOS clean-install jobs.

The 1.3 development line is not a certified multi-tenant or distributed-lock
service. It assumes trusted workflow/plugin code and operator-managed isolation,
credentials, and network controls. Do not publish the 1.3 release or change
these boundaries until the relevant checks are backed by receipts.
