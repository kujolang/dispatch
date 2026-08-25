# Dispatch Architecture And Extension Diagrams

This document provides visual diagrams for runtime flow and extension surfaces.

## Runtime Flow

```mermaid
flowchart TD
	A[dispatch.kujo CLI] --> B[src/cli/cli_args.kujo]
	B --> C[src/workflows/workflow.kujo]
	C --> D[src/core/state.kujo create_run_state]
	D --> E[src/core/runner.kujo run_workflow]
	E --> RT[src/core/routing.kujo resolve and persist route]
	RT --> CAT[AI SDK versioned model catalog]
	RT --> AG[Agents SDK-compatible agent metadata]
	RT --> H[src/agents/agent.kujo handler execution]
	E --> F[src/core/approval.kujo]
	E --> G[src/core/retry.kujo]
	E --> H[src/agents/agent.kujo]
	E --> I[src/tools/tool.kujo]
	I --> J[src/tools/source_lookup.kujo]
	I --> K[src/tools/content_processing.kujo]
	I --> L[src/tools/reliability_tools.kujo]
	E --> M[src/core/report.kujo]
	E --> N[src/core/trace.kujo]
	E --> O[src/core/hooks.kujo]
	E --> P[src/core/state.kujo persist_run_state]
	P --> Q[state.json]
	P --> R[trace.json and trace.md]
	P --> S[report.md and report.json]
```

## Extension Points

```mermaid
flowchart LR
	A[Workflow Template Extension] --> A1[src/workflows/workflow.kujo]
	A1 --> A2[Template ID routed by demo/resume --workflow]

	B[Tool Extension] --> B1[src/tools/tool.kujo]
	B1 --> B2[Payload adapters and handler registration]
	B2 --> B3[Invoked by runner tool steps]

	C[Plugin Extension] --> C1[src/core/plugins.kujo]
	C1 --> C2[Inject tools and agent handlers]
	C2 --> C3[Applied before runtime execution]

	D[Policy Extension] --> D1[src/core/tool_policy.kujo]
	D1 --> D2[Profile aliases and allow/deny logic]
	D2 --> D3[Consumed by dispatch CLI policy resolution]

	E[Reporting And Trace Extension] --> E1[src/core/report.kujo]
	E1 --> E2[src/core/trace.kujo]
	E2 --> E3[Artifacts and observability outputs]

	F[Routing Policy Extension] --> F1[src/core/routing.kujo]
	F1 --> F2[Hard constraints and stable quality-first ranking]
	F2 --> F3[Persisted decision, evaluation, and bounded fallback]
```

## Notes

- The default execution path uses `src/` modules.
- CLI commands in `dispatch.kujo` are the integration boundary for workflow runtime, policy controls, and artifact lifecycle.
- Routing is opt-in and backward compatible. Dispatch owns decisions, AI SDK owns the versioned model catalog, and Agents SDK supplies the shared agent metadata vocabulary.
- A resumed step reuses its persisted route and fails explicitly when its catalog, route, execution handler, or plugin is no longer available.
