# Dispatch Workflow Builder Guide

A practical, copy-oriented companion to [dispatch-workflow-review.md](dispatch-workflow-review.md). It shows the exact patterns for building a new workflow in Dispatch as it exists today (offline/fixture path, no credentials).

Every pattern is grounded in the current code. Where a capability is library-only (not reachable from the shipped CLI), it is flagged **(library-only)**.

---

## New Workflow Checklist

Work top-to-bottom. ☐ = file you must touch.

1. ☐ **Builder function** in [src/workflows/workflow.kujo](../src/workflows/workflow.kujo)
   `func create_<name>_workflow(topic, auto_approve) { return create_workflow({...}) }`
2. ☐ **Register the template** in `create_workflow_templates()` → `"my-template": func(t,a){ return create_<name>_workflow(t,a) }`
3. ☐ **Add to `template_order`** in `list_workflow_templates()` so `templates` lists it.
4. **Steps** — assemble with `create_step(id, name, type, config)`; types: `agent`, `tool`, `approval`, `handoff`, `report`.
5. **Data flow** — set `input_from` (sources) and `output_key` (destination in `run_state.data`).
6. **Ordering** — list position is the default order; add `depends_on:[ids]` for DAG gating.
7. **Agents** — reuse `planner/research/verification/writer`, or ☐ add a handler in `register_default_agent_handlers()` ([src/agents/agent.kujo](../src/agents/agent.kujo)) for any new `agent_id`.
8. **Tools** — reuse the 7 built-ins, or ☐ register a new tool + payload adapter in `register_default_tools()` ([src/tools/tool.kujo](../src/tools/tool.kujo)).
9. **Approval** — add a `type:"approval"` step with `approval_required:true` and `approval_gate{reason,summary}`.
10. **Retry** — add `retry_policy` per step, or rely on `default_retry_policy`.
11. **Report** — add a final `type:"report"` step. ☐ If your data keys differ from research-report, extend `build_report_payload` in [src/core/report.kujo](../src/core/report.kujo) (currently hardcoded).
12. **Policy check** — do not depend on a tool your target profile denies. (`staging`/`prod` deny `flaky_reliability_tool`.)
13. **Test** — add a test in [tests/dispatch_tests.kujo](../tests/dispatch_tests.kujo) and run a live offline `demo`.

---

## Minimal Workflow Template Pattern

```kujo
func create_minimal_workflow(topic, auto_approve) {
    agents := {
        "planner": {
            "id": "planner", "name": "Planner Agent",
            "purpose": "Plan the work.",
            "instructions": "Produce a concise plan.",
            "model": {"provider": "openai", "model": "gpt-4.1-mini"},
            "tools": ["timestamp_tool"], "handoff_targets": [],
            "output_schema": {"type": "dict"}, "guardrails": []
        }
        # reuse research/verification/writer if you need them
    }

    steps := [
        create_step("plan", "Plan", "agent", {
            "agent_id": "planner", "input_from": ["input"], "output_key": "plan"
        }),
        create_step("gate", "Approval", "approval", {
            "approval_required": true,
            "approval_gate": {"reason": "Confirm before finalizing.", "summary": "Review the plan."},
            "input_from": ["plan"], "output_key": "approval"
        }),
        create_step("finalize", "Finalize", "report", {
            "input_from": ["plan"], "output_key": "final_output"
        })
    ]

    return create_workflow({
        "id": "minimal_workflow", "name": "Minimal Workflow",
        "description": "Smallest useful Dispatch workflow.",
        "input_schema": {"type": "dict", "required": ["topic"], "properties": {"topic": {"type": "string"}}},
        "agents": agents,
        "tools": ["timestamp_tool"],
        "steps": steps,
        "memory_config": {"workflow_memory": true, "agent_notes": true, "step_output_memory": true, "history_lookup": true},
        "default_retry_policy": {"max_attempts": 2, "base_delay_ms": 10, "max_delay_ms": 100, "strategy": "linear", "retry_on_codes": ["tool_execution_failure", "agent_execution_failure"]},
        "approval_config": {"auto_approve": auto_approve},
        "output_schema": {"type": "dict", "required": ["run_id"]}
    })
}
```

Then register:

```kujo
func create_workflow_templates() {
    return {
        "research-report": func(t, a) { return create_research_report_workflow(t, a) },
        "crud-reliability": func(t, a) { return create_crud_reliability_workflow(t, a) },
        "minimal": func(t, a) { return create_minimal_workflow(t, a) }   # add
    }
}
# and add "minimal" to template_order in list_workflow_templates()
```

