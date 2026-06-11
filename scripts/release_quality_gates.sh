#!/usr/bin/env bash
# Release quality gates for Kujo Eval.
# Run before tagging a release to verify all quality checks pass.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export KUJO_BIN="${KUJO_BIN:-$PROJECT_ROOT/kujo}"
cd "$PROJECT_ROOT"

echo "=== EvalRelease Quality Gates ==="
echo ""

mkdir -p eval_results
export KUJO_EVAL_BENCHMARK_ARTIFACT_PATH="$PROJECT_ROOT/eval_results/benchmarks.json"

# Gate 1: All test suites pass
echo "[GATE 1] Running test suites..."
TEST_OUT=""
if ! TEST_OUT="$($KUJO_BIN test 2>&1)"; then
	echo "$TEST_OUT"
    echo "FAIL: Test suites failed"
    exit 1
fi
echo "$TEST_OUT"
echo "PASS: All test suites pass"
echo ""

# Gate 1B: Benchmark suite timing budget
echo "[GATE 1B] Benchmark suite timing budget..."
BENCH_ARTIFACT="eval_results/benchmarks.json"
BENCH_SUITE_MS="$(echo "$TEST_OUT" | sed -nE 's#.*tests/benchmark_tests\.[^[:space:]]+ \(([0-9]+\.[0-9]+)ms\).*#\1#p' | head -n1)"
if [ -z "$BENCH_SUITE_MS" ]; then
    echo "FAIL: Could not parse benchmark suite timing from test output"
    exit 1
fi

BENCH_SUITE_BUDGET_MS="${KUJO_EVAL_BENCH_SUITE_BUDGET_MS:-600}"
BENCH_MEDIUM_SUITE_BUDGET_MS="${KUJO_EVAL_BENCH_MEDIUM_SUITE_BUDGET_MS:-3000}"
BENCH_LARGE_SUITE_BUDGET_MS="${KUJO_EVAL_BENCH_LARGE_SUITE_BUDGET_MS:-8000}"
BENCH_IO_HEAVY_SUITE_BUDGET_MS="${KUJO_EVAL_BENCH_IO_HEAVY_SUITE_BUDGET_MS:-12000}"
BENCH_TREND_WINDOW_RUNS="${KUJO_EVAL_BENCH_TREND_WINDOW_RUNS:-6}"
BENCH_SUITE_TREND_SLOPE_MAX_MS="${KUJO_EVAL_BENCH_SUITE_TREND_SLOPE_MAX_MS:-25}"
BENCH_MEDIUM_TREND_SLOPE_MAX_MS="${KUJO_EVAL_BENCH_MEDIUM_TREND_SLOPE_MAX_MS:-120}"
BENCH_LARGE_TREND_SLOPE_MAX_MS="${KUJO_EVAL_BENCH_LARGE_TREND_SLOPE_MAX_MS:-250}"
BENCH_IO_HEAVY_TREND_SLOPE_MAX_MS="${KUJO_EVAL_BENCH_IO_HEAVY_TREND_SLOPE_MAX_MS:-400}"

if ! [[ "$BENCH_SUITE_BUDGET_MS" =~ ^[0-9]+$ ]] || ! [[ "$BENCH_MEDIUM_SUITE_BUDGET_MS" =~ ^[0-9]+$ ]] || ! [[ "$BENCH_LARGE_SUITE_BUDGET_MS" =~ ^[0-9]+$ ]] || ! [[ "$BENCH_IO_HEAVY_SUITE_BUDGET_MS" =~ ^[0-9]+$ ]] || ! [[ "$BENCH_TREND_WINDOW_RUNS" =~ ^[0-9]+$ ]] || ! [[ "$BENCH_SUITE_TREND_SLOPE_MAX_MS" =~ ^[0-9]+$ ]] || ! [[ "$BENCH_MEDIUM_TREND_SLOPE_MAX_MS" =~ ^[0-9]+$ ]] || ! [[ "$BENCH_LARGE_TREND_SLOPE_MAX_MS" =~ ^[0-9]+$ ]] || ! [[ "$BENCH_IO_HEAVY_TREND_SLOPE_MAX_MS" =~ ^[0-9]+$ ]]; then
    echo "FAIL: Benchmark budget env vars must be integer milliseconds"
    exit 1
