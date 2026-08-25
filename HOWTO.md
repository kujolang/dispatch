# Dispatch Router HOWTO

This guide explains how to configure, run, inspect, and troubleshoot Dispatch's deterministic agent, provider, and model router.

## Executive Summary

The Dispatch router chooses the best policy-compliant execution route for an agent step. A route is the combination of:

- an agent definition and compatible runtime handler;
- a provider;
- a model from an approved, versioned AI SDK catalog.

The router is deterministic rather than LLM-driven. It first rejects candidates that violate hard constraints, then ranks the eligible candidates using a stable quality-first policy. Dispatch persists the selected route before execution, records the reasons for the choice, keeps ordinary retries separate from provider/model fallback, and reuses the persisted decision on resume.

Routing is opt-in. Existing workflows continue to use their configured `agent.model` unchanged unless `routing.enabled` is `true`.

Responsibility is deliberately split across the Kujo SDKs:

- **Dispatch** owns routing policy, selection, persistence, retries, fallback, evaluation, and audit artifacts.
- **AI SDK** owns the versioned provider/model catalog and its canonical hash.
- **Agents SDK** defines the shared agent-side vocabulary: `handler_id`, versioned `execution_contract`, `capabilities`, `model_candidates`, and routing metadata.

## Start With the Offline Example

The canonical example requires no provider credentials:

```bash
cd /path/to/dispatch

kujo run dispatch.kujo demo "Routing review" \
  --workflow-file examples/workflows/routed-review.json \
  --yes \
  --non-interactive \
  --output-root tests/tmp/routing-howto
```

The command prints a run ID. Inspect the completed run with:

```bash
kujo run dispatch.kujo inspect <run-id> \
  --output-root tests/tmp/routing-howto \
  --json
```

The example gives Dispatch two fixture models. Both satisfy the step's hard constraints, so the quality-first policy selects `dispatch-frontier` deterministically.

If you installed the ecosystem AI profile, the same example is ready immediately:

```bash
cd "$HOME/.kujo/sources/dispatch"

dispatch validate --workflow-file examples/workflows/routed-review.json --json
dispatch explain-route --workflow-file examples/workflows/routed-review.json --json
dispatch demo "Routing review" \
  --workflow-file examples/workflows/routed-review.json \
  --yes \
  --non-interactive \
  --output-root tests/tmp/routing-howto
```

The installer configures the `dispatch` shim with the matching Dispatch and AI SDK source paths. No additional dependency install or provider credential is required for this fixture-backed walkthrough.

## How a Route Is Selected

For each routed agent step, Dispatch performs this sequence:

1. Merge workflow, agent, and step routing constraints.
2. Load the requested agent and, when enabled, compatible substitute agents.
3. Expand each agent's `model_candidates` against the AI SDK model catalog.
4. Reject candidates that violate any hard constraint.
5. Rank the remaining candidates with the quality-first policy.
6. Create and persist the route decision before the model call.
7. Execute the selected handler using an effective cloned agent whose model is replaced by the selected provider/model.
8. Evaluate the output when deterministic evaluation is configured.
9. Retry the same route or select an explicit fallback route according to policy.

Candidate declaration order does not decide the winner. Dispatch uses stable candidate ordering and a deterministic route-key tie-break.

### Quality-First Ranking

Eligible candidates are ranked in this order:

1. `quality_tier`: `frontier`, `premium`, `standard`, `economy`, `fixture`, then `unknown`;
2. higher `relative_quality`;
3. higher `reliability_score`;
4. lower combined input/output cost;
5. lower typical latency;
6. higher `token_efficiency` when supplied;
7. lexicographically stable `agent::provider::model` route key.

Unknown cost or latency values are ranked after known values. Dispatch never invents missing operational metadata.

## Build a Routable Workflow

A routed workflow needs four pieces:

1. routable agent metadata;
2. model candidates;
3. a valid model catalog;
4. workflow and/or step routing policy.

### 1. Define the Agent Execution Contract

```json
{
  "id": "writer",
  "name": "Report Writer",
  "role": "writer",
  "purpose": "Write a structured report.",
  "instructions": "Write a concise, evidence-backed report.",
  "handler_id": "writer",
  "execution_contract": {
    "id": "report-writer",
    "version": "1"
  },
  "capabilities": {
    "write_report": true
  },
  "model": {
    "provider": "openai",
    "model": "legacy-default-model"
  },
  "model_candidates": [
    {"provider": "openai", "model": "approved-standard-model"},
    {"provider": "openrouter", "model": "approved-frontier-model"}
  ],
  "tools": [],
  "output_schema": {"type": "dict"},
  "routing": {"risk": "low"},
  "uses_model": true
}
```

