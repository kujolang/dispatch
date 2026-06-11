# Production Polish Checklist — Kujo Eval

> **Purpose**: Final polish items to make kujo-eval a shining star example of what the Kujo language is capable of. These are quality, polish, and presentation items — not feature additions.
>
> **Status**: COMPLETE — 24/25 items done (P1.1 blocked: needs asciinema). Contract v2.0.0. Package v0.3.1.
>
> **Pre-flight**: Read `README.md`, `docs/ARCHITECTURE.md`, `docs/agent-notes.md`, `docs/ECOSYSTEM.md`.
>
> **General rules**:
> - Run `kujo test` after every file edit — never commit broken tests
> - Commit each item separately with `polish(<ID>):` prefix
> - Update this document by marking items `[x]` as you complete them

---

## Tier P1: Presentation & First Impressions (4 items)

These items ensure the project makes an excellent first impression when someone discovers it.

### [ ] P1.1 — Add a `demo.gif` or terminal recording to README

**Blocker (2026-05-24)**: Requires external recording tool (asciinema, terminalizer, or similar). Cannot be generated programmatically by an AI agent. Manual task: record a 20-30 second terminal session showing `kujo run main.kujo --interpreter init --name demo && kujo run main.kujo --interpreter run && kujo run main.kujo --interpreter report --format html`. Add `demo.gif` to repo root and reference in README as `![Demo](demo.gif)`.

---

### [x] P1.2 — Add a "Why Not X?" comparison section to README

**Description**: Compare Evalto similar tools in other ecosystems: Jest, Pytest, Bats, ShellSpec, etc. Highlight what makes eval unique (AI-native, deterministic, no dependencies).

**Implementation**: Add a comparison table to README with columns: Feature, Kujo Eval, Jest, Pytest, Bats.

---

### [x] P1.3 — Add "Quick Wins" section with 3 copy-paste eval.json examples

**Description**: Show 3 complete eval.json examples that solve common real-world problems: (1) Testing a CLI tool, (2) Validating an API endpoint, (3) Checking an agent's output.

**Implementation**: Add `examples/cli_quality.json`, `examples/api_health.json`, `examples/agent_output.json`. Link from README.

---

### [x] P1.4 — Add version badge + CI status badge to README

**Description**: Shields.io badges for version and CI status make the project look professional.

**Implementation**: Add badges at the top of README:
- `![Version](https://img.shields.io/badge/version-0.3.1-blue)`
- `![Contract](https://img.shields.io/badge/contract-v2.0.0-green)`
- `![Checks](https://img.shields.io/badge/checks-27-orange)`
- `![Tests](https://img.shields.io/badge/tests-267%20passing-brightgreen)` (update dynamically via badge.json if possible)

---

## Tier P2: Code Quality & Robustness (5 items)

### [x] P2.1 — Add `--timeout` flag that works around Kujo's execute_status limitation

**Description**: While `execute_status` has no timeout param, we can implement a wall-clock timeout wrapper using `time()`. If the command exceeds the timeout, return a timeout error even though the subprocess may still be running (orphaned process risk — document this).

**Implementation**: In `run_shell`, before calling `execute_status`, check if `timeout_ms` option is set. Record start time. After `execute_status` returns, check elapsed. If exceeded, return error result with timeout message. Document the orphan process caveat.

**Verification**: Test with `echo hi` and `timeout_ms=1` — should pass. Test with `sleep 3` and `timeout_ms=100` — should fail with timeout error.

---

### [x] P2.2 — Add graceful error handling for empty/invalid configs with line numbers

**Description**: When `eval.json` has a JSON parse error, `load_config` currently reports "Invalid JSON in config file" but doesn't show WHERE the error is. Add approximate position reporting.

**Implementation**: For JSON parse errors, report the first ~80 characters of context around the error. Kujo's `parse_json` may not provide position info — if not, document the limitation and suggest using `eval lint` or the JSON schema for validation.

---

### [x] P2.3 — Add `--no-color` flag for environments without ANSI support

**Description**: Currently `[PASS]`/`[FAIL]` use emoji. Some terminals/CI systems don't render them well. Add `--no-color` to use plain text instead.

**Implementation**: Add `--no-color` flag. When set, use `[PASS]`/`[FAIL]` text without emoji. Pass through to report generation for plain output.

---

### [x] P2.4 — Add exit code documentation for each CLI command

**Description**: Document which exit codes each command returns and what they mean. Currently only `run` documents exit code 1 for failures.

**Implementation**: Add exit code section to README and `eval --help` output:
- `0` — success (all commands)
- `1` — test failure (run), invalid config (lint), file differs (diff), error (all others)
- `2` — usage error (missing args, invalid flags)

---

### [x] P2.5 — Thread `timeout_seconds` from config through to `run_shell` if/when available

**Description**: The `timeout_seconds` field is validated in config and documented as reserved. Create the threading path so that when Kujo adds timeout support, it's a one-line change.

**Implementation**: Add a `timeout_ms` parameter to `run_shell` signature (default 0 = no timeout). Thread `timeout_seconds * 1000` from config through `run_suite` → `run_check` → each check function → `run_shell`. If `timeout_ms` is 0, skip the check. This makes the integration point ready.

---

## Tier P3: Developer Experience (4 items)

### [x] P3.1 — Add `eval init --from-existing <path>` to convert an existing test suite

**Description**: Allow importing test definitions from a JSON file and wrapping them in the eval format.

**Implementation**: Add `--from <path>` flag to `eval init`. Read the file, wrap each entry as a test definition, write `eval.json`.

