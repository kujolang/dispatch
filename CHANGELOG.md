# Changelog

## Unreleased

### FEATURE
- Added a production-usable multi-stage `Dockerfile` that compiles the Kujo runtime from pinned `RUNTIME_VERSION` (with optional `KUJO_RUNTIME_REF` override) and runs `eval` via `kujo run main.ruff`.
- Added `examples/strict_enterprise_policy_gate.json` with minimum-privilege command/path/env policy defaults and redaction audit mode.
- Added `examples/sandbox_adjacent_policy_gate.json` for constrained fixture-only policy boundaries.
- Added `init --from-scout <path>` as an alias for `--from` to align Scout workflow docs with CLI behavior.
- Added `policy-explain` CLI command and `policy_explain_config` support to print effective merged command/path/env policy by stage.
- Added deterministic contract fixtures under `examples/fixtures/contracts/` for `summary.json`, `cli-summary.json`, `artifact-manifest.json`, and `policy-explain` payload validation.
- Added policy explain risk telemetry (`risk_score`, `risk_tier`, `risk_hints`) to support enterprise policy posture review.
- Added schema-driven lint diagnostics (`lint_config_file`) with stable error codes, locations, and actionable suggested fixes.
- Added richer JSON-path assertions for `json_value_equals` and `command_stdout_json_path_equals`, including array index traversal and `expected_type` checks.
- Added incremental report generation controls via `save_report_with_options` and command-level `--incremental` support.

### TWEAK
- Extended `scripts/verify_docs_command_parity.sh` to validate strict-enterprise and sandbox-adjacent quickstart bundles.
- Extended `scripts/verify_docs_command_parity.sh` to validate the Scout ecosystem import path (`init --from-scout`) and broadened parity reporting to docs-wide scope.
- Added `.dockerignore` defaults to keep VCS metadata, transient eval outputs, and logs out of container build context.
- Added optional human signoff enforcement controls to `scripts/release_quality_gates.sh` via `KUJO_EVAL_REQUIRE_RELEASE_SIGNOFF` and `KUJO_EVAL_RELEASE_SIGNOFF_FILE`.
- Added changelog coverage gate to `scripts/release_quality_gates.sh` to fail when behavior-affecting changes land without `CHANGELOG.md` updates.
- Cleaned committed `tests/*.out` artifacts and standardized `.gitignore` to `tests/*.out` for runtime-generated outputs only.
- Updated CLI integration tests to resolve `KUJO_BIN` from environment with a `kujo` fallback instead of using a machine-specific absolute path.
- Updated CLI help/completion surface to include `policy-explain` and `verify-manifest` and surfaced incremental report metadata in JSON summaries.
- Updated schema policy fields to stage-aware `path_policy_mode` behavior (`open`/`allowlist-required`) for clearer governance defaults.

### FIX
- Hardened command safety evaluation in `src/checks.ruff` by normalizing case/whitespace before policy and dangerous-pattern checks.
- Added security regression coverage for uppercase dangerous-command bypass attempts.
- Restored stable report rendering flow after malformed patch collision in `src/report.ruff` and validated with full suite passes.
- Fixed an unbound-variable bug in `scripts/verify_docs_command_parity.sh` so Scout import parity checks execute deterministically.

### SECURITY
- Added strict command policy enforcement controls for CI/release stages (`require_command_policy`) with stage overlay support.
- Added path allowlist enforcement mode for guarded stages and expanded policy introspection for command/path/env controls.
- Added outbound HTTP host governance for network checks with `allowed_http_hosts`/`blocked_http_hosts` and blocked-host precedence.
- Added organization-specific redaction extension patterns (`redact_output_patterns`) for command output sanitization.

### PERFORMANCE
- Added deterministic mixed-suite parallel scheduling heuristics and benchmark coverage for mixed check workloads.
- Extended deterministic parallel file fastpath to include `file_line_count`, `file_matches_glob`, and `file_matches_regex` with cache metrics (`cache_metric_*`) in run/report payloads.
- Added benchmark trend slope regression gating with rolling history and stage gate controls in `scripts/release_quality_gates.sh`.

### CI
- Expanded `.github/workflows/ci.yml` to a Linux + macOS matrix.
- Added Ubuntu CI coverage to build the pinned-runtime Docker image (`docker build`) and validate container workflow integrity.
- Added CI guard to reject tracked `tests/*.out` artifacts.

