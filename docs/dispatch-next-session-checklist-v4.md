# Dispatch Next-Session Checklist v4

Active backlog after the 2026-06-25 robustness/security/presentation passes.

An earlier pass shipped: source-handler consolidation into `src/tools/`, a cryptographic (keyed SHA-256 MAC) bundle signing scheme (`dispatch-signature-v2`), workflow-aware report titles, and an O(1) in-place step writer.

A follow-up enterprise-hardening pass then shipped (and closed several items below):

- **F1 DONE** — the default bytecode VM run path is now canonical and warning-free; `--interpreter` remains for debugging. Docs/help/tests updated.
- **Atomic writes** — all artifacts (state, trace, report, index, audit, bundles) are written via temp-file + `rename`, fixing torn/partial files on crash or concurrent read.
- **D1 DONE** — `--webhook-sink` path guard (`DISPATCH_ALLOW_ANY_WEBHOOK_SINK` opt-out).
- **D2 DONE** — bundle signing key rotation (`key_id` + `DISPATCH_BUNDLE_SIGNING_KEYS` trusted set).
- **C2 DONE** — per-step `idempotency_key` (replay-safe resume).
- **Partial C1** — `--cancel-after-step` cooperative cancellation wired; preemptive timeout is still post-hoc.
- **Observability** — `--webhook-url` HTTP sink added; `event_hook` callback still library-only.
- **CI** — version-consistency, pinned-runtime mechanism, and a warning-free smoke added.
- **SDK** — bridge timeout is now `DISPATCH_SDK_TIMEOUT_MS`-configurable.
- **Diagnostics** — `doctor` flags oversized `state.json` (`DISPATCH_STATE_MAX_BYTES`).

All `dispatch_tests`, `sdk_adapter`, and `policy_precedence` suites pass after the pass.

### Known runtime quirk (record for future work)

In this Kujo build, reassigning a whole variable with `=` to a function's return value **inside an `if` block** in a module function did not always propagate to the enclosing scope (observed in `resolve_bundle_verification_key`), whereas element assignment (`d[k] := v`) inside the same block does. Prefer building dicts/arrays via element assignment in conditional blocks until this is confirmed fixed upstream.

This document is the prioritized list to work through next. Earlier backlogs (`dispatch-next-session-checklist-v2.md`, `-v3.md`) remain as history.

## How to read this

- **Priority:** P0 (blocks "production-ready" claim), P1 (high value), P2 (polish).
- **Difficulty:** low / medium / high.
- Each item names the primary files and an acceptance signal.

---

## A. Workflow authoring (make it a real platform)

| # | Item | Priority | Difficulty | Files | Acceptance |
|---|---|---|---|---|---|
| A1 | Declarative template loader: parse a JSON/TOML workflow spec into `create_workflow` with schema validation and clear errors, so workflows can be authored without editing Kujo source. | P1 | high | `src/workflows/`, new `src/workflows/loader.kujo`, `dispatch.kujo` (`--workflow-file`) | `demo --workflow-file my.json` runs a user-authored workflow offline |
| A2 | Per-template report builders: register a report builder per workflow so non-research templates produce purpose-built reports (titles are already workflow-aware; sections are still research-shaped). | P1 | medium | `src/core/report.kujo`, `src/workflows/workflow.kujo` | crud-reliability report shows contract/migration/auth/error-budget sections |
| A3 | Multi-field run input beyond a single `topic` string (structured input + per-step references). | P2 | medium | `src/core/state.kujo`, `src/core/runner.kujo`, `dispatch.kujo` | a template can consume `{repo, ref, area}` input |

## B. Extensibility (wire what already exists)

