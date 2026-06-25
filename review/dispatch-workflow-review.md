# Dispatch Workflow Review

> Review date: 2026-06-24
> Reviewer scope: deep repo review + workflow-design extraction
> Verification method: static reading of every module under `src/` plus offline CLI runs using a real Kujo runtime (`kujo 1.0.0`) with `DISPATCH_OFFLINE_FIXTURE=true`.

All major claims below are grounded in file paths, functions, observed CLI output, or generated artifacts. Where I could not verify something, it is marked **Unverified**.

> **Update (post-review, same session):** Several gaps below were addressed immediately after this review and are now in the codebase. The original analysis is preserved for provenance; resolved items are flagged inline.
> - **Gap 1 (P0) — RESOLVED:** steps now support an `optional` flag; an optional step that fails or is policy-denied emits a `step_skipped` trace event and the run continues. The built-in `retry_probe` step is marked optional, so `research-report`/`crud-reliability` now complete under `staging`/`prod` profiles (verified: `demo --policy-profile prod` → `completed`).
> - **Gap 2 (P1) — PARTIALLY RESOLVED:** `--webhook-sink <path.jsonl>` is now wired into `demo`/`resume`, so lifecycle hooks are reachable from the CLI. Plugin injection and the `event_hook` callback remain library-only.
> - **Gap 10 (P2) — RESOLVED:** `version` / `--version` implemented (reads `kennel.toml`).
> - **Gap 11 (P2) — PARTIALLY ADDRESSED:** a third template, `approval-handoff`, was added (6 steps, no flaky tool) — a smaller/distinct shape, though still research-derived.

---

## Executive Summary

Dispatch is a **single-process, sequential workflow-orchestration engine** written in Kujo. It takes a topic string, expands a built-in workflow *template* into a fixed list of typed steps (agent / tool / approval / handoff / report), executes them in order with retry + approval semantics, and writes durable, resumable run artifacts (`state.json`, `trace.json`, `trace.md`, `report.md`, `report.json`).

Its real strength is the **Control layer**: run-state persistence, resumable approval gates, run cataloging/filtering, health diagnostics (`doctor`), retention cleanup, tool authorization policy, mutation auditing, and import/export bundles. That layer is genuinely implemented, tested (61 tests in [tests/dispatch_tests.kujo](../tests/dispatch_tests.kujo)), and runs fully offline.

Its weakness is the **intelligence/authoring layer**. "Agents" are hardcoded Kujo functions keyed by `agent_id` ([src/agents/agent.kujo](../src/agents/agent.kujo)) that emit deterministic synthetic output; the live model path is optional and credential-gated. New workflows cannot be authored from data/config — they require editing Kujo source. And several advertised capabilities (lifecycle hooks, webhook sinks, plugins, parallel execution, cancellation) are implemented in the engine and unit-tested **but not wired into the CLI**, so they are library-only today.

