# Dispatch

Dispatch is a workflow orchestration engine for reliable AI systems built in Kujo.

It routes structured work through repeatable workflow templates and produces reviewable run state, traces, reports, and handoff bundles.

Dispatch is strongest as a Control-layer primitive: workflow routing, run-state persistence, import/export, approval gates, and auditable orchestration evidence.

The verified path in this repository uses safe local/offline fixture runs by default. Live SDK integration is optional and requires a local `ai-sdk` checkout plus environment-specific validation.

## Why Dispatch

Single-step chat calls are rarely enough when work needs to be repeated, reviewed, and resumed. Dispatch provides:

- Declarative workflow steps and agent roles
- Deterministic tool orchestration
- Retry policies and failure semantics
- Optional deterministic or random jitter in retry backoff
- Human-in-the-loop approval controls
- Persisted, resumable run state
- Structured report outputs and trace artifacts

## Key Capabilities

- Workflow schema with typed step metadata
- Step lifecycle tracking (pending, running, paused, completed, failed)
- Step input/output schema validation with actionable errors
- Per-step timeout handling and cancellation lifecycle state
- Lifecycle event hooks via callback and webhook sink outputs
- Approval decisions (approved, rejected, request_changes)
- DAG-style step dependencies (`depends_on`) with parallel-ready scheduling support
- Agent-to-agent handoff events
- Run cataloging and filtering (`runs --status`, `--topic`, `--issues-only`, `--json`)
- Output retention cleanup with safe dry-run/apply modes (`cleanup`)
- Workflow template selection by ID (`demo/resume --workflow <template-id>`)
- Health diagnostics and repair (`doctor`, `doctor --write`)
- Report generation (`report.md`, `report.json`)
- Trace generation (`trace.json`, `trace.md`)

## Architecture Overview

Architecture and extension diagrams:

- `docs/architecture-and-extension-diagrams.md`

Core modules:

- `dispatch.kujo`: CLI entrypoint and command routing
- `src/cli/cli_args.kujo`: schema-driven CLI argument parsing
- `src/workflows/workflow.kujo`: workflow templates and template registry
- `src/core/runner.kujo`: orchestration engine entrypoint
- `src/agents/agent.kujo`: agent execution entrypoint and handler registry mapping
- `src/tools/tool.kujo`: tool registry, payload adapters, and tool invocation entrypoint
- `tools/source_lookup.kujo`: source search and lookup handlers
- `tools/content_processing.kujo`: claim/citation/report/timestamp handlers
- `tools/reliability_tools.kujo`: reliability simulation handlers
- `src/core/approval.kujo`: approval request/decision handling
- `src/core/retry.kujo`: retry policies and attempt tracking
- `src/core/state.kujo`: run persistence, summaries, filtering, diagnostics
- `src/core/trace.kujo`: trace event model and markdown rendering
- `src/core/hooks.kujo`: lifecycle event hook callback and webhook sink emission
- `src/core/report.kujo`: report payload and artifact writing
- `src/core/tool_policy.kujo`: centralized tool authorization policy parsing and builder
- `src/core/plugins.kujo`: plugin registration and runtime injection for external tools/agents
- `sdk_adapter.kujo`: external AI SDK bridge invocation
- `bridge_chat.kujo`: Kujo bridge script executed from `AI_SDK_PATH`

Module layout:

- Core implementation modules now live under `src/`.
- Root-level runtime entry scripts are limited to `dispatch.kujo`, `sdk_adapter.kujo`, and `bridge_chat.kujo`.
- New development should target `src/` modules directly.

## External AI SDK Integration (AI Chat Style)

Dispatch uses the same pattern as `ai-chat`:

1. Dispatch does not vendor `ai_sdk.kujo` or `providers.kujo`.
2. `sdk_adapter.kujo` invokes a bridge process.
3. The bridge runs with `AI_SDK_PATH` as module root and imports shared SDK modules from that external project.

This keeps SDK behavior centralized in one repository (`ai-sdk`) while allowing Dispatch to remain lightweight.

## Prerequisites

- Kujo CLI/runtime installed for local fixture runs
- Local clone of `ai-sdk` only for live SDK integration
- `dispatch` checked out locally

## Quick Start

The default path is offline and fixture-backed, so it is safe to run without provider credentials:

```bash
cd /path/to/kujo-dispatch

kujo run --interpreter dispatch.kujo demo "How do AI agent workflows differ from chatbots?" --yes --non-interactive
```

Expected output shape:

```text
Run ID: run-...
Status: completed
Run Directory: outputs/run-...
Report: outputs/run-.../report.md
State: outputs/run-.../state.json
Trace: outputs/run-.../trace.json
```

Set `KUJO_BIN` when Dispatch child bridge calls should use a specific Kujo binary, and set `AI_SDK_PATH` only when validating live SDK behavior.

## Configuration

Dispatch reads the following environment variables:

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `KUJO_BIN` | No | `kujo` | Kujo executable used to invoke bridge calls |
| `AI_SDK_PATH` | Yes (for live SDK integration) | `../ai-sdk` | Directory containing `ai_sdk.kujo` and `providers.kujo` |
| `DISPATCH_SDK_BRIDGE_SCRIPT` | No | `<PWD>/bridge_chat.kujo` | Override bridge script path |
| `DISPATCH_OFFLINE_FIXTURE` | No | `true` | Enables fixture-mode model calls by default for the verified local/offline path |
| `DISPATCH_ALLOW_ANY_SOURCES_DIR` | No | `false` | Allows non-default `--sources-dir` paths when explicitly set to `true` |
| `DISPATCH_ALLOW_ANY_OUTPUT_ROOT` | No | `false` | Allows unconstrained `--output-root` paths (absolute and broader targets) when explicitly set to `true` |
| `DISPATCH_ALLOW_ANY_CONFIG_PATH` | No | `false` | Allows absolute or otherwise unrestricted `--config` paths when explicitly set to `true` |
| `DISPATCH_CONFIG_MAX_BYTES` | No | `262144` | Maximum config file size in bytes accepted by `--config` |
| `DISPATCH_ALLOWED_TOOLS` | No | empty | Comma-separated allowlist of tool names permitted during tool steps |
| `DISPATCH_DENIED_TOOLS` | No | empty | Comma-separated denylist of tool names blocked during tool steps |
| `DISPATCH_POLICY_PROFILE` | No | empty | Named policy profile alias (`dev`, `development`, `staging`, `prod`, `production`) applied before explicit allow/deny overrides |
| `DISPATCH_BUNDLE_SIGNING_KEY` | No | empty | Shared signing key used by `export-run --sign-bundle` and `import-run --verify-bundle-signature` |
| `DISPATCH_STRICT_MUTATION_MODE` | No | `false` | When `true`, destructive commands require explicit confirmation |
| `DISPATCH_MUTATION_CONFIRM` | No | `false` | Global mutation confirmation guard used with strict mutation mode |
| `DISPATCH_MUTATION_AUDIT_MAX_BYTES` | No | `1048576` | Maximum active audit log size before rolling to a backup file |
| `DISPATCH_MUTATION_AUDIT_MAX_BACKUPS` | No | `5` | Maximum rotating backup slots used for `dispatch-mutations.<slot>.jsonl` |
| `DISPATCH_MUTATION_AUDIT_ROTATE_DAILY` | No | `false` | Enables daily rollover for mutation audit logs |
| `DISPATCH_TRACE_MAX_EVENTS` | No | `400` | Global default maximum number of trace events retained per run |
| `DISPATCH_TRACE_MAX_PAYLOAD_CHARS` | No | `2400` | Global default maximum payload characters retained per trace event |
| `DISPATCH_SDK_DEBUG_OUTPUT` | No | `false` | Includes raw bridge stdout/stderr in bridge parse and execution error details when set to `true` |

By default, Dispatch only allows fixture sources under `examples/research-report/sources` for demo/resume runs.

By default, Dispatch also restricts `--output-root` to safe relative directories and blocks absolute/traversal-like paths unless `DISPATCH_ALLOW_ANY_OUTPUT_ROOT=true` is set explicitly.

By default, Dispatch restricts `--config` to safe relative paths and enforces a maximum config size to reduce risky local path and oversized input scenarios.

## CLI Reference