fi

if [ "$BENCH_TREND_WINDOW_RUNS" -lt 2 ]; then
	echo "FAIL: KUJO_EVAL_BENCH_TREND_WINDOW_RUNS must be >= 2"
	exit 1
fi

if [ "$BENCH_MEDIUM_SUITE_BUDGET_MS" -gt "$BENCH_LARGE_SUITE_BUDGET_MS" ]; then
    echo "FAIL: Medium suite budget cannot exceed large suite budget"
    exit 1
fi

if awk -v current="$BENCH_SUITE_MS" -v budget="$BENCH_SUITE_BUDGET_MS" 'BEGIN { exit !(current > budget) }'; then
    echo "FAIL: Benchmark suite duration ${BENCH_SUITE_MS}ms exceeded budget ${BENCH_SUITE_BUDGET_MS}ms"
    exit 1
fi
echo "PASS: Benchmark suite duration ${BENCH_SUITE_MS}ms within ${BENCH_SUITE_BUDGET_MS}ms budget"
echo ""

run_benchmark_suite_duration_ms() {
    label="$1"
    config_path="$2"
    out_dir=".eval_bench_${label}_gate"
    log_file="$(mktemp "${TMPDIR:-/tmp}/kujo-eval-bench-${label}.XXXXXX.log")"

    rm -rf "$out_dir"
    if ! "$KUJO_BIN" run main.kujo run "$config_path" --output-dir "$out_dir" --summary-only > "$log_file" 2>&1; then
        echo "FAIL: ${label} benchmark suite command failed"
        cat "$log_file"
        rm -f "$log_file"
        exit 1
    fi

    if [ ! -f "$out_dir/summary.json" ]; then
        echo "FAIL: ${label} benchmark suite did not produce summary.json"
        cat "$log_file"
        rm -f "$log_file"
        exit 1
    fi

    duration_ms="$(sed -nE 's#.*"duration_ms"[[:space:]]*:[[:space:]]*([0-9]+(\.[0-9]+)?).*#\1#p' "$out_dir/summary.json" | head -n1)"
    if [ -z "$duration_ms" ]; then
        echo "FAIL: Could not parse duration_ms from ${out_dir}/summary.json"
        cat "$log_file"
        rm -f "$log_file"
        exit 1
    fi

    rm -f "$log_file"
    echo "$duration_ms"
}

# Gate 1C: Medium/large/io-heavy suite budget enforcement
echo "[GATE 1C] Medium/large/io-heavy suite timing budgets..."
MEDIUM_SUITE_MS="$(run_benchmark_suite_duration_ms "medium" "examples/release_gate_suite.json")"
if awk -v current="$MEDIUM_SUITE_MS" -v budget="$BENCH_MEDIUM_SUITE_BUDGET_MS" 'BEGIN { exit !(current > budget) }'; then
    echo "FAIL: Medium suite duration ${MEDIUM_SUITE_MS}ms exceeded budget ${BENCH_MEDIUM_SUITE_BUDGET_MS}ms"
    exit 1
fi

LARGE_SUITE_MS="$(run_benchmark_suite_duration_ms "large" "examples/enterprise_api_contract_gate.json")"
if awk -v current="$LARGE_SUITE_MS" -v budget="$BENCH_LARGE_SUITE_BUDGET_MS" 'BEGIN { exit !(current > budget) }'; then
    echo "FAIL: Large suite duration ${LARGE_SUITE_MS}ms exceeded budget ${BENCH_LARGE_SUITE_BUDGET_MS}ms"
    exit 1
fi

