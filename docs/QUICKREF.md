# Contributor Quick Reference

One-page summary for adding features to Kujo Eval.

## Where Everything Lives

| What | Where |
|------|-------|
| CLI entry + dispatch | `main.kujo` |
| CLI parsing + help | `src/cli.kujo` |
| Shared utilities | `src/common.kujo` |
| Config loading/validation | `src/config.kujo` |
| 27 check implementations | `src/checks.kujo` |
| Suite runner + compare | `src/eval_core.kujo` |
| 5 report formats | `src/report.kujo` |
| Snapshot CRUD | `src/snapshot.kujo` |
| Contract tests | `tests/contract_tests.kujo` |
| Security tests | `tests/security_tests.kujo` |
| CLI integration tests | `tests/cli_integration_tests.kujo` |
| Full coverage tests | `tests/coverage_tests.kujo` |
| Benchmark tests | `tests/benchmark_tests.kujo` |
| Quality/fuzz/property tests | `tests/quality_tests.kujo` |
| Stress tests | `tests/stress_tests.kujo` |

## Runtime Binary (Use This First)

```bash
export KUJO_BIN=./kujo
"$KUJO_BIN" --version
```

If your shell `kujo` command points to the Python linter tool, run eval commands with `"$KUJO_BIN"`.

## How to Add a New Check Type

1. **Add the function** to `src/checks.kujo`:
   ```kujo
   export func check_my_check(params) {
       // validate params
       // run logic
       return make_check_success("my_check", "ok", details)
   }
   ```

2. **Register in dispatcher** (`run_check` in `src/checks.kujo`):
   ```kujo
   if kind == "my_check" { return check_my_check(params) }
   ```

3. **Register in KNOWN_CHECKS** (`src/config.kujo`):
   ```kujo
   "my_check",
   ```

4. **Add tests** in `tests/contract_tests.kujo` (success, failure, edge case, dispatcher, known_checks)

5. **Update schema** `schema/eval-suite.schema.json` (add to enum)

6. **Update docs** `docs/eval-suite-reference.md`, `docs/API_REFERENCE.md`

7. **Run**: `kujo test` — all suites must pass

## How to Add a CLI Command

1. **Add function** to `main.kujo`:
   ```kujo
   func command_mycmd(parsed) { ... }
   ```

2. **Add to dispatch** in main.kujo

3. **Add to help** in `src/cli.kujo` (`print_help` + usage section)

4. **Add tests** in `tests/cli_integration_tests.kujo`

## How to Add a Report Format

1. **Add generator** to `src/report.kujo`

2. **Add to save_report/print_report** format handling

3. **Add tests** in `tests/coverage_tests.kujo`

## How to Run Tests

```bash
kujo test
# Runs all 7 suites
```

## Parity-Verified Runbook Commands

```bash
# Core command surface
kujo run main.kujo version
kujo run main.kujo list-checks
kujo run main.kujo diff README.md README.md

# Release gate suite and report generation
kujo run main.kujo run examples/release_gate_suite.json --output-dir .eval_readme_parity --json
kujo run main.kujo run examples/release_gate_suite.json --output-dir .eval_readme_parity --summary-only
kujo run main.kujo report examples/release_gate_suite.json --rerun --output-dir .eval_readme_parity --format junit
kujo run main.kujo report examples/release_gate_suite.json --rerun --output-dir .eval_readme_parity --format tap

# Artifact integrity flow
kujo run main.kujo run examples/release_gate_suite.json --output-dir .eval_readme_parity --summary-channel-path .eval_readme_parity/run-channel.json --json
kujo run main.kujo run examples/release_gate_suite.json --output-dir .eval_readme_parity --artifact-checksums --json
kujo run main.kujo verify-manifest --output-dir .eval_readme_parity --json

# Enterprise quickstarts
kujo run main.kujo run examples/enterprise_cli_quality_gate.json --output-dir .eval_readme_parity_cli --json
kujo run main.kujo run examples/enterprise_api_contract_gate.json --output-dir .eval_readme_parity_api --parallel-workers 8 --json
kujo run main.kujo run examples/enterprise_agent_output_gate.json --output-dir .eval_readme_parity_agent --parallel-workers 8 --json

# Full repository test pass
kujo test
```

## Enterprise Quickstart Matrix (Risk Tier)

| Risk Tier | Use Case | Command |
|---|---|---|
| Tier 1 (local dev) | Fast deterministic feedback while authoring checks | `kujo run main.kujo run examples/enterprise_cli_quality_gate.json --output-dir .eval_enterprise_cli --json` |
| Tier 2 (CI strict) | API/output contract enforcement in pull requests | `kujo run main.kujo run examples/enterprise_api_contract_gate.json --output-dir .eval_enterprise_api --parallel-workers 8 --json` |
| Tier 3 (release gate) | High-assurance release policy checks | `kujo run main.kujo run examples/strict_enterprise_policy_gate.json --output-dir .eval_enterprise_strict --json` |
| Tier 3 (sandbox-adjacent) | Constrained fixture-only local policy boundaries | `kujo run main.kujo run examples/sandbox_adjacent_policy_gate.json --output-dir .eval_sandbox_adjacent --json` |

```bash
# Inspect effective policy overlays for an explicit stage
kujo run main.kujo policy-explain examples/release_gate_suite.json --policy-stage release --json

# Ensure generated command inventory docs are fresh
bash scripts/generate_command_inventory.sh --check
```

## Key Contracts

- **Result envelope**: `{ok: bool, error: string, data: {}}` — v2.0.0
- **Check result**: `data.check`, `data.message`, `data.details`
- **All modules export** `describe_*_module()` at contract v2.0.0

## Coding Rules (from docs/agent-notes.md)

- Use `push(arr, val)` — never `arr[len(arr)] := val`
- Use `:=` for variables — `=` is for dict keys only
- Bool comparisons: `== true`/`== false` — never `== 1`/`== 0`
- `test` is a reserved keyword — use `tdef`
- `#` in JSON breaks `parse_json` — remove comments
- `print()` goes to stderr in interpreter mode

## Commit Format

```
polish(<ID>): <imperative summary>
enhance(<ID>): <imperative summary>
```