Important rules:

- `model` remains the legacy/default route and preserves backward compatibility.
- `model_candidates` identify possible routes; they do not own cost, quality, latency, or reliability facts.
- The AI SDK catalog is authoritative for model metadata. A candidate cannot override catalog facts.
- `handler_id` identifies the executable handler.
- `execution_contract` must contain non-empty `id` and `version` fields.
- A substitute agent is compatible only when it uses the same handler or has an exact execution-contract ID/version match.
- `uses_model` controls whether model-call lifecycle events are emitted for the handler.

### 2. Create a Versioned AI SDK Model Catalog

Generate catalog entries in the AI SDK repository rather than maintaining a second provider table in Dispatch:

```kujo
from src.model_catalog import create_model_metadata, create_model_catalog

catalog := create_model_catalog("production-approved", "2026-08-24", [
    create_model_metadata("openai", "approved-standard-model", {
        "quality_tier": "standard",
        "relative_quality": 0.80,
        "context_window": 16000,
        "supports_tools": true,
        "supports_structured_output": true,
        "input_cost_per_million": null,
        "output_cost_per_million": null,
        "typical_latency_ms": null,
        "reliability_score": null,
        "source": "platform-policy"
    }),
    create_model_metadata("openrouter", "approved-frontier-model", {
        "quality_tier": "frontier",
        "relative_quality": 0.95,
        "context_window": 32000,
        "supports_tools": true,
        "supports_structured_output": true,
        "source": "platform-policy"
    })
], {"owner": "ai-platform"})

print(to_json(catalog))
```

Copy the generated JSON object into `workflow.routing.model_catalog`, or inject the same generated object when constructing a workflow in Kujo code. Do not type a catalog hash manually: AI SDK calculates the canonical `catalog_hash` from the catalog identity, sorted model entries, and metadata.

An enabled Dispatch router requires:

- `schema_name: "ai-sdk-model-catalog"`;
- `schema_version: "1.0.0"`;
- a non-empty catalog `id` and `version`;
- a valid canonical `catalog_hash`;
- a `models` array containing unique `provider::model` entries.

Unknown context, price, latency, or reliability values should be `null`. If a hard constraint depends on unknown metadata, the default `unknown_metadata: "reject_constrained"` policy rejects that candidate.

### 3. Enable Workflow Routing

```json
{
  "routing": {
    "enabled": true,
    "policy_version": "1.0.0",
    "objective": "quality_first",
    "allow_agent_substitution": false,
    "constraints": {
      "quality_floor": "standard",
      "unknown_metadata": "reject_constrained"
    },
    "fallback": {
      "max_fallbacks": 1,
      "max_evaluation_retries": 1,
      "fallback_on_codes": [
        "provider_unavailable",
        "structured_output_invalid"
      ]
    },
    "model_catalog": {
      "schema_name": "ai-sdk-model-catalog",
      "schema_version": "1.0.0",
      "id": "production-approved",
      "version": "2026-08-24",
      "catalog_hash": "<generated-by-ai-sdk>",
      "models": []
    }
  }
}
```

The abbreviated catalog above shows placement only; it is not runnable. Use the complete object generated by AI SDK.

Only routing policy version `1.0.0` and objective `quality_first` are currently supported. Unsupported versions or objectives fail explicitly rather than silently changing behavior.

### 4. Add Step-Level Constraints

```json
{
  "id": "write",
  "name": "Write Report",
  "type": "agent",
  "agent_id": "writer",
  "input_from": ["input", "research"],
  "output_key": "report",
  "routing": {
    "allow_agent_substitution": true,
    "constraints": {
      "required_capabilities": ["write_report"],
      "required_tools": [],
      "allowed_providers": ["openai", "openrouter"],
      "quality_floor": "standard",
      "required_context_tokens": 12000,
      "requires_structured_output": true,
      "minimum_reliability": 0.95,
      "max_latency_ms": 3000,
      "maximum_risk": "low"
    }
  }
}
```

Step constraints may only narrow agent and workflow policy. Allowlists intersect, requirements and denylists accumulate, minimums increase, and maximums decrease. A step cannot weaken a broader constraint. Dispatch also uses a step's declared `output_schema` as a required agent output contract.

## Validate and Explain Before Running

