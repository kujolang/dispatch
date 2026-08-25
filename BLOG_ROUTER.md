# Introducing Deterministic Agent and Model Routing in Dispatch

AI workflows usually start with a hard-coded model: one agent, one provider, one model. That is simple, but it becomes fragile as soon as a team needs different quality levels, provider restrictions, cost or latency limits, resumable runs, or a reliable fallback plan.

Dispatch now has an opt-in, policy-driven router for that job. Instead of asking a model to decide which model should run next, Dispatch makes the decision itself from explicit workflow policy and a versioned model catalog. The result is deterministic, persisted, and inspectable.

That distinction matters. Routing is part of the control plane, so it should behave like control-plane software: the same inputs produce the same choice, disallowed routes never become candidates, retries and fallbacks are visible, and a resumed run does not quietly change providers.

## What the Router Chooses

For a routed agent step, Dispatch chooses a complete execution route:

- the agent definition;
- the compatible runtime handler;
- the provider;
- the model.

The workflow supplies the allowed model candidates and policy constraints. The AI SDK supplies trustworthy metadata about those models. Dispatch combines the two, removes anything that violates a hard requirement, and ranks what remains with a stable quality-first policy.

Possible constraints include provider allowlists and denylists, minimum quality, required context size, tool or structured-output support, maximum cost, maximum latency, minimum reliability, data residency, and risk limits. Candidate declaration order does not determine the winner.

When two candidates are otherwise similar, Dispatch uses documented tie-breakers all the way down to a stable route key. There is no hidden model call and no probabilistic classifier in the selection path.

## The Primitives Working Together

The feature crosses three Kujo AI primitives, but each one keeps a clear responsibility.

### Kujo

Kujo is the language runtime and CLI beneath the system. It runs Dispatch and the SDK bridge, provides the module and process primitives used by the implementation, and keeps the local fixture path easy to execute without a separate application server.

### Dispatch

Dispatch owns the routing decision and the workflow lifecycle around it. Its routing module merges constraints, filters and ranks candidates, persists decisions, separates same-route retries from route fallback, and records evaluation results.

The router also connects to Dispatch's existing primitives:

- **Workflow loader:** reads agent metadata, routing policy, step constraints, and deterministic evaluation rules.
- **Agent registry and plugins:** resolves the requested agent and any explicitly permitted compatible substitutes.
- **Runner:** selects and saves a route before executing the step.
- **Retry policy:** retries the same route without pretending it is a fallback.
- **Evaluation:** can accept output, retry it, upgrade to another route, fail the step, or request human review.
- **State and resume:** restores the exact persisted route and fails explicitly if that route is no longer available.
- **Trace and reports:** expose candidate rejections, route selection, attempts, fallbacks, and model-call lifecycle events.
- **AI SDK bridge:** performs the selected live provider/model call without duplicating provider logic inside Dispatch.

Existing workflows are unaffected. Routing only runs when a workflow sets `routing.enabled` to `true`; otherwise the agent's existing `model` configuration remains the source of truth.

### AI SDK

The AI SDK owns provider integration and the model catalog contract. It provides helpers for building a versioned catalog with quality, context, capability, cost, latency, reliability, and provenance metadata, then calculates a canonical hash for that catalog.

Dispatch validates the catalog and its hash before using it. This prevents workflows from quietly overriding shared model facts and gives every recorded decision a precise catalog identity. For live execution, Dispatch's bridge also relies on AI SDK provider presets and request behavior rather than growing a second provider stack.

### Agents SDK

The Agents SDK defines the shared agent-side vocabulary used by the router: `handler_id`, versioned `execution_contract`, `capabilities`, `model_candidates`, and routing metadata.

That common contract lets Dispatch reason about whether a substitute agent is actually compatible. A different display name or role is not enough: it must use the same handler or match the original execution contract exactly. Agents SDK is the contract owner, while Dispatch remains the runtime owner of route selection.

Agents SDK is not imported to execute an ordinary Dispatch workflow. It is needed when building or sharing agents through the SDK, and it provides the canonical vocabulary that Dispatch supports.

## How a Routed Step Runs

The sequence is deliberately straightforward:

1. Dispatch merges workflow, agent, and step constraints.
2. It resolves the requested agent and any compatible substitutes allowed by policy.
3. It expands each agent's model candidates against the approved AI SDK catalog.
4. It rejects every candidate that violates a hard constraint.
5. It ranks the eligible candidates with the stable quality-first policy.
6. It persists the decision before making the model call.
7. It executes the selected handler with the selected provider and model.
8. It evaluates the result when the step defines an evaluation contract.
9. It either accepts the output, retries the same route, or performs a bounded and recorded fallback.

If no candidate qualifies, the step fails with `no_route_available` and structured rejection reasons. If a persisted route is missing or incompatible during resume, Dispatch fails with `persisted_route_unavailable` instead of silently choosing a replacement.

This creates a useful audit chain: what was requested, which candidates were considered, why each candidate passed or failed, what was selected, what happened during execution, and whether a later fallback occurred.

## What You Need to Install

The Kujo ecosystem installer has separate profiles. The default install is `core` plus `operating`; the routing stack is in the optional `ai` profile.