IO_HEAVY_SUITE_MS="$(run_benchmark_suite_duration_ms "io-heavy" "examples/io_heavy_regression_suite.json")"
if awk -v current="$IO_HEAVY_SUITE_MS" -v budget="$BENCH_IO_HEAVY_SUITE_BUDGET_MS" 'BEGIN { exit !(current > budget) }'; then
    echo "FAIL: I/O-heavy suite duration ${IO_HEAVY_SUITE_MS}ms exceeded budget ${BENCH_IO_HEAVY_SUITE_BUDGET_MS}ms"
    exit 1
fi

echo "PASS: Medium suite ${MEDIUM_SUITE_MS}ms (budget ${BENCH_MEDIUM_SUITE_BUDGET_MS}ms), large suite ${LARGE_SUITE_MS}ms (budget ${BENCH_LARGE_SUITE_BUDGET_MS}ms), I/O-heavy suite ${IO_HEAVY_SUITE_MS}ms (budget ${BENCH_IO_HEAVY_SUITE_BUDGET_MS}ms)"
echo ""

# Gate 1D: Benchmark regression trend slope gate
echo "[GATE 1D] Benchmark trend slope regression gate..."
BENCH_TREND_FILE="eval_results/benchmark_trend.csv"
if [ ! -f "$BENCH_TREND_FILE" ]; then
    echo "timestamp,benchmark_suite_ms,medium_suite_ms,large_suite_ms,io_heavy_suite_ms" > "$BENCH_TREND_FILE"
else
    BENCH_TREND_SANITIZED="$(mktemp "${TMPDIR:-/tmp}/kujo-eval-bench-trend-sanitize.XXXXXX.csv")"
    awk -F',' '
        NR == 1 { print; next }
        $2 ~ /^[0-9]+(\.[0-9]+)?$/ && $3 ~ /^[0-9]+(\.[0-9]+)?$/ && $4 ~ /^[0-9]+(\.[0-9]+)?$/ && $5 ~ /^[0-9]+(\.[0-9]+)?$/ { print }
    ' "$BENCH_TREND_FILE" > "$BENCH_TREND_SANITIZED"
    mv "$BENCH_TREND_SANITIZED" "$BENCH_TREND_FILE"
fi

echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ"),$BENCH_SUITE_MS,$MEDIUM_SUITE_MS,$LARGE_SUITE_MS,$IO_HEAVY_SUITE_MS" >> "$BENCH_TREND_FILE"

TREND_TMP_FILE="$(mktemp "${TMPDIR:-/tmp}/kujo-eval-bench-trend.XXXXXX.csv")"
{
    head -n1 "$BENCH_TREND_FILE"
    tail -n +2 "$BENCH_TREND_FILE" | tail -n "$BENCH_TREND_WINDOW_RUNS"
} > "$TREND_TMP_FILE"
mv "$TREND_TMP_FILE" "$BENCH_TREND_FILE"

TREND_DATA_ROWS="$(( $(wc -l < "$BENCH_TREND_FILE") - 1 ))"
TREND_SUITE_SLOPE_JSON="null"
TREND_MEDIUM_SLOPE_JSON="null"
TREND_LARGE_SLOPE_JSON="null"
TREND_IO_HEAVY_SLOPE_JSON="null"

