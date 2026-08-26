# Dispatch Quickstart Walkthrough

An end-to-end tour you can run offline in under a minute, with no provider
credentials. It showcases the orchestration engine, a human approval gate,
resume, signed bundle export/import, and a user-authored workflow.

All commands use the default warning-free VM path (`kujo run dispatch.kujo ...`).
Set `KUJO_BIN` to your Kujo binary if `kujo` is not on `PATH`.

```bash
export DISPATCH_OFFLINE_FIXTURE=true
WORK=tests/tmp/quickstart
rm -rf "$WORK"
```

## 1. See available templates

```bash
kujo run dispatch.kujo templates
```

You should see `research-report`, `crud-reliability`, and `approval-handoff`.

## 2. Run a workflow to completion

```bash
kujo run dispatch.kujo demo "How do AI workflows improve reliability?" \
  --yes --non-interactive --output-root "$WORK"
```

Outputs a `Status: completed` run with `report.md`, `report.json`, `state.json`,
`trace.json`, and `trace.md` under `$WORK/<run-id>/`.

## 3. Pause at a human approval gate, then resume

```bash
# Pause: omit --yes so the run stops at the approval gate.
kujo run dispatch.kujo demo "Release readiness review" \
  --non-interactive --output-root "$WORK"     # -> Status: paused

# Grab the paused run id, then resume with approval.
RID=$(kujo run dispatch.kujo runs --output-root "$WORK" --status paused --json \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["runs"][0]["run_id"])')
kujo run dispatch.kujo resume "$RID" --yes --output-root "$WORK"   # -> Status: completed
```

## 4. Inspect and catalog runs

```bash
kujo run dispatch.kujo runs --output-root "$WORK" --json
kujo run dispatch.kujo inspect "$RID" --output-root "$WORK" --json
kujo run dispatch.kujo doctor --output-root "$WORK" --json
```

## 5. Export a cryptographically signed bundle and verify it

```bash
export DISPATCH_BUNDLE_SIGNING_KEY=demo-signing-key
kujo run dispatch.kujo export-run "$RID" \
  --bundle-path "$WORK/bundle.json" --sign-bundle --output-root "$WORK"

kujo run dispatch.kujo import-run \
	--bundle-path "$WORK/bundle.json" \
  --output-root "$WORK/imported"
```

Tamper with `$WORK/bundle.json` and re-run the import to see a deterministic
`invalid_bundle_signature` failure.

## 6. Run a user-authored workflow from a JSON spec

```bash
kujo run dispatch.kujo demo "Custom review topic" \
  --yes --non-interactive --output-root "$WORK/custom" \
  --workflow-file examples/workflows/custom-review.json
```

## 7. Stream lifecycle events and try a plugin

```bash
# Append every lifecycle event to a local JSONL sink.
kujo run dispatch.kujo demo "Observed run" --yes --non-interactive \
  --output-root "$WORK/obs" --webhook-sink "$WORK/obs/events.jsonl"

# Apply a built-in plugin (adds a sample tool + agent handler + event hook).
kujo run dispatch.kujo demo "Plugin run" --yes --non-interactive \
  --output-root "$WORK/plug" --plugin sample
```

## Clean up

```bash
rm -rf "$WORK"
```

That is the full control loop: template selection, multi-step execution,
approval gate, resume, cataloging, signed handoff, declarative authoring, and
observability — all offline.
