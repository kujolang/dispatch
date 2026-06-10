# Blocked Items Checklist — Kujo Eval

> **Purpose**: Step-by-step unblocking plans for the 3 remaining items from `docs/improvement-checklist.md`. Each plan is designed for an AI agent to execute sequentially, with verification steps at every stage. No steps are batched — work through each sub-item in order.
>
> **Pre-flight**: Read `README.md`, `docs/ARCHITECTURE.md`, `docs/agent-notes.md`, and `docs/eval-suite-reference.md` before starting any item.
>
> **General rules**:
> - Run `kujo test` after every file edit — never commit broken tests
> - Commit each sub-item separately with `eval(<ID>.<sub>):` prefix
> - Update this document by marking sub-items `[x]` as you complete them

---

## Item 3.4 — Standardize result dict shape across all modules

**Status**: Blocked (breaking refactor across 8 files)
**Estimated effort**: 10-12 sub-items
**Contract impact**: Bump to `2.0.0`

### Problem

5 different modules return 5 different result shapes with no consistent envelope:
- `checks.kujo`: `{ok, check, message, details}`
- `snapshot.kujo`: `{ok, path, name, message}` or `{match, snapshot_path, name, message, diff}`
- `config.kujo`: `{ok, error, config, path}`
- `report.kujo`: `{ok, path, message, report}` or `{ok, message}`
- `eval_core.kujo`: `{ok, error, suite_name, passed, failed, ...}` or `{ok, run_a, run_b, ...}`

### Target envelope (defined in `src/common.kujo`)

```
{
  "ok": bool,
  "error": string ("" on success),
  "data": { ... module-specific payload ... }
}
```

### Step-by-step plan

#### [x] 3.4.1 — Define the standard envelope in `src/common.kujo`

**File**: `src/common.kujo`

Add:
```kujo
export func make_result(ok_flag, error_msg, data_dict) {
    return {
        "ok": ok_flag,
        "error": normalize_string(error_msg, ""),
        "data": normalize_dict(data_dict)
    }
}

export func make_success_result(data_dict) {
    return make_result(true, "", data_dict)
}

export func make_error_result(error_msg, data_dict) {
    return make_result(false, error_msg, data_dict)
}
```

**Verification**: Add a unit test in `tests/contract_tests.kujo` that calls `make_success_result` and `make_error_result` and verifies the shape.

---

#### [x] 3.4.2 — Bump contract version to `2.0.0`

**Files**: `src/eval_core.kujo` (contract_version function), `kennel.toml` (version field)

- Change `contract_version()` to return `"2.0.0"`
- Update `kennel.toml` version to `"0.2.0"` (package version, not contract version)

**Verification**: Run `kujo run main.kujo --interpreter version` and verify output.

---

#### [x] 3.4.3 — Refactor `src/checks.kujo` result shapes

**File**: `src/checks.kujo`

All 20 check functions currently return `{ok, check, message, details}`. Refactor to:
```
make_result(ok_flag, error_msg, {
    "check": check_type,
    "message": message,
    "details": details
})
```

Steps:
1. Refactor `check_file_exists` as the model — test passes
2. Refactor `check_file_does_not_exist` — test passes
3. Refactor `check_file_contains` — test passes
4. Refactor `check_file_does_not_contain` — test passes
5. Refactor `check_command_succeeds` — test passes
6. Refactor `check_command_fails` — test passes
7. Refactor `check_exit_code_equals` — test passes
8. Refactor `check_output_contains` — test passes
9. Refactor `check_output_does_not_contain` — test passes
10. Refactor `check_json_matches_shape` — test passes
11. Refactor `check_snapshot_matches` — test passes
12. Refactor `check_directory_diff` — test passes
13. Refactor `check_file_matches_glob` — test passes
14. Refactor `check_output_matches_glob` — test passes
15. Refactor `check_json_value_equals` — test passes
16. Refactor `check_file_size_greater_than` — test passes
17. Refactor `check_file_size_less_than` — test passes
18. Refactor `check_env_var_equals` — test passes
19. Refactor `check_stdout_json_matches_shape` — test passes
20. Refactor `check_http_status` — test passes

**Also update**: `make_check_error` and `make_check_success` in `src/common.kujo` to use the new envelope.

**Verification**: Run `kujo test` after each check refactor. All tests must pass before moving to the next check.

---

#### [x] 3.4.4 — Refactor `src/snapshot.kujo` result shapes

**File**: `src/snapshot.kujo`

Functions to refactor:
1. `save_snapshot` — currently returns `{ok, path, name, message}` → wrap in envelope
2. `compare_snapshot` — currently returns `{match, snapshot_path, name, message, diff}` → standardize `match` field into `ok`/`error` envelope, put diff info in `data`
3. `list_snapshots` — currently returns `{ok, snapshots, count, message}` → envelope
4. `delete_snapshot` — currently returns `{ok, message}` → envelope

**Verification**: All snapshot tests in `tests/contract_tests.kujo` pass.

---

#### [x] 3.4.5 — Refactor `src/config.kujo` result shapes

**File**: `src/config.kujo`

