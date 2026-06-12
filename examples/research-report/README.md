# Research Report Example

This directory is the canonical local fixture corpus for the built-in `research-report` workflow.

- `sources/` contains small markdown source fixtures used by `demo` and tests.
- These files are hand-authored fixture inputs, not generated output.
- Keep fixture text concise and stable so examples stay copyable and tests remain deterministic.

Run the example from the repository root:

```bash
kujo run --interpreter dispatch.kujo demo "Agent workflow reliability" --workflow research-report --yes --non-interactive
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