---

### [x] P3.2 — Add `eval report --history` to print recent run history

**Description**: The `history.json` file is written but never read back in a user-friendly way. Add a `--history` flag to `eval report`.

**Implementation**: In `command_report`, if `--history` flag is set, load `history.json`, print a table of recent runs with pass rates and trends.

---

### [x] P3.3 — Add `eval completion` command for shell autocomplete

**Description**: Generate shell completion scripts for bash, zsh, and fish.

**Implementation**: Add `command_completion` that generates and prints completion scripts. Support `--shell bash|zsh|fish`.

---

### [x] P3.4 — Add output directory auto-creation with `.gitkeep`

**Description**: When `eval init` runs, auto-create `eval_results/` and `snapshots/` directories with `.gitkeep` files so they're tracked by git.

**Implementation**: In `command_init`, call `create_dir` for output_dir and snapshot_dir, then write `.gitkeep` files.

---

## Tier P4: Testing & Quality Assurance (4 items)

### [x] P4.1 — Add fuzz testing for config parser

**Description**: Test the config parser against randomly generated JSON inputs to ensure it never crashes.

**Implementation**: Create `tests/fuzz_tests.kujo` with a loop that generates random JSON strings and calls `parse_json` + `validate_config`. Catch exceptions and report failures. Limit to 100 iterations.

---

### [x] P4.2 — Add cross-module integration tests that exercise the full pipeline

**Description**: Test the complete init → run → report → compare → export pipeline end-to-end.

**Implementation**: Add a test that: (1) inits a suite, (2) runs it, (3) reports in all 5 formats, (4) compares two runs, (5) exports to shell script. Verify no step crashes.

---

### [x] P4.3 — Add stress test with maximum allowed config (1000 tests)

**Description**: Create and run a suite with 1000 simple tests. Verify it completes under 30 seconds and reports correct counts.

**Implementation**: Generate a config with 1000 `file_exists` checks against `kennel.toml`. Run with `--quiet`. Assert total=1000, passed=1000, duration under threshold.

---

### [x] P4.4 — Add property-based tests for utility functions

**Description**: Test `normalize_*` functions with random inputs to verify they always return the correct fallback type.

**Implementation**: For each normalize_* function, test with all Kujo types (string, int, bool, array, dict, null-equivalent). Verify the return type is always correct.

---

## Tier P5: Documentation Completeness (5 items)

### [x] P5.1 — Add a "Common Patterns" cookbook to docs

**Description**: A cookbook of common eval patterns: "Testing a CLI tool", "Validating JSON output", "Performance regression testing", "Snapshot testing workflow", "CI pipeline integration".

**New file**: `docs/COOKBOOK.md`

---

### [x] P5.2 — Add inline examples to every check in eval-suite-reference.md

**Description**: Each check type in the reference should have a working JSON example that users can copy-paste.

**Implementation**: Review every check in `docs/eval-suite-reference.md`. Ensure each has a `params` example. Add missing ones.

---

### [x] P5.3 — Generate API reference from describe_*_module() functions

**Description**: Create an API reference doc by calling each module's `describe_*_module()` function.

**New file**: `docs/API_REFERENCE.md`

**Implementation**: Call each describe function, format the exports list, document the contract version and module purpose.

---

### [x] P5.4 — Add a "Getting Started" tutorial with step-by-step instructions

**Description**: A beginner-friendly tutorial that walks through installing Kujo, creating a first eval suite, running it, and understanding the output.

**New file**: `docs/TUTORIAL.md`

---

### [x] P5.5 — Add a contributor's quick reference card

**Description**: A one-page summary of the codebase: where to find things, how to add a check, how to add a CLI command, how to run tests.

**New file**: `docs/QUICKREF.md`

---

## Tier P6: Ecosystem & Distribution (3 items)

### [x] P6.1 — Publish to Kennel registry

**Description**: Register the package in the Kennel registry so it can be installed via `kennel install eval`.

**Implementation**: Verify `kennel.toml` is complete. Run `kennel publish --dry-run`. Fix any issues. Publish.

---

### [x] P6.2 — Create a GitHub Release with auto-generated changelog

**Description**: Create a v0.3.1 GitHub Release with the CHANGELOG.md content.

**Implementation**: Use `git tag v0.3.1` and push. Create release notes from CHANGELOG.md.

---

### [x] P6.3 — Add a `Dockerfile` for containerized usage

**Description**: Provide a Docker image so users can run eval without installing Kujo.

**Implementation**: Create `Dockerfile` that installs Kujo runtime and copies the eval source. Entrypoint runs `kujo run main.kujo --interpreter`.

---

## Quick Reference: Completion Tracking

| Tier | Items | Done | Description |
|------|-------|------|-------------|
| Tier P1: Presentation | 4 | 3 | Demo, comparisons, quick wins, badges |
| Tier P2: Code Quality | 5 | 5 | Timeout workaround, error handling, no-color, exit codes, timeout threading |
| Tier P3: DevEx | 4 | 4 | Import, history, completion, gitkeep |
| Tier P4: Testing | 4 | 4 | Fuzz, integration, stress, property |
| Tier P5: Documentation | 5 | 5 | Cookbook, examples, API ref, tutorial, quickref |
| Tier P6: Ecosystem | 3 | 3 | Publish, release, Docker |
| **Total** | **25** | **24** | 🎉 (P1.1 blocked — needs asciinema) |

---

> **Last updated**: 2026-05-24 | **Contract version**: v2.0.0 | **Package version**: v0.3.1
