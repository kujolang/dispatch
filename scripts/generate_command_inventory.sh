#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

export KUJO_BIN="${KUJO_BIN:-$ROOT_DIR/kujo}"
TARGET_DOC="docs/COMMAND_INVENTORY.md"
MODE="write"

if [ "${1:-}" = "--check" ]; then
	MODE="check"
fi

if [ "${1:-}" = "--stdout" ]; then
	MODE="stdout"
fi

HELP_OUT=""
if ! HELP_OUT="$($KUJO_BIN run main.kujo 2>&1)"; then
	echo "FAIL: Could not read CLI help output from $KUJO_BIN run main.kujo"
	echo "$HELP_OUT"
	exit 1
fi

COMMAND_ROWS="$(
	echo "$HELP_OUT" |
		awk '
			/^Commands:/ { in_commands = 1; next }
			/^Options:/ { in_commands = 0 }
			in_commands == 1 { print }
		' |
		sed -nE 's/^[[:space:]]+([a-z0-9-]+)[[:space:]]+(.*)$/| `\1` | \2 |/p'
)"

if [ -z "$COMMAND_ROWS" ]; then
	echo "FAIL: Could not parse command rows from CLI help output"
	exit 1
fi

TMP_FILE="$(mktemp "${TMPDIR:-/tmp}/kujo-eval-command-inventory.XXXXXX.md")"
cat > "$TMP_FILE" <<'EOF'
# Command Inventory

Generated from `kujo run main.kujo` help output. Do not edit manually; regenerate with `scripts/generate_command_inventory.sh`.

## Command Surface

| Command | Description |
|---|---|
EOF

printf '%s
' "$COMMAND_ROWS" >> "$TMP_FILE"
printf '\n' >> "$TMP_FILE"
cat >> "$TMP_FILE" <<'EOF'
## Canonical Invocation

```bash
kujo run main.kujo <command> [options]
```
EOF

if [ "$MODE" = "stdout" ]; then
	cat "$TMP_FILE"
	rm -f "$TMP_FILE"
	exit 0
fi

if [ "$MODE" = "check" ]; then
	if [ ! -f "$TARGET_DOC" ]; then
		echo "FAIL: Missing $TARGET_DOC. Run scripts/generate_command_inventory.sh"
		rm -f "$TMP_FILE"
		exit 1
	fi

	if ! cmp -s "$TMP_FILE" "$TARGET_DOC"; then
		echo "FAIL: $TARGET_DOC is stale. Run scripts/generate_command_inventory.sh"
		rm -f "$TMP_FILE"
		exit 1
	fi

	echo "PASS: $TARGET_DOC is up to date"
	rm -f "$TMP_FILE"
	exit 0
fi

mv "$TMP_FILE" "$TARGET_DOC"
echo "Wrote $TARGET_DOC"
