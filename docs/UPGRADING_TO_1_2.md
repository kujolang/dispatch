# Upgrading Dispatch from 1.1 to 1.2

Dispatch 1.2 packages the deterministic routing, reliability, lifecycle, artifact, and installation hardening shipped after 1.1. Existing workflows remain compatible.

## Install or Update

Install the router through its pinned release dependency closure, not a moving ecosystem profile:

```bash
curl -fsSL https://raw.githubusercontent.com/kujolang/kujo/123542ba17a0ef0150970a6c626b518946ff0bbb/install.sh \
  | bash -s -- --package dispatch \
      --release-manifest https://raw.githubusercontent.com/kujolang/dispatch/v1.2.0/release/dispatch-v1.2.0.refs

export PATH="$HOME/.local/bin:$PATH"
dispatch version
```

The manifest pins Kujo, Dispatch, AI SDK, and Agents SDK as one tested unit. The installed command shim supplies `DISPATCH_ROOT`, `AI_SDK_PATH`, and the bridge path automatically. `--with-deps` is not required for routing.

For source checkouts, update Dispatch and AI SDK together and set `AI_SDK_PATH=/path/to/ai-sdk` before live calls.

## Adopt Routing Incrementally

1. Keep the existing `agent.model` field as the legacy/default route.
2. Add `handler_id`, a versioned `execution_contract`, `capabilities`, and `model_candidates` to routed agents.
3. Generate a catalog with `ai-sdk/scripts/generate_model_catalog.kujo`; do not hand-edit its `catalog_hash`.
4. Reference the catalog with `routing.model_catalog_file` and enable routing.
5. Run `dispatch validate`, `dispatch explain-route`, and a workflow with `DISPATCH_OFFLINE_FIXTURE=true` before enabling live calls.
6. Unset `DISPATCH_OFFLINE_FIXTURE`, configure provider credentials in the environment, and run `dispatch validate --live`.

See the repository-root `HOWTO.md` for complete schemas, fallback behavior, human review, artifact inspection, and troubleshooting.

## Compatibility and Operational Notes

- Routing policy version `1.0.0` supports deterministic `quality_first`, `cost_first`, `latency_first`, and `balanced` objectives.
- Run-state schema v1 loads automatically as schema v2. The persisted migration ledger records the additive revision/budget/provider-health backfill; keep a pre-upgrade backup until representative resumes complete.
- Fixture model calls now require explicit `DISPATCH_OFFLINE_FIXTURE=true`; an unset value fails closed into live configuration checks.
- Bundle signatures are now standard HMAC-SHA256 (`hmac-sha256-v1`) with constant-time verification. Re-export bundles created with the old custom schemes.
- Optional workflow budgets, bounded `parallel_safe` tool execution, durable webhook delivery, SQLite state authority, streaming event artifacts, and OTLP JSON traces require no changes to legacy static workflows.
- A catalog content change requires a new canonical hash and should use a new catalog version.
- Resume reuses the persisted route. If the handler, execution contract, provider/model, or catalog hash no longer matches, Dispatch fails explicitly instead of silently rerouting.
- Same-route retries and provider/model fallbacks are separately bounded and separately recorded.
- Workflow files, model catalogs, and output roots retain Dispatch's existing path-safety controls.
- Provider secrets belong only in environment variables. Dispatch redacts credential values from persisted workflow state and never stores API-key values.

## Rollback

To stop using routing without changing the installed version, set `routing.enabled` to `false` or run a legacy workflow that omits routing. Dispatch will use the requested agent's existing `model` configuration.
