# Dispatch follow-up review — 2026-09-22

## Assessment and evidence limits

Dispatch is a useful, substantial Kujo orchestration example, but **not yet
universally useful or independently enterprise-production-ready**. The 1.2
release checklist is the release authority. This review inspected the CLI,
bridge, persistence, webhook, package layout, documentation, test harness, and
the previous [hardening receipt](repository-hardening.md). The previous receipt
records fixed regressions and the still-open lock recovery failure (H11).
This review does not claim live-provider, cross-host, hostile-input, or
production-deployment certification. The Codex Security workbench could not
start because its Python environment lacked `tomllib` and `tomli`; a completed
formal security scan remains outstanding.

The layout change in this session moved the internal SDK adapter and bridge
script into `src/bridge/`, updated imports, package metadata, and the default
bridge path, and added a regression for that default. The root CLI entrypoint,
package/release manifests, contributor documentation, and fixtures remain at
their intentional locations; they are not stray implementation files.

## Next-session work, in priority order

| Priority | Work | Completion evidence |
| --- | --- | --- |
| P1 | Replace age-only run-lock recovery (H11) with an owner-liveness/heartbeat and fenced lease or a runtime-backed process lock. Ensure old owners cannot release new locks or commit state/tool side effects after losing ownership. | Multiprocess expiry, crash, release-race, and long-running-resume tests on macOS and Linux; documented legacy-lock handling. Until then, serialize workers externally. |
| P1 | Complete a formal repository-wide security scan once the Codex Security workbench has Python 3.11+ or `tomli`, and resolve validated findings. | Sealed scan report on the final revision and regression tests for each accepted finding. |
| P1 | Verify the full pinned release closure and real execution beyond the offline fixture. | Clean Linux/macOS package install from a different working directory, exact pinned CI gate, approved live-provider route with non-secret receipt, and restart/soak evidence. Do not publish release claims on fixture tests alone. |
| P2 | Validate the moved bridge with a live or deterministic bridge subprocess, including custom-provider origin rejection and failure redaction from an installed package. | End-to-end test exercising `src/bridge/bridge_chat.kujo` with `AI_SDK_PATH` as the working directory and no accidental secret output; source-tree and installed-package paths both pass. |
| P2 | Make webhook sink framing safe for concurrent writers or explicitly enforce single-writer ownership. Current `file_size` then `append_file` is a separate check and write. | Two-process event emission retains one valid JSON event per line, with no lost or interleaved records; supported ownership documented. |
| P2 | Quantify and bound state/index/trace cost as run counts and step outputs grow; decide whether to rotate or compact sinks without surprising operators. | Repeated same-machine throughput and peak-RSS measurements at small and large run catalogs, explicit budgets, and failure-safe retention tests. |
| P2 | Improve the showcase onboarding: one minimal workflow-to-trace walkthrough, a diagram linking Kujo modules to the runtime, and an extension example with a scoped plugin/tool policy. | Fresh-user copy/paste walkthrough succeeds without credentials; each sample uses public current fields and links to Kujo learning material. |

## Shipping decision

Do not interpret `kennel.toml`'s `production` status or a passing offline gate
as universal suitability. Dispatch assumes trusted workflow/plugin code, a
controlled single-service filesystem, external IAM/secrets controls, and an
operator preventing lock-expiry overlap. Multi-tenant isolation and distributed
locking are outside the current implementation. Keep the release checklist open
until target-environment evidence and H11 remediation are available.
