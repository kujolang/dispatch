#!/usr/bin/env bash
# CI-only aliases for the existing bounded graph fixtures. Never replace a checkout.
set -euo pipefail
workspace="${GITHUB_WORKSPACE:?GITHUB_WORKSPACE is required}"
for mapping in 'workcell:workcell-wave-f' 'eval:eval-wave-f' 'agents-sdk:agents-sdk-wave-d'; do
  name="${mapping%%:*}"
  source_dir="$workspace/.ci/${mapping#*:}"
  alias_path="$workspace/../$name"
  test -d "$source_dir/src"
  if [[ -e "$alias_path" || -L "$alias_path" ]]; then
    if [[ ! -L "$alias_path" || "$(readlink "$alias_path")" != "$source_dir" ]]; then
      echo "Refusing to replace existing graph fixture path: $alias_path" >&2
      exit 1
    fi
  else
    ln -s "$source_dir" "$alias_path"
  fi
done
