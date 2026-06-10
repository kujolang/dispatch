# Common Patterns Cookbook

Copy-paste recipes for common eval scenarios.

## Enterprise Quickstart Bundles (Parity-Verified)

These bundles are ready to run as-is in this repository and are also covered by docs parity automation.

```bash
# CLI quality gate
kujo run main.kujo run examples/enterprise_cli_quality_gate.json --output-dir .eval_enterprise_cli --json

# API contract gate (parallel file-check fast path)
kujo run main.kujo run examples/enterprise_api_contract_gate.json --output-dir .eval_enterprise_api --parallel-workers 8 --json

# Agent output gate (parallel file-check fast path)
kujo run main.kujo run examples/enterprise_agent_output_gate.json --output-dir .eval_enterprise_agent --parallel-workers 8 --json

# Strict-enterprise policy preset with explicit allowlists
kujo run main.kujo run examples/strict_enterprise_policy_gate.json --output-dir .eval_enterprise_strict --json

# Sandbox-adjacent constrained profile for fixture-only paths
kujo run main.kujo run examples/sandbox_adjacent_policy_gate.json --output-dir .eval_sandbox_adjacent --json
```

### Risk-Tier Matrix

| Risk Tier | Preferred Bundle | Why |
|---|---|---|
| Tier 1 (local dev) | `examples/enterprise_cli_quality_gate.json` | Minimal policy friction and quick iteration cycle |
| Tier 2 (CI strict) | `examples/enterprise_api_contract_gate.json` | Strong contract assertions with scalable parallel file checks |
| Tier 3 (release gate) | `examples/strict_enterprise_policy_gate.json` | Fail-closed command/path/env posture for release workflows |
| Tier 3 (sandbox-adjacent) | `examples/sandbox_adjacent_policy_gate.json` | Tight fixture-only allowlists for constrained local execution |

```bash
# Inspect the effective policy for the release stage before rollout
kujo run main.kujo policy-explain examples/strict_enterprise_policy_gate.json --policy-stage release --json
```

Files:

- `examples/enterprise_cli_quality_gate.json`
- `examples/enterprise_api_contract_gate.json`
- `examples/enterprise_agent_output_gate.json`
- `examples/strict_enterprise_policy_gate.json`
- `examples/sandbox_adjacent_policy_gate.json`
- `examples/fixtures/api_contract_response.json`
- `examples/fixtures/agent_output_result.json`

## Testing a CLI Tool

```json
{
  "name": "cli-quality",
  "tests": [
    {"name": "help works", "check": "command_succeeds", "params": {"command": "mytool --help"}},
    {"name": "help shows usage", "check": "output_contains", "params": {"command": "mytool --help", "expected": "Usage"}},
    {"name": "invalid flag fails", "check": "command_fails", "params": {"command": "mytool --bad-flag"}},
    {"name": "version matches", "check": "output_contains", "params": {"command": "mytool --version", "expected": "1."}},
    {"name": "config file created", "check": "file_exists", "params": {"path": "./config.json"}}
  ]
}
```

## Validating JSON Output

```json
{
  "name": "json-validation",
  "tests": [
    {"name": "output is valid JSON", "check": "json_matches_shape", "params": {"path": "./output.json", "required_keys": ["status", "data"]}},
    {"name": "status is success", "check": "json_value_equals", "params": {"path": "./output.json", "json_path": "status", "expected": "ok"}},
    {"name": "data not empty", "check": "file_size_greater_than", "params": {"path": "./output.json", "bytes": 20}}
  ]
}
```

## Performance Regression Testing

```json
{
  "name": "perf-regression",
  "tests": [
    {"name": "build under 30s", "check": "command_timing_less_than", "params": {"command": "make build", "max_ms": 30000}},
    {"name": "test suite under 60s", "check": "command_timing_less_than", "params": {"command": "make test", "max_ms": 60000}},
    {"name": "binary not too large", "check": "file_size_less_than", "params": {"path": "./dist/binary", "bytes": 52428800}}
  ]
}
```

## Snapshot Testing Workflow

```bash
# First run: create baseline snapshots
kujo run main.kujo run --update-snapshots

# Subsequent runs: compare against snapshots
kujo run main.kujo run

# If changes are intentional, update snapshots
kujo run main.kujo run --update-snapshots
```

```json
{
  "name": "snapshot-testing",
  "tests": [
    {"name": "CLI help output stable", "check": "snapshot_matches", "params": {"name": "help-output", "command": "mytool --help"}},
    {"name": "API response stable", "check": "snapshot_matches", "params": {"name": "api-response", "command": "curl -s https://api.example.com/health"}}
  ]
}
```

## CI Pipeline Integration

```yaml
# GitHub Actions
- name: Run Eval Suite
  run: kujo run main.kujo run --quiet --json

# GitLab CI
eval:
  script:
    - kujo run main.kujo run --quiet --json

# Jenkins
stage('Eval') {
  steps {
    sh 'kujo run main.kujo run --quiet --json'
  }
}
```

## Testing an Agent's Output

```json
{
  "name": "agent-output-check",
  "tests": [
    {"name": "output file exists", "check": "file_exists", "params": {"path": "./agent_output/result.json"}},
    {"name": "valid JSON", "check": "json_matches_shape", "params": {"path": "./agent_output/result.json", "required_keys": ["answer", "sources"]}},
    {"name": "has answer", "check": "file_line_count", "params": {"path": "./agent_output/result.json", "expected": 4, "comparison": "greater_than"}},
    {"name": "no error keywords", "check": "file_does_not_contain", "params": {"path": "./agent_output/result.json", "expected": "error"}},
    {"name": "matches baseline", "check": "snapshot_matches", "params": {"name": "agent-baseline", "path": "./agent_output/result.json"}}
  ]
}
```

## Directory Content Validation

```json
{
  "name": "build-artifacts",
  "tests": [
    {"name": "dist dir has binaries", "check": "directory_contains", "params": {"dir": "./dist", "pattern": ".exe", "min_files": 1}},
    {"name": "two builds identical", "check": "two_files_equal", "params": {"path_a": "./dist/v1/binary", "path_b": "./dist/v2/binary"}},
    {"name": "dist not empty", "check": "directory_contains", "params": {"dir": "./dist", "min_files": 3}}
  ]
}
```

## Flaky Test Handling

```json
{
  "name": "flaky-tests",
  "tests": [
    {"name": "sometimes-fails network call", "check": "http_status", "params": {"url": "https://api.example.com/health", "expected_status": 200}, "retry": 2},
    {"name": "race-condition check", "check": "file_exists", "params": {"path": "./output/async_result.json"}, "retry": 3}
  ]
}
```

Run with `--repeat 5` to detect intermittently failing tests over multiple runs.

## Multi-Tag Filtering

```json
{
  "name": "tagged-suite",
  "tests": [
    {"name": "smoke test", "check": "file_exists", "params": {"path": "kennel.toml"}, "tags": ["smoke", "fast"]},
    {"name": "integration test", "check": "command_succeeds", "params": {"command": "make test"}, "tags": ["integration", "slow"]},
    {"name": "critical path", "check": "command_succeeds", "params": {"command": "echo critical"}, "tags": ["critical", "fast"]}
  ]
}
```

```bash
# Run only fast tests
kujo run main.kujo run --tags fast

# Run all except slow tests
kujo run main.kujo run --skip-tags slow
```