if [ "$TREND_DATA_ROWS" -ge 3 ]; then
    calc_trend_slope() {
        local column_index="$1"
        awk -F',' -v col="$column_index" '
            NR > 1 && $col ~ /^[0-9]+(\.[0-9]+)?$/ {
                if (count == 0) {
                    first = $col
                }
                last = $col
                count += 1
            }
            END {
                if (count < 3) {
                    print "nan"
                } else {
                    printf "%.2f", (last - first) / (count - 1)
                }
            }
        ' "$BENCH_TREND_FILE"
    }

    TREND_SUITE_SLOPE="$(calc_trend_slope 2)"
    TREND_MEDIUM_SLOPE="$(calc_trend_slope 3)"
    TREND_LARGE_SLOPE="$(calc_trend_slope 4)"
    TREND_IO_HEAVY_SLOPE="$(calc_trend_slope 5)"

    TREND_SUITE_SLOPE_JSON="$TREND_SUITE_SLOPE"
    TREND_MEDIUM_SLOPE_JSON="$TREND_MEDIUM_SLOPE"
    TREND_LARGE_SLOPE_JSON="$TREND_LARGE_SLOPE"
    TREND_IO_HEAVY_SLOPE_JSON="$TREND_IO_HEAVY_SLOPE"

    if awk -v slope="$TREND_SUITE_SLOPE" -v max="$BENCH_SUITE_TREND_SLOPE_MAX_MS" 'BEGIN { exit !(slope > max) }'; then
        echo "FAIL: Benchmark suite trend slope ${TREND_SUITE_SLOPE}ms/run exceeded ${BENCH_SUITE_TREND_SLOPE_MAX_MS}ms/run"
        exit 1
    fi
    if awk -v slope="$TREND_MEDIUM_SLOPE" -v max="$BENCH_MEDIUM_TREND_SLOPE_MAX_MS" 'BEGIN { exit !(slope > max) }'; then
        echo "FAIL: Medium suite trend slope ${TREND_MEDIUM_SLOPE}ms/run exceeded ${BENCH_MEDIUM_TREND_SLOPE_MAX_MS}ms/run"
        exit 1
    fi
    if awk -v slope="$TREND_LARGE_SLOPE" -v max="$BENCH_LARGE_TREND_SLOPE_MAX_MS" 'BEGIN { exit !(slope > max) }'; then
        echo "FAIL: Large suite trend slope ${TREND_LARGE_SLOPE}ms/run exceeded ${BENCH_LARGE_TREND_SLOPE_MAX_MS}ms/run"
        exit 1
    fi
    if awk -v slope="$TREND_IO_HEAVY_SLOPE" -v max="$BENCH_IO_HEAVY_TREND_SLOPE_MAX_MS" 'BEGIN { exit !(slope > max) }'; then
        echo "FAIL: I/O-heavy suite trend slope ${TREND_IO_HEAVY_SLOPE}ms/run exceeded ${BENCH_IO_HEAVY_TREND_SLOPE_MAX_MS}ms/run"
        exit 1
    fi

    echo "PASS: Trend slopes suite=${TREND_SUITE_SLOPE}ms/run medium=${TREND_MEDIUM_SLOPE}ms/run large=${TREND_LARGE_SLOPE}ms/run io-heavy=${TREND_IO_HEAVY_SLOPE}ms/run"
else
    echo "PASS: Benchmark trend gate has insufficient history (${TREND_DATA_ROWS}/${BENCH_TREND_WINDOW_RUNS}); slope checks deferred"
fi
echo ""

PREV_MS=""
if [ -f "$BENCH_ARTIFACT" ]; then
    PREV_MS="$(grep -Eo '"benchmark_suite_duration_ms":[0-9]+(\.[0-9]+)?' "$BENCH_ARTIFACT" | head -n1 | cut -d: -f2 || true)"
fi

DELTA_MS="null"
PREV_JSON="null"
if [ -n "$PREV_MS" ]; then
    DELTA_MS="$(awk -v current="$BENCH_SUITE_MS" -v previous="$PREV_MS" 'BEGIN { printf "%.2f", (current - previous) }')"
    PREV_JSON="$PREV_MS"
fi