---

## Agent Handler Pattern

Agent *definitions* live in the workflow; agent *behavior* lives in the handler registry ([src/agents/agent.kujo:194](../src/agents/agent.kujo)). A handler receives `(agent, step_input, run_state, tool_registry, context)` and must return `{"ok": true, "data": {...}}` or an error dict.

```kujo
func my_role_output(agent, step_input, run_state, tool_registry, context) {
    topic := dict_get_or(dict_get_or(step_input, "input", {}), "topic", "")
    # call tools via call_tool(tool_registry, "<tool>", payload, context)
    return {"ok": true, "data": {"topic": topic, "note": "did the thing"}}
}

# inside register_default_agent_handlers():
handler_registry := register_agent_handler(handler_registry, "my_role",
    func(agent, step_input, run_state, tool_registry, context) {
        return my_role_output(agent, step_input, run_state, tool_registry, context)
    })
```

A step then references it: `create_step("do_it", "Do It", "agent", {"agent_id": "my_role", "input_from": ["input"], "output_key": "result"})`.

> If a step names an `agent_id` with no handler, the run fails with `No implementation exists for this agent id` ([agent.kujo:232](../src/agents/agent.kujo)). The offline handlers ignore `model`/`instructions`/`guardrails` — those only matter on the live SDK path.

**Plugin alternative (library-only):** inject handlers without editing core via `create_plugin(id, agents, agent_handlers, tools)` + `apply_plugins_to_runtime(...)` ([src/core/plugins.kujo](../src/core/plugins.kujo)). Not reachable from the shipped CLI — you'd need a custom entrypoint.

---

## Tool Handler Pattern

A tool handler receives `(input_payload, context)` and returns `{"ok": true, "data": {...}}` or `{"ok": false, "error": {code,message,retryable}}`. The `payload_adapter` maps the generic `step_input` into the handler's expected shape.

```kujo
# in tools/my_tools.kujo
func word_count_handler(params, context) {
    text := dict_get_or(params, "text", "")
    return {"ok": true, "data": {"words": len(split(text, " "))}}
}
export word_count_handler := word_count_handler

# in src/tools/tool.kujo register_default_tools():
registry := register_tool(registry, create_tool(
    "word_count",
    "Counts words in provided text.",
    {"type": "dict", "required": ["text"]},   # input_schema (advisory)
    {"type": "dict"},                          # output_schema
    word_count_handler,
    func(step_input) { return {"text": dict_get_or(step_input, "doc", "")} }  # payload_adapter
))
```

Use it in a tool step: `create_step("count", "Count", "tool", {"tool_name": "word_count", "input_from": ["doc"], "output_key": "wc"})`.