| Component | Needed for | In the default core install? | Installation notes |
| --- | --- | --- | --- |
| Kujo runtime | Running Dispatch and its bridge | Yes | Installed by the default profile. |
| Dispatch | Workflow routing, persistence, retries, evaluation, and evidence | No | Included in `--group ai`; the installer adds a `dispatch` command shim. |
| AI SDK | Catalog generation and live provider calls | No | Included in `--group ai`. Live calls also need provider credentials and `AI_SDK_PATH` when working from source checkouts. |
| Agents SDK | Authoring portable agents with the shared routing vocabulary | No | Included in `--group ai`. It is not a runtime dependency for a plain Dispatch workflow. |
| Provider credentials | Calling live providers | No | Not needed for the offline fixture example. Supply keys through environment variables, never workflow JSON. |
| `jq` | Convenient artifact inspection | No | Optional; Dispatch does not require it to route or run. |

Install the complete AI profile with the ecosystem installer:

```bash
curl -fsSL https://raw.githubusercontent.com/kujolang/kujo/main/install.sh \
  | bash -s -- --group ai

export PATH="$HOME/.local/bin:$PATH"
dispatch --help
```

The `ai` profile installs source snapshots of AI SDK, Agents SDK, Dispatch, Watchdog, MCP, RAG, and Relay under `~/.kujo/sources/`. It installs stable command shims for the CLI-bearing tools, including `dispatch`. You do not need `--with-deps` for the Dispatch router; that option is for repositories with optional Node dependencies.

If you already have the repositories checked out for development, the minimum offline setup is the Kujo runtime plus Dispatch. Run the fixture example from the Dispatch repository:

```bash
kujo run dispatch.kujo demo "Routing review" \
  --workflow-file examples/workflows/routed-review.json \
  --yes \
  --non-interactive
```

The example uses fixture models, so it does not send data to a provider and does not need API keys.

For live calls from source checkouts, point Dispatch at AI SDK and turn fixture mode off:

```bash
export AI_SDK_PATH=/path/to/ai-sdk
export DISPATCH_OFFLINE_FIXTURE=false
export OPENAI_API_KEY=...

kujo run dispatch.kujo demo "Live routed review" \
  --workflow-file /path/to/live-routed-workflow.json \
  --yes \
  --non-interactive
```

The bridge currently recognizes `openai`, `openrouter`, and `deepseek`, plus `custom` for an OpenAI-compatible endpoint. Only configure credentials for providers included in your approved catalog. Before production use, test every allowed route with the real credentials, network policy, and provider limits; an offline fixture proves routing behavior, not external provider availability.

## A Small Policy Example

The model catalog should be generated with AI SDK so its canonical hash is correct. A routed workflow then references that catalog and adds policy:

```json
{
  "routing": {
    "enabled": true,
    "policy_version": "1.0.0",
    "objective": "quality_first",
    "allow_agent_substitution": false,
    "constraints": {
      "quality_floor": "standard",
      "min_reliability": 0.98
    },
    "fallback": {
      "max_fallbacks": 1,
      "max_evaluation_retries": 1
    },
    "model_catalog": {
      "schema_name": "ai-sdk-model-catalog",
      "schema_version": "1.0.0",
      "id": "approved-production-models",
      "version": "1",
      "catalog_hash": "generated-by-ai-sdk",
      "models": []
    }
  },
  "steps": [
    {
      "id": "write",
      "type": "agent",
      "agent_id": "writer",
      "routing": {
        "constraints": {
          "allowed_providers": ["openai"],
          "max_latency_ms": 2000
        }
      },
      "evaluation": {
        "required_fields": ["summary"],
        "on_failure": "upgrade_model"
      }
    }
  ]
}
```

Workflow-wide rules establish the default boundary. Agent and step rules can narrow that boundary, but cannot loosen it. The current router supports policy version `1.0.0` and the `quality_first` objective; unsupported versions fail explicitly.

## Inspecting What Happened

Routing evidence appears alongside the rest of a Dispatch run:

- `state.json` stores route decisions, attempts, and per-step route state;
- `trace.json` and `trace.md` show the route and model-call timeline;
- `report.json` includes routing evidence when a report is generated;
- `dispatch inspect <run-id> --json` exposes a routing envelope for automation.

The artifacts retain useful metadata while applying Dispatch's existing sensitive-field redaction. API keys and authorization values do not belong in a workflow or model catalog.

## Why This Design

The goal is not automatic model switching at any cost. The goal is predictable choice inside an explicit operating policy.

Keeping catalog facts in AI SDK avoids a second provider registry. Keeping agent contracts aligned with Agents SDK avoids Dispatch-specific agent definitions. Keeping the actual decision in Dispatch makes it resumable and auditable with the workflow that used it. Keeping the router deterministic makes the outcome testable without another AI system sitting in judgment over it.

This first version is intentionally bounded. Human-review evaluation produces an explicit `route_human_review_required` outcome for the caller to handle; it does not silently turn that result into a native Dispatch pause. That boundary is visible rather than implied.

## Try It

Start with the fixture workflow, inspect the route evidence, and then replace its generated catalog and candidates with the models your organization has approved. Routing is opt-in, so it can be introduced one workflow at a time.

For the complete configuration and troubleshooting guide, see [HOWTO.md](HOWTO.md). For an executable starting point, see [examples/workflows/routed-review.json](examples/workflows/routed-review.json).

### Short Share Copy

> New in Dispatch: deterministic, policy-driven agent and model routing. Dispatch filters and ranks routes from an AI SDK model catalog, persists the decision before execution, separates retries from fallback, and restores the same route on resume. It is opt-in, fixture-testable, and auditable end to end. Built across Kujo, Dispatch, AI SDK, and the Agents SDK contract vocabulary. Read the introduction, then run the included routed-review workflow.