cat > "$BENCH_ARTIFACT" <<EOF
{
    "generated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "source": "release_quality_gates",
    "benchmark_suite_duration_ms": $BENCH_SUITE_MS,
    "benchmark_suite_budget_ms": $BENCH_SUITE_BUDGET_MS,
    "medium_fixture_suite_duration_ms": $MEDIUM_SUITE_MS,
    "medium_fixture_suite_budget_ms": $BENCH_MEDIUM_SUITE_BUDGET_MS,
    "large_fixture_suite_duration_ms": $LARGE_SUITE_MS,
    "large_fixture_suite_budget_ms": $BENCH_LARGE_SUITE_BUDGET_MS,
    "io_heavy_fixture_suite_duration_ms": $IO_HEAVY_SUITE_MS,
    "io_heavy_fixture_suite_budget_ms": $BENCH_IO_HEAVY_SUITE_BUDGET_MS,
    "trend_window_runs": $BENCH_TREND_WINDOW_RUNS,
    "trend_data_points": $TREND_DATA_ROWS,
    "benchmark_suite_trend_slope_ms_per_run": $TREND_SUITE_SLOPE_JSON,
    "medium_fixture_trend_slope_ms_per_run": $TREND_MEDIUM_SLOPE_JSON,
    "large_fixture_trend_slope_ms_per_run": $TREND_LARGE_SLOPE_JSON,
    "io_heavy_fixture_trend_slope_ms_per_run": $TREND_IO_HEAVY_SLOPE_JSON,
    "previous_benchmark_suite_duration_ms": $PREV_JSON,
    "delta_ms": $DELTA_MS,
    "benchmarks": [
        {
            "name": "benchmark_tests_suite",
            "duration_ms": $BENCH_SUITE_MS
        },
        {
            "name": "medium_fixture_suite_x1",
            "duration_ms": $MEDIUM_SUITE_MS
        },
        {
            "name": "large_fixture_suite_x1",
            "duration_ms": $LARGE_SUITE_MS
        },
        {
            "name": "io_heavy_fixture_suite_x1",
            "duration_ms": $IO_HEAVY_SUITE_MS
        }
    ]
}
EOF

if ! grep -q '"benchmarks"' "$BENCH_ARTIFACT"; then
    echo "FAIL: Benchmark artifact missing benchmarks payload"
    exit 1
fi
echo "PASS: Benchmark artifact generated"
echo ""

# Gate 2: CLI help displays all subcommands
echo "[GATE 2] CLI help output..."
if ! HELP_OUT="$($KUJO_BIN run main.kujo 2>&1)"; then
    echo "FAIL: CLI help command execution failed"
    echo "$HELP_OUT"
    exit 1
fi
for cmd in init run report compare list-checks snapshots version; do
    if ! grep -q "$cmd" <<< "$HELP_OUT"; then
        echo "FAIL: CLI help missing subcommand: $cmd"
        exit 1
    fi
done
echo "PASS: All subcommands in help output"
echo ""

# Gate 3: Version command works
echo "[GATE 3] Version command..."
if ! VER_OUT="$($KUJO_BIN run main.kujo version 2>&1)"; then
    echo "FAIL: Version command execution failed"
    echo "$VER_OUT"
    exit 1
fi
if ! grep -q "2.0.0" <<< "$VER_OUT"; then
    echo "FAIL: Version command did not print expected version"
    exit 1
fi
echo "PASS: Version command works"
echo ""

# Gate 4: Release gate suite runs end-to-end
echo "[GATE 4] Release gate suite execution..."
GATE_OUT_DIR=".eval_release_gate"
GATE_LOG_FILE="$(mktemp "${TMPDIR:-/tmp}/kujo-eval-gate4.XXXXXX.log")"
GATE_TIMEOUT_SECONDS="${KUJO_EVAL_GATE_TIMEOUT_SECONDS:-120}"
rm -rf "$GATE_OUT_DIR"

"$KUJO_BIN" run main.kujo run examples/release_gate_suite.json --output-dir "$GATE_OUT_DIR" --summary-only > "$GATE_LOG_FILE" 2>&1 &
GATE_PID=$!

gate_success=0
gate_timed_out=0
gate_start_epoch="$(date +%s)"

