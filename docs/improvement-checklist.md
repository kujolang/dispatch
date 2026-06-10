# Eval Improvement Checklist

> **Purpose**: This document is designed to be consumed by an AI agent. Each item is a self-contained task with enough context to complete it independently. Items are organized into tiers by priority and work type.
>
> **How agents should use this**:
> 1. Read this document and the README.md to understand the project.
> 2. Pick an unchecked item from the highest-priority tier.
> 3. Complete the item, updating source files, tests, and README.md as needed.
> 4. Mark the item `[x]` in this document when done.
> 5. Move to the next item.
>
> **Verification for each item**: Run `kujo test-run tests/contract_tests.kujo -v` after every change to catch regressions.

---

## Tier 1: Critical Fixes (bugs and broken functionality)

These items fix things that are currently broken or non-functional. Do these first.

### [x] 1.1 — Fix `--update-snapshots` CLI flag (dead code)

**File**: `main.kujo`, function `command_run` (approx. lines 130-145)

**Problem**: The `should_update` variable is computed from CLI flags but never passed to the check runner or used anywhere. The `--update-snapshots` flag has zero effect. Individual snapshot checks read `params["update"]` which can only be set in `eval.json`, not from the CLI.

**Fix**:
- In `command_run`, after parsing `should_update`, inject `params["update"] = "true"` into each test definition's params before calling `run_suite`, but only for tests whose `check` is `snapshot_matches`.
- Alternatively, modify `run_suite` in `src/eval_core.kujo` to accept an `update_snapshots` flag and thread it through to the check dispatcher.

**Verification**: Add a test in `tests/contract_tests.kujo` that runs `check_snapshot_matches` with `update: "true"` and verifies the snapshot file is created/updated. Then test end-to-end that `--update-snapshots` flag works from the CLI.

---

### [x] 1.2 — Fix `kennel.toml` smoke script referencing wrong file extension

**File**: `kennel.toml`, line 38

**Problem**: The `[scripts]` section has `smoke = "kujo run examples/basic_suite.kujo --interpreter"` but the actual file is `examples/basic_suite.json`. This command will fail because Kujo can't run a JSON file as a script.

**Fix**: The smoke script needs to run the eval suite using the JSON config file. Change to:
```toml
smoke = "kujo run main.kujo --interpreter run examples/basic_suite.json --json"
```

**Verification**: Run `kujo run main.kujo --interpreter run examples/basic_suite.json --json` and confirm it executes and produces output.

---

### [x] 1.3 — Fix `command_report` re-running the entire suite instead of reading saved results

**File**: `main.kujo`, function `command_report` (approx. lines 165-200)

**Problem**: `command_report` calls `run_suite(config_path)` which re-executes ALL tests just to generate a report. If tests are slow or have side effects, this is wasteful and potentially dangerous. The `command_run` already saves results via `save_report()`, but `command_report` ignores that saved file.

**Fix**:
- In `command_run`, after calling `save_report`, also save the raw results JSON to `eval_results/last_run.json`.
- In `command_report`, first try to load `eval_results/last_run.json`. If it exists, generate the report from that. Only re-run if no saved results exist or if a `--rerun` flag is passed.
- Add a `--rerun` flag to `command_report` for explicitly re-running.

**Verification**: Test that `command_report` uses cached results and doesn't re-execute commands.

---

### [x] 1.4 — Remove inline import inside `check_snapshot_matches` function body

**File**: `src/checks.kujo`, line 644

**Problem**: The function `check_snapshot_matches` has `from src.config import normalize_string, dict_get_or` inside the function body. This is unusual and may cause issues with the Kujo interpreter (imports belong at the top of the file). These functions are already defined at the top of `checks.kujo` anyway — the import is redundant.

**Fix**: Delete the inline import line. Use the module-level `normalize_string` and `dict_get_or` that are already defined above in the same file.

**Verification**: Run contract tests to confirm `check_snapshot_matches` still works.

---

### [x] 1.5 — Add missing `run_shell` error-handling tests