| # | Item | Priority | Difficulty | Files | Acceptance |
|---|---|---|---|---|---|
| B1 | Wire plugin injection into the CLI (a plugin manifest or `--plugin` discovery path), so `src/core/plugins.kujo` is reachable without a custom entrypoint. | P1 | medium | `dispatch.kujo`, `src/core/plugins.kujo` | a sample plugin adds a tool + agent handler via CLI |
| B2 | Expose the `event_hook` callback path (today only `--webhook-sink` is wired). | P2 | medium | `dispatch.kujo`, `src/core/hooks.kujo` | a registered callback observes lifecycle events |
| B3 | Public "emit custom trace event" API for tool/agent handlers. | P2 | medium | `src/core/trace.kujo`, `src/tools/tool.kujo` | a tool can append a typed trace event |

## C. Reliability / state / recovery

| # | Item | Priority | Difficulty | Files | Acceptance |
|---|---|---|---|---|---|
| C1 | Real per-step timeout/cancellation: cooperative cancellation wired from the CLI (`--cancel-after-step`), and honest docs that the current timeout is post-hoc. | P1 | medium | `src/core/runner.kujo`, `dispatch.kujo` | a long step can be cancelled; docs match behavior |
| C2 | Idempotency keys for replay-safe side effects, so resume does not double-run non-completed side-effecting steps. | P2 | medium | `src/core/runner.kujo`, `src/core/step.kujo` | a tool with an idempotency key is not re-executed on resume |
| C3 | Concurrency: implement real parallel execution for independent DAG branches, or remove the `parallel_execution` no-op branch and the "parallel-ready" claim. | P2 | high | `src/core/runner.kujo` | independent steps run concurrently, or the claim is removed |

## D. Security / policy

| # | Item | Priority | Difficulty | Files | Acceptance |
|---|---|---|---|---|---|
| D1 | Constrain `--webhook-sink` to safe relative paths (reject absolute/traversal unless an explicit opt-in env), mirroring `--output-root`/`--config` guards. | P1 | low | `dispatch.kujo`, `src/core/hooks.kujo` | absolute/`..` sink paths are rejected by default |
| D2 | Optional key rotation / multi-key verification for bundle signatures (accept a key id + set of trusted keys). | P2 | medium | `src/core/state.kujo` | a bundle signed with a rotated key still verifies |
| D3 | Document a threat model section (trust boundaries for bundles, sinks, sources-dir, config). | P2 | low | `docs/enterprise-deployment.md` | threat model section exists |

## E. Performance / scale

| # | Item | Priority | Difficulty | Files | Acceptance |
|---|---|---|---|---|---|
| E1 | Stream/iterative run-index maintenance for very large catalogs (avoid full rewrites on every persist). | P2 | medium | `src/core/state.kujo` | index update cost is bounded as catalog grows |
| E2 | Benchmark harness for run throughput and large-trace handling, committed under `tests/` or `docs/`. | P2 | medium | new `tests/` bench | reproducible numbers in the repo |

## F. Developer experience / presentation (the "shining star" goals)

| # | Item | Priority | Difficulty | Files | Acceptance |
|---|---|---|---|---|---|
| F1 | Silence the `[RUFRUN001]` type-checker warnings flooding stderr on every run (fix root causes or scope a suppression in the entrypoint). | P1 | medium | `dispatch.kujo`, `src/**` | a normal `demo` run prints no type warnings |
| F2 | A `quickstart`/`examples` walkthrough that runs end-to-end in under a minute and showcases approval + resume + signed export, as a language showcase. | P1 | low | `README.md`, `examples/` | copy-paste walkthrough verified offline |
| F3 | Split the ~1.5k-line `dispatch.kujo` entrypoint into command modules under `src/cli/commands/` for readability. | P2 | medium | `dispatch.kujo`, `src/cli/` | each command lives in its own module |
| F4 | Consolidate `kujo.toml` and `kennel.toml` (or document why both exist) to remove version-drift risk. | P2 | low | `kujo.toml`, `kennel.toml`, docs | single source of version truth, documented |

---

## Suggested order for the next session

1. F1 (kill the warning noise) and F2 (showcase walkthrough) — biggest presentation wins.
2. A2 (per-template reports) and B1 (CLI plugins) — turn it into an authoring platform.
3. D1 (webhook sink path guard) — quick security win.
4. C1 (real cancellation) and C3 (concurrency or claim removal) — reliability honesty.
