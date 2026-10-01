#!/usr/bin/env bash
set -euo pipefail
operator_root="$(cd "$(dirname "$0")/.." && pwd)"
operator_deps="${DISPATCH_OPERATOR_DEPS:-$operator_root/.operator-deps}"
mkdir -p "$operator_deps"
while read -r repository revision; do
  destination="$operator_deps/$repository"
  [[ ! -e "$destination" ]] || { echo "Refusing to replace $destination; use a fresh DISPATCH_OPERATOR_DEPS directory." >&2; exit 1; }
  archive="$(mktemp)"
  curl -fsSL --retry 3 "https://api.github.com/repos/kujolang/$repository/tarball/$revision" -o "$archive"
  mkdir "$destination"
  tar -xzf "$archive" --strip-components=1 -C "$destination"
  rm "$archive"
  printf '%s\n' "$revision" > "$destination/.operator-source-ref"
done <<'PINS'
workcell 0f9595b79872d2500f0bb35a8cf6227171fd7eeb
eval 6a5ab09e5c24cc1a842b374afccb64da40db2874
PINS
printf 'Installed pinned operator dependencies in %s\n' "$operator_deps"