while true; do

    if [ -f "$GATE_OUT_DIR/summary.json" ] && [ -f "$GATE_OUT_DIR/artifact-manifest.json" ]; then
        if grep -q '"status":"PASS"' "$GATE_OUT_DIR/summary.json" && grep -q '"artifacts"' "$GATE_OUT_DIR/artifact-manifest.json"; then
            gate_success=1
            break
        fi
    fi

    if ! kill -0 "$GATE_PID" 2>/dev/null; then
        break
    fi

    gate_now_epoch="$(date +%s)"
    gate_elapsed_seconds=$((gate_now_epoch - gate_start_epoch))
    if [ "$gate_elapsed_seconds" -ge "$GATE_TIMEOUT_SECONDS" ]; then
        gate_timed_out=1
        break
    fi

    sleep 0.05
done

if [ "$gate_success" -eq 1 ]; then
    if kill -0 "$GATE_PID" 2>/dev/null; then
        kill "$GATE_PID" 2>/dev/null || true
    fi
    wait "$GATE_PID" 2>/dev/null || true
else
    if [ "$gate_timed_out" -eq 1 ]; then
        echo "FAIL: Release gate suite watchdog timed out after ${GATE_TIMEOUT_SECONDS}s before PASS artifacts were produced"
    else
        if wait "$GATE_PID"; then
            gate_exit_code=0
        else
            gate_exit_code=$?
        fi
        echo "FAIL: Release gate suite execution command returned non-zero (exit $gate_exit_code)"
    fi
    if kill -0 "$GATE_PID" 2>/dev/null; then
        kill "$GATE_PID" 2>/dev/null || true
    fi
    wait "$GATE_PID" 2>/dev/null || true
    if [ -f "$GATE_LOG_FILE" ]; then
        tail -n 40 "$GATE_LOG_FILE"
    fi
    exit 1
fi

if [ -f "$GATE_LOG_FILE" ] && ! grep -q "Summary: PASS" "$GATE_LOG_FILE"; then
    echo "FAIL: Release gate suite output missing PASS summary"
    tail -n 40 "$GATE_LOG_FILE"
    exit 1
fi
if [ ! -f "$GATE_OUT_DIR/summary.json" ]; then
    echo "FAIL: Missing summary artifact: $GATE_OUT_DIR/summary.json"
    exit 1
fi
if [ ! -f "$GATE_OUT_DIR/artifact-manifest.json" ]; then
    echo "FAIL: Missing artifact manifest: $GATE_OUT_DIR/artifact-manifest.json"
    exit 1
fi
if ! grep -q '"artifacts"' "$GATE_OUT_DIR/artifact-manifest.json"; then
    echo "FAIL: Artifact manifest missing artifacts payload"
    exit 1
fi
echo "PASS: Release gate suite executes successfully"
rm -rf "$GATE_OUT_DIR"
rm -f "$GATE_LOG_FILE"
echo ""

# Gate 5: List checks shows all 20 types
echo "[GATE 5] Check type count..."
if ! CHECKS_OUT="$($KUJO_BIN run main.kujo list-checks 2>&1)"; then
    echo "FAIL: list-checks command execution failed"
    echo "$CHECKS_OUT"
    exit 1
fi
CHECK_COUNT=$(echo "$CHECKS_OUT" | grep -c "  - " || true)
if [ "$CHECK_COUNT" -lt 20 ]; then
    echo "FAIL: Expected at least 20 check types, found $CHECK_COUNT"
    exit 1
fi
echo "PASS: $CHECK_COUNT check types listed"
echo ""

# Gate 6: Docs freshness — key files exist
echo "[GATE 6] Documentation freshness..."
for doc in README.md docs/ARCHITECTURE.md docs/CONTRIBUTING.md docs/SECURITY.md docs/eval-suite-reference.md docs/improvement-checklist.md docs/agent-notes.md docs/release-candidate-runbook.md; do
    if [ ! -f "$doc" ]; then
        echo "FAIL: Missing documentation file: $doc"
        exit 1
    fi