**File**: `tests/contract_tests.kujo`

**Problem**: The `run_shell` helper (used by 6 check types) is never tested directly. If `execute_status` returns a ProcessResult with unexpected field types, or if the command produces very large output, the behavior is undefined and untested.

**Fix**: Add tests that:
- Verify `run_shell` handles a command that produces multi-line output correctly.
- Verify `run_shell` captures stderr separately from stdout.
- Verify `run_shell` sets `ok: false` when `execute_status` throws (mock or use a command likely to fail in a detectable way).
- Verify `run_shell` with a command that produces empty stdout (e.g., `echo -n ""`).

**Verification**: Run the new tests.

---

## Tier 2: Security Hardening

These items address security concerns. They are important before anyone runs untrusted eval suites.

### [x] 2.1 — Add command allowlisting/validation to `run_shell`

**File**: `src/checks.kujo`, function `run_shell`

**Problem**: The `run_shell` function passes raw user-provided strings directly to `execute_status` with zero validation. An `eval.json` from an untrusted source can execute arbitrary commands. For example: `{"check": "command_succeeds", "params": {"command": "rm -rf /"}}` would execute.

**Fix**:
- Add an optional `allowed_commands` list to the eval config that restricts which executables can be run.
- At minimum, add a check that rejects commands containing dangerous patterns: `rm -rf`, `sudo`, `chmod`, `curl | sh`, `/dev/`, etc.
- Extract the first word of the command (the executable name) and validate it against the allowlist.
- Document the security model in README.md.

**Verification**: Add security tests in a new `tests/security_tests.kujo` that verify dangerous commands are rejected.

---

### [x] 2.2 — Add path boundary enforcement for file checks

**File**: `src/checks.kujo`, all file-related check functions

**Problem**: File checks (`file_exists`, `file_contains`, `file_does_not_contain`, `json_matches_shape`, `snapshot_matches`) accept arbitrary paths with no validation. A malicious eval suite could read sensitive files like `/etc/passwd` or `~/.ssh/id_rsa`.

**Fix**:
- Add an optional `allowed_paths` config field that defines which directories file checks can access.
- Default to the current working directory and its children.
- Reject paths containing `..` segments that escape the allowed boundary.
- Validate paths before passing them to `read_file` or `path_exists`.

**Verification**: Add tests that verify path traversal attempts are rejected.

---

### [x] 2.3 — Add output redaction for sensitive data

**File**: `src/report.kujo` and `src/checks.kujo`

**Problem**: Command output (stdout/stderr) is included verbatim in check results and reports. If a command outputs API keys, tokens, passwords, or PII, those secrets appear in markdown reports and JSON output.

**Fix**:
- Add a `redact_patterns` config option (list of regex patterns).
- Before including stdout/stderr in results, scan for common secret patterns: `[A-Za-z0-9_\-]{20,}`, `sk-`, `Bearer`, `password=`, `secret=`, etc.
- Replace matched content with `[REDACTED]`.
- Default to basic redaction; allow opt-out with `redact: false`.

**Verification**: Add tests that verify sensitive patterns are redacted from output.

---

### [x] 2.4 — Add config size/depth limits to prevent JSON bombing

**File**: `src/config.kujo`, function `load_config`

**Problem**: `eval.json` is parsed without any size or depth limits. A malicious config could contain deeply nested JSON or arrays with millions of elements, causing memory exhaustion.

**Fix**:
- Add a `MAX_CONFIG_SIZE_BYTES` constant (e.g., 1MB) and check file size before parsing.
- Add a `MAX_TESTS` limit (e.g., 1000) and reject configs exceeding it.
- Add a `MAX_STRING_LENGTH` limit for test names, descriptions, and command strings (e.g., 10000 chars).

**Verification**: Add tests that verify oversized configs are rejected with a clear error.

---

## Tier 3: Code Quality & DRY Refactoring

These items reduce duplication and improve maintainability. They make the codebase easier to extend.