**Verdict:** Dispatch is a strong *control-plane primitive* and an excellent *reference implementation of reliable orchestration patterns*, but it is **not yet a general workflow-authoring platform**. Treat it as "usable but rough" for building net-new workflows (see [§CLI And Developer Experience](#cli-and-developer-experience)).

---

## What Dispatch Does Today

| Capability | Status | Evidence |
|---|---|---|
| Expand built-in templates into typed steps | ✅ Implemented | [workflow.kujo](../src/workflows/workflow.kujo), `templates` CLI |
| Sequential step execution with 5 step types | ✅ Implemented | `execute_step` in [runner.kujo:445](../src/core/runner.kujo) |
| Retry policy (linear/exponential, retry_on_codes) | ✅ Implemented + tested | [retry.kujo](../src/core/retry.kujo), test L218 |
| Deterministic & random jitter | ✅ Implemented + tested | `compute_delay` [retry.kujo:3](../src/core/retry.kujo), test L248 |
| Human approval gate (pause/resume) | ✅ Implemented + verified | `execute_approval_step` [runner.kujo:364](../src/core/runner.kujo); ran pause→resume offline |
| Approval decisions: approved / rejected / request_changes | ✅ Implemented | [approval.kujo](../src/core/approval.kujo), `normalize_decision` |
| `depends_on` DAG dependency gating | ✅ Implemented + tested | `step_dependencies_satisfied` [runner.kujo:206](../src/core/runner.kujo), test L1155 |
| Per-step input/output schema validation | ✅ Implemented + tested | `validate_step_schema` [runner.kujo:128](../src/core/runner.kujo), test L373 |
| Per-step timeout | ⚠️ Partial (post-hoc only) | [runner.kujo:556](../src/core/runner.kujo) — see [§Reliability](#reliability--state--resume-behavior) |
| Cancellation lifecycle | ⚠️ Implemented, not CLI-reachable | `cancellation_requested` [runner.kujo:177](../src/core/runner.kujo); options never set by CLI |
| Run persistence + resume | ✅ Implemented + verified | [state.kujo](../src/core/state.kujo), `persist_run_state`/`load_run_state` |
| Run catalog/filter (`runs --status/--topic/--tags/--issues-only/--json`) | ✅ Implemented + verified | `run_runs` in [dispatch.kujo](../dispatch.kujo) |
| `doctor` diagnostics + `--write` repair | ✅ Implemented + verified | `doctor_runs` [state.kujo:1063](../src/core/state.kujo) |
| `cleanup` dry-run/apply retention | ✅ Implemented + tested | `prune_runs` [state.kujo:835](../src/core/state.kujo), test L1089 |
| Tool allow/deny + named profiles | ✅ Implemented + verified | [tool_policy.kujo](../src/core/tool_policy.kujo) |
| Mutation audit log + rotation | ✅ Implemented + tested | `append_mutation_audit_record` [state.kujo:245](../src/core/state.kujo) |
| Export/import run bundles + "signing" | ⚠️ Implemented; weak crypto | `export_run_bundle`/`import_run_bundle` [state.kujo:1212](../src/core/state.kujo) — see [§Reliability](#reliability--state--resume-behavior) |
| Trace event/payload limits + truncation | ✅ Implemented + tested | [trace.kujo](../src/core/trace.kujo), test L1833 |
| Sensitive-field redaction before write | ✅ Implemented + tested | `redact_sensitive_data` [utils.kujo:149](../src/core/utils.kujo), test L1293 |
| Lifecycle hooks (callback + webhook sink) | ⚠️ Implemented + tested, **not CLI-wired** | [hooks.kujo](../src/core/hooks.kujo), test L603 |
| Plugin injection (tools + agent handlers) | ⚠️ Implemented + tested, **not CLI-wired** | [plugins.kujo](../src/core/plugins.kujo), test L908 |
| Parallel step execution | ❌ Claimed, effectively sequential | `run_workflow` [runner.kujo:695](../src/core/runner.kujo) — both branches identical |
| Live AI SDK model calls | ⚠️ Optional, credential-gated | [sdk_adapter.kujo](../sdk_adapter.kujo) → [bridge_chat.kujo](../bridge_chat.kujo) |
| `version` / `--version` | ❌ Not implemented (returns `Unknown command`) | README L173, confirmed in help routing |

### Is it a workflow engine, agent runner, or orchestration layer?

It is primarily an **orchestration + control layer over a sequential state machine**. It is *not* an agent runner in the autonomous sense — agents do not loop, plan tool calls, or decide next steps; each "agent" is a deterministic Kujo function producing fixed-shape output. The DAG/`depends_on` machinery makes it a state machine with dependency gating, but with a single linear executor (no concurrency).

### Strongest implemented capabilities

1. **Resumable approval gates** — pause to `state.json`, resume by replay. Verified end-to-end offline.
2. **Run-state durability & cataloging** — index file, filtering, diagnostics, repair.
3. **Tool authorization policy** — profile aliases + allow/deny + audit trail of denials.
4. **Artifact discipline** — schema/contract versioning, redaction, trace truncation.

### Aspirational / incomplete / repo-dependent

- **Parallel execution** — advertised ("parallel-ready scheduling") but the executor runs one step at a time; the `parallel_execution` branch is a no-op ([runner.kujo:695-699](../src/core/runner.kujo)).
- **Hooks / webhooks / plugins / cancellation** — fully coded and tested but unreachable from `dispatch.kujo` (the CLI never populates `event_hook`, `webhook_sink`, `cancel_requested`, or `parallel_execution` in the options it passes to `run_workflow`).
- **Agent intelligence** — synthetic. Verification status is assigned by `index % 4` ([agent.kujo:107-125](../src/agents/agent.kujo)), not by reading evidence.
- **Bundle "signing"** — not a real signature (see [§Reliability](#reliability--state--resume-behavior)).

---

## How Dispatch Works Internally

```
kujo run --interpreter dispatch.kujo <command> [...]
        │
        ▼
dispatch.kujo  ── route_command()
        │  parse flags via src/cli/cli_args.kujo (schema-driven)
        │  resolve tool policy via src/core/tool_policy.kujo
        ▼
create_workflow_by_template(template_id, topic, auto_approve)   # src/workflows/workflow.kujo
        │  → fixed list of typed steps + agents + tools + retry/approval config
        ▼
create_run_state(workflow, {topic}, output_root, options)       # src/core/state.kujo
        │  → run-id, run_dir, cloned steps, trace, memory; persisted immediately
        ▼
register_default_tools(sources_dir)                             # src/tools/tool.kujo
        ▼
run_workflow(workflow, run_state, tool_registry, options)       # src/core/runner.kujo
        │
        │  while steps remain (multi-pass for depends_on):
        │    ├─ cancellation check  (options-driven; CLI never sets it)
        │    ├─ dependency check    step_dependencies_satisfied()
        │    ├─ mark_step_started + build_step_input (from input_from keys)
        │    ├─ validate input schema
        │    ├─ execute_step → one of:
        │    │     agent    → run_with_retry → run_agent (handler registry)
        │    │     tool     → authorize → run_with_retry → call_tool
        │    │     approval → resolve_approval (auto / simulated / pause / interactive)
        │    │     handoff  → create_handoff (recorded in run_state.handoffs)
        │    │     report   → build_report_payload + write_report_artifacts
        │    ├─ validate output schema + post-hoc timeout check
        │    ├─ on pause   → status=paused/needs_changes, persist, RETURN
        │    ├─ on failure → status=failed, append error, finalize trace, RETURN
        │    └─ on success → store output_key into run_state.data + memory, trace, persist
        ▼
finalize: status=completed, finalize_trace, persist_run_state
        ▼
artifacts in outputs/<run-id>/: state.json, trace.json, trace.md, report.md, report.json
```

Each lifecycle stage emits a trace event and a hook event. Verified trace event counts from a real demo run: `step_started=9, step_completed=9, handoff=1, run_completed=1`.

**Resume** ([dispatch.kujo:985+](../dispatch.kujo)): reloads `state.json`, rebuilds the template fresh, then re-enters `run_workflow`. The executor skips steps already marked `completed` ([runner.kujo:515](../src/core/runner.kujo)) and continues from `current_step_index`. Completed/failed/rejected/cancelled runs refuse to resume.

---

## Workflow Lifecycle

| Stage | Where | Notes |
|---|---|---|
| CLI input | `dispatch.kujo` route_command | `demo`, `resume`, `show`, `inspect`, `runs`, `doctor`, `cleanup`, `templates`, `export-run`, `import-run`, `help` |
| Template selection | `create_workflow_by_template` | by `--workflow <template-id>`; unknown id → `missing_workflow_error` |
| Workflow definition | `create_*_workflow` | builds agents{}, tools[], steps[] in code |
| Run-state creation | `create_run_state` | persists immediately; assigns `run-<ts>-<rand>` |
| Step execution | `run_workflow` loop | sequential, dependency-gated multi-pass |
| Agent execution | `run_agent` | handler registry keyed by `agent_id` |
| Tool execution | `call_tool` | registry lookup + payload adapter + retry |
| Approval pause/resume | `execute_approval_step` / resume | persisted `status=paused`; resume replays |
| Retry | `run_with_retry` | per-step policy or workflow default |
| State persistence | `persist_run_state` | after every step; redacted |
| Trace generation | `append_trace`/`finalize_trace` | bounded events + payloads |
| Report generation | `execute_report_step` → `build_report_payload` | research-report shaped (see gap) |
| Inspection/cataloging | `runs`, `show`, `inspect`, `doctor` | JSON envelopes with `command/ok/output_root` |

**Lifecycle statuses observed/handled:** `running`, `paused`, `needs_changes`, `completed`, `failed`, `cancelled`, `rejected`, `interrupted` (the last is accepted by the `runs --status` validator [dispatch.kujo:485](../dispatch.kujo) though not produced by the core loop — **Unverified** as an emitted state).

---

## Workflow Schema / Template Anatomy

### Workflow object (`create_workflow`, [workflow.kujo:5](../src/workflows/workflow.kujo))

| Field | Type | Purpose |
|---|---|---|
| `id` | string | internal workflow id (e.g. `research_report_workflow`) |
| `name` | string | display name |
| `description` | string | shown in `templates` |
| `input_schema` | dict | validated shape of run input (e.g. requires `topic`) |
| `agents` | dict{agent_id → agent} | agent role definitions |
| `tools` | array[string] | tool names this workflow may use |
| `steps` | array[step] | ordered step list |
| `memory_config` | dict | flags: workflow_memory, agent_notes, step_output_memory, history_lookup |
| `default_retry_policy` | dict | fallback when a step has no `retry_policy` |
| `approval_config` | dict | `{auto_approve: bool}` |
| `output_schema` | dict | required keys for final output |

### Step object (`create_step`, [step.kujo:3](../src/core/step.kujo))

| Field | Default | Purpose |
|---|---|---|
| `id`, `name`, `type` | — | `type` ∈ {`agent`,`tool`,`approval`,`handoff`,`report`} |
| `status` | `pending` | → running → completed/failed/paused |
| `agent_id` | `""` | for agent steps |
| `tool_name` | `""` | for tool steps |
| `input_from` | `[]` | keys pulled from `run_state.data` (+ literal `"input"`) |
| `depends_on` | `[]` | DAG dependency ids (gates scheduling) |
| `output_key` | `""` | where output is stored in `run_state.data` |
| `input_schema` / `output_schema` | `null` | per-step validation |
| `timeout_ms` | `0` | post-hoc timeout (0 = none) |
| `retry_policy` | `null` | per-step override |
| `approval_required` | `false` | approval flag |
| `approval_gate` | `{}` | `{reason, summary}` |
| `handoff` | `{}` | `{source_agent, target_agent, reason, expected_next_action}` |
| `config`, `input`, `output`, `started_at`, `finished_at`, `error`, `attempts` | runtime | populated during execution |

### Agent role (`create_research_report_workflow` agents, [workflow.kujo:23](../src/workflows/workflow.kujo))

`id, name, purpose, instructions, model{provider,model}, tools[], handoff_targets[], output_schema, guardrails[]`. Note: `instructions`, `guardrails`, `model` are passed to the live SDK bridge but are **ignored by the offline deterministic handlers** — they shape the prompt only when a live model is used.

### Tool (`create_tool`, [tool.kujo:7](../src/tools/tool.kujo))

`name, description, input_schema, output_schema, handler, payload_adapter`. The `payload_adapter` maps the generic `step_input` into the tool's expected shape — this is the extension idiom that avoids runner-specific branching.

### Retry policy

`{max_attempts, base_delay_ms, max_delay_ms, strategy ∈ {none,linear,exponential}, retry_on_codes[], jitter ∈ {none,deterministic,random}, jitter_ms, jitter_seed}`.

### Validation behavior

`validate_schema_value` ([runner.kujo:71](../src/core/runner.kujo)) checks `type` (with `number`→int|float), `required` keys on dicts, recursive `properties`, and `array` `items`. Failure produces `step_input_schema_validation_failed` / `step_output_schema_validation_failed` (non-retryable). The built-in templates set step-level `input_schema`/`output_schema` to `null`, so per-step validation is opt-in.

---

## How To Build A New Workflow

Templates are **code, not config**. To add one:

1. **Define the builder** in [src/workflows/workflow.kujo](../src/workflows/workflow.kujo): a `func create_<x>_workflow(topic, auto_approve)` returning `create_workflow({...})` with `agents`, `tools`, `steps`.
2. **Register it** in `create_workflow_templates()` (map `template-id → builder`) **and** add the id to `template_order` in `list_workflow_templates()` so it shows in `templates`.
3. **Steps** — build with `create_step(id, name, type, config)`; wire data flow via `input_from` / `output_key`; express order via list position and/or `depends_on`.
4. **Agents** — if you reuse `planner/research/verification/writer`, no handler work is needed. If you add a new `agent_id`, you **must** add a handler in `register_default_agent_handlers()` ([agent.kujo:194](../src/agents/agent.kujo)) or inject it via a plugin's `agent_handlers` (library-only path) — otherwise the run fails with `No implementation exists for this agent id`.
5. **Tools** — reference existing tool names, or register new tools in `register_default_tools()` ([tool.kujo:78](../src/tools/tool.kujo)) with a `payload_adapter`.
6. **Approval gate** — add a step of `type:"approval"` with `approval_required:true` and an `approval_gate{reason,summary}`.
7. **Retries** — add `retry_policy` to the step config, or rely on the workflow `default_retry_policy`.
8. **Outputs** — include a final `type:"report"` step. ⚠️ `build_report_payload` ([report.kujo:23](../src/core/report.kujo)) is **hardcoded to the research-report shape** (title "Research Report Workflow Output", reads `verification`/`claims`/`sources`/`report` data keys). A new workflow with different data keys will produce a sparse/mislabeled report unless you extend `report.kujo`.
9. **Test locally** — see [§Local Test Pattern in the builder guide](dispatch-workflow-builder-guide.md#local-test-pattern).

See the **New Workflow Checklist** in [dispatch-workflow-builder-guide.md](dispatch-workflow-builder-guide.md#new-workflow-checklist).

---

## Existing Templates Reviewed

`templates --json` confirms two:

| template-id | workflow_id | steps | approvals | tools |
|---|---|---|---|---|
| `research-report` | research_report_workflow | 9 | 1 | 7 |
| `crud-reliability` | crud_reliability_workflow | 9 | 1 | 7 |

Step sequence (both): `plan → gather_sources → retry_probe → extract_claims → verify_claims → handoff_writer → approval_gate → write_report → finalize`.

`crud-reliability` is **not a structurally different workflow** — `create_crud_reliability_workflow` ([workflow.kujo:178](../src/workflows/workflow.kujo)) clones the research workflow and only rewrites agent `instructions`/`guardrails`/`description`. Same steps, same tools, same deterministic handlers. So today there is effectively **one workflow shape** with two prompt skins. Both ran to `completed` offline; both **fail** under `staging`/`prod` policy profiles (see gap below).

---

## Extension Points

| Extension | Where | How used | Guardrails | Risk / Limitation |
|---|---|---|---|---|
| New template | [workflow.kujo](../src/workflows/workflow.kujo) | add builder + register | template introspection auto-counts steps/approvals/tools | requires source edit + recompile-by-reinterpret; no config-driven authoring |
| New tool | [tool.kujo](../src/tools/tool.kujo) `register_default_tools` | `create_tool` + `payload_adapter` | input/output schema fields exist | schemas not enforced at tool boundary by default; handler is trusted code |
| New agent handler | [agent.kujo](../src/agents/agent.kujo) `register_default_agent_handlers` | map `agent_id → func` | missing handler → clean error | every new role needs code |
| Plugin (tools + agent handlers) | [plugins.kujo](../src/core/plugins.kujo) | `create_plugin` + `apply_plugins_to_runtime` | injects `__agent_handlers`, dedupes tool names | **not invoked anywhere in `dispatch.kujo`** — library/test only |
| Tool policy profile | [tool_policy.kujo](../src/core/tool_policy.kujo) | alias + allow/deny; CLI > config > env | explicit allow/deny override profile | profiles are hardcoded; deny is hard-fail not skip |
| Lifecycle hooks | [hooks.kujo](../src/core/hooks.kujo) | `event_hook` callback + `webhook_sink` file | webhook appends JSONL | **not CLI-wired**; webhook is a local file append, not an HTTP sink |
| External SDK bridge | [sdk_adapter.kujo](../sdk_adapter.kujo) / [bridge_chat.kujo](../bridge_chat.kujo) | spawns `kujo` in `AI_SDK_PATH` | stdout/stderr redacted by default | requires external `ai-sdk` checkout + creds; default handlers ignore model output |
| Custom reports | [report.kujo](../src/core/report.kujo) | edit `build_report_payload` | contract fields auto-added | single hardcoded shape |
| Custom trace events | [trace.kujo](../src/core/trace.kujo) via `append_trace` | engine calls only | bounded by limits | no public step-level "emit custom event" API for tools |
| Import/export bundles | [state.kujo](../src/core/state.kujo) | `export-run`/`import-run` | optional "signature" + strict-mutation gating | signature is non-cryptographic (see below) |

**Headline extensibility gap:** the three most "platform-like" extension points — **plugins, hooks, webhook sinks** — are implemented and unit-tested but **cannot be activated through the shipped CLI**. Using them requires writing your own Kujo entrypoint that calls `run_workflow` with the right options. The architecture diagram ([docs/architecture-and-extension-diagrams.md](../docs/architecture-and-extension-diagrams.md)) shows `runner → hooks` and a Plugin extension surface, which overstates current CLI reach.

---

## Reliability / State / Resume Behavior

| Feature | Behavior | Assessment |
|---|---|---|
| Retry | `run_with_retry`: retries when `error.retryable` or `error.code ∈ retry_on_codes`; sleeps `compute_delay` between attempts; emits `attempt_records` | Solid. Verified: flaky tool fails attempt 1, succeeds attempt 2 (`attempts:2` in state). |
| Jitter | deterministic (`(seed + attempt*31) % (jitter_ms+1)`) or `random_int` | Works; deterministic mode is reproducible (tested). |
| Lifecycle states | paused/needs_changes/completed/failed/cancelled/rejected | Verified pause→resume→completed and rejected→failed paths. |
| Timeout | **post-hoc**: compares elapsed against `timeout_ms` *after* the step returns ([runner.kujo:556](../src/core/runner.kujo)) | ⚠️ Cannot interrupt a hung step — it only flags an overrun after completion. Not a real watchdog. |
| Cancellation | checks `cancel_requested` / `cancel_after_step_id` in options | ⚠️ Implemented but CLI never sets these → unreachable in normal use. |
| State persistence | written after every step; redacted; index upserted | Strong; durable and resumable. |
| Resume | rebuild template + replay, skipping completed steps | Verified. Caveat: side-effecting tools without idempotency could double-run on a re-executed (non-completed) step. |
| `doctor` / repair | detects index/trace/status inconsistencies, missing artifacts; `--write` persists repairs; incremental via `--run-ids`/`--recent-count` | Good. `detect_run_issues` covers the common drift cases. |
| Cleanup safety | dry-run default, `--apply` to act; strict-mutation gating | Good defaults. |
| Strict mutation mode | blocks `doctor --write`, `cleanup --apply`, `import-run` unless `--confirm-mutation`/env | Good; audited. |
| Import/export "signing" | `build_bundle_signature_value` = `join` of **character/structure counts + 32-char prefix/suffix + the signing key in plaintext** ([state.kujo:1163](../src/core/state.kujo)) | ⚠️ **Not a cryptographic signature.** It is a tamper-evidence checksum, trivially forgeable by anyone who knows the (plaintext-embedded) scheme. Do not rely on it for authenticity across trust boundaries. |
| Trace limits | `DISPATCH_TRACE_MAX_EVENTS` (400) drops excess events; `DISPATCH_TRACE_MAX_PAYLOAD_CHARS` (2400) truncates payloads; both counted in `truncated{}` | Good; bounded artifacts. |
| Redaction | `redact_sensitive_data` masks keys containing api_key/token/authorization/secret/password before write | Good; applied to state, trace, report. |
| Tool allow/deny | deny → **hard run failure**, not a skip | ⚠️ See footgun below. |

### Demonstrated footgun (P1)

The built-in templates include a `retry_probe` step that hard-depends on `flaky_reliability_tool`. The `staging` and `prod` policy profiles **deny** `flaky_reliability_tool`. Result, verified live:

```
demo --policy-profile prod     → Status: failed  (tool_execution_denied: flaky_reliability_tool)
demo --policy-profile staging  → Status: failed  (tool_execution_denied: flaky_reliability_tool)
```

So the shipped templates cannot complete under the shipped "production" profile. Policy denial is hard-fail with no graceful-skip option, and the demo template embeds a tool that the prod profile blocks. This is a contradiction between the template set and the profile set.

### Fragile / under-tested

- Timeout and cancellation are effectively decorative in the CLI path.
- `parallel_execution` is dead-code branching (both arms identical).
- Bundle signature security is overstated by naming.

---

## CLI And Developer Experience

**Rating: Usable but rough.**

What's good:
- Fully offline, no credentials, deterministic — verified every documented offline command runs.
- Consistent JSON envelopes (`command/ok/output_root`) make automation easy.
- `templates`, `runs`, `doctor`, `inspect` give real operational visibility.
- Schema-driven flag parser ([cli_args.kujo](../src/cli/cli_args.kujo)) with clear missing-value/unknown-flag/required errors (tested).
- 61 offline tests; CI gate runs three suites.
- Strong env-var configuration surface and safe-by-default path constraints.

What's rough:
- **Type-checker noise:** every run prints a wall of `[RUFRUN001]` type warnings to stderr before real output. The README tells you to ignore them, but it badly hurts first-run confidence. (Functional output is correct; exit codes are reliable.)
- **No config-driven authoring:** new workflows require editing Kujo source and re-interpreting.
- **Report shape is hardcoded** to research-report; other workflows get mislabeled output.
- **Headline features unreachable:** hooks/webhooks/plugins/parallel/cancel are not exposed by the CLI.
- **Profile/template mismatch** makes the prod profile fail the demo (above).
- **`version` missing** despite being a near-universal expectation.
- **`crud-reliability` adds no structural variety** — only prompt text differs.

For a developer trying to *build* a workflow, the experience is: read Kujo source, copy a builder, edit step lists, re-run. For a developer trying to *operate* runs, the experience is genuinely good.

---

## Workflow Patterns Dispatch Can Support Today

| Pattern | Supported today? | Enabling modules | What's missing |
|---|---|---|---|
| Research report | ✅ Yes (built-in) | workflow/agent/tool/report | live evidence (uses fixtures) |
| CRUD reliability review | ✅ Yes (built-in skin) | same as above | structural difference from research |
| Human approval gate | ✅ Yes (verified) | approval + state resume | richer reviewer UX |
| Resumable paused workflow | ✅ Yes (verified) | state persist/load | idempotency guarantees on replay |
| Retry / failure simulation | ✅ Yes (verified) | retry + flaky tool | real backoff observability |
| Source/citation verification | ⚠️ Synthetic | content_processing tools | real verification (status is `index%4`) |
| Multi-agent handoff | ⚠️ Recorded, not behavioral | handoff step | handoff doesn't change execution, only logs |
| Code review workflow | ⚠️ Buildable | new template + tools | real code-reading tools |
| Repo audit workflow | ⚠️ Buildable | new template + tools | filesystem/analysis tools |
| Issue triage workflow | ⚠️ Buildable | new template | input beyond a single topic string |
| Release readiness workflow | ⚠️ Buildable | new template + approval | gate criteria evaluation tools |
| QA handoff workflow | ⚠️ Buildable | handoff + report | structured handoff bundle export |
| Import/export handoff | ✅ Mechanically yes | export-run/import-run | real signing |
| Event-driven / webhook fan-out | ❌ Not via CLI | hooks.kujo (library) | CLI wiring for `webhook_sink` |
| Parallel/concurrent steps | ❌ No | — | real concurrency |

A "minimal template" for any buildable pattern is the same skeleton: 1 plan agent step → N tool/agent steps (data via `input_from`/`output_key`) → optional `approval` step → `report` step. See the builder guide for the copy-paste skeleton.

---

## Recommended First Workflows To Build

These are chosen to prove orchestration, exercise approval + resume + traces, avoid the live SDK, and expose gaps. Full designs are in [dispatch-workflow-builder-guide.md](dispatch-workflow-builder-guide.md#example-workflow-ideas); summary:

1. **Repo Review Workflow** — plan → scan (new `repo_scan` tool over fixture files) → findings → **approval gate** → report. Proves: new template + new tool + payload adapter + approval + report. Difficulty: **medium** (needs report.kujo extension for a non-research shape).
2. **Release Readiness Workflow** — collect signals → evaluate gate criteria (tool) → **approval gate** (go/no-go) → handoff bundle. Proves: approval as a real decision gate + export-run handoff. Difficulty: **medium**.
3. **Human Approval Handoff Workflow** — minimal: gather → **approval (request_changes path)** → resume → finalize. Proves: pause/`needs_changes`/resume and reviewer notes with the least new code. Difficulty: **low** — best first build.

Each design in the guide lists purpose, user, trigger/input, steps, agents, tools, approval points, outputs, success criteria, difficulty, and an offline test command.

---

## Gaps And Risks

| # | Area | Current behavior | Why it matters | Suggested fix | Priority | Difficulty |
|---|---|---|---|---|---|---|
| 1 | Policy/template | Default templates depend on `flaky_reliability_tool`; `staging`/`prod` profiles deny it → demo fails under prod | "Production profile" can't run the shipped workflow | Make `retry_probe` optional, or give policy a "skip-denied" mode, or remove flaky tool from default templates | **P0** | low |
| 2 | Extensibility | Plugins/hooks/webhooks not wired into CLI | Headline extension points are unreachable without writing a custom entrypoint | Add `--webhook-sink`, `--plugin` (or a plugin manifest) to `demo`/`resume`; pass into `run_workflow` options | **P1** | medium |
| 3 | Authoring | Templates are Kujo code only | No config-driven workflow authoring → high barrier to reuse | Add a declarative template loader (JSON/TOML → `create_workflow`) with validation | **P1** | high |
| 4 | Reporting | `build_report_payload` hardcoded to research shape | Non-research workflows get mislabeled/sparse reports | Make report builder workflow-aware (per-template report config or registered report builders) | **P1** | medium |
| 5 | Reliability | Timeout is post-hoc; cancellation unreachable | No real protection against hung/runaway steps | Wire cancellation flags into CLU; document timeout as advisory; explore cooperative cancellation | **P1** | medium |
| 6 | Security | Bundle "signature" is a non-crypto checksum with key in plaintext scheme | Misleading authenticity guarantee | Replace with real HMAC (if Kujo exposes one) or rename to "integrity checksum" and document non-authenticity | **P1** | low–medium |
| 7 | Concurrency | `parallel_execution` branch is a no-op | Advertised parallelism doesn't exist | Either implement real concurrency or remove the claim and the dead branch | **P2** | high (impl) / low (doc) |
| 8 | Agents | Verification status assigned by `index % 4`; model output ignored offline | Reviewers may mistake synthetic output for analysis | Clearly label outputs as synthetic in offline mode; gate real logic behind live SDK | **P1** | low |
| 9 | DX | `[RUFRUN001]` type warnings flood stderr every run | Erodes trust, noisy automation logs | Fix the underlying type issues or suppress benign warnings in the entrypoint | **P2** | medium |
| 10 | CLI | No `version`/`--version` | Breaks tooling expectations | Implement from `kennel.toml` version | **P2** | low |
| 11 | Templates | `crud-reliability` is a prompt skin of research | Implies more variety than exists | Build at least one structurally distinct template | **P2** | medium |
| 12 | Testing | No CLI-level e2e harness for prod-profile run | Profile/template mismatch (gap 1) slipped through | Add an e2e test that runs each template under each profile | **P1** | low |
| 13 | State/recovery | Replay re-runs non-completed side-effecting steps | Possible double execution of external effects | Document idempotency requirement for tools; add per-step idempotency key support | **P2** | medium |

---

## Suggested Roadmap

**Phase 0 — Make the shipped story true (P0/P1, low effort):**
- Fix gap 1 (profile/template mismatch) and add the e2e profile test (gap 12).
- Rename/clarify bundle "signature" (gap 6) and label synthetic agent output (gap 8).
- Implement `version` (gap 10).

**Phase 1 — Unlock the platform (P1):**
- Wire plugins + hooks + webhook sink into the CLI (gap 2).
- Make reporting workflow-aware (gap 4).
- Wire cancellation; document timeout semantics honestly (gap 5).

**Phase 2 — Authoring & breadth (P1/P2):**
- Declarative template loader (gap 3).
- A structurally distinct second template (gap 11).
- Real concurrency or remove the claim (gap 7).

**Phase 3 — Hardening:**
- Idempotency keys for replay-safe side effects (gap 13).
- Reduce/fix type-checker noise (gap 9).

**Is Dispatch ready to be a reusable workflow primitive across projects?** As a **control/operations primitive** (run state, approval gates, audit, cataloging) — yes, today, for offline/fixture-backed flows. As a **workflow-authoring platform** — not yet; it needs Phase 0 + Phase 1 first (config authoring, wired extension points, workflow-aware reporting, and resolving the profile/template contradiction).

---

## Appendix: Commands Run

Runtime used: `KUJO_BIN=.../kujo/target/release/kujo` (kujo 1.0.0), `DISPATCH_OFFLINE_FIXTURE=true`, run from repo root. All scratch outputs were written under `tests/tmp/` and removed after review.

```bash
# All succeeded (exit 0 unless noted). stderr type-warnings suppressed for readability.
kujo run --interpreter dispatch.kujo help
kujo run --interpreter dispatch.kujo templates
kujo run --interpreter dispatch.kujo templates --json
kujo run --interpreter dispatch.kujo demo "How do AI agent workflows differ from chatbots?" --yes --non-interactive --output-root tests/tmp/...   # completed
kujo run --interpreter dispatch.kujo runs --output-root tests/tmp/... --json                                                                      # 1 run, completed
kujo run --interpreter dispatch.kujo doctor --output-root tests/tmp/... --json                                                                    # ok, 0 issues
kujo run --interpreter dispatch.kujo demo "Pause test" --non-interactive --output-root tests/tmp/...                                               # paused
kujo run --interpreter dispatch.kujo resume <run-id> --yes --output-root tests/tmp/...                                                             # completed
kujo run --interpreter dispatch.kujo demo "Orders API reliability" --workflow crud-reliability --yes --non-interactive --output-root tests/tmp/... # completed
kujo run --interpreter dispatch.kujo demo "Policy test" --yes --non-interactive --deny-tools flaky_reliability_tool --output-root tests/tmp/...    # FAILED (tool_execution_denied)
kujo run --interpreter dispatch.kujo demo "Prod profile test"    --yes --non-interactive --policy-profile prod    --output-root tests/tmp/...      # FAILED (tool_execution_denied)
kujo run --interpreter dispatch.kujo demo "Staging profile test" --yes --non-interactive --policy-profile staging --output-root tests/tmp/...      # FAILED (tool_execution_denied)
```

Note on environment: `kujo` is not on `PATH`; a working runtime exists at `../kujo/target/release/kujo`. The repo's `./kujo` wrapper requires `KUJO_BIN` to point at that binary. This did not block research.

## Appendix: Key Files Reviewed

| File | Role |
|---|---|
| [dispatch.kujo](../dispatch.kujo) (1449 L) | CLI entrypoint, command routing, option assembly |
| [src/cli/cli_args.kujo](../src/cli/cli_args.kujo) | schema-driven flag parser |
| [src/workflows/workflow.kujo](../src/workflows/workflow.kujo) | template builders + registry |
| [src/core/step.kujo](../src/core/step.kujo) | step factory + status transitions |
| [src/core/runner.kujo](../src/core/runner.kujo) | orchestration loop, step execution, schema/timeout/cancel |
| [src/agents/agent.kujo](../src/agents/agent.kujo) | agent handler registry + deterministic handlers |
| [src/tools/tool.kujo](../src/tools/tool.kujo) | tool registry, payload adapters, default tools |
| [src/core/approval.kujo](../src/core/approval.kujo) | approval request/decision |
| [src/core/retry.kujo](../src/core/retry.kujo) | retry policy, delay, jitter |
| [src/core/state.kujo](../src/core/state.kujo) (1411 L) | persistence, index, catalog, doctor, cleanup, bundles, audit |
| [src/core/trace.kujo](../src/core/trace.kujo) | trace model, limits, markdown render |
| [src/core/hooks.kujo](../src/core/hooks.kujo) | lifecycle event + webhook sink (not CLI-wired) |
| [src/core/report.kujo](../src/core/report.kujo) | report payload + artifact write |
| [src/core/tool_policy.kujo](../src/core/tool_policy.kujo) | profiles + allow/deny |
| [src/core/plugins.kujo](../src/core/plugins.kujo) | plugin injection (not CLI-wired) |
| [sdk_adapter.kujo](../sdk_adapter.kujo) / [bridge_chat.kujo](../bridge_chat.kujo) | external SDK bridge |
| [tools/*.kujo](../tools/) | source_lookup, content_processing, reliability_tools handlers |
| [tests/dispatch_tests.kujo](../tests/dispatch_tests.kujo) (61 tests) | behavior coverage |
| [docs/architecture-and-extension-diagrams.md](../docs/architecture-and-extension-diagrams.md) | runtime + extension diagrams |