```bash
kujo run --interpreter dispatch.kujo demo "Research topic" [--config config.json] [--workflow research-report] [--policy-profile staging] [--tags prod,project-a] [--yes] [--non-interactive] [--output-root outputs] [--allow-tools timestamp_tool,citation_formatter] [--deny-tools flaky_reliability_tool] [--trace-max-events 400] [--trace-max-payload-chars 2400]
kujo run --interpreter dispatch.kujo show <run-id> [--output-root outputs] [--json]
kujo run --interpreter dispatch.kujo inspect <run-id> [--output-root outputs] [--json]
kujo run --interpreter dispatch.kujo resume <run-id> [--config config.json] [--workflow research-report] [--policy-profile staging] [--yes] [--non-interactive] [--output-root outputs] [--allow-tools timestamp_tool,citation_formatter] [--deny-tools flaky_reliability_tool] [--trace-max-events 400] [--trace-max-payload-chars 2400]
kujo run --interpreter dispatch.kujo templates [--json]
kujo run --interpreter dispatch.kujo runs [--output-root outputs] [--status completed] [--workflow research] [--topic ai] [--tags prod] [--issues-only] [--limit 50] [--offset 0] [--json] [--diagnostics]
kujo run --interpreter dispatch.kujo doctor [--output-root outputs] [--write] [--run-ids run-1,run-2] [--recent-count 20] [--json] [--strict-mutations] [--confirm-mutation]
kujo run --interpreter dispatch.kujo cleanup [--output-root outputs] [--status completed] [--older-than-hours 24] [--max-count 50] [--apply] [--json] [--strict-mutations] [--confirm-mutation]
kujo run --interpreter dispatch.kujo export-run <run-id> --bundle-path bundles/run.json [--output-root outputs] [--sign-bundle] [--signing-key key]
kujo run --interpreter dispatch.kujo import-run --bundle-path bundles/run.json [--output-root outputs] [--verify-bundle-signature] [--signing-key key] [--strict-mutations] [--confirm-mutation]
```

When strict mutation mode is enabled (`--strict-mutations` or `DISPATCH_STRICT_MUTATION_MODE=true`), `doctor --write`, `cleanup --apply`, and `import-run` are blocked unless `--confirm-mutation` is present or `DISPATCH_MUTATION_CONFIRM=true` is set.

`doctor` supports incremental scope via `--run-ids` (explicit run selection) and `--recent-count` (most recently updated runs only), which helps reduce scan latency on large catalogs.

`show --json`, `inspect --json`, and `doctor --json` emit consistent machine-readable envelopes with shared metadata keys (`command`, `ok`, and `output_root`) plus command-specific payload data.

`runs --json --diagnostics` includes index diagnostics metadata such as `index_fallback_count` and `index_rebuild_count` to surface catalog/index health quickly.

`demo --tags` stores normalized per-run metadata labels and `runs --tags` filters to runs that include all requested tags.

Dispatch is template-driven: `demo` and `resume` select workflows by template ID through `--workflow <template-id>`. Direct Spec-file ingestion is not part of the verified command surface in this repository.

Dispatch currently supports `help` and `--help`. `version` and `--version` are not implemented and return `Unknown command`.

## Common Usage Flows

### 1. Run a workflow interactively

```bash
kujo run --interpreter dispatch.kujo demo "How do AI workflows improve reliability?"
```

### 2. Run non-interactive and pause at approval

```bash
kujo run --interpreter dispatch.kujo demo "How do AI workflows improve reliability?" --non-interactive
```

### 3. Resume a paused run

```bash
kujo run --interpreter dispatch.kujo resume <run-id> --yes
```

### 4. Inspect runs and diagnostics

```bash
kujo run --interpreter dispatch.kujo runs --json
kujo run --interpreter dispatch.kujo runs --tags env:prod,project:dispatch --json
kujo run --interpreter dispatch.kujo inspect <run-id> --json
kujo run --interpreter dispatch.kujo doctor --json
```

### 4b. Persist doctor repairs to state

```bash
kujo run --interpreter dispatch.kujo doctor --write
```

### 5. Run the CRUD reliability template

```bash
kujo run --interpreter dispatch.kujo demo "Orders API reliability" --workflow crud-reliability --yes
```

### 6. Use config-file driven runs with CLI precedence

```bash
kujo run --interpreter dispatch.kujo demo --config ./dispatch-config.json --decision approve
```

### 3b. Inspect available workflow templates

```bash
kujo run --interpreter dispatch.kujo templates
kujo run --interpreter dispatch.kujo templates --json
```

### 6b. Enforce tool authorization policy from CLI

```bash
kujo run --interpreter dispatch.kujo demo "Policy constrained run" --yes --allow-tools timestamp_tool,citation_formatter --deny-tools flaky_reliability_tool
```

### 7. Export and import run bundles

```bash
kujo run --interpreter dispatch.kujo export-run <run-id> --bundle-path bundles/run.json --sign-bundle
kujo run --interpreter dispatch.kujo import-run --bundle-path bundles/run.json --output-root outputs-imported --verify-bundle-signature
```