### [x] 3.1 — Create `src/common.kujo` shared utilities module

**Files affected**: All `src/*.kujo` files and `main.kujo`

**Problem**: `dict_get_or`, `normalize_string`, `normalize_int`, `normalize_bool`, `normalize_array`, and `normalize_dict` are copy-pasted into 5 different files (~120 lines of duplicated code). Every new module reinvents these.

**Fix**:
- Create `src/common.kujo` with all shared utility functions exported.
- Update all source files to import from `src/common.kujo` instead of defining locally.
- Ensure the module has a `describe_common_module()` contract function.
- Update `kennel.toml` exports to include `common = "src/common.kujo"`.

**Verification**: All existing contract tests must pass unchanged. The total line count across src/ should decrease noticeably.

---

### [x] 3.2 — Extract CLI argument parsing into `src/cli.kujo`

**Files**: `main.kujo`, new file `src/cli.kujo`

**Problem**: `main.kujo` is ~340 lines, mixing CLI dispatch, argument parsing, help text, and command implementations. The `parse_cli_flags` function is long and complex. Following the kujo-rag pattern (which has `src/cli_args.kujo`), CLI parsing should be in its own module.

**Fix**:
- Move `parse_cli_flags`, `print_help`, `dict_get_or`, and `normalize_string` into `src/cli.kujo`.
- Export `parse_cli_flags` and `print_help`.
- In `main.kujo`, import from `src/cli.kujo` and `src/common.kujo`.
- Keep command implementations (`command_init`, `command_run`, etc.) in `main.kujo` but slim them down by using shared utilities.

**Verification**: Run `kujo run main.kujo --interpreter help` and verify output is identical.

---

### [x] 3.3 — Extract result-building helpers to reduce per-check boilerplate

**File**: `src/checks.kujo`

**Problem**: Every check function repeats the same boilerplate: validate that a required param exists, return an error result dict if missing, build a result dict with `ok`/`check`/`message`/`details`. Each check is ~40% boilerplate.

**Fix**: Add helper functions to `src/checks.kujo` (or `src/common.kujo`):
- `make_check_error(check_type, message, details)` — returns `{ok: false, check: check_type, message, details}`
- `make_check_success(check_type, message, details)` — returns `{ok: true, check: check_type, message, details}`
- `validate_required_param(params, key, check_type)` — returns either an error result or the param value
- Refactor 1-2 checks as a proof of concept, then the rest.

**Verification**: All contract tests pass. The `checks.kujo` file should be noticeably shorter.

---

### [x] 3.4 — Standardize result dict shape across all modules

**Files**: `src/eval_core.kujo`, `src/checks.kujo`, `src/report.kujo`, `src/snapshot.kujo`, `src/config.kujo`

**Problem**: Different modules return slightly different result shapes:
- `checks.kujo`: `{ok, check, message, details}`
- `snapshot.kujo`: `{ok, path, name, message}` or `{match, snapshot_path, name, message, diff}`
- `config.kujo`: `{ok, error, config, path}` or `{ok, error, config}`
- `report.kujo`: `{ok, path, message, report}` or `{ok, message}`
- `eval_core.kujo`: `{ok, error, suite_name, ...}` or `{ok, run_a, run_b, ...}`

There's no consistent contract. This makes it harder to compose modules and harder for external consumers.

**Fix**: Define a standard result envelope in `src/common.kujo`:
```
{
  "ok": bool,
  "error": string (empty on success),
  "data": { ... module-specific payload ... }
}
```
Refactor each module to use this envelope. This is a breaking change to the API contract so bump contract version to `2.0.0`.

**Verification**: Update all tests to expect the new envelope shape. Update `eval.json` self-check.

---

### [x] 3.5 — Remove the unused `mismatched_types` variable in `check_json_matches_shape`

**File**: `src/checks.kujo`, function `check_json_matches_shape`

**Problem**: The variable `mismatched_types` is declared and populated in the loop but never checked in the condition `if len(missing_keys) > 0 || len(mismatched_types) > 0`. However, `mismatched_types` is always empty because no code adds to it (the type-checking loop was never written). This is dead code and misleading.

