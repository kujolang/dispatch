#!/usr/bin/env bash
# Supply-chain policy check for Kujo Eval.
# Verifies repo integrity, file hygiene, and export consistency.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

PASS=0
FAIL=0

check() {
    local desc="$1"
    shift
    if "$@"; then
        echo "  PASS: $desc"
        PASS=$((PASS + 1))
    else
        echo "  FAIL: $desc"
        FAIL=$((FAIL + 1))
    fi
}

echo "=== Kujo Eval Supply-Chain Policy Check ==="
echo ""

# 1. No root scratch Kujo files
check "No root scratch .kujo files" bash -c '
    files=$(find . -maxdepth 1 -type f -name "test_*.kujo" -print)
    [ -z "$files" ]
'

# 2. All source files parse as valid Kujo
check "All src/*.kujo files exist" bash -c '
    for f in src/common.kujo src/cli.kujo src/config.kujo src/checks.kujo src/eval_core.kujo src/report.kujo src/snapshot.kujo; do
        [ -f "$f" ] || exit 1
    done
'

# 3. No hardcoded tokens or secrets
check "No hardcoded secrets in source" bash -c '
    ! grep -rq "sk-[A-Za-z0-9]\{20,\}" src/ tests/ 2>/dev/null
'

# 4. kennel.toml exports match actual source files
check "kennel.toml exports match src files" bash -c '
    for mod in common cli eval_core checks report snapshot config; do
        [ -f "src/${mod}.kujo" ] || exit 1
    done
'

# 5. RUNTIME_VERSION file exists
check "RUNTIME_VERSION file exists" test -f RUNTIME_VERSION

# 6. All documentation files referenced in README exist
check "README doc references are valid" bash -c '
    for doc in docs/ARCHITECTURE.md docs/CONTRIBUTING.md docs/SECURITY.md docs/eval-suite-reference.md docs/improvement-checklist.md docs/agent-notes.md; do
        [ -f "$doc" ] || exit 1
    done
'

# 7. No .out artifacts are allowed in git index
check "No tracked .out artifacts" bash -c '
    tracked="$(git ls-files | grep "\.out$" || true)"
    [ -z "$tracked" ]
'

# 8. LICENSE exists
check "LICENSE exists" test -f LICENSE

# 9. CHANGELOG exists
check "CHANGELOG.md exists" test -f CHANGELOG.md

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