When signature mode is enabled, Dispatch writes `signature` metadata into the bundle and verifies it during import. Verification failures return deterministic `invalid_bundle_signature` errors.

`--signing-key` can be passed directly, but using `DISPATCH_BUNDLE_SIGNING_KEY` is recommended for non-interactive and managed environments.

## Demo Workflow Included

Built-in workflow templates:

- `research-report`: General evidence-backed research report workflow
- `crud-reliability`: CRUD API reliability review focused on contract checks, migration safety, auth checks, and error-budget notes

The baseline execution lifecycle demonstrates:

1. Planning
2. Source gathering
3. Retry probe
4. Claim extraction
5. Verification
6. Handoff to writer
7. Human approval gate
8. Report generation
9. Finalization and artifact write-out

## Output Artifacts

Each run is written to:

```text
outputs/<run-id>/
```

Artifacts:

- `state.json`: full run state snapshot
- `trace.json`: structured execution trace
- `trace.md`: human-readable trace timeline
- `report.md`: human-readable report
- `report.json`: machine-readable report payload
- `dispatch-mutations.jsonl`: active mutation/policy audit log for `doctor --write`, `cleanup --apply`, bundle imports, and policy-denied tool attempts
- `dispatch-mutations.<slot>.jsonl`: rotated mutation audit backups controlled by `DISPATCH_MUTATION_AUDIT_MAX_BYTES` and `DISPATCH_MUTATION_AUDIT_MAX_BACKUPS`
- `.dispatch-run-index.json`: run metadata index used for faster run listing/filtering

Contract metadata is embedded in persisted machine-readable artifacts: `state.json`, `trace.json`, and `report.json` include `artifact_contract_version`, `schema_name`, and `schema_version` fields to support schema-aware integrations and forward-compatible readers.

Dispatch redacts sensitive fields (for example keys containing `api_key`, `token`, `authorization`, `secret`, `password`) before writing persisted artifacts.

Policy-denied tool execution attempts are recorded in trace events (`policy_denied`) and mutation audit entries (`operation=policy_deny`) including run and command context.

Tool policy can be sourced from a reusable profile alias (`--policy-profile`, `policy_profile`, `DISPATCH_POLICY_PROFILE`) plus explicit allow/deny controls. Explicit `allow_tools` and `deny_tools` override profile defaults when provided. CLI flags take precedence over config and environment values.

Built-in policy profile aliases:

- `dev` / `development`: no allow/deny restrictions (open profile)
- `staging`: deny `flaky_reliability_tool`
- `prod` / `production`: allow `mock_web_search`, `local_source_lookup`, `claim_extraction`, `citation_formatter`, `markdown_report_writer`, `timestamp_tool`; deny `flaky_reliability_tool`

## Testing

```bash
kujo test-run tests/dispatch_tests.kujo
```

## CI Gate

Repository CI is enforced by GitHub Actions in `.github/workflows/ci-gate.yml`.

The gate builds Kujo from `kujolang/kujo`, exports `KUJO_BIN` for test child processes, and runs:

```bash
$KUJO_BIN test-run tests/sdk_adapter_tests.kujo -v
$KUJO_BIN test-run tests/policy_precedence_tests.kujo -v
$KUJO_BIN test-run tests/dispatch_tests.kujo -v
```

Equivalent local validation:

```bash
export KUJO_BIN=/path/to/kujo/target/debug/kujo
export DISPATCH_OFFLINE_FIXTURE=true

$KUJO_BIN test-run tests/sdk_adapter_tests.kujo -v
$KUJO_BIN test-run tests/policy_precedence_tests.kujo -v
$KUJO_BIN test-run tests/dispatch_tests.kujo -v
```

## Improvement Checklist

Track prioritized hardening, architecture cleanup, extensibility work, and testing backlog in:

- `docs/dispatch-next-session-checklist-v3.md`
- `docs/dispatch-next-session-checklist-v2.md`

`docs/dispatch-next-session-checklist-v3.md` is the active next-session backlog for flagship enterprise readiness, scale, and presentation work.

`docs/dispatch-next-session-checklist-v2.md` is now complete and serves as an implementation audit trail for enterprise hardening milestones.

`docs/dispatch-next-session-checklist.md` is kept as historical context from the earlier backlog phase.

## Agent And Contributor Guidance

For AI-agent and contributor search hygiene, canonical example labels, generated-path exclusions, and cleanup preferences, see:

- `AGENTS.md`