### DOCS
- Added VM-first migration guidance for legacy interpreter-era commands in `README.md`.
- Added migration notes in `docs/agent-notes.md` and `docs/eval-suite-reference.md` to keep command guidance internally consistent.
- Added enterprise quickstart risk-tier matrices and copy/paste profile guidance in `README.md`, `docs/QUICKREF.md`, and `docs/COOKBOOK.md`.
- Added container build/run documentation in `README.md` for pinned-runtime Docker workflows.
- Added `docs/release-signoff.md` template and runbook guidance for optional human approval enforcement in release gates.
- Updated `docs/ECOSYSTEM.md` Scout import example to use canonical `kujo run main.ruff init --from-scout ...` invocation.
- Added generated command inventory docs (`docs/COMMAND_INVENTORY.md`) with freshness checks via `scripts/generate_command_inventory.sh --check`.
- Updated release runbook guidance for benchmark trend slope environment overrides and command inventory verification.
- Corrected `kennel.toml` package status notes to reflect the actual CLI/test surface and remaining release workflow tasks.

## 0.3.1 — Production Hardening Release

### FEATURE
- `--quiet` flag: suppresses per-test output for CI pipelines (summary only)
- `--verbose` flag: prints full check details as tests execute
- Real timing support: `duration_ms` now records actual elapsed time via `time()`
- Flaky test retry: `"retry": N` field in test definitions auto-retries failures
- `describe_module()` contract discovery function on main.ruff
- Enhanced `redact_sensitive`: now also catches `token=`, `api_key=`, `apikey=` patterns

### SECURITY
- Expanded `DANGEROUS_PATTERNS`: added `nc`, `ncat`, `telnet`, `eval`, `$(`, backtick, `; rm`, `|| rm`, `&& rm` patterns

### TWEAK
- `describe_common_module()` bumped to contract version `2.0.0`
- Removed dead `DEFAULT_TIMEOUT` constant from config.ruff
- Removed redundant `export dict_get_or`/`export normalize_string` re-exports from config.ruff
- Removed unused `generate_markdown_report` import from main.ruff
- Updated checks.ruff header docs to reflect envelope shape and 20 check types
- `kujo.toml` bumped to version `0.3.0` with description

### FIX
- All `has_key(...) == 1` → `== true` for interpreter mode compatibility
- All `contains(...) == 0/1` → `== false/true` across checks.ruff and eval_core.ruff
- All `found == 0/1` → `== false/true` in file_contains/file_does_not_contain
- `.gitignore` updated to include `tests/cli_integration_tests.out`
- Cleaned stale `.out` files from tests/ directory

### DOCS
- README: added quiet/verbose, retry, timing, describe_module, expanded features list
- README: updated Quick Start with more examples, Command Reference with new flags
- README: updated Repository Layout with all test suites and examples dir
- main.ruff: updated usage header with all 7 commands and `--format` flag

---

## 0.3.0 — Blocked Items Resolution & Docs Finalization

**Status**: All 44 of 44 planned items complete. See `docs/improvement-checklist.md` for full tracking.

### REFACTOR
- Standardized result dict envelope (`{ok, error, data}`) across all 8 modules: `checks.ruff`, `snapshot.ruff`, `config.ruff`, `report.ruff`, `eval_core.ruff`, `main.ruff`, and all 3 test suites
- Contract version bumped to `2.0.0` (breaking change to result shapes)
- `make_result`, `make_success_result`, `make_error_result` helpers in `src/common.ruff`
- All `path_exists(...) == 0` comparisons replaced with `== false` for interpreter mode compatibility

### FEATURE
- HTML report output with self-contained inline CSS, summary cards, pass rate bar, colored results table, and collapsible `<details>` sections for failures
- `--format <md|html>` CLI flag for choosing report output format
- XSS-safe HTML escaping for test names and messages
- Snapshot diff rendered in `<pre>` blocks within collapsible failure details

### TWEAK
- Removed `timeout_seconds` from default `init_config` template (Kujo runtime has no process timeout mechanism)
- Added documentation comment in `run_shell` explaining timeout limitation and future implementation path
- `save_report` and `print_report` now accept optional `format` parameter

