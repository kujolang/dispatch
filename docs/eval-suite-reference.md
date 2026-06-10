# Eval Suite Reference

Complete reference for the `eval.json` suite configuration format.

## Top-Level Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | — | Suite name, used in report titles |
| `description` | string | No | `""` | Human-readable suite description |
| `version` | string | No | `"0.0.0"` | Suite version for tracking |
| `output_dir` | string | No | `"./eval_results"` | Directory for report output |
| `snapshot_dir` | string | No | `"./snapshots"` | Directory for snapshot files |
| `timeout_seconds` | int | No | — | Suite-level timeout budget (seconds) propagated to command checks; timed-out commands are terminated. |
| `parallel_workers` | int | No | `1` | Opt-in worker count for independent file-check parallel fast path. `1` keeps serial execution. |
| `policy_profile` | string | No | `""` | Optional preset: `strict-ci`, `local-dev`, or `release-gate` |
| `require_command_policy` | bool | No | `false` | When true, command-backed checks in enforced stages (`ci`/`release`) require allowlist policy inputs. |
| `path_policy_mode` | string | No | `"open"` | Path policy mode: `open` or `allowlist-required`. In enforced stages, `allowlist-required` fails closed unless allowlists are present. |
| `allowed_commands` | array | No | `[]` | Explicit command allowlist. |
| `allowed_command_patterns` | array | No | `[]` | Command pattern allowlist (substring or token mode). |
| `blocked_arg_patterns` | array | No | `[]` | Denied argument/pattern substrings evaluated before command execution. |
| `allowed_paths` | array | No | `[]` | Path allowlist used by file-backed/path-backed checks. |
| `allowed_env_vars` | array | No | `[]` | Environment variable allowlist for `env_var_equals`. |
| `redaction_audit_mode` | bool | No | `false` | Include redaction telemetry fields in command-check details. |
| `redact_output_patterns` | array | No | `[]` | Organization-specific output redaction patterns layered on built-ins. |
| `policy_stage_overlays` | object | No | `{}` | Stage-specific policy overrides keyed by `local`, `ci`, `release` (selected via `--policy-stage` or `KUJO_EVAL_POLICY_STAGE`) |
| `stop_on_failure` | bool | No | `false` | Halt suite on first failure |
| `history_retention_runs` | int | No | `200` | Max entries retained in `history.json` |
| `aux_artifact_retention_files` | int | No | `25` | Max auxiliary backup artifacts (`*.bak`) retained in output dir |
| `artifact_checksums` | bool | No | `false` | Include SHA-256 checksums in `artifact-manifest.json` for generated artifacts |
| `tests` | array | Yes | — | Array of test definitions |

## Test Definition

Each test in the `tests` array:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Test name for reporting |
| `description` | string | No | Optional test description |
| `check` | string | Yes | Check type (see below) |
| `params` | object | Yes | Check-specific parameters |
| `skip` | bool | No | Set `true` to skip this test |
| `retry` | int | No | Number of retries on failure (default: 0) |
| `timeout_seconds` | int | No | Per-test timeout budget (seconds) for command checks; overrides suite `timeout_seconds` when set |
| `tags` | array | No | String tags for filtering (`--tags`, `--skip-tags`) |
| `depends_on` | array | No | Test dependency names; if any dependency fails, this test is skipped |

## Check Parameters

### `command_succeeds`

```json
{
  "check": "command_succeeds",
  "params": {
    "command": "echo hello"
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes | Shell command to execute |

### `command_fails`

```json
{
  "check": "command_fails",
  "params": {
    "command": "exit 1"
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes | Shell command expected to fail |

### `exit_code_equals`

```json
{
  "check": "exit_code_equals",
  "params": {
    "command": "my-tool validate",
    "expected": 2
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes | Shell command to execute |
| `expected` | int | Yes | Expected exit code |

### `file_exists`

```json
{
  "check": "file_exists",
  "params": {
    "path": "./output/result.txt"
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | File path to check |

### `file_does_not_exist`

```json
{
  "check": "file_does_not_exist",
  "params": {
    "path": "./output/temp.txt"
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | File path that should NOT exist |

### `file_contains`

```json
{
  "check": "file_contains",
  "params": {
    "path": "./output/log.txt",
    "expected": "SUCCESS"
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | File path to read |
| `expected` | string | Yes | Substring to find in file |

### `file_does_not_contain`

```json
{
  "check": "file_does_not_contain",
  "params": {
    "path": "./output/log.txt",
    "expected": "ERROR"
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | File path to read |
| `expected` | string | Yes | Substring that should NOT be in file |

### `output_contains`

```json
{
  "check": "output_contains",
  "params": {
    "command": "my-tool status",
    "expected": "running"
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes | Shell command to execute |
| `expected` | string | Yes | Substring expected in stdout |

### `output_does_not_contain`

```json
{
  "check": "output_does_not_contain",
  "params": {
    "command": "my-tool status",
    "expected": "ERROR"
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes | Shell command to execute |
| `expected` | string | Yes | Substring that should NOT be in stdout |

### `json_matches_shape`

```json
{
  "check": "json_matches_shape",
  "params": {
    "path": "./output/data.json",
    "required_keys": ["id", "name", "status"]
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Conditionally | Path to JSON file (or use `json`) |
| `json` | string | Conditionally | Inline JSON string (or use `path`) |
| `required_keys` | array | No | Required top-level keys |
| `shape` | string | No | Comma-separated key names (alternative to `required_keys`) |

### `snapshot_matches`

```json
{
  "check": "snapshot_matches",
  "params": {
    "name": "my-snapshot",
    "command": "my-tool --help",
    "snapshot_dir": "./snapshots",
    "update": "false"
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Snapshot identifier |
| `content` | string | Conditionally | Direct content to compare (or use `command`) |
| `command` | string | Conditionally | Command whose output to snapshot (or use `content`) |
| `snapshot_dir` | string | No | Snapshot storage directory |
| `update` | string | No | Set `"true"` to create/update snapshot |

### `directory_diff`

```json
{
  "check": "directory_diff",
  "params": {
    "dir_a": "./expected_output",
    "dir_b": "./actual_output"
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `dir_a` | string | Yes | First directory to compare |
| `dir_b` | string | Yes | Second directory to compare |

## Report Format

Reports are generated as Markdown with:

- Suite name and description
- Summary table (total, passed, failed, skipped, duration, pass rate)
- Overall pass/fail banner
- Per-test result table
- Detailed failure section with each failing test's parameters

## Exit Codes

- `0` — All tests passed
- `1` — One or more tests failed or configuration error

## JSON Output Mode

Use `--json` flag for machine-readable output:

## Runtime Mode Migration (VM-First)

Legacy command examples may show interpreter-first invocation:

```bash
kujo run main.ruff --interpreter run --json
```

Current default guidance is VM-first execution:

```bash
kujo run main.ruff run --json
```

Use interpreter mode only when validating compatibility behavior across runtimes or investigating runtime-specific warnings.

Migration mapping:

- Legacy: `kujo run main.ruff --interpreter <subcommand> ...`
- Preferred: `kujo run main.ruff <subcommand> ...`
- Optional parity run: `kujo run main.ruff --interpreter <subcommand> ...`

For CI automation, prefer VM-first commands and validate pass/fail via exit code plus artifact outputs (`summary.json`, `artifact-manifest.json`).

```bash
kujo run main.ruff run --json
```

Output shape:

```json
{
  "ok": true,
  "suite_name": "...",
  "passed": 10,
  "failed": 2,
  "skipped": 0,
  "total": 12,
  "duration_ms": 500,
  "test_results": [...]
}
```