Functions to refactor:
1. `load_config` — currently returns `{ok, error, config, path}` → envelope with `data.config` and `data.path`
2. `validate_config` — currently returns `{ok, error, config}` → envelope with `data.config`
3. `init_config` — currently returns `{ok, message, path}` → envelope

**Verification**: All config tests pass.

---

#### [x] 3.4.6 — Refactor `src/report.kujo` result shapes

**File**: `src/report.kujo`

Functions to refactor:
1. `save_report` — currently returns `{ok, path, message, report}` → envelope
2. `print_report` — currently returns `{ok, message}` → envelope

**Verification**: Report tests pass.

---

#### [x] 3.4.7 — Refactor `src/eval_core.kujo` result shapes

**File**: `src/eval_core.kujo`

Functions to refactor:
1. `run_suite` — currently returns `{ok, error, suite_name, passed, failed, ...}` → envelope with all suite data in `data`
2. `compare_runs` — currently returns `{ok, run_a, run_b, regression, improvement, summary}` → envelope

**This is the most impactful change** — `main.kujo` and all callers of `run_suite` access fields like `results["passed"]`, `results["failed"]`, `results["total"]`, `results["test_results"]` directly. After refactoring, these become `results["data"]["passed"]`, etc.

**Verification**: All tests pass. Run `kujo run main.kujo --interpreter run examples/basic_suite.json --json` and verify JSON output structure.

---

#### [x] 3.4.8 — Update `main.kujo` callers

**File**: `main.kujo`

Update all callers that access result fields directly:
- `command_run`: `results["ok"]`, `results["error"]`, `results["failed"]`, etc.
- `command_report`: `results["ok"]`, `results["error"]`
- `command_compare`: accesses run data

For each field access, add `.data` level:
- `results["failed"]` → `results["data"]["failed"]`
- `results["passed"]` → `results["data"]["passed"]`
- etc.

**Verification**: Run `kujo run main.kujo --interpreter run examples/basic_suite.json --json` and verify output. Run `kujo run main.kujo --interpreter report --json`.

---

#### [x] 3.4.9 — Update `tests/contract_tests.kujo` assertions

**File**: `tests/contract_tests.kujo`

All test assertions that access result fields directly must be updated to use the new envelope. This is the largest change — ~100+ assertions across 60+ tests.

Search for patterns:
- `result["passed"]` → `result["data"]["passed"]`
- `result["ok"]` stays the same (top-level field)
- `result["check"]` → `result["data"]["check"]`
- `result["message"]` → `result["data"]["message"]`
- `result["match"]` → `result["ok"]` (snapshot)
- `results["suite_name"]` → `results["data"]["suite_name"]`
- `results["total"]` → `results["data"]["total"]`

**Verification**: `kujo test` — all 3 suites pass.

---

#### [x] 3.4.10 — Update `tests/security_tests.kujo` assertions

**File**: `tests/security_tests.kujo`

Same pattern as 3.4.9 — update field access paths for all assertions.

**Verification**: `kujo test` — all 3 suites pass.

---

#### [x] 3.4.11 — Update `tests/cli_integration_tests.kujo` assertions

**File**: `tests/cli_integration_tests.kujo`

Same pattern — update field access paths.

**Verification**: `kujo test` — all 3 suites pass.

---

#### [x] 3.4.12 — Update `eval.json` self-check and examples

**Files**: `examples/self_check.json`, `examples/basic_suite.json`, `examples/snapshot_suite.json`

These JSON files don't need structural changes since they define test configs, not consume results. But verify by running them:
- `kujo run main.kujo --interpreter run examples/self_check.json --json`
- `kujo run main.kujo --interpreter run examples/basic_suite.json --json`

**Verification**: All example suites execute successfully.

---

#### [x] 3.4.13 — Final validation — full test suite + CLI smoke

Run all validations:
1. `kujo test` — all 3 suites pass
2. `kujo run main.kujo --interpreter version` — prints "2.0.0"
3. `kujo run main.kujo --interpreter list-checks` — all 20 types
4. `kujo run main.kujo --interpreter run examples/basic_suite.json --json` — valid JSON
5. `kujo run main.kujo --interpreter report --json` — valid report
6. `bash scripts/supply_chain_policy_check.sh` — all 8 gates pass
7. `bash scripts/release_quality_gates.sh` — all 8 gates pass

**Mark complete**: Change `### [ ] 3.4` to `### [x] 3.4` in `docs/improvement-checklist.md`.

---

## Item 5.6 — Add timeout enforcement for commands

**Status**: Blocked by Kujo runtime (no process timeout)
**Estimated effort**: 3 sub-items (mostly documentation)

### Problem

Kujo's `execute_status` has no timeout parameter. There is no process-level timeout or signal mechanism available in the Kujo runtime.

### Step-by-step plan

#### [x] 5.6.1 — Verify current Kujo runtime state

**Check**: Test `execute_status` with various arguments to confirm no timeout parameter exists. Document the exact function signature available.

**Action**: Run a test script that attempts `execute_status("sleep 10", {timeout: 1})` or similar. Document the error or behavior.

**Evidence to collect**: Exact error message, Kujo version, available `execute_status` parameters.

---