```bash
dispatch validate --workflow-file workflow.json --json
dispatch explain-route --workflow-file workflow.json --step-id write --json
```

Add `--live` to `validate` to check the AI SDK bridge and provider credential environment variables without making a model call. Validation rejects unknown fields, unsupported providers, missing handlers, incomplete execution contracts, invalid fallback/evaluation policy, and missing model candidates.

## Use a Catalog File

Set `routing.model_catalog_file` to a JSON file path relative to the workflow file:

```json
{"routing": {"enabled": true, "model_catalog_file": "catalogs/production.json"}}
```

Dispatch loads and validates it before execution, then embeds the resolved catalog in persisted run state so resume does not depend on the original file. Generate it with AI SDK:

```bash
cd /path/to/ai-sdk
kujo run scripts/generate_model_catalog.kujo --interpreter -- \
  examples/dispatch-model-catalog.config.json --output /path/to/dispatch/catalogs/production.json
```

## Declare a Generic Model Agent

Use `handler_id: "model"` for an agent that does not need custom Kujo handler code. Supply `instructions`, `model_candidates`, optional registered `tools`, `model_options`, and an optional `output_schema`. Dispatch executes tools through the configured authorization policy, sends the assembled input to the selected model, and returns text or structured output.

Agents SDK users can call `convert_agent_to_dispatch(agent, options)` or `validate_dispatch_agent_conversion(agent, options)` from `src.agents.integrations.adapters` to create this definition without manually translating fields.

## Human Review

When deterministic evaluation returns `request_human_review`, Dispatch creates a native approval request, persists the candidate output and route decision, and pauses the run. Resume with the normal `resume` or `resume-decision` flow. Approval accepts the stored output without another model call; rejection fails the step; requested changes rerun the persisted route.

## Hard Constraints Reference

All hard constraints are applied before ranking.

| Constraint | Meaning |
| --- | --- |
| `required_capabilities` | Every named capability must be enabled on the agent. |
| `required_tools` | The agent must expose every named tool, and the model must support tools. |
| `allowed_agents` / `denied_agents` | Agent ID allowlist or denylist. |
| `allowed_providers` / `denied_providers` | Provider ID allowlist or denylist. |
| `allowed_models` / `denied_models` | Model ID allowlist or denylist. |
| `quality_floor` | Minimum accepted quality tier. |
| `requires_tools` | Requires model tool-call support. |
| `requires_structured_output` | Requires model structured-output support. |
| `output_schema_required` | Requires the agent to declare an output schema. |
| `required_output_schema` | Requires compatible output type and required fields. Normally derived from the step schema. |
| `required_context_tokens` | Minimum catalog context window. |
| `max_input_cost_per_million` | Maximum catalog input price. |
| `max_output_cost_per_million` | Maximum catalog output price. |
| `max_latency_ms` | Maximum typical catalog latency. |
| `minimum_reliability` | Minimum reliability score from `0` to `1`. |
| `maximum_risk` | Maximum agent/model risk: `low`, `medium`, `high`, or `critical`. |
| `unknown_metadata` | `reject_constrained` rejects unknown values needed by an active constraint. |

`require_catalog_membership` is enforced by default. A workflow may set `allow_uncataloged_models: true`, but production workflows should normally keep catalog membership mandatory.

## Agent Substitution

Agent substitution is disabled by default. Enable it at workflow or step level:

```json
{
  "routing": {
    "enabled": true,
    "allow_agent_substitution": true
  }
}
```

Dispatch considers substitute agents in stable agent-ID order. A substitute must:

- satisfy all capability, tool, schema, policy, and risk constraints;
- use the same `handler_id` as the requested agent, or declare the exact same versioned `execution_contract`.

This prevents a semantically attractive agent definition from being routed to an incompatible runtime implementation.

Plugin-provided agents can participate in routing. Apply the plugin when starting the run with `--plugin`; Dispatch persists the active plugin reference and rehydrates built-in plugins on resume.

## Deterministic Output Evaluation

Evaluation runs after a successful handler/model call:

```json
{
  "evaluation": {
    "required_fields": ["summary", "citations"],
    "minimum_confidence": 0.80,
    "max_unsupported_claims": 0,
    "on_failure": "upgrade_model"
  }
}
```

Supported outcomes are:

