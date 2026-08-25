# Upgrading Dispatch from 1.0 to 1.1

Dispatch 1.1 adds opt-in deterministic agent, provider, and model routing. Existing workflows remain static unless they explicitly set `routing.enabled` to `true`; existing run-state fields and command behavior remain compatible.

## Install or Update

The router is in the ecosystem installer's `ai` profile, not the default core profile:

```bash
curl -fsSL https://raw.githubusercontent.com/kujolang/kujo/main/install.sh \
  | bash -s -- --group ai

export PATH="$HOME/.local/bin:$PATH"
dispatch version
```

The AI profile includes Dispatch, AI SDK, and Agents SDK. The installed command shim supplies `DISPATCH_ROOT`, `AI_SDK_PATH`, and the bridge path automatically. `--with-deps` is not required for routing.

For source checkouts, update Dispatch and AI SDK together and set `AI_SDK_PATH=/path/to/ai-sdk` before live calls.

## Adopt Routing Incrementally

1. Keep the existing `agent.model` field as the legacy/default route.
2. Add `handler_id`, a versioned `execution_contract`, `capabilities`, and `model_candidates` to routed agents.
3. Generate a catalog with `ai-sdk/scripts/generate_model_catalog.kujo`; do not hand-edit its `catalog_hash`.
4. Reference the catalog with `routing.model_catalog_file` and enable routing.
5. Run `dispatch validate`, `dispatch explain-route`, and the fixture workflow before enabling live calls.
6. Set `DISPATCH_OFFLINE_FIXTURE=false`, configure provider credentials in the environment, and run `dispatch validate --live`.

See the repository-root `HOWTO.md` for complete schemas, fallback behavior, human review, artifact inspection, and troubleshooting.

## Compatibility and Operational Notes

- Routing policy version `1.0.0` and objective `quality_first` are the supported router contracts in Dispatch 1.1.
- A catalog content change requires a new canonical hash and should use a new catalog version.
- Resume reuses the persisted route. If the handler, execution contract, provider/model, or catalog hash no longer matches, Dispatch fails explicitly instead of silently rerouting.
- Same-route retries and provider/model fallbacks are separately bounded and separately recorded.
- Workflow files, model catalogs, and output roots retain Dispatch's existing path-safety controls.
- Provider secrets belong only in environment variables. Dispatch redacts credential values from persisted workflow state and never stores API-key values.

## Rollback

To stop using routing without changing the installed version, set `routing.enabled` to `false` or run a legacy workflow that omits routing. Dispatch will use the requested agent's existing `model` configuration.
