# Dispatch 1.3 follow-up review — 2026-09-22

The 1.3 development candidate adds process-owned run locking, serialized
JSONL webhook writing, installed/source bridge checks, a credential-free
showcase, and a reproducible catalog/state/trace scale harness. The exact pinned
Dispatch CI gate passed on Linux and macOS at `1a82def`
([run 35735638167](https://github.com/kujolang/dispatch/actions/runs/35735638167));
local pinned AI SDK and Agents SDK offline gates also passed on macOS. A real
commit-pinned source installation and external-directory shim check passed on
macOS against `1a82def`; the final candidate and Linux installation remain
subject to the expanded CI gate. A quiesced v1.2 source upgrade, paused-run
resume, and backup rollback passed locally for filesystem and SQLite state,
using the current pinned runtime rather than the original 1.2 runtime. None of
these checks alone establishes universal enterprise readiness. The active
[release checklist](../release-checklist.md) governs promotion; the
[previous review](next-review-2026-09-22.md) preserves the before baseline.

## Remaining work, in priority order

| Priority | Item | Required evidence |
| --- | --- | --- |
| P1 | Restore Codex Security workbench compatibility and complete the formal sealed repository scan at the final revision. Its existing MCP server invokes Python 3.9, which fails on a Python 3.10+ type expression; installing `tomli` alone did not fix it. | Supported Python 3.11+ configured for the workbench, sealed report and validated-finding remediations. Never substitute a hand-written scan report. |
| P1 | Verify independent pinned AI SDK/Agents SDK gates and final-revision clean package installations on Linux and macOS, including commands from an unrelated working directory. The candidate CI now exercises these, but its result and release-tag installer jobs are pending. | Passing independent SDK gate receipts and pinned real-installer paths for the exact final revision; tagged clean-install receipts after authorized tagging. |
| P1 | Validate an approved real provider or local proxy route, failure/restart, and bounded soak without exposing credentials. | Non-secret provider/model/route outcome and restart receipts; document target deployment constraints and runtime version. |
| P1 | Confirm the scripted quiesced 1.2-to-1.3 upgrade/rollback on both CI platforms, then stage with the actual prior and candidate runtimes and a representative existing paused run. Never share a live output root between versions. | CI receipts for both state backends plus target-staging backup/recovery and separate-worker evidence. The local source-level rehearsal alone does not prove a production upgrade. |
| P1 | Require external idempotency for consequential tool effects. A forced crash after the effect but before checkpoint demonstrably replays a non-idempotent effect on resume; process locks and the keyed step cache do not eliminate this window. | Sink-enforced stable `context.effect_idempotency_key`, or a transactional outbox, and a representative crash/restart receipt for the chosen integration. |
| P2 | Set an explicit workload-specific capacity and physical-retention policy. `cleanup --apply` only tombstones entries and retains disk artifacts intentionally. | Peak-RSS/disk/latency measurements at actual workload volumes on both target OSes; approved archive/backup/purge procedure and recovery test, without breaking audit or resume. |
| P2 | Decide whether the initial single-host, trusted-plugin scope is enough for adopters. | Real user workflow feedback; only then scope isolation of untrusted plugins, distributed locks, remote state, and multi-tenant identity as separately specified features. |

Do not publish a 1.3 tag, source artifact, or enterprise-certification claim
until the applicable release checklist items and independent evidence are
complete. The local native lock is neither distributed fencing nor protection
against a malicious peer with write access to the trusted output root.