| Outcome | Behavior |
| --- | --- |
| `accepted` | Output passed evaluation and the step completes. |
| `retry_same_route` | Re-execute the same agent/provider/model up to `max_evaluation_retries`. |
| `upgrade_model` | Select another eligible route that is a strict quality upgrade. |
| `reroute_agent` | Exclude the current agent and select a compatible substitute. |
| `request_human_review` | Create a native Dispatch approval request and pause with the candidate output and route persisted. |
| `failed` | Fail with `quality_evaluation_failed`. |

`accepted` is produced by the evaluator; configure one of the other values through `on_failure`.

## Retry Versus Fallback

Dispatch treats retry and fallback as different operations.

### Same-Route Retry

Transient, retryable failures remain on the same agent/provider/model. Examples include:

- `timeout`;
- `rate_limit` or `http_429`;
- retryable network or bridge execution errors;
- retryable `http_5xx` responses.

The step's normal `retry_policy` controls these attempts.

### Route Fallback

Fallback deliberately selects a different route. Built-in fallback categories include:

- `provider_unavailable`;
- `context_incompatible`;
- `structured_output_invalid`;
- `quality_evaluation_failed`;
- `unsupported_feature`;
- any code explicitly listed in `fallback.fallback_on_codes`.

Fallback is bounded by `max_fallbacks`. Each transition records:

- `fallback_from`;
- `fallback_reason`;
- `fallback_to`;
- the previous and next decision IDs.

Dispatch never silently changes a provider or model.

## Resume Behavior

Route decisions are persisted before execution. When a run resumes, Dispatch reuses the stored decision instead of resolving a new route.

Resume fails with `persisted_route_unavailable` when the stored route can no longer be executed—for example, when:

- the selected agent is missing;
- the agent's handler changed;
- the execution-contract ID or version changed;
- the selected provider/model is absent from the active catalog;
- the catalog hash changed;
- a required plugin or plugin handler is unavailable.

This behavior is intentional. Update or migrate the persisted workflow/run explicitly instead of expecting resume to silently select a new route.

## Run With Live Providers

The default is fixture mode. For live SDK calls:

```bash
export DISPATCH_OFFLINE_FIXTURE=false
export AI_SDK_PATH=/path/to/ai-sdk

# Configure only the providers present in the approved catalog.
export OPENAI_API_KEY=...
export OPENROUTER_API_KEY=...
export DEEPSEEK_API_KEY=...

kujo run dispatch.kujo demo "Live routed review" \
  --workflow-file path/to/live-routed-workflow.json \
  --yes \
  --non-interactive
```

The bridge currently recognizes the built-in provider IDs `openai`, `openrouter`, and `deepseek`, plus `custom` for an OpenAI-compatible endpoint. A `custom` agent's legacy `model` configuration should include `base_url` and `api_key_env`; the selected model candidate supplies the model ID. `CUSTOM_API_KEY` is the default permitted credential variable for custom endpoints. To use a different, purpose-specific variable, explicitly allow its name:

```bash
export DISPATCH_ALLOWED_CUSTOM_API_KEY_ENVS=WATCHDOG_PROXY_TOKEN
```

Use a comma-separated list for multiple approved names. Dispatch rejects arbitrary process environment variables so an untrusted workflow cannot select an unrelated secret and forward it to a custom endpoint.

Workflow files are limited to 1 MiB and external model catalogs to 5 MiB by default. Controlled deployments may override these bounds with `DISPATCH_WORKFLOW_MAX_BYTES` and `DISPATCH_MODEL_CATALOG_MAX_BYTES`.

Never put API-key values in a workflow, catalog, route decision, or model candidate. Use provider environment-variable names and the environment itself for secrets.

Before production rollout, validate every allowed provider/model route with the real credentials and deployment network policy. Offline fixture validation proves routing behavior, not external provider availability.

Run the live preflight before starting a live workflow:

```bash
dispatch validate --workflow-file path/to/live-routed-workflow.json --live --json
```

For an intentionally local OpenAI-compatible endpoint over HTTP, also set `KUJO_AI_SDK_ALLOW_INSECURE_LOCALHOST=1`. This opt-in applies only to `localhost` and `127.0.0.1`; production provider endpoints should use HTTPS.

## Inspect Routing Evidence

Each run stores routing data in:

- `state.json`: `route_decisions`, `route_attempts`, and per-step route fields;
- `trace.json`: structured route and model-call lifecycle events;
- `trace.md`: human-readable routing timeline and event counts;
- `report.json`: routing decisions and attempts when a report is generated;
- `inspect --json`: a `routing` envelope containing decisions and attempts.

Useful trace event types include:

