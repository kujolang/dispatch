#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

check_count="$(awk 'BEGIN{inarr=0;c=0} /export func KNOWN_CHECKS\(\)/{inarr=1} inarr && /"[^"]+"/{c++} inarr && /\]/{print c; exit}' src/config.kujo)"
command_count="$(awk 'BEGIN{in_section=0;c=0} /print\("Commands:"\)/{in_section=1; next} in_section && /print\("Options:"\)/{print c; exit} in_section && /print\("  [a-z]/{c++}' src/cli.kujo)"
test_suite_count="$(find tests -maxdepth 1 -type f -name '*_tests.kujo' | wc -l | tr -d ' ')"

summary_line="$(grep -m1 '^> \*\*v' README.md || true)"

fail=0

if [[ "$summary_line" != *"$check_count checks"* ]]; then
	echo "FAIL: README summary does not match check count ($check_count)"
	fail=1
fi

if [[ "$summary_line" != *"$command_count CLI commands"* ]]; then
	echo "FAIL: README summary does not match command count ($command_count)"
	fail=1
fi

if [[ "$summary_line" != *"$test_suite_count test suites"* ]]; then
	echo "FAIL: README summary does not match test suite count ($test_suite_count)"
	fail=1
fi

if ! grep -qi "list all $check_count available check types" README.md; then
	echo "FAIL: README command reference list-checks row is out of sync"
	fail=1
fi

if [[ "$fail" -ne 0 ]]; then
	exit 1
fi

echo "PASS: README counts are in sync"
echo "checks=$check_count commands=$command_count test_suites=$test_suite_count"