done
echo "PASS: All documentation files present"
echo ""

# Gate 7: No root scratch Kujo files
echo "[GATE 7] Root file hygiene..."
SCRATCH_FILES="$(find . -maxdepth 1 -type f -name 'test_*.kujo' -print)"
if [ -n "$SCRATCH_FILES" ]; then
    echo "FAIL: Found disallowed root scratch Kujo files:"
    echo "$SCRATCH_FILES"
    exit 1
fi
echo "PASS: No root scratch files"
echo ""

# Gate 8: kennel.toml exports match actual src files
echo "[GATE 8] Kennel exports consistency..."
for mod in common cli eval_core checks report snapshot config; do
    SRC_FILE="src/${mod}.kujo"
    if [ ! -f "$SRC_FILE" ]; then
        echo "FAIL: Exported module has no source file: $SRC_FILE"
        exit 1
    fi
done
echo "PASS: All exported modules have source files"
echo ""

# Gate 9: Import boundary audit
echo "[GATE 9] Import boundary audit..."
chmod +x scripts/check_import_boundaries.sh
if ! bash scripts/check_import_boundaries.sh; then
    echo "FAIL: Import boundary audit failed"
    exit 1
fi
echo "PASS: Import boundaries are consistent"
echo ""

# Gate 10: Test runtime parity
echo "[GATE 10] Test runtime parity..."
if ! bash scripts/verify_test_runtime_parity.sh; then
    echo "FAIL: Runtime parity check failed"
    exit 1
fi
echo "PASS: Runtime parity is consistent"
echo ""

# Gate 11: Canonical CLI smoke matrix
echo "[GATE 11] Canonical CLI smoke matrix..."
chmod +x scripts/cli_smoke_matrix.sh
if ! bash scripts/cli_smoke_matrix.sh; then
    echo "FAIL: CLI smoke matrix check failed"
    exit 1
fi
echo "PASS: CLI smoke matrix verified"
echo ""

# Gate 12: README command parity
echo "[GATE 12] README command parity..."
if ! bash scripts/verify_docs_command_parity.sh; then
    echo "FAIL: README command parity check failed"
    exit 1
fi
echo "PASS: README command parity verified"
echo ""

# Gate 13: Changelog coverage for user-visible behavior changes
echo "[GATE 13] Changelog coverage for behavior deltas..."
CHANGELOG_BASE_REF="${KUJO_EVAL_CHANGELOG_BASE_REF:-origin/main}"
CHANGELOG_RANGE=""

if git rev-parse --verify "$CHANGELOG_BASE_REF" >/dev/null 2>&1; then
    CHANGELOG_MERGE_BASE="$(git merge-base HEAD "$CHANGELOG_BASE_REF" 2>/dev/null || true)"
    if [ -n "$CHANGELOG_MERGE_BASE" ] && [ "$CHANGELOG_MERGE_BASE" != "$(git rev-parse HEAD)" ]; then
        CHANGELOG_RANGE="${CHANGELOG_MERGE_BASE}...HEAD"
    fi
fi

if [ -z "$CHANGELOG_RANGE" ] && git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
    CHANGELOG_RANGE="HEAD~1...HEAD"
fi

RANGE_CHANGED_FILES=""
if [ -n "$CHANGELOG_RANGE" ]; then
    RANGE_CHANGED_FILES="$(git diff --name-only "$CHANGELOG_RANGE" || true)"
fi

if [ -z "$RANGE_CHANGED_FILES" ]; then
    RANGE_CHANGED_FILES="$(git show --name-only --pretty='' HEAD 2>/dev/null || true)"
fi

WORKTREE_CHANGED_FILES="$(
    {
        git diff --name-only || true
        git diff --cached --name-only || true
    } | sed '/^$/d' | sort -u
)"

ALL_CHANGED_FILES="$(
    {
        echo "$RANGE_CHANGED_FILES"
        echo "$WORKTREE_CHANGED_FILES"
    } | sed '/^$/d' | sort -u
)"

