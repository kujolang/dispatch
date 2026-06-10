#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

violations=0

# Shared helper symbols are owned by src/common.ruff and must not be imported from src/config.ruff.
while IFS= read -r line; do
	file_path="${line%%:*}"
	line_text="${line#*:}"
	if echo "$line_text" | grep -Eq 'dict_get_or|normalize_string|normalize_int|normalize_bool|normalize_array|normalize_dict|make_result|make_check_error|make_check_success'; then
		echo "BOUNDARY VIOLATION: $file_path imports common-owned helpers from src.config"
		echo "  $line_text"
		violations=1
	fi
done < <(grep -n "from src.config import" src/*.ruff || true)

if [[ "$violations" -ne 0 ]]; then
	exit 1
fi

echo "PASS: import boundary checks passed"
