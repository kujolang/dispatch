# Dispatch

[![Version](https://img.shields.io/badge/version-1.0.0-black)](https://github.com/kujolang/dispatch)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)
[![built with Kujo](https://img.shields.io/badge/built%20with-Kujo-white.svg)](https://github.com/kujolang/kujo)

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
- Deterministic, policy-driven agent and model routing with persisted decisions

## Key Capabilities

- Workflow schema with typed step metadata
- Step lifecycle tracking (pending, running, paused, completed, failed, skipped)
- Optional steps that skip-and-continue on failure or policy denial
- Step input/output schema validation with actionable errors
- Per-step timeout handling and cancellation lifecycle state
- Lifecycle event hooks via callback and webhook sink outputs (`--webhook-sink`)
- Approval decisions (approved, rejected, request_changes)
- DAG-style step dependencies (`depends_on`) with dependency-ordered scheduling (steps execute sequentially in a single process; `depends_on` gates ordering)
- Agent-to-agent handoff events
- Run cataloging and filtering (`runs --status`, `--topic`, `--issues-only`, `--json`)
- Output retention cleanup with safe dry-run/apply modes (`cleanup`)
- Workflow template selection by ID (`demo/resume --workflow <template-id>`)
- Health diagnostics and repair (`doctor`, `doctor --write`)
- Report generation (`report.md`, `report.json`)
- Trace generation (`trace.json`, `trace.md`)
- Provider-neutral human-intervention events and validated `resume-decision`
  bridge handoff for Leash ChatOps routing
- Quality-first route selection with hard policy constraints, explicit fallback limits,
  resumable route evidence, and structured `no_route_available` failures

## Architecture Overview

Architecture and extension diagrams:

- `docs/architecture-and-extension-diagrams.md`

Core modules:

- `dispatch.kujo`: CLI entrypoint and command routing
- `src/cli/cli_args.kujo`: schema-driven CLI argument parsing
- `src/workflows/workflow.kujo`: workflow templates and template registry
- `src/workflows/loader.kujo`: declarative JSON workflow spec loader (`--workflow-file`)
- `src/plugins/builtin_plugins.kujo`: built-in plugin registry applied via `--plugin`
- `src/cli/output.kujo`: CLI output, version, and contract-metadata helpers
- `src/core/runner.kujo`: orchestration engine entrypoint
- `src/core/routing.kujo`: deterministic route filtering, ranking, evaluation, and fallback policy
- `src/agents/agent.kujo`: agent execution entrypoint and handler registry mapping
- `src/tools/tool.kujo`: tool registry, payload adapters, and tool invocation entrypoint
- `src/tools/source_lookup.kujo`: source search and lookup handlers
- `src/tools/content_processing.kujo`: claim/citation/report/timestamp handlers
- `src/tools/reliability_tools.kujo`: reliability simulation handlers
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

- All implementation modules live under `src/`, including the tool handler layer (`src/tools/`).
- Root-level runtime entry scripts are limited to `dispatch.kujo` (CLI entrypoint), `sdk_adapter.kujo` (imported bridge invoker), and `bridge_chat.kujo` (spawned from `AI_SDK_PATH`).
- New development should target `src/` modules directly.

## External AI SDK Integration (AI Chat Style)

Dispatch uses the same pattern as `ai-chat`:

1. Dispatch does not vendor `ai_sdk.kujo` or `providers.kujo`.
2. `sdk_adapter.kujo` invokes a bridge process.
3. The bridge runs with `AI_SDK_PATH` as module root and imports shared SDK modules from that external project.

This keeps SDK behavior centralized in one repository (`ai-sdk`) while allowing Dispatch to remain lightweight.

The bridge forwards AI SDK structured-output controls (`response_format`, `structured_output_schema`, and `structured_output_retryable`) when callers provide them. This keeps JSON-mode and schema validation policy in the SDK instead of reimplementing it in Dispatch.

## Deterministic Agent And Model Routing

Routing is opt-in. Workflows without `routing.enabled: true` retain their configured
agent and model exactly. An enabled workflow supplies a versioned AI SDK model
catalog, workflow defaults, and optional step constraints. Dispatch validates the
catalog hash, rejects candidates that violate hard constraints, and applies a
stable quality-first ordering to the remainder. It persists the complete decision,
candidate rejections, attempts, catalog provenance, and evaluation outcome before
the model call.

Dispatch owns policy and run decisions. AI SDK owns provider/model catalog metadata.
Agents SDK defines the compatible agent vocabulary (`handler_id`, versioned
`execution_contract`, capabilities, model candidates, and risk metadata). Agent
substitution is permitted only when enabled and handler-compatible or when the
execution contracts match exactly.

On resume, Dispatch reuses the persisted route. It will not silently reroute if the
catalog, model, agent, handler, execution contract, or plugin that supplied a route
is unavailable. Same-route retries remain distinct from bounded fallback to a new
route. Provider failures, evaluation failures, and fallback eligibility are
recorded as route lifecycle trace events.

Run the offline example without credentials:

```bash
kujo run dispatch.kujo demo "Routing review" \
  --workflow-file examples/workflows/routed-review.json \
  --yes --non-interactive
```

The example is intentionally fixture-backed. `state.json`, `report.json`, the
`inspect --json` envelope, and the runner result metadata expose `route_decisions`
and `route_attempts`. Secrets and raw provider output remain subject to Dispatch's
existing artifact redaction policy.

Minimal workflow routing shape (the catalog fields and hash should come from AI
SDK's `create_model_catalog`/`provider_model_catalog`, not a copied routing table):

```json
{
  "routing": {
    "enabled": true,
    "policy_version": "1.0.0",
    "objective": "quality_first",
    "allow_agent_substitution": false,
    "constraints": {"quality_floor": "standard"},
    "fallback": {"max_fallbacks": 1, "max_evaluation_retries": 1},
    "model_catalog": {"schema_name": "ai-sdk-model-catalog", "schema_version": "1.0.0", "id": "approved", "version": "1", "catalog_hash": "...", "models": []}
  },
  "steps": [{
    "id": "write",
    "type": "agent",
    "agent_id": "writer",
    "routing": {"constraints": {"allowed_providers": ["openai"], "max_latency_ms": 2000}},
    "evaluation": {"required_fields": ["summary"], "on_failure": "upgrade_model"}
  }]
}
```

## Prerequisites

- Kujo CLI/runtime installed for local fixture runs
- Local clone of `ai-sdk` only for live SDK integration
- `dispatch` checked out locally

## Quick Start

The default path is offline and fixture-backed, so it is safe to run without provider credentials:

```bash
cd /path/to/kujo-dispatch

kujo run dispatch.kujo demo "How do AI agent workflows differ from chatbots?" --yes --non-interactive
```

Dispatch runs on the default Kujo bytecode VM, which executes cleanly with no diagnostic output. The `--interpreter` flag (tree-walking interpreter) is supported for debugging but prints type-checker warnings to stderr; prefer the default VM path shown above for production and automation.

Expected output shape:

```text
Run ID: run-...
Status: completed
Run Directory: outputs/run-...
Report: outputs/run-.../report.md
State: outputs/run-.../state.json
Trace: outputs/run-.../trace.json
```

Dispatch child bridge calls use the installed `kujo` command by default; set `AI_SDK_PATH` only when validating live SDK behavior.

For a full offline tour (approval gate, resume, signed bundle export/import, a user-authored workflow, plugins, and event sinks), see `examples/quickstart-walkthrough.md`. Performance harnesses live in `docs/benchmarks.md`.

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
| `DISPATCH_BUNDLE_SIGNING_KEY_ID` | No | `default` | Key id label recorded in signed bundles, enabling key rotation |
| `DISPATCH_BUNDLE_SIGNING_KEYS` | No | empty | Trusted verification key set (`id1=key1,id2=key2`) used during signature verification for rotation windows |
| `DISPATCH_ALLOW_ANY_WEBHOOK_SINK` | No | `false` | Allows absolute or otherwise unrestricted `--webhook-sink` paths when explicitly set to `true` |
| `DISPATCH_SDK_TIMEOUT_MS` | No | `240000` | Timeout in milliseconds for live SDK bridge subprocess calls |
| `DISPATCH_STATE_MAX_BYTES` | No | `5242880` | `state.json` size budget; `doctor` flags runs whose state exceeds it |
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
kujo run dispatch.kujo demo "Research topic" [--config config.json] [--workflow research-report] [--workflow-file my-workflow.json] [--input-json '{"repo":"x"}'] [--plugin sample] [--policy-profile staging] [--tags prod,project-a] [--yes] [--non-interactive] [--output-root outputs] [--allow-tools timestamp_tool,citation_formatter] [--deny-tools flaky_reliability_tool] [--webhook-sink path.jsonl] [--webhook-url https-url] [--cancel-after-step step-id] [--trace-max-events 400] [--trace-max-payload-chars 2400]
kujo run dispatch.kujo show <run-id> [--output-root outputs] [--json]
kujo run dispatch.kujo inspect <run-id> [--output-root outputs] [--json]
kujo run dispatch.kujo resume <run-id> [--config config.json] [--workflow research-report] [--policy-profile staging] [--yes] [--non-interactive] [--output-root outputs] [--allow-tools timestamp_tool,citation_formatter] [--deny-tools flaky_reliability_tool] [--webhook-sink path.jsonl] [--webhook-url https-url] [--cancel-after-step step-id] [--trace-max-events 400] [--trace-max-payload-chars 2400]
kujo run dispatch.kujo templates [--json]
kujo run dispatch.kujo runs [--output-root outputs] [--status completed] [--workflow research] [--topic ai] [--tags prod] [--issues-only] [--limit 50] [--offset 0] [--json] [--diagnostics]
kujo run dispatch.kujo doctor [--output-root outputs] [--write] [--run-ids run-1,run-2] [--recent-count 20] [--json] [--strict-mutations] [--confirm-mutation]
kujo run dispatch.kujo cleanup [--output-root outputs] [--status completed] [--older-than-hours 24] [--max-count 50] [--apply] [--json] [--strict-mutations] [--confirm-mutation]
kujo run dispatch.kujo export-run <run-id> --bundle-path bundles/run.json [--output-root outputs] [--sign-bundle] [--signing-key key]
kujo run dispatch.kujo import-run --bundle-path bundles/run.json [--output-root outputs] [--verify-bundle-signature] [--signing-key key] [--strict-mutations] [--confirm-mutation]
```

When strict mutation mode is enabled (`--strict-mutations` or `DISPATCH_STRICT_MUTATION_MODE=true`), `doctor --write`, `cleanup --apply`, and `import-run` are blocked unless `--confirm-mutation` is present or `DISPATCH_MUTATION_CONFIRM=true` is set.

`doctor` supports incremental scope via `--run-ids` (explicit run selection) and `--recent-count` (most recently updated runs only), which helps reduce scan latency on large catalogs.

`show --json`, `inspect --json`, and `doctor --json` emit consistent machine-readable envelopes with shared metadata keys (`command`, `ok`, and `output_root`) plus command-specific payload data.

`runs --json --diagnostics` includes index diagnostics metadata such as `index_fallback_count` and `index_rebuild_count` to surface catalog/index health quickly.

`demo --tags` stores normalized per-run metadata labels and `runs --tags` filters to runs that include all requested tags.

Dispatch is template-driven: `demo` and `resume` select workflows by template ID through `--workflow <template-id>`. Direct Spec-file ingestion is not part of the verified command surface in this repository.

Dispatch supports `help`/`--help` and `version`/`--version`. The version is sourced from `kennel.toml` (`[package].version`).

Steps can be marked `optional` in a workflow template. When an optional step fails (including a tool blocked by policy), Dispatch records a `step_skipped` trace event and continues the run instead of failing it. The built-in `retry_probe` step is optional, so the `research-report` and `crud-reliability` templates complete even when `flaky_reliability_tool` is denied (for example under the `staging`/`production` policy profiles).

`demo` and `resume` accept lifecycle observability and control flags:

- `--webhook-sink <path.jsonl>` appends lifecycle events (one JSON object per line) to a local sink file. Absolute/traversal paths are blocked unless `DISPATCH_ALLOW_ANY_WEBHOOK_SINK=true`.
- `--webhook-url <https-url>` best-effort POSTs each lifecycle event to an HTTP endpoint. Delivery failures never fail the run; the local sink and trace remain the source of truth.
- `--cancel-after-step <step-id>` cooperatively cancels the run after the named step completes, producing a `cancelled` lifecycle state.

Tool and agent steps can declare an `idempotency_key`; a keyed result is cached in run state and reused on resume instead of re-executing the side effect.

## Common Usage Flows

### 1. Run a workflow interactively

```bash
kujo run dispatch.kujo demo "How do AI workflows improve reliability?"
```

### 2. Run non-interactive and pause at approval

```bash
kujo run dispatch.kujo demo "How do AI workflows improve reliability?" --non-interactive
```

### 3. Resume a paused run

```bash
kujo run dispatch.kujo resume <run-id> --yes
kujo run dispatch.kujo resume-decision decision.json --output-root outputs --non-interactive
```

### 4. Inspect runs and diagnostics

```bash
kujo run dispatch.kujo runs --json
kujo run dispatch.kujo runs --tags env:prod,project:dispatch --json
kujo run dispatch.kujo inspect <run-id> --json
kujo run dispatch.kujo doctor --json
```

### 4b. Persist doctor repairs to state

```bash
kujo run dispatch.kujo doctor --write
```

### 5. Run the CRUD reliability template

```bash
kujo run dispatch.kujo demo "Orders API reliability" --workflow crud-reliability --yes
```

### 6. Use config-file driven runs with CLI precedence

```bash
kujo run dispatch.kujo demo --config ./dispatch-config.json --decision approve
```

### 3b. Inspect available workflow templates

```bash
kujo run dispatch.kujo templates
kujo run dispatch.kujo templates --json
```

### 6b. Enforce tool authorization policy from CLI

```bash
kujo run dispatch.kujo demo "Policy constrained run" --yes --allow-tools timestamp_tool,citation_formatter --deny-tools flaky_reliability_tool
```

### 7. Export and import run bundles

```bash
kujo run dispatch.kujo export-run <run-id> --bundle-path bundles/run.json --sign-bundle
kujo run dispatch.kujo import-run --bundle-path bundles/run.json --output-root outputs-imported --verify-bundle-signature
```

When signature mode is enabled, Dispatch writes `signature` metadata into the bundle and verifies it during import. Verification failures return deterministic `invalid_bundle_signature` errors.

Signatures use a keyed SHA-256 MAC (`dispatch-signature-v2`): each artifact is hashed with `sha256`, the per-artifact digests are bound to the run id, and the combined value is signed with a nested keyed hash so the secret key never appears in the persisted bundle and any artifact tampering invalidates the signature. The signing key is required for both signing and verification.

Bundles record a `key_id` (default `default`, or `DISPATCH_BUNDLE_SIGNING_KEY_ID`/`--signing-key-id`). During a key rotation window, verification can trust multiple keys at once via `DISPATCH_BUNDLE_SIGNING_KEYS` (`id1=key1,id2=key2`): the verifier selects the key matching the bundle's `key_id`, falling back to the single signing key when no set entry matches.

Prefer `DISPATCH_BUNDLE_SIGNING_KEY` (env) over `--signing-key` (CLI flag) so the secret does not appear in process arguments or shell history.

`--signing-key` can be passed directly, but using `DISPATCH_BUNDLE_SIGNING_KEY` is recommended for non-interactive and managed environments.

## Demo Workflow Included

Built-in workflow templates:

- `research-report`: General evidence-backed research report workflow
- `crud-reliability`: CRUD API reliability review focused on contract checks, migration safety, auth checks, and error-budget notes
- `approval-handoff`: Minimal human-in-the-loop workflow (gather, pause at an approval gate, finalize); avoids the flaky reliability tool so it runs cleanly under the `staging` and `production` policy profiles

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

All run artifacts (`state.json`, `trace.json`, `trace.md`, `report.*`, the run index, and signed bundles) are written atomically: content is staged to a temporary file and renamed into place, so a crash or a concurrent reader never observes a partially written file. The run index (`.dispatch-run-index.json`) is a cache that can be rebuilt from per-run `state.json` files; `runs` and `doctor` fall back to scanning state when the index is missing or malformed. For strict isolation under heavy concurrency, use a dedicated `--output-root` per service.

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
kujo test-run tests/sdk_adapter_tests.kujo -v
kujo test-run tests/policy_precedence_tests.kujo -v
kujo test-run tests/dispatch_tests.kujo -v
```

Equivalent local validation:

```bash
export DISPATCH_OFFLINE_FIXTURE=true

kujo test-run tests/sdk_adapter_tests.kujo -v
kujo test-run tests/policy_precedence_tests.kujo -v
kujo test-run tests/dispatch_tests.kujo -v
```

## Improvement Checklist

Track prioritized hardening, architecture cleanup, extensibility work, and testing backlog in:

- `docs/dispatch-next-session-checklist-v4.md`
- `docs/dispatch-next-session-checklist-v3.md`
- `docs/dispatch-next-session-checklist-v2.md`

`docs/dispatch-next-session-checklist-v4.md` is the active next-session backlog for workflow-authoring, extensibility wiring, reliability, and presentation work.

`docs/dispatch-next-session-checklist-v3.md` and `-v2.md` are retained as implementation audit trails for the enterprise hardening milestones.

`docs/dispatch-next-session-checklist.md` is kept as historical context from the earliest backlog phase.

A deeper external review and a workflow-builder guide live under `review/`.

## Agent And Contributor Guidance

For AI-agent and contributor search hygiene, canonical example labels, generated-path exclusions, and cleanup preferences, see:

- `AGENTS.md`

Prioritize copyable examples over tests: examples should model the most token-efficient idioms we want agents to imitate.

Exclude generated/bulk paths from the main sweep unless the task explicitly targets them; document the search exclusions you used.

## Release Process

Release governance artifacts:

- `CHANGELOG.md`: changelog format and versioning policy.
- `docs/release-checklist.md`: step-by-step release gate and tagging checklist.

Release versions are sourced from `kennel.toml` (`[package].version`) and should be updated together with the corresponding changelog release section. The repository also keeps a `kujo.toml` toolchain manifest; its `[package].version` must match `kennel.toml`, and CI fails the build on a mismatch.

For v1.0 pre-release walkthroughs, prefer the repository-root invocation pattern to avoid shell cwd drift:

```bash
pushd "$(git rev-parse --show-toplevel)"
export DISPATCH_OFFLINE_FIXTURE=true

kujo test-run tests/sdk_adapter_tests.kujo -v
kujo test-run tests/policy_precedence_tests.kujo -v
kujo test-run tests/dispatch_tests.kujo -v
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
kujo run dispatch.kujo demo "Development profile smoke" --policy-profile development --yes --non-interactive --decision approve --output-root tests/tmp/profile-dev-outputs

# Staging
export DISPATCH_POLICY_PROFILE=staging
export DISPATCH_STRICT_MUTATION_MODE=true
export DISPATCH_MUTATION_CONFIRM=false
kujo run dispatch.kujo runs --output-root tests/tmp/profile-staging-outputs --json --diagnostics

# Production
export DISPATCH_POLICY_PROFILE=production
export DISPATCH_STRICT_MUTATION_MODE=true
export DISPATCH_MUTATION_CONFIRM=true
kujo run dispatch.kujo doctor --output-root tests/tmp/profile-prod-outputs --strict-mutations --confirm-mutation
```

For environment hardening rationale and rollout policy, use the full deployment guide in `docs/enterprise-deployment.md`.

## Extension Guide

Dispatch is designed to be extended safely and incrementally:

- Add new workflow templates in `src/workflows/workflow.kujo`
- Add new tool handlers in `src/tools/` and register them in `src/tools/tool.kujo` with per-tool payload adapters instead of runner-specific branching
- Register project-specific plugins via `src/core/plugins.kujo` to inject tools and agents without core edits
- Extend decision policies in `src/core/approval.kujo` and `src/core/retry.kujo`
- Add reporting outputs in `src/core/report.kujo`
- Integrate observability sinks from trace events

## Troubleshooting

### AI SDK not found

Set `AI_SDK_PATH` to a directory that contains both `ai_sdk.kujo` and `providers.kujo`.

### Bridge execution errors

- Verify `KUJO_BIN` resolves to a valid Kujo command, usually `kujo`.
- Verify `DISPATCH_SDK_BRIDGE_SCRIPT` (if set) points to a valid file.
- Run with `--interpreter` during development.
- Bridge parse and execution failures redact raw stdout/stderr by default; set `DISPATCH_SDK_DEBUG_OUTPUT=true` only for local debugging.

### Sources validation errors in demo mode

Ensure your sources directory exists and includes markdown fixtures (`.md` files).

If you intentionally need a different sources directory, set `DISPATCH_ALLOW_ANY_SOURCES_DIR=true` explicitly.

### Type-checker warnings on stderr

The default VM run path (`kujo run dispatch.kujo ...`) is warning-free. The optional `--interpreter` (tree-walking) mode runs a best-effort type checker that prints `[KUJORUN001]` warnings to stderr while still executing correctly; these are diagnostics from the interpreter, not Dispatch failures. Prefer the default VM path for clean output, and treat command exit status and functional output as the primary success signal when using `--interpreter`.

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
      source_lookup.kujo
      content_processing.kujo
      reliability_tools.kujo
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
  sdk_adapter.kujo
  bridge_chat.kujo
  examples/
    research-report/
      sources/
  outputs/
  tests/
    dispatch_tests.kujo
```