Prioritize copyable examples over tests: examples should model the most token-efficient idioms we want agents to imitate.

Exclude generated/bulk paths from the main sweep unless the task explicitly targets them; document the search exclusions you used.

## Release Process

Release governance artifacts:

- `CHANGELOG.md`: changelog format and versioning policy.
- `docs/release-checklist.md`: step-by-step release gate and tagging checklist.

Release versions are sourced from `kennel.toml` (`[package].version`) and should be updated together with the corresponding changelog release section.

For v1.0 pre-release walkthroughs, prefer the repository-root invocation pattern to avoid shell cwd drift:

```bash
pushd "$(git rev-parse --show-toplevel)"
export KUJO_BIN=/path/to/kujo
export DISPATCH_OFFLINE_FIXTURE=true

$KUJO_BIN test-run tests/sdk_adapter_tests.kujo -v
$KUJO_BIN test-run tests/policy_precedence_tests.kujo -v
$KUJO_BIN test-run tests/dispatch_tests.kujo -v
popd
```

## Enterprise Deployment Guide

For production assumptions, hardening controls, monitoring expectations, upgrade strategy, and non-goals, see:

- `docs/enterprise-deployment.md`

Enterprise quickstart profile examples (copy-paste defaults):

```bash
# Development
export DISPATCH_POLICY_PROFILE=development
export DISPATCH_STRICT_MUTATION_MODE=false
kujo run --interpreter dispatch.kujo demo "Development profile smoke" --policy-profile development --yes --non-interactive --decision approve --output-root tests/tmp/profile-dev-outputs

# Staging
export DISPATCH_POLICY_PROFILE=staging
export DISPATCH_STRICT_MUTATION_MODE=true
export DISPATCH_MUTATION_CONFIRM=false
kujo run --interpreter dispatch.kujo runs --output-root tests/tmp/profile-staging-outputs --json --diagnostics

# Production
export DISPATCH_POLICY_PROFILE=production
export DISPATCH_STRICT_MUTATION_MODE=true
export DISPATCH_MUTATION_CONFIRM=true
kujo run --interpreter dispatch.kujo doctor --output-root tests/tmp/profile-prod-outputs --strict-mutations --confirm-mutation
```

For environment hardening rationale and rollout policy, use the full deployment guide in `docs/enterprise-deployment.md`.

## Extension Guide

Dispatch is designed to be extended safely and incrementally:

- Add new workflow templates in `src/workflows/workflow.kujo`
- Add new tools in `src/tools/tool.kujo` with per-tool payload adapters instead of runner-specific branching
- Register project-specific plugins via `src/core/plugins.kujo` to inject tools and agents without core edits
- Extend decision policies in `src/core/approval.kujo` and `src/core/retry.kujo`
- Add reporting outputs in `src/core/report.kujo`
- Integrate observability sinks from trace events

## Troubleshooting

### AI SDK not found

Set `AI_SDK_PATH` to a directory that contains both `ai_sdk.kujo` and `providers.kujo`.

### Bridge execution errors

- Verify `KUJO_BIN` points to a valid Kujo binary.
- Verify `DISPATCH_SDK_BRIDGE_SCRIPT` (if set) points to a valid file.
- Run with `--interpreter` during development.
- Bridge parse and execution failures redact raw stdout/stderr by default; set `DISPATCH_SDK_DEBUG_OUTPUT=true` only for local debugging.

### Sources validation errors in demo mode

Ensure your sources directory exists and includes markdown fixtures (`.md` files).

If you intentionally need a different sources directory, set `DISPATCH_ALLOW_ANY_SOURCES_DIR=true` explicitly.

### Undefined-function warnings

Some Kujo interpreter runs can emit warnings about undefined functions while still executing correctly. Treat command exit status and functional output as the primary success signal.

## Repository Layout

```text
dispatch/
  README.md
  src/
    cli/
      cli_args.kujo
    workflows/
      workflow.kujo
    agents/
      agent.kujo
    tools/
      tool.kujo
    core/
      approval.kujo
      decision.kujo
      handoff.kujo
      hooks.kujo
      plugins.kujo
      report.kujo
      retry.kujo
      runner.kujo
      state.kujo
      step.kujo
      trace.kujo
  dispatch.kujo
  tools/
    source_lookup.kujo
    content_processing.kujo
    reliability_tools.kujo
  sdk_adapter.kujo
  bridge_chat.kujo
  examples/
    research-report/
      sources/
  outputs/
  tests/
    dispatch_tests.kujo
```
