# API Reference

Generated from `describe_*_module()` functions (contract v2.0.0).

## `src/common.kujo` — Shared Utilities

**Exports**: `dict_get_or`, `normalize_string`, `normalize_int`, `normalize_bool`, `normalize_array`, `normalize_dict`, `make_result`, `make_success_result`, `make_error_result`, `make_check_error`, `make_check_success`

- `dict_get_or(obj, key, default)` — Safe dict access with fallback
- `normalize_string(value, fallback)` — Returns trimmed string or fallback
- `normalize_int(value, fallback)` — Returns int or fallback
- `normalize_bool(value, fallback)` — Returns bool or fallback
- `normalize_array(value)` — Returns array or empty array
- `normalize_dict(value)` — Returns dict or empty dict
- `make_result(ok, error, data)` — Standard result envelope
- `make_success_result(data)` — Shorthand for ok=true result
- `make_error_result(error, data)` — Shorthand for ok=false result
- `make_check_error(check, message, details)` — Check-specific error result
- `make_check_success(check, message, details)` — Check-specific success result

## `src/cli.kujo` — CLI Argument Parsing

**Exports**: `parse_cli_flags`, `print_help`

- `parse_cli_flags(args)` — Parses CLI args into `{flags, positionals}`
- `print_help()` — Prints help text with all commands and options

## `src/config.kujo` — Configuration

**Exports**: `load_config`, `validate_config`, `init_config`, `KNOWN_CHECKS`, `default_config_path`, `lint_config_file`, `policy_explain_config`

- `load_config(path)` — Loads and validates eval.json, returns envelope
- `validate_config(cfg)` — Validates config structure, returns envelope with normalized config
- `init_config(name, out_dir, snap_dir, template)` — Creates default eval.json
- `KNOWN_CHECKS()` — Returns array of all 27 check type names
- `default_config_path()` — Returns `"eval.json"`
- `lint_config_file(path)` — Returns structured lint diagnostics with code/location/suggested fix
- `policy_explain_config(cfg, stage)` — Returns effective merged policy view for local/ci/release stage

## `src/checks.kujo` — Check Implementations

**Exports**: `run_check`, `run_shell`, `run_shell_timed`, `is_command_safe`, `is_path_safe`, `redact_sensitive`

### Command Checks
- `check_command_succeeds(params)` — Asserts command exits 0
- `check_command_fails(params)` — Asserts command exits non-zero
- `check_exit_code_equals(params)` — Asserts specific exit code
- `check_command_timing_less_than(params)` — Asserts command under max_ms

### File Checks
- `check_file_exists(params)` — Asserts file exists
- `check_file_does_not_exist(params)` — Asserts file doesn't exist
- `check_file_contains(params)` — Asserts file contains text
- `check_file_does_not_contain(params)` — Asserts file doesn't contain text
- `check_file_matches_glob(params)` — Asserts file matches glob pattern
- `check_file_matches_regex(params)` — Asserts file matches regex
- `check_file_size_greater_than(params)` — Asserts file size > bytes
- `check_file_size_less_than(params)` — Asserts file size < bytes
- `check_file_line_count(params)` — Asserts file line count
- `check_two_files_equal(params)` — Asserts two files identical

### Output Checks
- `check_output_contains(params)` — Asserts command stdout contains text
- `check_output_does_not_contain(params)` — Asserts command stdout doesn't contain text
- `check_output_matches_glob(params)` — Asserts command stdout matches glob

### Data Checks
- `check_json_matches_shape(params)` — Asserts JSON has required keys
- `check_json_value_equals(params)` — Asserts JSON path equals value
- `check_stdout_json_matches_shape(params)` — Asserts command stdout JSON shape
- `check_command_stdout_json_path_equals(params)` — Asserts command stdout JSON path value

### Snapshot & Directory
- `check_snapshot_matches(params)` — Asserts output matches stored snapshot
- `check_directory_diff(params)` — Asserts two directories identical
- `check_directory_contains(params)` — Asserts directory contains matching files

### Environment & Network
- `check_env_var_equals(params)` — Asserts env var value
- `check_http_status(params)` — Asserts HTTP response status
- `check_http_body_contains(params)` — Asserts HTTP response body contains text

### Security
- `is_command_safe(command, allowed)` — Validates command against dangerous patterns
- `is_path_safe(path, allowed)` — Validates path against traversal/system access
- `redact_sensitive(text)` — Scrubs sensitive patterns from output

## `src/eval_core.kujo` — Core Engine

**Exports**: `run_suite`, `compare_runs`, `contract_version`, `shuffle_tests`, `build_dep_graph`, `has_matching_tag`

- `run_suite(config_path, options)` — Executes all tests, returns envelope with results
- `compare_runs(results_a, results_b)` — Compares two runs for regression/improvement
- `contract_version()` — Returns `"2.0.0"`
- `shuffle_tests(arr, seed)` — Fisher-Yates shuffle with LCG PRNG
- `build_dep_graph(tests)` — Builds dependency map from test definitions
- `has_matching_tag(test_tags, filter_tags)` — Tag intersection check

## `src/report.kujo` — Report Generation

**Exports**: `generate_markdown_report`, `generate_html_report`, `generate_junit_report`, `generate_tap_report`, `generate_ndjson_report`, `save_report`, `save_report_with_options`, `print_report`, `write_github_summary`

- `generate_markdown_report(results)` — Returns markdown string
- `generate_html_report(results)` — Returns self-contained HTML string
- `generate_junit_report(results)` — Returns JUnit XML string
- `generate_tap_report(results)` — Returns TAP string
- `generate_ndjson_report(results)` — Returns NDJSON string
- `save_report(results, out_dir, name, format)` — Saves report to file
- `save_report_with_options(results, out_dir, name, format, opts)` — Saves report with optional incremental section-signature cache
- `print_report(results, format)` — Prints report to stdout
- `write_github_summary(results)` — Writes to $GITHUB_STEP_SUMMARY

## CLI Command Inventory

The generated CLI command surface is tracked in `docs/COMMAND_INVENTORY.md` and validated by `scripts/generate_command_inventory.sh --check`.

## `src/snapshot.kujo` — Snapshot Management

**Exports**: `save_snapshot`, `compare_snapshot`, `list_snapshots`, `delete_snapshot`

- `save_snapshot(dir, name, content)` — Saves snapshot file
- `compare_snapshot(dir, name, content)` — Compares against stored snapshot
- `list_snapshots(dir)` — Lists all snapshots in directory
- `delete_snapshot(dir, name)` — Deletes a snapshot
