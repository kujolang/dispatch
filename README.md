# Eval

[![Version](https://img.shields.io/badge/version-0.3.1-blue)](https://github.com/kujolang/dispatch)
[![Contract](https://img.shields.io/badge/contract-v2.0.0-green)](https://github.com/kujolang/dispatch)
[![Checks](https://img.shields.io/badge/checks-27-orange)](https://github.com/kujolang/dispatch)
[![Tests](https://img.shields.io/badge/tests-7%20suites%20passing-brightgreen)](https://github.com/kujolang/dispatch)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

> **v0.1.0** | Contract v2.0.0 | 27 checks | 5 report formats | 14 CLI commands | 7 test suites | 5-layer controls

Evaluation framework for AI-native software — deterministic checks for agents, CLIs, files, snapshots, and workflow outputs.

Eval answers the question:

> Did the agent, workflow, model, generated output, or code change actually do the right thing?

Spec defines what should happen. Eval checks whether the work actually produced the expected evidence.

Eval is part of Kujo’s Control layer: measurable outcomes, repeatable checks, reviewable reports, and machine-readable evidence.

## Why This Exists

Every serious AI-native ecosystem needs evaluations. Without evals, agents are vibes. With evals, agents become software components that can be tested, trusted, compared, and improved.

Eval provides:

- **27 deterministic checks** — command success/failure, file existence/content/line count, JSON shape/value/path, HTTP status/body, regex, timing, snapshots, directory comparison, environment variables, and more.
- **5 report formats** — Markdown, HTML (collapsible details + summary cards), JUnit XML, TAP, and NDJSON streaming.
- **Snapshot testing** — store expected outputs and detect regressions with unified diff.
- **Run comparison** — compare two eval runs to detect improvements or regressions.
- **Retry support** — mark flaky tests with `"retry": N` to auto-retry on failure.
- **Dependency ordering** — declare `"depends_on": [...]` to skip tests when dependencies fail.
- **Enterprise policy presets** — use `"policy_profile": "strict-ci" | "local-dev" | "release-gate"` for fast onboarding.
- **Timing** — every run records `duration_ms`; `command_timing_less_than` check for perf regression.
- **Quiet/verbose modes** — `--quiet` suppresses per-test output (CI mode); `--verbose` prints full check details.
- **14 CLI commands** — init, run, report, compare, list-checks, snapshots, version, watch, lint, policy-explain, diff, export, verify-manifest, completion.
- **CI-ready** — non-zero exit on failure; JSON/NDJSON output; GitHub Actions step summary; shields.io badge.
- **Deterministic CI artifacts** — each run writes `summary.json` and `artifact-manifest.json` for machine consumers.
- **Machine summary channel** — run/report write `cli-summary.json` (or `--summary-channel-path`) as a stable automation handoff artifact.
- **Artifact integrity mode** — opt into SHA-256 checksums in `artifact-manifest.json` and verify with `verify-manifest`.
- **Parallel scale mode** — opt into `--parallel-workers` for independent file-check fast paths with deterministic ordering.
- **Retention controls** — bound output growth with `history_retention_runs` and `aux_artifact_retention_files`.
- **Security controls** — 5-layer defense: command allowlisting + pattern policy, path boundary enforcement, output redaction, config size/depth limits, max output truncation.
- **Command guardrails** — overly long command payloads are rejected before execution (`MAX_COMMAND_LENGTH`).
- **Fully local** — no API keys, no network dependencies, completely deterministic.

Kujo's core argument is that AI-native software needs new primitives. Eval is one of those primitives.

Traditional tests answer:

> Does this function return the expected value?

Eval answers:

> Did this agent or AI-assisted workflow produce the correct outcome under real project constraints?

## Requirements

- Kujo CLI/runtime available on your machine.
- No API keys or external services needed (fully local, deterministic).

## Containerized Usage

This repository includes a production-usable multi-stage `Dockerfile` that compiles the Kujo runtime from the pinned revision in `RUNTIME_VERSION`.

Build the image:

```bash
docker build -t kujo-eval:local .
```

Optionally override the runtime ref at build time:

```bash
docker build --build-arg KUJO_RUNTIME_REF=<tag-or-commit> -t kujo-eval:local .
```

Run a suite in the container:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace kujo-eval:local run
```

Generate a report in the container:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace kujo-eval:local report --format json --out eval_results/report.json
```

## Runtime Binary Selection (Important)

`kujo-eval` expects the Kujo language runtime binary, not the Python `kujo` linter command.

Recommended runtime for this repository:

```bash
export KUJO_BIN=./kujo
"$KUJO_BIN" --version
```

When running examples in this README, replace `kujo` with `"$KUJO_BIN"` if your shell resolves `kujo` to a different tool.

## VM-First Migration Note (Interpreter-Era Guidance)

Older repository docs and shell snippets may still show interpreter-era commands such as:

```bash
kujo run main.kujo --interpreter run <suite>
```

Current recommended default is VM-first execution:

```bash
kujo run main.kujo run <suite>
```

Use `--interpreter` only for runtime compatibility checks, warning investigations, or parity debugging.

Migration mapping:

- Legacy: `kujo run main.kujo --interpreter <command>`
- Preferred: `kujo run main.kujo <command>`
- Optional compatibility check: `kujo run main.kujo --interpreter <command>`

Interpreter mode can emit KUJORUN001 warning noise while still succeeding; rely on exit code plus generated artifacts (`summary.json`, `artifact-manifest.json`) for CI pass/fail decisions.

## Operational Watchdog Controls

Release and parity scripts include artifact-aware watchdogs to keep CI deterministic even when interpreter output capture behaves inconsistently.

Watchdog loops use portable `sleep` polling so behavior stays consistent across macOS and Linux shells.

- `scripts/release_quality_gates.sh`
  - `KUJO_EVAL_GATE_TIMEOUT_SECONDS` (default: `120`)
  - `KUJO_EVAL_BENCH_SUITE_BUDGET_MS` (default: `600`)
  - `KUJO_EVAL_BENCH_MEDIUM_SUITE_BUDGET_MS` (default: `3000`)
  - `KUJO_EVAL_BENCH_LARGE_SUITE_BUDGET_MS` (default: `8000`)
  - `KUJO_EVAL_BENCH_IO_HEAVY_SUITE_BUDGET_MS` (default: `12000`)
  - `KUJO_EVAL_REQUIRE_RELEASE_SIGNOFF` (default: `0`, set to `1` to require human approval)
  - `KUJO_EVAL_RELEASE_SIGNOFF_FILE` (default: `docs/release-signoff.md`)
- `scripts/cli_smoke_matrix.sh`
  - `KUJO_EVAL_CLI_SMOKE_INCLUDE_INTERPRETER` (default: `0`)
- `scripts/verify_artifact_contract.sh`
  - deterministic artifact shape/path verification for `summary.json`, `artifact-manifest.json`, and `cli-summary.json`
- `scripts/verify_docs_command_parity.sh`
  - `KUJO_EVAL_DOCS_WATCHDOG_TIMEOUT_SECONDS` (default: `120`)

Version note:

- Use `version` for the CLI version/contract output.
- `--version` is not implemented as a dedicated alias and falls back to help output.

Example:

```bash
export KUJO_BIN=./kujo
export KUJO_EVAL_GATE_TIMEOUT_SECONDS=180
export KUJO_EVAL_BENCH_SUITE_BUDGET_MS=600
export KUJO_EVAL_BENCH_MEDIUM_SUITE_BUDGET_MS=3000
export KUJO_EVAL_BENCH_LARGE_SUITE_BUDGET_MS=8000
export KUJO_EVAL_BENCH_IO_HEAVY_SUITE_BUDGET_MS=12000
export KUJO_EVAL_DOCS_WATCHDOG_TIMEOUT_SECONDS=180
scripts/cli_smoke_matrix.sh
scripts/verify_artifact_contract.sh
# Optional parity mode:
# KUJO_EVAL_CLI_SMOKE_INCLUDE_INTERPRETER=1 scripts/cli_smoke_matrix.sh --include-interpreter
scripts/release_quality_gates.sh
```

## Known Runtime Limitations

- Interpreter mode may print KUJORUN001 type-check warnings even when commands exit successfully.
- Command checks support native process timeout termination through `timeout_ms` and suite-level `timeout_seconds`.
- `watch` is intentionally long-running and should be interrupted manually in local shells.
- Command and file checks run in the host environment and are not a full sandbox boundary.
- Some interpreter invocations can stall when stdout/stderr is shell-captured; release/parity gate scripts mitigate this with artifact-driven watchdogs.

## Launch Scope Snapshot

Evalis verified for deterministic local and CI evaluation workflows where shell/file access is expected and controlled by repository policy.

It is not yet a universal fit for every enterprise testing context. Before broad rollout, evaluate the following constraints for your environment:

- Timeout enforcement depends on runtime support for `execute_status` timeout handling in your target Kujo build.
- No isolated sandbox boundary; commands execute with host-level permissions.
- Runtime warning noise in interpreter mode may require log filtering in strict observability pipelines.
- Feature roadmap items (LLM-as-judge, model-cost scoring, distributed execution) are intentionally out of current deterministic scope.

If your use case needs strict isolation, guaranteed process preemption, or non-local execution controls, place Evalbehind additional platform controls (container boundaries, workload policies, and external supervisors).

## Enterprise Deployment Patterns

Evalcan be deployed in enterprise CI/CD and platform workflows with a simple layered model:

1. **Runner boundary**: execute eval jobs in short-lived containers or isolated runners with least-privilege filesystem mounts.
2. **Command policy**: define `allowed_commands`, `allowed_command_patterns`, and `blocked_arg_patterns` at suite level; override only where needed at test level.
3. **Path policy**: scope file assertions using `allowed_paths` to explicitly owned workspace directories.
4. **Environment policy**: expose only approved variables and enforce with `allowed_env_vars`.
5. **Artifact policy**: keep report outputs (`--output-dir`) in per-run isolated folders and publish only required formats (JSON/JUnit/TAP/HTML/NDJSON).

Suggested rollout:

1. Start with `--json --quiet` in CI to establish deterministic pass/fail gates.
2. Add JUnit/TAP report publication for existing enterprise test dashboards.
3. Enforce suite-level command/path/env policy defaults before allowing per-test overrides.
4. Add external supervision for hard-kill guarantees on long-running processes until native runtime preemption support is available.

## Why Eval vs. Other Tools?

| Feature | Eval| Jest | Pytest | Bats |
|---------|-----------|------|--------|------|
| **Language** | Kujo | JavaScript | Python | Bash |
| **Dependencies** | Zero (Kujo runtime only) | npm + 100s packages | pip + plugins | Bash + helpers |
| **Deterministic** | ✅ Fully | ⚠️ JS runtime variance | ⚠️ Python env variance | ❌ Shell-dependent |
| **Command execution** | ✅ Native | ❌ Needs child_process | ❌ Needs subprocess | ✅ Native |
| **File checks** | ✅ 11 types | ❌ Needs custom matchers | ❌ Needs custom fixtures | ❌ Manual |
| **HTTP checks** | ✅ Built-in | ✅ With supertest | ✅ With requests | ❌ Needs curl |
| **Snapshot testing** | ✅ Built-in diff | ✅ Built-in | ✅ With syrupy | ❌ Manual |
| **Report formats** | 5 (md/html/junit/tap/ndjson) | 1 (CLI) | 2 (CLI + JUnit) | 1 (TAP) |
| **Security model** | ✅ 5-layer defense | ❌ None | ❌ None | ❌ None |
| **AI-native** | ✅ Purpose-built | ❌ Traditional | ❌ Traditional | ❌ Shell testing |
| **Install size** | < 1MB | ~50MB+ | ~30MB+ | ~2MB |

Eval fills a gap: it's a **deterministic, zero-dependency, AI-native evaluation framework** that tests outcomes (commands, files, JSON, HTTP) rather than code units. It's designed for agents, CLIs, and workflow outputs — not traditional unit tests.

## Quick Wins — Copy-Paste Examples

Three ready-to-use `eval.json` suites for common scenarios:

| Use Case | File | What It Tests |
|----------|------|---------------|
| Enterprise CLI quality gate | [`examples/enterprise_cli_quality_gate.json`](examples/enterprise_cli_quality_gate.json) | Policy-first CLI behavior checks, output assertions, repository file guards |
| Enterprise API contract gate | [`examples/enterprise_api_contract_gate.json`](examples/enterprise_api_contract_gate.json) | Fixture-backed API contract validation, JSON shape/value assertions, parallel file checks |
| Enterprise agent output gate | [`examples/enterprise_agent_output_gate.json`](examples/enterprise_agent_output_gate.json) | Policy-first agent output validation for structure/content/confidence and timing |
| Enterprise policy baseline | [`examples/policy_profile_release_gate.json`](examples/policy_profile_release_gate.json) | Profile-driven command/path/env policy defaults |
| Strict-enterprise policy example | [`examples/strict_enterprise_policy_gate.json`](examples/strict_enterprise_policy_gate.json) | Minimum-privilege command/path/env allowlists with redaction audit defaults |
| Sandbox-adjacent policy example | [`examples/sandbox_adjacent_policy_gate.json`](examples/sandbox_adjacent_policy_gate.json) | Constrained local policy boundaries for fixture-only command and file access |
| Mixed large-suite accounting | [`examples/large_suite_fixture.json`](examples/large_suite_fixture.json) | Tags, dependencies, retries, skip behavior |

Replace placeholders (URLs, file paths, tool names) with your actual values and run immediately.

See architecture and lifecycle diagrams in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Quick Start

```bash
# Initialize an eval suite
kujo run main.kujo init --name my-suite

# Run the suite (with optional flags)
kujo run main.kujo run

# Run with filtering and HTML output
kujo run main.kujo run --filter auth --format html

# Run quietly (CI mode — summary only)
kujo run main.kujo run --quiet --json

# Run with a compact one-line human summary
kujo run main.kujo run --summary-only

# Run explicit suite with isolated output directory (recommended for scripts)
kujo run main.kujo run examples/release_gate_suite.json --output-dir .eval_quickstart --json

# Enterprise quickstart bundles (policy-first)
kujo run main.kujo run examples/enterprise_cli_quality_gate.json --output-dir .eval_enterprise_cli --json
kujo run main.kujo run examples/enterprise_api_contract_gate.json --output-dir .eval_enterprise_api --parallel-workers 8 --json
kujo run main.kujo run examples/enterprise_agent_output_gate.json --output-dir .eval_enterprise_agent --parallel-workers 8 --json
kujo run main.kujo run examples/strict_enterprise_policy_gate.json --output-dir .eval_enterprise_strict --json
kujo run main.kujo run examples/sandbox_adjacent_policy_gate.json --output-dir .eval_sandbox_adjacent --json

# Emit machine summary channel to an explicit path for automation
kujo run main.kujo run examples/release_gate_suite.json --output-dir .eval_quickstart --summary-channel-path .eval_quickstart/run-channel.json --json

# Generate report artifacts (md/html/junit/tap/ndjson)
kujo run main.kujo report --format html
kujo run main.kujo report --format junit
kujo run main.kujo report --format tap

# Re-run and report explicit suite using isolated output directory
kujo run main.kujo report examples/release_gate_suite.json --rerun --output-dir .eval_quickstart --json

# Emit report machine summary channel to an explicit path
kujo run main.kujo report examples/release_gate_suite.json --rerun --output-dir .eval_quickstart --summary-channel-path .eval_quickstart/report-channel.json --json

# Enable manifest checksums and verify artifact integrity
kujo run main.kujo run examples/release_gate_suite.json --output-dir .eval_quickstart --artifact-checksums --json
kujo run main.kujo verify-manifest --output-dir .eval_quickstart --json

# List available check types
kujo run main.kujo list-checks

# Print contract version
kujo run main.kujo version

# Explain effective policy overlays
kujo run main.kujo policy-explain examples/release_gate_suite.json --policy-stage release --json
```

`init` scaffolds a starter suite; edit the generated file before you rely on `validate` or `run`.

## Enterprise Quickstart Matrix (Risk Tiers)

| Risk Tier | Best Fit | Command |
|---|---|---|
| Tier 1 (Local dev, low risk) | Fast feedback while iterating on checks and fixtures | `kujo run main.kujo run examples/enterprise_cli_quality_gate.json --output-dir .eval_enterprise_cli --json` |
| Tier 2 (CI gate, medium risk) | Contract + payload validation in pull requests | `kujo run main.kujo run examples/enterprise_api_contract_gate.json --output-dir .eval_enterprise_api --parallel-workers 8 --json` |
| Tier 3 (Release gate, high risk) | Policy-first release verification with strict controls | `kujo run main.kujo run examples/strict_enterprise_policy_gate.json --output-dir .eval_enterprise_strict --json` |
| Tier 3 + constrained sandbox-adjacent workflows | Fixture-only policy boundaries for local security testing | `kujo run main.kujo run examples/sandbox_adjacent_policy_gate.json --output-dir .eval_sandbox_adjacent --json` |

Policy visibility and command inventory for onboarding:

```bash
kujo run main.kujo policy-explain examples/release_gate_suite.json --policy-stage release --json
bash scripts/generate_command_inventory.sh --check
```

## Repository Status (Validated Commands)

Validated on 2026-05-25 with:

```bash
export KUJO_BIN=./kujo
```

| Command | Exit | Expected Output Signal |
|---|---:|---|
| `$KUJO_BIN run main.kujo version` | 0 | Prints `Evalv2.0.0` and `Contract version: 2.0.0` |
| `$KUJO_BIN run main.kujo list-checks` | 0 | Prints available check list and `Total: 27 check types` |
| `$KUJO_BIN run main.kujo snapshots` | 0 | Prints snapshot listing output (or empty listing message) |
| `$KUJO_BIN run main.kujo diff README.md README.md` | 0 | Reports no differences for identical files |
| `$KUJO_BIN run main.kujo run examples/release_gate_suite.json --output-dir .eval_status --json` | 0 | JSON result envelope includes `"ok":true` |
| `$KUJO_BIN run main.kujo run examples/release_gate_suite.json --output-dir .eval_status --summary-only` | 0 | Prints compact summary and overwrites prior run artifacts safely |
| `$KUJO_BIN run main.kujo report examples/release_gate_suite.json --rerun --output-dir .eval_status --json` | 0 | JSON result envelope includes `"ok":true` |
| `$KUJO_BIN run main.kujo report examples/release_gate_suite.json --rerun --output-dir .eval_status --format junit` | 0 | Generates `.eval_status/eval-report.xml` |
| `$KUJO_BIN run main.kujo report examples/release_gate_suite.json --rerun --output-dir .eval_status --format tap` | 0 | Generates `.eval_status/eval-report.tap` |
| `$KUJO_BIN test` | 0 | Test suite runner reports all configured test files passing |
| `$KUJO_BIN test --runtime interpreter` | non-zero | Interpreter mode is informational here and currently emits runtime warnings |

## Check Types

### Command Checks

| Check | Description |
|-------|-------------|
| `command_succeeds` | Run a shell command, assert exit code 0 |
| `command_fails` | Run a shell command, assert non-zero exit code |
| `exit_code_equals` | Run a command, assert specific exit code |

### Output Checks

| Check | Description |
|-------|-------------|
| `output_contains` | Run command, assert stdout contains substring |
| `output_does_not_contain` | Run command, assert stdout does NOT contain substring |
| `output_matches_glob` | Run command, assert stdout matches glob/substring pattern |

### File Checks

| Check | Description |
|-------|-------------|
| `file_exists` | Assert a file path exists |
| `file_does_not_exist` | Assert a file path does NOT exist |
| `file_contains` | Assert file content contains a substring |
| `file_does_not_contain` | Assert file content does NOT contain a substring |
| `file_matches_glob` | Assert file content matches glob/substring pattern |
| `file_size_greater_than` | Assert file size exceeds a byte threshold |
| `file_size_less_than` | Assert file size is under a byte threshold |

### Data Checks

| Check | Description |
|-------|-------------|
| `json_matches_shape` | Assert JSON has expected keys |
| `json_value_equals` | Assert a specific JSON path has an expected value |
| `stdout_json_matches_shape` | Run command, parse stdout as JSON, validate shape |
| `snapshot_matches` | Compare output against a stored snapshot |
| `directory_diff` | Compare two directories and report differences |

### Environment & Network Checks

| Check | Description |
|-------|-------------|
| `env_var_equals` | Assert an environment variable has a specific value |
| `http_status` | Assert an HTTP endpoint returns expected status code |

## Eval Suite Format

Create an `eval.json` file:

```json
{
  "name": "my-agent-eval",
  "description": "Tests for the auth agent workflow",
  "version": "1.0.0",
  "output_dir": "./eval_results",
  "snapshot_dir": "./snapshots",
  "stop_on_failure": false,
  "tests": [
    {
      "name": "auth command succeeds",
      "description": "The auth CLI should exit cleanly",
      "check": "command_succeeds",
      "params": {
        "command": "kujo run auth.kujo login --user test"
      }
    },
    {
      "name": "output file exists",
      "description": "Auth should produce a token file",
      "check": "file_exists",
      "params": {
        "path": "./output/token.json"
      }
    },
    {
      "name": "token JSON has required keys",
      "check": "json_matches_shape",
      "params": {
        "path": "./output/token.json",
        "required_keys": ["access_token", "refresh_token", "expires_in"]
      }
    },
    {
      "name": "output contains success message",
      "check": "output_contains",
      "params": {
        "command": "kujo run auth.kujo login --user test",
        "expected": "Login successful"
      }
    }
  ]
}
```

## Policy Profiles And Retention

Top-level optional controls for enterprise rollout:

| Field | Type | Default | Purpose |
|---|---|---|---|
| `policy_profile` | string | `""` | Preset security/governance baseline (`strict-ci`, `local-dev`, `release-gate`) |
| `policy_stage_overlays` | object | `{}` | Stage-specific policy overrides keyed by `local`, `ci`, `release` (selected with `--policy-stage`) |
| `history_retention_runs` | int | `200` | Maximum entries retained in `history.json` |
| `aux_artifact_retention_files` | int | `25` | Maximum retained auxiliary backup artifacts (`*.bak`) |
| `artifact_checksums` | bool | `false` | Include SHA-256 checksums in `artifact-manifest.json` |

Run/report outputs now include:

- `summary.json`: compact deterministic run summary for dashboards/status collectors
- `artifact-manifest.json`: deterministic file index for CI artifact discovery
- `cli-summary.json`: stable machine handoff channel for run/report command outcomes

When checksum mode is enabled (`artifact_checksums: true` or `--artifact-checksums`), `artifact-manifest.json` also includes a `checksums` block with SHA-256 digests. Validate it with:

```bash
kujo run main.kujo verify-manifest --output-dir ./eval_results --json
```

## Snapshot Testing

Snapshots store expected output so you can detect regressions:

```json
{
  "name": "snapshot test",
  "check": "snapshot_matches",
  "params": {
    "name": "my-cli-help",
    "command": "my-tool --help",
    "snapshot_dir": "./snapshots"
  }
}
```

First run with `--update-snapshots` to create the baseline:

```bash
kujo run main.kujo run --update-snapshots
```

Subsequent runs will compare against the stored snapshot and fail if output changes.

## Comparison

Compare two eval runs to detect regressions or improvements:

```bash
kujo run main.kujo compare ./eval_results/run-v1.json ./eval_results/run-v2.json
```

## CI Integration

Eval exits with code 1 on any test failure, making it CI-ready:

```yaml
- name: Run eval suite
  run: kujo run main.kujo run --json
```

Use `--json` for machine-readable output in CI pipelines.

## CLI Exit Code Contract

Evalcurrently uses explicit process exit classes:

| Exit Code | Class | Meaning |
|---:|---|---|
| `0` | Success | Command completed successfully (for `run`, all assertions passed). |
| `1` | Assertion failure | At least one eval assertion failed during `run`. |
| `1` | Usage/config/runtime error | Invalid command usage, missing/invalid config, or command execution error. |

Practical CI guidance:

1. Treat any non-zero exit as a hard failure gate.
2. Parse `--json` envelopes to distinguish assertion failures from usage/config/runtime failures.
3. Use JUnit/TAP artifacts for external dashboards where required.

## Command Reference

| Command | Description |
|---------|-------------|
| `init` | Create an eval suite file (`--name <name>`) |
| `run` | Execute all tests in a suite (`--filter`, `--exclude`, `--tags`, `--only-failed`, `--quiet`, `--summary-only`, `--verbose`, `--json`) |
| `report` | Generate a report from cached results (`--rerun`, `--format <md\|html\|junit\|tap\|ndjson>`, `--json`) |
| `compare` | Compare two eval run result files |
| `list-checks` | List all 27 available check types |
| `snapshots` | List stored snapshots (`--snapshot-dir <dir>`) |
| `version` | Print eval contract version (currently v2.0.0) |
| `watch` | Watch config file and re-run on changes |
| `lint` | Validate eval config without executing tests |
| `policy-explain` | Print effective merged command/path/env policy for a given stage |
| `diff` | Compare two files line-by-line |
| `export` | Export an eval suite as a shell script |
| `verify-manifest` | Verify artifact-manifest checksum entries against current files |
| `completion` | Generate shell completion script (`--shell bash\|zsh\|fish`) |

**Common flags**: `--json` (machine output), `--config <path>`, `--output-dir <dir>`, `--update-snapshots`, `--format <md|html|junit|tap|ndjson>`, `--quiet`, `--summary-only`, `--verbose`

Generated command inventory: [`docs/COMMAND_INVENTORY.md`](docs/COMMAND_INVENTORY.md) (validated via `bash scripts/generate_command_inventory.sh --check`).

## Flaky Test Retry

Add a `"retry"` field to any test definition to automatically retry on failure:

```json
{
  "name": "flaky network check",
  "check": "http_status",
  "params": { "url": "https://api.example.com/health" },
  "retry": 2
}
```

The test will run up to 3 times (1 initial + 2 retries) and pass if any attempt succeeds.

## Contract Version

Eval uses a `describe_module()` function for runtime contract discovery. Call it from any Kujo script:

```bash
kujo run main.kujo version
# Evalv2.0.0
# Contract version: 2.0.0
```

The result envelope contract (`{ok, error, data}`) is stable since v2.0.0 and used consistently across all source modules.

## Roadmap

See [`docs/enhancement-roadmap.md`](docs/enhancement-roadmap.md) for the full prioritized roadmap. **All 37 of 37 items complete** 🎉

**Completed**:
- [x] 27 check types (command, file, output, JSON, snapshot, diff, glob, HTTP, env, file size)
- [x] Markdown, JUnit XML, TAP, and HTML report formats
- [x] Snapshot testing with unified diff output
- [x] Run comparison (regression/improvement detection)
- [x] CI-ready exit codes and JSON output
- [x] Suite initialization (`eval init`) with scaffolding
- [x] Test filtering (`--filter`, `--exclude`, `--tags`, `--skip-tags`, `--only-failed`)
- [x] Before/after hooks (setup, teardown, before_each, after_each)
- [x] Progress output (`[PASS]`/`[FAIL]` per test)
- [x] Cached results (`last_run.json`) for report generation, `--rerun` support
- [x] Security hardening (command allowlisting, path boundaries, output redaction, config limits)
- [x] Shared utility module (`src/common.kujo`), CLI extraction (`src/cli.kujo`)
- [x] Architecture, contributing, and security documentation
- [x] CLI integration tests, security regression tests, edge case tests
- [x] Release quality gates, supply-chain policy checks, compatibility matrix CI
- [x] Kujo runtime version pinning (`RUNTIME_VERSION`)
- [x] Standardized result envelope (`{ok, error, data}`) across all modules (contract v2.0.0)
- [x] HTML report with collapsible failure details and summary cards
- [x] Timeout enforcement documented (pending Kujo runtime support — see `src/checks.kujo`)
- [x] `--quiet` and `--verbose` flags for CI and debugging workflows
- [x] Real timing (`duration_ms`) recorded for every suite run
- [x] Flaky test retry support (`"retry": N` in test definitions)
- [x] `describe_module()` contract discovery function
- [x] Enhanced security patterns (nc, telnet, eval, subshell injection)
- [x] Token/API key redaction expanded

**Future**:
- [ ] LLM-as-judge evaluations
- [ ] Agent replay evaluation
- [ ] Workflow-level evals
- [ ] Model comparison scoring
- [ ] Cost and latency scoring
- [ ] Scout-assisted eval generation
- [ ] Distributed suite execution across workers/runners

## Repository Layout

- `main.kujo`: CLI entry point and command dispatcher for the full command surface
- `src/common.kujo`: Shared utilities (`dict_get_or`, `normalize_*`, `make_check_*`)
- `src/cli.kujo`: CLI argument parsing and help text
- `src/config.kujo`: Configuration loading, validation, and KNOWN_CHECKS
- `src/checks.kujo`: All 27 check implementations + security validators
- `src/eval_core.kujo`: Core eval engine, suite runner, compare_runs
- `src/report.kujo`: Markdown, HTML, JUnit XML, TAP, and NDJSON report generation
- `src/snapshot.kujo`: Snapshot management (save, compare, diff, list, delete)
- `tests/`: 7 test suites — contract, security, CLI integration, coverage, benchmark, quality, stress
- `examples/`: Example eval suites (basic, release-gate, self-check, snapshot)
- `schema/eval-suite.schema.json`: JSON Schema for VSCode autocomplete + validation
- `docs/`: Architecture, contributing, security, agent notes, ecosystem integration, roadmaps
- `docs/CONTRIBUTING.md`: Contributing guide and code conventions
- `docs/SECURITY.md`: Security model, known limitations, reporting
- `docs/agent-notes.md`: Kujo runtime quirks and lessons learned
- `docs/release-candidate-runbook.md`: Human runbook for pre-tag release validation
- `RUNTIME_VERSION`: Pinned Kujo runtime commit hash for reproducible CI

### Root Layout Notes

- `main.kujo` intentionally stays at the repository root as the CLI entrypoint referenced by docs, scripts, and CI.
- `CONTRIBUTING.md` and `SECURITY.md` at root are lightweight pointers for enterprise discoverability; canonical content remains in `docs/`.
- Functional implementation modules remain under `src/`; root files are only packaging, entrypoint, policy, and governance artifacts.
- `tests/*.out` files are treated as runtime artifacts and intentionally remain untracked.

## License

MIT