- `route_requested`;
- `route_candidates_evaluated`;
- `route_rejected`;
- `route_selected`;
- `route_fallback`;
- `model_call_started`;
- `model_call_completed`;
- `model_call_failed`.

Inspect a decision directly:

```bash
jq '.route_decisions' outputs/<run-id>/state.json
jq '.route_attempts' outputs/<run-id>/state.json
jq '[.events[] | select(.type | startswith("route_") or startswith("model_call_"))]' \
  outputs/<run-id>/trace.json
```

A persisted decision includes the selected agent, provider, model, quality tier, catalog identity/hash, policy version, constraints, candidate count, reason codes, estimated cost/latency when known, selection time, and deterministic decision ID.

Dispatch applies its normal sensitive-field redaction before writing artifacts. Token-count metrics are retained; API keys, authorization data, secrets, and passwords are redacted.

## Troubleshooting

### `invalid_model_catalog`

Check that:

- the catalog was produced by the AI SDK `1.0.0` catalog contract;
- the catalog ID and version are non-empty;
- provider/model pairs are unique;
- bounded numeric metadata is valid;
- the canonical hash still matches the catalog content;
- a stale `validation.ok: false` result was not embedded.

Changing any hashed catalog content requires generating and persisting a new hash.

### `no_route_available`

Inspect `error.details.candidate_evaluations`. Every candidate includes rejection `reason_codes`, such as:

- `capability_mismatch`;
- `provider_denied`;
- `quality_below_floor`;
- `context_capacity_insufficient` or `context_capacity_unknown`;
- `structured_output_unsupported`;
- `reliability_below_floor`;
- `risk_exceeded` or `risk_unknown`;
- `output_schema_incompatible`.

Do not weaken several constraints at once. Correct stale metadata or relax the single policy that is intentionally too strict, then rerun with a newly versioned catalog when catalog content changes.

### The router chose an unexpected model

Confirm, in order:

1. both candidates passed hard constraints;
2. the selected model's catalog `quality_tier`;
3. `relative_quality` and `reliability_score`;
4. known versus unknown cost and latency;
5. the stable route-key tie-break.

The `route_candidates_evaluated` and `route_selected` trace payloads are the source of truth.

### Resume reports `persisted_route_unavailable`

Compare the stored decision with the persisted workflow definition and current plugin/catalog configuration. Do not delete the stored route merely to force a new decision; that would remove the audit guarantee. Start a new run or perform an explicit, reviewed migration.

### Live calls still use fixtures

Set `DISPATCH_OFFLINE_FIXTURE=false` in the environment used by Dispatch and verify `AI_SDK_PATH`, `KUJO_BIN`, the provider key, and `DISPATCH_SDK_BRIDGE_SCRIPT` when overridden.

## Backward Compatibility

Routing is disabled unless explicitly enabled. In a legacy workflow:

- Dispatch uses the step's requested agent;
- the agent's existing `model` is preserved;
- no model catalog is required;
- the route decision is marked with `legacy_static`;
- existing workflow, retry, approval, handoff, plugin, fixture, and CLI behavior remains intact.

This makes it safe to adopt routing one workflow at a time.

## Validation Checklist

Before merging a routed workflow:

- [ ] Generate the catalog and hash through AI SDK.
- [ ] Keep unknown operational data as `null`.
- [ ] Give every substitutable agent a versioned execution contract.
- [ ] Confirm every model candidate exists in the catalog.
- [ ] Set a deliberate quality floor and provider policy.
- [ ] Bound fallback and evaluation retries.
- [ ] Run the workflow in fixture mode.
- [ ] Inspect `state.json`, `trace.json`, `trace.md`, and `report.json`.
- [ ] Exercise at least one no-route case and one fallback case in tests.
- [ ] Verify resume reuses the persisted route.
- [ ] Validate all approved routes live before production rollout.

## Canonical References

- `examples/workflows/routed-review.json`: complete offline routed workflow.
- `src/core/routing.kujo`: filtering, ranking, decision, and evaluation contracts.
- `src/core/runner.kujo`: persistence, execution, retry, fallback, and resume behavior.
- `sdk_adapter.kujo` and `bridge_chat.kujo`: AI SDK bridge boundary.
- `tests/routing_tests.kujo`: executable routing behavior examples.
- `../ai-sdk/src/model_catalog.kujo`: model catalog construction and validation.
- `../agents-sdk/src/agents/core_types.kujo`: routable agent metadata and compatibility.
