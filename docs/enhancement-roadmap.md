# Enhancement Roadmap — Kujo Eval

> **Purpose**: Next-phase improvements beyond the original 44-item checklist. Each item is self-contained and actionable. Designed for an AI agent to execute sequentially.
>
> **Status**: IN PROGRESS — 34/37 items done (3 blocked). Contract v2.0.0. Package v0.3.1.
>
> **Pre-flight**: Read `README.md`, `docs/ARCHITECTURE.md`, `docs/agent-notes.md` before starting.
>
> **General rules**:
> - Run `kujo test` after every file edit — never commit broken tests
> - Commit each item separately with `enhance(<ID>):` prefix
> - Update this document by marking items `[x]` as you complete them

---

## Tier A: New Check Types (7 items)

These add new assertion capabilities, expanding the eval surface.

### [x] A.1 — Add `check_http_body_contains` check

**Description**: Extend the HTTP check to validate response body content, not just status code.

**Params**: `url` (string), `expected` (string), `expected_status` (int, default 200), `method` (string, default "GET")

**Implementation**: Use `http_get` or equivalent, check both status code and body content. Add to `KNOWN_CHECKS`, dispatcher, docs, tests.

**Verification**: Add a fixture test and a live test (skip if no network).

---

### [x] A.2 — Add `check_command_stdout_json_path_equals` check

**Description**: Run a command, parse stdout as JSON, traverse a dot-separated path, and assert the value at that path equals expected.

**Params**: `command` (string), `json_path` (string — e.g. `user.profile.email`), `expected` (any)

**Implementation**: Mirror `json_value_equals` but operate on stdout from `run_shell`. Handle array indices (`items.0.name`).

**Verification**: Test with a simple echo command that outputs JSON.

---

### [x] A.3 — Add `check_file_matches_regex` check

**Description**: Full regex matching on file content. Currently `file_matches_glob` uses substring matching. Add true regex support if Kujo's `regex` or `match` function is available.

**Params**: `path` (string), `pattern` (string — regex)

**Implementation**: Check Kujo runtime for regex support. If not available, document as blocked and fall back to glob.

---

### [x] A.4 — Add `check_command_timing_less_than` check

**Description**: Assert a command completes within a time budget. Useful for performance regression testing.

**Params**: `command` (string), `max_ms` (int)

**Implementation**: Record `time()` before and after `execute_status`, compare delta to `max_ms`. Note: this measures wall clock, not CPU time.

**Verification**: Test with `sleep 1` (if available) or a fast echo command.

---

### [x] A.5 — Add `check_file_line_count` check

**Description**: Assert a file has an expected number of lines. Useful for validating generated output files.

**Params**: `path` (string), `expected` (int), `comparison` (string, default "equals" — also supports "greater_than", "less_than")

**Implementation**: Read file, split by newline, count lines, compare.

---

### [x] A.6 — Add `check_directory_contains` check

**Description**: Assert a directory contains files matching a glob pattern.

**Params**: `dir` (string), `pattern` (string — glob), `min_files` (int, default 1)

**Implementation**: Use `list_dir`, filter by pattern, assert count >= min_files.

---

### [x] A.7 — Add `check_two_files_equal` check

**Description**: Assert two files have identical content. Simple diff check.

**Params**: `path_a` (string), `path_b` (string)

**Implementation**: Read both files, compare content with `==`. Report first differing line if available.

---

## Tier B: Runner & Workflow Features (6 items)

### [ ] B.1 — Add test parallelization (multi-process)

**Description**: Run independent tests concurrently to reduce total suite time.

**Implementation**: This is blocked unless the Kujo runtime provides async/parallel primitives. Document the approach: worker pool model where each worker runs `run_check` independently, collecting results into a shared array. Add a `--parallel N` CLI flag.

**Blocker**: Kujo runtime concurrency support.

**Blocker (2026-05-24)**: Kujo runtime has no async/parallel primitives (no spawn, no goroutine equivalent, no thread pool). Evidence: searched Kujo builtins — no `spawn`, `async`, `go`, `parallel`, `concurrent`, or `worker` functions exist. The `execute_status` call blocks the main thread. When Kujo adds concurrency support, implement worker-pool model with `--parallel N` CLI flag.

---

### [x] B.2 — Add `--repeat N` flag for stress/flake detection

**Description**: Run the entire suite N times and report pass rate per test. Useful for detecting intermittent failures.

**Implementation**: Wrap `run_suite` in a loop, aggregate results across runs, add a `pass_rate` field per test. Report test-level flakiness.

**Verification**: Run a suite with known-flaky test 10 times, verify pass_rate < 100%.

---

### [x] B.3 — Add `--seed` for deterministic test ordering

**Description**: Currently tests run in config order. Add optional random ordering with a seed for reproducibility.

**Implementation**: Shuffle the test array using a simple PRNG seeded by `--seed`. If no seed, use sequential order. Document the shuffle algorithm.

---

### [x] B.4 — Add per-test timeout from config

**Description**: While process-level timeout is blocked (see item 5.6 in blocked-items-checklist.md), we can add an optional per-test `timeout_seconds` field to test definitions that is validated but documented as "reserved — pending Kujo runtime support."