### DOCS
- `docs/blocked-items-checklist.md`: All 22 sub-items marked complete across items 3.4, 5.6, 6.4
- `docs/improvement-checklist.md`: All 44 items marked complete; completion tracking table updated
- `README.md`: Roadmap updated to reflect 44/44 completion, HTML format added, blocked section removed

---

## 0.2.0 — Checklist Completion Release

**Status**: 41 of 44 planned items complete. 3 items blocked (documented in `docs/blocked-items-checklist.md`).

### FEATURE
- 8 new check types: `file_matches_glob`, `output_matches_glob`, `json_value_equals`, `file_size_greater_than`, `file_size_less_than`, `env_var_equals`, `stdout_json_matches_shape`, `http_status` (now 20 total)
- JUnit XML and TAP report output formats (`generate_junit_report`, `generate_tap_report`)
- Test name filtering: `--filter`, `--exclude` CLI flags
- Test tags/categories: `--tags`, `--skip-tags` CLI flags, `tags` field in test definitions
- Suite-level hooks: `setup`, `teardown`, `before_each`, `after_each` commands
- `--only-failed` rerun mode (loads `last_failures.json`)
- Per-test progress output (`[PASS]`/`[FAIL]`)
- `--rerun` flag for `report` command
- `is_command_safe()`: blocks dangerous shell patterns (rm -rf, sudo, chmod, etc.)
- `is_path_safe()`: blocks `..` traversal and system directory access
- `redact_sensitive()`: scrubs API keys, tokens, passwords from output
- `src/cli.ruff`: extracted CLI argument parsing from main.ruff
- CLI integration test suite (`tests/cli_integration_tests.ruff`)
- Security regression test suite (`tests/security_tests.ruff`)
- Release quality gates script (8 checks)
- Supply-chain policy check script (8 checks)
- Compatibility matrix CI workflow
- Pinned Kujo runtime version (`RUNTIME_VERSION`)

### TWEAK
- Created `src/common.ruff` shared utilities module (~120 lines of duplication eliminated)
- Exported `run_shell` for testability
- `command_report` now loads cached results from `last_run.json` instead of re-running
- `command_run` saves `last_run.json` and `last_failures.json` after each run
- `--update-snapshots` CLI flag now correctly threads through to snapshot checks
- Removed inline imports from function bodies (moved to top-level)
- Replaced all `arr[len(arr)] := value` with `push()` for VM compatibility
- Fixed positional arg indexing in `command_run`, `command_report`, `command_compare`
- Removed `#` comments from example JSON files (invalid JSON)
- Renamed `test` variable to `tdef` in config.ruff (Kujo reserved keyword)
- Exported `dict_get_or` and `normalize_string` from config.ruff
- Moved `eval.json` self-check to `examples/self_check.json`

### SECURITY
- Command allowlisting with `DANGEROUS_PATTERNS` blocklist
- Path boundary enforcement for all file check functions
- Output redaction for sensitive data patterns
- Config size/depth limits: MAX_CONFIG_SIZE (1MB), MAX_TESTS (1000), MAX_STRING_LENGTH (10K)

### DOCS
- `docs/ARCHITECTURE.md`: data flow, module map, design decisions
- `docs/CONTRIBUTING.md`: development workflow, code conventions
- `docs/SECURITY.md`: security model, known limitations
- `docs/agent-notes.md`: 11 documented Kujo runtime quirks
- `docs/blocked-items-checklist.md`: step-by-step plans for 3 blocked items
- Updated README with all 20 check types, new flags, and current repo layout

### REFACTOR
- Extracted `src/cli.ruff` from main.ruff (~80 lines)
- Created `src/common.ruff` with shared utilities and result-building helpers
- Added `make_check_error` and `make_check_success` helpers

---

## 0.1.0 — Initial Release

- **FEATURE**: 12 deterministic eval checks
- **FEATURE**: Markdown report generation
- **FEATURE**: Snapshot testing with unified diff
- **FEATURE**: Run comparison for regression/improvement detection
- **FEATURE**: JSON output mode for CI pipelines
- **FEATURE**: `init` command to scaffold eval suites
- **FEATURE**: Contract version API (`1.0.0`)
- **TWEAK**: Long array syntax and explicit conditionals for Kujo runtime compatibility
- **TWEAK**: Structured result contracts across all check types