if [ -z "$ALL_CHANGED_FILES" ]; then
    echo "PASS: No changed files detected for changelog coverage"
    echo ""
else
    BEHAVIOR_CHANGED_FILES="$(echo "$ALL_CHANGED_FILES" | grep -E '^main\.kujo$|^kennel\.toml$|^(src|scripts|examples|schema|tests)/' || true)"
    CHANGELOG_CHANGED="$(echo "$ALL_CHANGED_FILES" | grep -E '^CHANGELOG\.md$' || true)"

    if [ -n "$BEHAVIOR_CHANGED_FILES" ] && [ -z "$CHANGELOG_CHANGED" ]; then
        echo "FAIL: Behavior-affecting changes detected without CHANGELOG.md update"
        echo "Detected behavior files:"
        echo "$BEHAVIOR_CHANGED_FILES"
        echo "Add a categorized CHANGELOG entry (FEATURE/FIX/TWEAK/SECURITY/etc.) before release gating."
        exit 1
    fi

    if [ -n "$BEHAVIOR_CHANGED_FILES" ]; then
        echo "PASS: Behavior changes include CHANGELOG coverage"
    else
        echo "PASS: No behavior-affecting files changed"
    fi
    echo ""
fi

# Gate 14: Legal metadata parity
echo "[GATE 14] Legal metadata parity..."
if [ ! -f "LICENSE" ]; then
    echo "FAIL: Missing top-level LICENSE file"
    exit 1
fi
if ! grep -q '^license = "MIT"' kennel.toml; then
    echo "FAIL: kennel.toml license metadata is missing or not MIT"
    exit 1
fi
echo "PASS: LICENSE and kennel.toml license metadata are in sync"
echo ""

# Gate 15: Supply-chain policy
echo "[GATE 15] Supply-chain policy..."
chmod +x scripts/supply_chain_policy_check.sh
if ! bash scripts/supply_chain_policy_check.sh; then
    echo "FAIL: Supply-chain policy check failed"
    exit 1
fi
echo "PASS: Supply-chain policy check passed"
echo ""

# Gate 16: Optional human release signoff
echo "[GATE 16] Human release signoff..."
REQUIRE_RELEASE_SIGNOFF="${KUJO_EVAL_REQUIRE_RELEASE_SIGNOFF:-0}"
RELEASE_SIGNOFF_FILE="${KUJO_EVAL_RELEASE_SIGNOFF_FILE:-docs/release-signoff.md}"

if [ "$REQUIRE_RELEASE_SIGNOFF" = "1" ]; then
    if [ ! -f "$RELEASE_SIGNOFF_FILE" ]; then
        echo "FAIL: Required signoff file not found: $RELEASE_SIGNOFF_FILE"
        exit 1
    fi

    if ! grep -q '^Status:[[:space:]]*APPROVED$' "$RELEASE_SIGNOFF_FILE"; then
        echo "FAIL: Signoff status must be APPROVED in $RELEASE_SIGNOFF_FILE"
        exit 1
    fi

    if ! grep -q '^Owner:[[:space:]]*[A-Za-z0-9]' "$RELEASE_SIGNOFF_FILE"; then
        echo "FAIL: Signoff owner must be set in $RELEASE_SIGNOFF_FILE"
        exit 1
    fi

    if ! grep -q '^Date:[[:space:]]*[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]$' "$RELEASE_SIGNOFF_FILE"; then
        echo "FAIL: Signoff date must use YYYY-MM-DD in $RELEASE_SIGNOFF_FILE"
        exit 1
    fi

    echo "PASS: Human signoff required and approved ($RELEASE_SIGNOFF_FILE)"
else
    echo "PASS: Human signoff gate skipped (set KUJO_EVAL_REQUIRE_RELEASE_SIGNOFF=1 to enforce)"
fi
echo ""

echo "=== ALL GATES PASSED ==="