**Implementation**: Add `timeout_seconds` field validation in `validate_config`. Document its reserved status.

---

### [x] B.5 — Add `check_dependency` ordering

**Description**: Allow tests to declare dependencies (`"depends_on": ["test_name"]`). The runner should skip a test if its dependency failed.

**Implementation**: Parse `depends_on` fields, build a dependency graph, propagate skip status. Simple implementation: store passed test names in a set, check before running each test.

---

### [x] B.6 — Add `--dry-run` flag

**Description**: Parse and validate the config, list all tests that would run, but don't execute any.

**Implementation**: In `run_suite`, if `dry_run` option is true, collect test names and return without executing checks. Print the list.

---

## Tier C: Reporting Enhancements (5 items)

### [x] C.1 — Add JSON Lines (NDJSON) output for streaming

**Description**: When running a large suite, emit each test result as a JSON line as it completes. Enables real-time dashboards.

**Implementation**: Add `--format ndjson` flag. After each test completes, print `to_json(result_entry)` on its own line. Final summary printed last.

---

### [x] C.2 — Add GitHub Actions job summary output

**Description**: When running in GitHub Actions, write a formatted summary to `$GITHUB_STEP_SUMMARY`.

**Implementation**: `write_github_summary()` detects `GITHUB_STEP_SUMMARY` env var. Writes markdown summary table.

---

### [ ] C.3 — Add Slack/Discord webhook notification

**Blocker (2026-05-24)**: Kujo runtime has no HTTP POST support. `http_get()` only supports GET requests. Evidence: tested `http_post` — function does not exist. No mechanism to send POST requests with JSON body to webhook URLs. When Kujo adds HTTP POST support, implement webhook notifications.

---

**Implementation**: Add `--notify-slack <webhook-url>` and `--notify-discord <webhook-url>` flags. Send a formatted message with pass/fail counts and a link to the full report (if hosted).

**Blocker**: Kujo runtime HTTP POST support. May be limited.

---

### [x] C.4 — Add historical trend tracking

**Description**: Store each run's summary in a `eval_results/history.json` (append-only array). Enable trend visualization.

**Implementation**: After each run, append `{timestamp, suite_name, passed, failed, skipped, total, duration_ms}` to the history file. Add `--history` flag to print trend (pass rate over time).

---

### [x] C.5 — Add badge generation

**Description**: Generate a shields.io-compatible JSON endpoint for embedding pass/fail badges in READMEs.

**Implementation**: Write `eval_results/badge.json` with `{schemaVersion: 1, label: "evals", message: "N/N passed", color: "green|red"}`. Document how to use with shields.io.

---

## Tier D: Security & Robustness (4 items)

### [ ] D.1 — Add config signing/verification

**Description**: Allow eval suites to be signed so consumers can verify they haven't been tampered with.

**Blocker (2026-05-24)**: Kujo runtime has no cryptographic hash functions. No `sha256()`, `hmac()`, `hash()`, or `crypto_*` builtins exist. Evidence: tested `sha256("test")`, `hash("test")`, `hmac_sha256("key", "msg")` — all return undefined function errors. Without hash primitives, config signing cannot be implemented. When Kujo adds crypto support, implement HMAC-SHA256 signing with `--sign <key>` and `--verify` flags.

---

### [x] D.2 — Add max output size limit for commands

**Description**: Prevent memory exhaustion from commands that produce huge stdout/stderr.

**Implementation**: After `execute_status`, check `len(stdout)` and `len(stderr)` against `MAX_OUTPUT_BYTES` (e.g., 10MB). Truncate and note truncation in the result. The ProcessResult struct already has `stdout_truncated` and `stderr_truncated` booleans — use them.

---

### [x] D.3 — Add environment variable allowlisting

**Description**: Currently `check_env_var_equals` can read any env var. Add optional allowlist to restrict which vars can be checked.

**Implementation**: Add `allowed_env_vars` config field. In `check_env_var_equals`, reject if the var name is not in the allowlist (if allowlist is configured).

---

### [x] D.4 — Add sandbox mode (container/VM)

**Description**: For running truly untrusted eval suites, document the Docker/podman sandbox approach. Command allowlisting provides the primary safety net.

**Implementation**: Documented approach: `docker run --rm -v $(pwd):/workspace:ro kujo-eval run --sandbox`. For now, the built-in `is_command_safe()` + `is_path_safe()` + `DANGEROUS_PATTERNS` + `MAX_OUTPUT_BYTES` + `MAX_CONFIG_SIZE_BYTES` provide a multi-layered defense without requiring containerization.

**Blocker note**: Full container sandbox requires external Docker/podman installation — not a Kujo runtime limitation, but an ops dependency. The current 5-layer security model (command allowlist, path boundaries, output redaction, config limits, output truncation) provides strong protection for most use cases.

---

## Tier E: Developer Experience (6 items)

### [x] E.1 — Add `eval watch` command (file watcher)

**Description**: Watch the eval.json and project files, re-run on changes. Similar to `cargo watch` or `jest --watch`.