**Fix**: Either remove the `mismatched_types` variable entirely, or implement the type-checking logic that compares actual JSON value types against expected types from params.

**Verification**: Contract tests pass. If implementing type checking, add new tests for type mismatches.

---

## Tier 4: New Check Types

These items add new assertion capabilities. Each is a self-contained feature addition.

### [x] 4.1 — Add `file_matches_glob` check

**Description**: Assert that file content matches a regular expression pattern.

**Params**: `path` (string), `pattern` (string — regex pattern)

**Implementation**: Add `check_file_matches_regex` to `src/checks.kujo`, register in `KNOWN_CHECKS` in `src/config.kujo`, add to the dispatcher in `run_check`, add tests, update `docs/eval-suite-reference.md`, update README check table.

**Note**: Kujo's regex support may be limited. If native regex isn't available, implement basic glob matching as `file_matches_glob` instead.

---

### [x] 4.2 — Add `output_matches_glob` check

**Description**: Run a command, assert its stdout matches a regex pattern.

**Params**: `command` (string), `pattern` (string — regex pattern)

**Implementation**: Same process as 4.1. Mirror `check_output_contains` but use regex matching.

---

### [x] 4.3 — Add `json_value_equals` check

**Description**: Assert that a specific JSON path has an expected value. Supports nested paths like `user.profile.email`.

**Params**: `path` (string — JSON file path), `json_path` (string — dot-separated key path), `expected` (any — expected value)

**Implementation**: Parse JSON, traverse the dot-separated path, compare the value at that path with `expected`. Handle arrays with index notation (`items.0.name`).

**Verification**: Add tests for top-level values, nested values, array index access, missing paths, and type mismatches.

---

### [x] 4.4 — Add `file_size_greater_than` and `file_size_less_than` checks

**Description**: Assert file size constraints. Useful for verifying output files are non-empty or under a size budget.

**Params**: `path` (string), `bytes` (int)

**Implementation**: Use `path_exists` + read and measure. Note: Kujo may not have a `file_size` built-in; may need to `read_file` and `len()`. Add a note about memory implications for large files.

---

### [x] 4.5 — Add `http_status` check

**Description**: Make an HTTP request and assert the response status code. Useful for testing agents that expose HTTP endpoints.

**Params**: `url` (string), `expected_status` (int, default 200), `method` (string, default "GET"), `timeout_ms` (int, default 5000)

**Implementation**: Use Kujo's `http_get` or equivalent. Note: per Kujo runtime quirks, HTTP in interpreter mode can panic. Document this limitation. Add fixture mode for offline testing.

---

### [x] 4.6 — Add `env_var_equals` check

**Description**: Assert an environment variable has a specific value.

**Params**: `name` (string), `expected` (string)

**Implementation**: Use Kujo's `env()` function. Simple check.

---

### [x] 4.7 — Add `stdout_json_matches_shape` check

**Description**: Run a command, parse its stdout as JSON, and validate the shape. Combines `output_contains` + `json_matches_shape`.

**Params**: `command` (string), `required_keys` (array), `shape` (string — optional)

**Implementation**: Run command via `run_shell`, parse stdout as JSON, apply shape validation. Reuse logic from `check_json_matches_shape`.

---

## Tier 5: Suite & Runner Features

These items improve the test execution and developer experience.

### [x] 5.1 — Add test name filtering

**Description**: Allow running a subset of tests by name pattern.

**Implementation**:
- Add `--filter <pattern>` CLI flag to `command_run`.
- In `run_suite`, before running each test, check if the test name contains the filter string. Skip if not.
- Support `--filter` accepting comma-separated patterns for OR matching.
- Add `--exclude <pattern>` for exclusion filtering.

**Verification**: Add tests that verify filtering includes/excludes the correct tests.

---

### [x] 5.2 — Add test tags/categories

**Description**: Allow grouping tests with tags for selective execution.