#### [x] 5.6.2 — Remove `timeout_seconds` from default config and docs

**Files**: `src/config.kujo` (init_config), `README.md`, `docs/eval-suite-reference.md`

Actions:
1. In `init_config`, remove `"timeout_seconds": 60` from the default template
2. In `docs/eval-suite-reference.md`, mark `timeout_seconds` as "Reserved — not yet functional" with a note
3. In README, add a note that timeout enforcement is pending Kujo runtime support

**Verification**: Run `kujo run main.kujo --interpreter init --name test` and verify the generated `eval.json` does not contain `timeout_seconds`.

---

#### [x] 5.6.3 — Add timeout wrapper (conditional on runtime support)

**File**: `src/checks.kujo`, function `run_shell`

If the Kujo runtime has added timeout support since this document was written:
1. Add a `timeout_ms` parameter to `run_shell`
2. Thread it through from the `timeout_seconds` config field
3. If the command exceeds the timeout, return `{ok: false, error: "Command timed out"}`

If timeout support still doesn't exist:
- Add a comment block in `run_shell` documenting the limitation
- Update the blocker note in `docs/improvement-checklist.md` with current evidence

**Verification**: If implemented, add a test for timeout behavior. If still blocked, update blocker evidence.

---

## Item 6.4 — Add HTML report output with collapsible sections

**Status**: Blocked (template complexity for single loop)
**Estimated effort**: 6 sub-items

### Problem

A self-contained HTML report requires generating ~150+ lines of HTML/CSS using Kujo string concatenation. This is tedious but straightforward — each section is a standalone piece.

### Step-by-step plan

#### [x] 6.4.1 — Add CSS styles as a constant

**File**: `src/report.kujo`

Define a `HTML_REPORT_CSS` constant with embedded styles:
- Body font, colors, max-width
- Summary cards (green for pass, red for fail, gray for skip)
- Pass rate progress bar
- Test result rows (alternating colors, hover)
- Failure details (collapsible with `<details>` / `<summary>`)
- Snapshot diff (monospace pre block)

Use minimal, clean CSS — no external dependencies.

---

#### [x] 6.4.2 — Implement `generate_html_report(results)` header and summary

**File**: `src/report.kujo`

Build the HTML document structure:
- `<!DOCTYPE html>` + `<html><head>` with inline CSS
- Page title from suite name
- Summary section with cards: Total, Passed, Failed, Skipped, Pass Rate bar

**Verification**: Call `generate_html_report` with mock results in a test and verify the output contains expected elements.

---

#### [x] 6.4.3 — Implement test results table

**File**: `src/report.kujo`

Build the test results table:
- Columns: #, Status (✅/❌), Test Name, Check Type, Message
- Alternating row colors
- Failed rows highlighted

**Verification**: Verify table renders all tests from mock results.

---

#### [x] 6.4.4 — Implement collapsible failure details

**File**: `src/report.kujo`

For each failed test, add a collapsible `<details>` section below the table row containing:
- Full error message
- Check-specific details rendered as a definition list
- Snapshot diff in a `<pre>` block (if applicable)

---

#### [x] 6.4.5 — Add `--format html` CLI flag

**Files**: `src/cli.kujo` (help text), `main.kujo` (command_run, command_report)

1. Add `--format html` to help text
2. In `command_run`, if `--format html`, call `generate_html_report` instead of `print_report`
3. In `command_report`, same treatment
4. Add `--format` to `parse_cli_flags`

**Verification**: Run `kujo run main.kujo --interpreter run examples/basic_suite.json --format html` and verify HTML output.

---

#### [x] 6.4.6 — Add HTML format tests

**File**: `tests/contract_tests.kujo`

Add tests:
1. `generate_html_report` produces valid HTML structure (has `<!DOCTYPE`, `<html>`, `<head>`, `<body>`)
2. HTML contains suite name in title
3. HTML contains pass/fail counts
4. HTML contains test names
5. HTML with all-passed results shows success styling
6. HTML with failures shows collapsible details

**Verification**: `kujo test` — all 3 suites pass.

---

## Completion Tracking

| Item | Sub-items | Completed |
|------|-----------|-----------|
| 3.4 — Standardize result shapes | 13 | 0 |
| 5.6 — Timeout enforcement | 3 | 0 |
| 6.4 — HTML report | 6 | 0 |
| **Total** | **22** | **0** |

---

## Quick Reference

| File | What changes in 3.4 |
|------|---------------------|
| `src/common.kujo` | Add `make_result`, `make_success_result`, `make_error_result` |
| `src/checks.kujo` | 20 check functions + `run_shell` → new envelope |
| `src/snapshot.kujo` | 4 functions → new envelope |
| `src/config.kujo` | 3 functions → new envelope |
| `src/report.kujo` | 2 functions → new envelope |
| `src/eval_core.kujo` | `run_suite`, `compare_runs` → new envelope |
| `main.kujo` | All result field accesses → add `.data` level |
| `tests/contract_tests.kujo` | ~100 assertions → new paths |
| `tests/security_tests.kujo` | ~20 assertions → new paths |
| `tests/cli_integration_tests.kujo` | ~10 assertions → new paths |