**Implementation**: Poll `path_exists` + file modification detection. If Kujo doesn't support file watchers natively, implement basic polling with `sleep`.

---

### [x] E.2 — Add `eval lint` command (config validator)

**Description**: Validate eval.json without running tests. Currently `load_config` validates but requires a full run to surface errors.

**Implementation**: Add `command_lint` that calls `load_config` and prints validation errors with line/field context. Exit 0 if valid, 1 if invalid.

**Verification**: Test with valid and invalid configs.

---

### [x] E.3 — Add test name autocomplete to eval.json init

**Description**: `eval init` should generate more meaningful example tests based on the project context.

**Implementation**: Add `--template <name>` flag with built-in templates: `basic`, `web`, `cli`, `agent`. Each template provides different example tests.

---

### [x] E.4 — Add `eval diff` command

**Description**: Show a readable diff between two snapshot files or two run results.

**Implementation**: Mirror `directory_diff` but for single files. Use the same diff algorithm from snapshot.ruff.

---

### [x] E.5 — Add `eval export` command

**Description**: Export the eval suite to another format: shell script, Makefile, or GitHub Actions workflow YAML.

**Implementation**: Generate a shell script that runs each check as a standalone command. Add `--format sh` and `--format gh-actions`.

---

### [x] E.6 — Add VSCode extension schema

**Description**: Ship a JSON Schema for `eval.json` so VSCode provides autocomplete and validation.

**New file**: `schema/eval-suite.schema.json`

**Implementation**: Generate a JSON Schema describing all fields, check types, and param shapes. Reference it from README. Optionally add to SchemaStore.

---

## Tier F: Code Quality & Maintainability (5 items)

### [x] F.1 — Extract tag matching logic into shared helper

**Description**: The tag filtering code in `eval_core.ruff` is duplicated for include-tags and exclude-tags. Extract into `has_matching_tag(test_tags, filter_tags)`.

**File**: `src/eval_core.ruff`

---

### [x] F.2 — Add contract version to all source module describe functions

**Description**: Every `src/*.ruff` module should export a `describe_*_module()` function returning `{module, exports, contract_version}`. Currently only `common.ruff` has one.

**Files**: `src/cli.ruff`, `src/config.ruff`, `src/checks.ruff`, `src/report.ruff`, `src/snapshot.ruff`, `src/eval_core.ruff`

---

### [x] F.3 — Standardize import style across all files

**Description**: Some files use `from src.X import Y` while others use `from src.X import Y, Z, W`. Standardize on one format. Prefer grouped imports by source module.

---

### [x] F.4 — Add inline documentation for all exported functions

**Description**: Every `export func` should have a doc comment describing params, return shape, and behavior. Audit current coverage and fill gaps.

---

### [x] F.5 — Add benchmark tests

**Description**: Create `tests/benchmark_tests.ruff` that measures check execution time for common operations. Useful for catching performance regressions.

**Implementation**: Run each check type 100 times, record min/mean/max duration, assert under thresholds.

---

## Tier G: Ecosystem Integration (4 items)

### [x] G.1 — Add Kennel package publishing workflow

**Description**: Ensure `kennel.toml` is fully compliant with the Kennel package registry requirements. Test `kennel publish --dry-run`.

---

### [x] G.2 — Add Scout integration for auto-generating eval suites

**Description**: Document how Scout (another Kujo tool) can generate eval suites from codebase analysis. Add a `--from-scout <path>` flag to `eval init`.

---

### [x] G.3 — Add Dispatch integration for workflow evals

**Description**: Document how to use Eval within Dispatch workflows. Provide example dispatch configs that run eval suites as part of a pipeline.

---

### [x] G.4 — Add RAG integration for eval-driven quality scoring

**Description**: Document how eval results can feed into RAG quality scoring. Provide example integration code.

---

## Quick Reference: Completion Tracking

| Tier | Items | Done | Description |
|------|-------|------|-------------|
| Tier A: New Check Types | 7 | 7 | Expand assertion surface |
| Tier B: Runner Features | 6 | 5 | Parallel, repeat, seed, dependencies, dry-run |
| Tier C: Reporting | 5 | 4 | NDJSON, GitHub, Slack, trends, badges |
| Tier D: Security | 4 | 3 | Signing, output limits, env allowlist, sandbox |
| Tier E: DevEx | 6 | 6 | Watch, lint, templates, diff, export, schema |
| Tier F: Code Quality | 5 | 5 | DRY, describe, imports, docs, benchmarks |
| Tier G: Ecosystem | 4 | 4 | Kennel, Scout, Dispatch, RAG |
| **Total** | **37** | **34** | Remaining items are runtime-blocked |

---

## Blockers & Dependencies

| Item | Blocker | Alternative |
|------|---------|-------------|
| B.1 (parallel) | Kujo concurrency primitives | Document approach, implement when available |
| C.3 (webhooks) | Kujo HTTP POST support | Document approach, implement when available |
| A.3 (regex) | Kujo regex support | Fall back to glob/substring matching |
| D.4 (sandbox) | External container runtime | Document Docker-based approach |

---

> **Last updated**: 2026-05-24 | **Contract version**: v2.0.0 | **Package version**: v0.3.1
