# Kujo Eval Release Candidate Runbook

Use this runbook before tagging a release.
All commands are VM-first and should be executed from the repository root.

## 1. Runtime Setup

```bash
export KUJO_BIN=./kujo
"$KUJO_BIN" --version
```

Expected:
- Kujo runtime prints a version string.

## 2. Core Validation Sequence

```bash
"$KUJO_BIN" run main.ruff version
"$KUJO_BIN" test
bash scripts/verify_artifact_contract.sh
bash scripts/cli_smoke_matrix.sh
bash scripts/verify_docs_command_parity.sh
bash scripts/release_quality_gates.sh
bash scripts/generate_command_inventory.sh --check
```

Expected:
- `version` prints contract/runtime version details.
- `test` passes all suites.
- Artifact contract verifier reports `PASS: artifact contract is valid`.
- CLI smoke matrix reports `PASS: CLI smoke matrix succeeded`.
- Docs parity reports `PASS: docs command parity checks succeeded`.
- Release gates report `=== ALL GATES PASSED ===`.
- Command inventory check reports `PASS: docs/COMMAND_INVENTORY.md is up to date`.

## 2.1 Benchmark Trend Gate Controls

Release quality gates enforce both single-run benchmark budgets and regression slope thresholds across recent runs.

Optional environment overrides:

```bash
export KUJO_EVAL_BENCH_TREND_WINDOW_RUNS=6
export KUJO_EVAL_BENCH_SUITE_TREND_SLOPE_MAX_MS=25
export KUJO_EVAL_BENCH_MEDIUM_TREND_SLOPE_MAX_MS=120
export KUJO_EVAL_BENCH_LARGE_TREND_SLOPE_MAX_MS=250
export KUJO_EVAL_BENCH_IO_HEAVY_TREND_SLOPE_MAX_MS=400

# Optional human signoff enforcement
export KUJO_EVAL_REQUIRE_RELEASE_SIGNOFF=1
export KUJO_EVAL_RELEASE_SIGNOFF_FILE=docs/release-signoff.md
```

## 3. Required Artifacts

After the sequence completes:
- `eval_results/benchmarks.json` exists and contains benchmark suite timing data.
- `eval_results/benchmark_trend.csv` exists and retains the latest rolling trend window used by Gate 1D slope checks.
- No `.eval_*` temporary directories remain in the repository root.
- Working tree is clean except for intentional version/changelog updates for the pending release.

### Benchmark Trend Gate Controls

Gate 1D in `scripts/release_quality_gates.sh` computes a rolling per-run slope for benchmark suite, medium, large, and I/O-heavy durations.

Optional environment variables:
- `KUJO_EVAL_BENCH_TREND_WINDOW_RUNS` (default: `6`)
- `KUJO_EVAL_BENCH_SUITE_TREND_SLOPE_MAX_MS` (default: `25`)
- `KUJO_EVAL_BENCH_MEDIUM_TREND_SLOPE_MAX_MS` (default: `120`)
- `KUJO_EVAL_BENCH_LARGE_TREND_SLOPE_MAX_MS` (default: `250`)
- `KUJO_EVAL_BENCH_IO_HEAVY_TREND_SLOPE_MAX_MS` (default: `400`)

## 4. Release Evidence Checklist

Capture these in the release PR:
- Runtime version output (`"$KUJO_BIN" --version`).
- Test summary (all suites passing).
- Artifact contract script output.
- CLI smoke matrix output.
- README/docs parity output.
- Release gate summary.

## 5. Fail-Fast Guidance

If any step fails:
- Stop the release process.
- Record the failing command and tail output in the PR.
- Fix forward with tests, then rerun this full runbook.