**Implementation**:
- Add optional `tags` field to test definitions in `eval.json`: `"tags": ["smoke", "critical", "slow"]`.
- Add `--tags <tag1,tag2>` CLI flag to run only tests matching any of the given tags.
- Add `--skip-tags <tag1,tag2>` to skip tests with those tags.
- Update `config.kujo` to validate tags are arrays of strings.

**Verification**: Add tests with tags to the contract tests.

---

### [x] 5.3 — Add before/after hooks

**Description**: Allow setup and teardown commands that run before/after each test or the entire suite.

**Implementation**:
- Add `setup` and `teardown` fields at the suite level (run once before/after all tests).
- Add `before_each` and `after_each` at the suite level (run before/after each test).
- Each hook is a shell command string. If the hook fails, the test/suite is marked as errored.
- Update `run_suite` to execute hooks in order.

**Verification**: Add tests that verify hooks execute and failures are reported.

---

### [x] 5.4 — Add `--only-failed` rerun mode

**Description**: Re-run only tests that failed in the previous run.

**Implementation**:
- Save the list of failed test names to `eval_results/last_failures.json` after each run.
- Add `--only-failed` flag that loads that file and filters the test list.
- Works with `--filter` for combining filters.

**Verification**: Simulate a run with failures, then verify `--only-failed` only re-runs the failed tests.

---

### [x] 5.5 — Add progress output during execution

**Description**: Show real-time progress as tests execute instead of just "Running eval suite: ..."

**Implementation**:
- In `run_suite`, after each test completes, print a one-line status: `[PASS] test name` or `[FAIL] test name`.
- Use `print()` for now (Kujo may not support ANSI colors).
- Add `--quiet` flag to suppress per-test output (only show summary).
- Add `--verbose` flag to show full check details as they run.

---

### [x] 5.6 — Add timeout enforcement for commands

**Blocker (2026-05-24)**: Kujo's `execute_status` has no timeout parameter and no process-level timeout mechanism exists in the runtime. Removed `timeout_seconds` from default config in init_config to avoid misleading users. Evidence: tested `execute_status` signature — no timeout arg. When Kujo adds process timeout support, this can be implemented.

**Description**: The `timeout_seconds` config field exists but is never used. Make it work.

**Implementation**:
- Since Kujo's `execute_status` may not support timeout natively, implement a wrapper that uses a background process or timeout mechanism if available.
- If Kujo runtime doesn't support command timeouts, document this limitation clearly and remove the `timeout_seconds` field from the default config to avoid misleading users.
- If it does support timeout, thread `timeout_seconds` through to `run_shell` and enforce it.

**Verification**: Test that a long-running command is killed after the timeout.

---

## Tier 6: Reporting Improvements

These items improve output formats and result handling.

### [x] 6.1 — Add JUnit XML output format

**Description**: Many CI systems (Jenkins, GitLab, CircleCI) consume JUnit XML. Add this output format.

**Implementation**:
- Add `--format junit` CLI flag (default: `markdown`).
- Implement `generate_junit_report(results)` in `src/report.kujo`.
- JUnit XML structure: `<testsuite>` with `<testcase>` elements, `<failure>` for failed tests, `<skipped>` for skipped, timing info.
- Write to `eval_results/junit.xml`.

**Verification**: Generate JUnit XML from test results and validate against the JUnit XSD schema manually (or verify structure).

---

### [x] 6.2 — Add TAP (Test Anything Protocol) output

**Description**: TAP is a simple line-based format widely used in CI. Add support.

**Implementation**:
- Add `--format tap`.
- Implement `generate_tap_report(results)` in `src/report.kujo`.
- TAP format: `1..N` header, `ok N - test name` or `not ok N - test name`.

**Verification**: Compare output against TAP version 13 spec.

---

### [x] 6.3 — Save run results JSON after every `run` for `report` to consume (done in 1.3)

**Description**: Currently `command_report` re-runs the suite. It should use saved results.

