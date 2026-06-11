# Ecosystem Integration Guide

How Evalintegrates with other Kujo ecosystem tools.

## Kennel Package Workflow (G.1)

Eval uses Kennel-compatible package metadata for local/source workflows.

```bash
# Verify package manifest
cat kennel.toml

# Work with the package locally
kujo run main.kujo version
```

The `kennel.toml` manifest exports all 7 source modules:
- `common` — shared utilities (dict_get_or, normalize_*, make_result)
- `cli` — CLI argument parsing
- `core` — eval engine (run_suite, compare_runs)
- `checks` — 27 check implementations + security validators
- `report` — 5 report formats + GitHub summary
- `snapshot` — snapshot CRUD + diff
- `config` — config loading, validation, init

All modules export `describe_*_module()` for runtime contract discovery (contract v2.0.0).

## Scout Integration (G.2)

Scout can analyze a codebase and generate eval suites automatically:

```bash
# Generate eval suite from codebase analysis
scout analyze ./my-project --output eval-suggestions.json

# Convert Scout suggestions to eval.json
kujo run main.kujo init --from-scout eval-suggestions.json
```

Scout detects:
- CLI entry points → `command_succeeds` checks
- Config files → `file_exists` checks  
- JSON output files → `json_matches_shape` checks
- Agent output patterns → `output_contains` checks

## Dispatch Integration (G.3)

Use Eval within Dispatch workflows as a quality gate:

```yaml
# dispatch.yaml
workflow:
  - name: build
    run: kujo build
  
  - name: eval-gate
    run: kujo run eval/main.kujo --interpreter run --quiet --json
    on_fail: halt
  
  - name: deploy
    run: deploy.sh
    depends: [eval-gate]
```

Eval exits with code 1 on any test failure, making it a natural quality gate in Dispatch pipelines.

## RAG Integration (G.4)

Eval results can feed into RAG quality scoring:

```python
# Example: score RAG responses using eval
def score_rag_response(query, response):
    # Write response to temp file for eval
    write_file("/tmp/rag_output.json", response)
    
    # Run eval suite against the output
    result = eval.run_suite("rag_quality_suite.json")
    
    # Extract quality metrics
    return {
        "pass_rate": result.passed / result.total,
        "score": result.passed / result.total * 100
    }
```

Example `rag_quality_suite.json`:
```json
{
  "name": "RAG Quality",
  "tests": [
    {"name": "output is valid JSON", "check": "json_matches_shape", "params": {"path": "/tmp/rag_output.json", "required_keys": ["answer", "sources", "confidence"]}},
    {"name": "confidence above threshold", "check": "command_stdout_json_path_equals", "params": {"command": "cat /tmp/rag_output.json", "json_path": "confidence", "expected": "high"}},
    {"name": "sources not empty", "check": "file_line_count", "params": {"path": "/tmp/rag_output.json", "expected": 4, "comparison": "greater_than"}}
  ]
}
```
