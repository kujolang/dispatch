# Dispatch 1.3 follow-up review — 2026-09-22

The 1.3 development candidate adds process-owned run locking, serialized
JSONL webhook writing, installed/source bridge checks, a credential-free
showcase, and a reproducible catalog/state/trace scale harness. The exact pinned
Dispatch CI gate passed on Linux and macOS at `1a82def`
([run 35735638167](https://github.com/kujolang/dispatch/actions/runs/35735638167));
the expanded pinned Dispatch, AI SDK, and Agents SDK gates, 1.2 source-level
upgrade/rollback rehearsal, three-sample state-scale measurements, and real
commit-pinned clean installation from outside the source tree all passed on
Linux and macOS at `573dec5`
([run 35740688654](https://github.com/kujolang/dispatch/actions/runs/35740688654)).
An additional quiesced rehearsal passed on Linux and macOS with the original
pinned Kujo 1.0.2 executable creating and rolling back paused v1.2 runs, and
the pinned Kujo 1.4.0 executable resuming them, on both state backends
([run 35751227471](https://github.com/kujolang/dispatch/actions/runs/35751227471)).
An independent local fixture soak completed 100/100 research-report runs;
its 2,249,762 ms wall time reflects a contended development host, not an SLA.
Representative target staging remains pending. None of
these checks alone establishes universal enterprise readiness. The active
[release checklist](../release-checklist.md) governs promotion; the
[previous review](next-review-2026-09-22.md) preserves the before baseline.

## Remaining work, in priority order

| Priority | Item | Required evidence |
| --- | --- | --- |
| P1 | Restore Codex Security workbench compatibility and complete the formal sealed repository scan at the final revision. Its existing MCP server invokes Python 3.9, which fails on a Python 3.10+ type expression; installing `tomli` alone did not fix it. | Supported Python 3.11+ configured for the workbench, sealed report and validated-finding remediations. Never substitute a hand-written scan report. |
| P1 | After explicit release authorization, verify the 1.3 tag, signed/provenance-bearing source artifact and release-tag clean-install jobs. Commit-pinned candidate installations passed on both CI platforms; a future tag is not interchangeable with the tested commit. | Immutable tag and artifact receipts, checksum/provenance verification, and clean Linux/macOS installations from the released tag. |
| P1 | Validate an approved real provider or local proxy route, failure/restart, and bounded soak without exposing credentials. | Non-secret provider/model/route outcome and restart receipts; document target deployment constraints and runtime version. |
| P1 | Stage a quiesced 1.2-to-1.3 upgrade/rollback on representative target storage with prior and candidate workers. Both pinned executables passed both backends on Linux/macOS CI; never share a live output root between versions. | Target-staging backup/recovery, paused-run and separate-worker receipts on both state backends; CI fixtures alone do not prove a production upgrade. |
| P1 | Require external idempotency for consequential tool effects. A forced crash after the effect but before checkpoint demonstrably replays a non-idempotent effect on resume; process locks and the keyed step cache do not eliminate this window. | Sink-enforced stable `context.effect_idempotency_key`, or a transactional outbox, and a representative crash/restart receipt for the chosen integration. |
| P2 | Set an explicit workload-specific capacity and physical-retention policy. `cleanup --apply` only tombstones entries and retains disk artifacts intentionally. | Peak-RSS/disk/latency measurements at actual workload volumes on both target OSes; approved archive/backup/purge procedure and recovery test, without breaking audit or resume. |
| P2 | Decide whether the initial single-host, trusted-plugin scope is enough for adopters. | Real user workflow feedback; only then scope isolation of untrusted plugins, distributed locks, remote state, and multi-tenant identity as separately specified features. |

Do not publish a 1.3 tag, source artifact, or enterprise-certification claim
until the applicable release checklist items and independent evidence are
complete. The local native lock is neither distributed fencing nor protection
against a malicious peer with write access to the trusted output root.
