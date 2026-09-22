#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

test -f dispatch.kujo
test -f src/bridge/sdk_adapter.kujo
test -f src/bridge/bridge_chat.kujo
test ! -e sdk_adapter.kujo
test ! -e bridge_chat.kujo

if find . -maxdepth 1 -type f -name '*.kujo' ! -name dispatch.kujo | grep -q .; then
	echo "Unexpected Kujo implementation file at repository root." >&2
	exit 1
fi

grep -q 'bridge_script = "src/bridge/bridge_chat.kujo"' kennel.toml
grep -q '"src", "tests", "dispatch.kujo"' kennel.toml
grep -q 'default_bridge := "src/bridge/bridge_chat.kujo"' src/bridge/sdk_adapter.kujo
grep -q 'default_bridge = dispatch_root + "/src/bridge/bridge_chat.kujo"' src/bridge/sdk_adapter.kujo
grep -q 'from src.bridge.sdk_adapter import' dispatch.kujo
grep -q 'from src.bridge.sdk_adapter import' src/agents/agent.kujo

echo "Source layout passed."