> A returned `error.retryable:true` (or a `code` in the step's `retry_on_codes`) triggers retry. See the flaky tool ([tools/reliability_tools.kujo](../tools/reliability_tools.kujo)) for the canonical retryable-failure example.

---

## Approval Gate Pattern

```kujo
create_step("approval_gate", "Human Approval Gate", "approval", {
    "approval_required": true,
    "approval_gate": {
        "reason": "Final report can publish conclusions.",
        "summary": "Review verified claims before writing."
    },
    "input_from": ["verification"],
    "output_key": "approval"
})
```

Resolution paths ([src/core/approval.kujo](../src/core/approval.kujo)):

| Invocation | Result |
|---|---|
| `--yes` | auto-approved, note "Auto-approved by --yes flag." |
| `--decision approve|reject|changes` (simulated) | applies that decision non-interactively |
| `--non-interactive` (no decision) | **pauses** → `status: paused`, resume later |
| interactive (default) | prompts for decision + note |

Decisions: `approved` (continue), `rejected` (run fails), `request_changes` (run pauses with `status: needs_changes`, resumable). Verified offline: pause → `resume <id> --yes` → `completed`.

---

## Retry Pattern

```kujo
create_step("retry_probe", "Reliability Probe", "tool", {
    "tool_name": "flaky_reliability_tool",
    "input_from": ["input"], "output_key": "reliability_probe",
    "retry_policy": {
        "max_attempts": 3,
        "base_delay_ms": 10, "max_delay_ms": 50,
        "strategy": "exponential",                # or "linear" / "none"
        "retry_on_codes": ["flaky_failure", "tool_execution_failure"],
        "jitter": "deterministic",                # or "random" / "none"
        "jitter_ms": 5, "jitter_seed": 17         # deterministic jitter inputs
    }
})
```

Behavior ([src/core/retry.kujo](../src/core/retry.kujo)): retries while `error.retryable` OR `error.code ∈ retry_on_codes`, up to `max_attempts`, sleeping `compute_delay` between tries. Each attempt is recorded in `attempt_records` and surfaced in the trace. Verified: flaky tool failed attempt 1, succeeded attempt 2 → step `attempts:2`.

---

## Report Output Pattern

The final `type:"report"` step calls `build_report_payload` + `write_report_artifacts` ([src/core/report.kujo](../src/core/report.kujo)) and writes `report.md` + `report.json` (plus state/trace).

```kujo
create_step("finalize", "Finalize Outputs", "report", {
    "input_from": ["report", "verification", "claims", "sources"],
    "output_key": "final_output"
})
```

⚠️ **Current limitation:** `build_report_payload` is hardcoded to the research-report shape (title, and it reads `data.verification`, `data.claims`, `data.sources`, `data.report`). For a different workflow, either (a) populate those same data keys, or (b) extend `report.kujo` with workflow-aware logic. A clean fix is a per-template report config or a registered report-builder map.

Persisted machine artifacts carry `artifact_contract_version`, `schema_name`, `schema_version` for forward-compatible readers, and sensitive keys are redacted before write.

---

## Trace Output Pattern

Tracing is automatic — the runner emits `step_started`, `step_completed`, `step_failed`, `step_paused`, `handoff`, `policy_denied`, `run_completed`, `run_cancelled` events. Verified counts from a real run: `step_started=9, step_completed=9, handoff=1, run_completed=1`.

- Bound size with `--trace-max-events` / `--trace-max-payload-chars` (or `DISPATCH_TRACE_MAX_EVENTS` / `DISPATCH_TRACE_MAX_PAYLOAD_CHARS`). Defaults 400 / 2400.
- Truncation is tracked in `trace.truncated{events_dropped, payloads_truncated}`.
- `trace.md` renders a human timeline with per-type counts.

> There is **no public "emit custom trace event" API** for tools/handlers today — events are produced by the engine only. To add custom observability, you'd extend `append_trace` call sites in the runner, or (library-only) use the lifecycle `event_hook`/`webhook_sink` in [src/core/hooks.kujo](../src/core/hooks.kujo).

---

## Local Test Pattern

**Unit/behavior test** (preferred — mirrors the 61 existing tests):

```kujo
test "minimal workflow runs to completion offline" {
    workflow := create_minimal_workflow("Test topic", true)
    run_state := create_run_state(workflow, {"topic": "Test topic"}, "tests/tmp/min-outputs", {
        "auto_approve": true, "interactive": false
    })
    tool_registry := register_default_tools("examples/research-report/sources")
    result := run_workflow(workflow, run_state, tool_registry, {
        "auto_approve": true, "interactive": false, "command_name": "test"
    })
    assert_eq(result["run_state"]["status"], "completed")
}
```

Run it:

```bash
export KUJO_BIN=/path/to/kujo/target/release/kujo
export DISPATCH_OFFLINE_FIXTURE=true
"$KUJO_BIN" test-run tests/dispatch_tests.kujo -v
```

**End-to-end CLI smoke** (offline, no creds):

```bash
export KUJO_BIN=/path/to/kujo/target/release/kujo
export DISPATCH_OFFLINE_FIXTURE=true
"$KUJO_BIN" run --interpreter dispatch.kujo templates                       # see your template listed
"$KUJO_BIN" run --interpreter dispatch.kujo demo "Smoke" --workflow minimal --yes --non-interactive --output-root tests/tmp/smoke
"$KUJO_BIN" run --interpreter dispatch.kujo runs --output-root tests/tmp/smoke --json
"$KUJO_BIN" run --interpreter dispatch.kujo doctor --output-root tests/tmp/smoke --json
```

> Type-checker `[RUFRUN001]` warnings on stderr are expected and benign; judge success by exit code + functional output. Always use an isolated `--output-root` under `tests/tmp/` and clean it up after.

---

## Example Workflow Ideas

Three concrete designs. All are offline-testable; (2) and (3) need a `report.kujo` extension for non-research output shapes.

### 1. Repo Review Workflow

| Field | Value |
|---|---|
| **Purpose** | Produce a reviewable, approval-gated summary of a repo/code area with evidence + findings. |
| **User** | Eng lead / reviewer wanting repeatable, auditable reviews. |
| **Trigger / input** | `demo "<repo or area name>" --workflow repo-review` (single topic string today). |
| **Steps** | `plan` (agent) → `scan_repo` (tool, new) → `extract_findings` (tool/agent) → `assess` (agent, severity/confidence) → `approval_gate` (approval) → `write_review` (agent) → `finalize` (report). |
| **Dependencies** | `assess depends_on [scan_repo, extract_findings]`; `write_review depends_on [approval_gate]`. |
| **Agents/tools** | reuse `planner`/`writer`; new `repo_scan` tool (reads fixture files under a sources dir) + payload adapter; reuse `markdown_report_writer`. |
| **Artifacts** | `report.md/.json` (findings + severities + evidence), `trace.*`, `state.json`. |
| **Approval points** | one gate before publishing the review. |
| **Success criteria** | completes offline; report lists findings with evidence + severity; pause/resume works at the gate. |
| **Difficulty** | **Medium** — needs one new tool + report.kujo shape for findings. |
| **Why it matters** | Proves the full extension path (new template + new tool + adapter + approval + report) without the SDK. |
| **Offline test** | `demo "core/runner.kujo" --workflow repo-review --non-interactive` → expect `paused`; then `resume <id> --yes` → `completed`. |

### 2. Release Readiness Workflow

| Field | Value |
|---|---|
| **Purpose** | Gate a release: collect signals, evaluate go/no-go criteria, require human sign-off, emit a handoff bundle. |
| **User** | Release manager. |
| **Trigger / input** | `demo "<release tag>" --workflow release-readiness`. |
| **Steps** | `collect_signals` (tool) → `evaluate_criteria` (agent/tool: checklist pass/fail) → `risk_summary` (agent) → `approval_gate` (approval = go/no-go) → `finalize` (report) → export via `export-run`. |
| **Dependencies** | `approval_gate depends_on [risk_summary]`; report after approval. |
| **Agents/tools** | reuse `planner`/`writer`; new `criteria_eval` tool over a fixture checklist. |
| **Artifacts** | readiness `report.*` (criteria + risk + decision), exportable bundle (`export-run --bundle-path`). |
| **Approval points** | one decisive go/no-go gate (use `reject` to block release). |
| **Success criteria** | reject → run `failed` (blocks); approve → `completed` + bundle exportable/importable. |
| **Difficulty** | **Medium**. |
| **Why it matters** | Exercises approval as a *real decision* (not rubber-stamp) plus the import/export handoff path. |
| **Offline test** | `demo "v1.2.0" --workflow release-readiness --decision reject --non-interactive` → expect `failed`; rerun with `--decision approve` → `completed`, then `export-run <id> --bundle-path tests/tmp/rel.json`. |

### 3. Human Approval Handoff Workflow (best first build) — ✅ shipped as `approval-handoff`

> This design was implemented in-session as the built-in `approval-handoff` template (`create_approval_handoff_workflow` in [src/workflows/workflow.kujo](../src/workflows/workflow.kujo)): `plan → gather_sources → extract_claims → verify_claims → approval_gate → finalize` (6 steps, no flaky tool). Run it with `demo "<subject>" --workflow approval-handoff`. The table below is the original design.


| Field | Value |
|---|---|
| **Purpose** | Minimal demonstration of pause → request-changes → resume → finalize with reviewer notes. |
| **User** | Anyone validating the human-in-the-loop control. |
| **Trigger / input** | `demo "<subject>" --workflow approval-handoff`. |
| **Steps** | `gather` (agent) → `approval_gate` (approval) → `finalize` (report). |
| **Dependencies** | linear; `finalize depends_on [approval_gate]` (implicit by order). |
| **Agents/tools** | reuse `planner` (as `gather`), `timestamp_tool`; no new code beyond the template. |
| **Artifacts** | `state.json` showing `paused`/`needs_changes` then `completed`; `report.*`; approval record with `reviewer_note`. |
| **Approval points** | one gate, exercising all three decisions (approve / reject / request_changes). |
| **Success criteria** | `--decision changes` → `needs_changes`; `resume --yes` → `completed`; approval object persists the note. |
| **Difficulty** | **Low** — no new tools/handlers; pure template. |
| **Why it matters** | Cheapest way to prove resumability + the full approval-decision matrix end-to-end offline. |
| **Offline test** | `demo "Quarterly plan" --workflow approval-handoff --decision changes --non-interactive` → `needs_changes`; `resume <id> --yes` → `completed`. |

---

### Build order recommendation

Start with **#3** (proves the control loop with zero new tools), then **#1** (proves the tool/report extension path), then **#2** (proves decision gates + bundles). All three avoid the live SDK and surface the report-shape gap, which is the highest-value fix to unlock general workflow authoring.
