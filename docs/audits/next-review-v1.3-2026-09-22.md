# Dispatch 1.3 follow-up review — 2026-09-22

The 1.3 development candidate adds process-owned run locking, serialized
JSONL webhook writing, installed/source bridge checks, a credential-free
showcase, and a reproducible catalog/state/trace scale harness. None of these
checks alone establishes universal enterprise readiness. The active
[release checklist](../release-checklist.md) governs promotion; the
[previous review](next-review-2026-09-22.md) preserves the before baseline.

## Remaining work, in priority order

| Priority | Item | Required evidence |
| --- | --- | --- |
| P1 | Restore Codex Security workbench compatibility and complete the formal sealed repository scan at the final revision. Its existing MCP server invokes Python 3.9, which fails on a Python 3.10+ type expression; installing `tomli` alone did not fix it. | Supported Python 3.11+ configured for the workbench, sealed report and validated-finding remediations. Never substitute a hand-written scan report. |
| P1 | Run the pinned Kujo/AI SDK/Agents SDK/Dispatch closure on clean Linux and macOS installations, including package commands from an unrelated working directory. | Exact revision checks, both platform CI receipts, real installer paths, and passing full release gates. Local macOS pinned SDK gates and copied installed-layout checks are preliminary. |
| P1 | Validate an approved real provider or local proxy route, failure/restart, and bounded soak without exposing credentials. | Non-secret provider/model/route outcome and restart receipts; document target deployment constraints and runtime version. |
| P1 | Stage a 1.2-to-1.3 upgrade/rollback with quiesced workers and an existing paused run; confirm pre-1.3 and 1.3 never share a live output root. | Staging upgrade/resume and rollback record for both state backends, with backup recovery. |
| P2 | Set an explicit workload-specific capacity and physical-retention policy. `cleanup --apply` only tombstones entries and retains disk artifacts intentionally. | Peak-RSS/disk/latency measurements at actual workload volumes on both target OSes; approved archive/backup/purge procedure and recovery test, without breaking audit or resume. |
| P2 | Decide whether the initial single-host, trusted-plugin scope is enough for adopters. | Real user workflow feedback; only then scope isolation of untrusted plugins, distributed locks, remote state, and multi-tenant identity as separately specified features. |

Do not publish a 1.3 tag, source artifact, or enterprise-certification claim
until the applicable release checklist items and independent evidence are
complete. The local native lock is neither distributed fencing nor protection
against a malicious peer with write access to the trusted output root.