**Implementation**:
- In `command_run`, save `eval_results/last_run.json` with the full results dict.
- In `command_report`, load `eval_results/last_run.json` first. Only re-run if missing or `--rerun` flag.
- Add `--rerun` flag documentation.

**Verification**: Run a suite, then run report without re-execution. Verify no commands are executed during report generation.

---

### [x] 6.4 — Add HTML report output with collapsible sections

**Description**: HTML reports are easier to share and browse than markdown.

**Implementation**:
- Add `--format html`.
- Implement `generate_html_report(results)` in `src/report.kujo`.
- Include a self-contained HTML page with:
  - Summary cards (pass/fail/skip counts, pass rate bar)
  - Collapsible test details sections
  - Snapshot diffs rendered with side-by-side view
- No external CSS/JS dependencies.

**Verification**: Open generated HTML in a browser and verify rendering.

---

## Tier 7: Structural & Documentation Improvements

These items improve the project organization and developer onboarding.

### [x] 7.1 — Move `eval.json` self-check into `examples/` directory

**Files**: `eval.json` (root), new location `examples/self_check.json`

**Problem**: The root directory has `eval.json` which is the default config name used by `eval init`. Having a pre-existing `eval.json` at root means `eval init` will overwrite it or conflict.

**Fix**: Move `eval.json` to `examples/self_check.json`. Update the README to reference it as an example. Add a note in `.gitignore` to ignore root `eval.json` (it's already implicitly covered by the eval_results/snapshots entries but be explicit).

---

### [x] 7.2 — Add architecture/design document

**New file**: `docs/ARCHITECTURE.md`

**Content**: Document the module structure, data flow (config → runner → checks → results → report), result envelope contract, check type extension guide, and design decisions. Model after `kujo-ai-sdk/docs/ARCHITECTURE_DATA_FLOW.md`.

---

### [x] 7.3 — Add contributing guide

**New file**: `docs/CONTRIBUTING.md`

**Content**: How to add new check types, how to run tests, coding conventions (reference the Kujo style guide from existing tools), PR checklist, release process.

---

### [x] 7.4 — Add security policy

**New file**: `docs/SECURITY.md`

**Content**: Document the security model (command execution boundaries, path restrictions, output redaction), known limitations, responsible disclosure process. Reference the existing `kujo-mcp/docs/security-model.md` for format.

---

### [x] 7.5 — Fix README roadmap and align with this checklist

**File**: `README.md`

**Problem**: The README roadmap section has unchecked items that overlap with this checklist. Some already-completed items are marked unchecked.

**Fix**:
- Update the roadmap to reflect current state accurately.
- Add links to this checklist doc and `docs/eval-suite-reference.md`.
- Add a "Contributing" section pointing to `docs/CONTRIBUTING.md`.

---

## Tier 8: Test Coverage Expansion

These items add tests for currently uncovered paths.

### [x] 8.1 — Add CLI integration tests

**New file**: `tests/cli_integration_tests.kujo`

**Content**: Test each CLI subcommand end-to-end:
- `init` creates a valid eval.json
- `run` executes tests and produces output
- `run --json` produces valid JSON
- `report` generates a markdown file
- `compare` with two result files
- `list-checks` outputs all check types
- `snapshots` lists snapshots
- `version` prints version string
- Invalid subcommand shows help
- Missing required args shows error

---

### [x] 8.2 — Add edge case tests for existing checks

**File**: `tests/contract_tests.kujo`

**Additional tests needed**:
- `check_file_contains` with empty file
- `check_file_contains` with Unicode/emoji content
- `check_file_contains` with very long content (>10KB)
- `check_output_contains` with multi-line output
- `check_output_contains` with command that produces stderr
- `check_json_matches_shape` with inline `json` param (not `path`)
- `check_json_matches_shape` with nested JSON keys
- `check_json_matches_shape` with empty JSON object `{}`
- `check_directory_diff` with nested subdirectories
- `check_directory_diff` with one empty directory
- `check_snapshot_matches` with `update: "true"` flag
- `check_snapshot_matches` with command (not content)
- `check_exit_code_equals` with negative expected code
- `run_check` with each of the 12 check types to verify dispatch

---

### [x] 8.3 — Add security regression tests

**New file**: `tests/security_tests.kujo`

**Content**: Tests for:
- Path traversal rejection (`../etc/passwd`, `../../root/.ssh`)
- Command injection rejection (`rm -rf`, `; cat /etc/passwd`, `$(whoami)`)
- Oversized config rejection
- Too many tests rejection

---

### [x] 8.4 — Add `run_suite` integration test

**File**: `tests/contract_tests.kujo`

**Additional test**: Create a temporary `eval.json` with a mix of passing and failing tests, call `run_suite`, and verify:
- The correct number of passed/failed tests is reported
- Each test result has the expected shape
- `stop_on_failure: true` halts after the first failure
- Skipped tests are counted correctly
- Missing config file returns an error result

---

## Tier 9: CI/CD & Release Engineering

These items harden the CI pipeline and release process.

### [x] 9.1 — Add release quality gates

**New file**: `scripts/release_quality_gates.sh`

**Description**: Model after `kujo-ai-sdk/scripts/release_quality_gates.sh`. Script should:
- Run all contract tests
- Run security tests (when added)
- Run CLI integration tests (when added)
- Verify docs freshness (check README commands match actual CLI output)
- Reject if any gate fails

---

### [x] 9.2 — Add compatibility matrix test

**New file**: `.github/workflows/compatibility-matrix.yml`

**Description**: Test against multiple Kujo runtime versions to ensure compatibility. Model after `kujo-ai-sdk/.github/workflows/compatibility-matrix.yml`.

---

### [x] 9.3 — Pin Kujo runtime version explicitly and add update mechanism

**File**: `.github/workflows/ci.yml`, `kennel.toml`

**Problem**: The CI hardcodes a `KUJO_RUNTIME_REF` commit hash. There's no mechanism to update this when the Kujo runtime changes.

**Fix**:
- Document the `KUJO_RUNTIME_REF` in a `RUNTIME_VERSION` file at the repo root.
- Update CI to read from that file.
- Add a script `scripts/update_runtime_pin.sh` that helps update the pinned version.

---

### [x] 9.4 — Add supply-chain policy check

**New file**: `scripts/supply_chain_policy_check.sh`

**Description**: Model after `kujo-ai-sdk/scripts/supply_chain_policy_check.sh`. Verify:
- No root scratch Kujo files
- All source files have correct imports
- kennel.toml exports match actual exports
- No hardcoded secrets or tokens

---

## Quick Reference: File Map

| File | Purpose | Lines (approx) |
|------|---------|----------------|
| `main.kujo` | CLI entry point, command dispatch | 340 |
| `src/config.kujo` | Config loading, validation, init | 290 |
| `src/checks.kujo` | All 12 check implementations + dispatcher | ~800 |
| `src/eval_core.kujo` | Suite runner, compare_runs | 130 |
| `src/report.kujo` | Markdown report generation | 250 |
| `src/snapshot.kujo` | Snapshot CRUD + diff | 200 |
| `tests/contract_tests.kujo` | All tests | 620 |
| `kennel.toml` | Package manifest | 50 |
| `README.md` | User documentation | ~230 |

---

## Completion Tracking

| Tier | Items | Completed |
|------|-------|-----------|
| Tier 1: Critical Fixes | 5 | 5 |
| Tier 2: Security Hardening | 4 | 4 |
| Tier 3: Code Quality & DRY | 5 | 5 |
| Tier 4: New Check Types | 7 | 7 |
| Tier 5: Suite & Runner Features | 6 | 6 |
| Tier 6: Reporting Improvements | 4 | 4 |
| Tier 7: Structural & Documentation | 5 | 5 |
| Tier 8: Test Coverage Expansion | 4 | 4 |
| Tier 9: CI/CD & Release Engineering | 4 | 4 |
| **Total** | **44** | **44** |
