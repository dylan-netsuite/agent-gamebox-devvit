#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GAMES_DIR="$REPO_ROOT/games/phaser"

if [ ! -d "$GAMES_DIR" ]; then
  echo "Error: $GAMES_DIR not found"
  exit 1
fi

games=()
for dir in "$GAMES_DIR"/*/; do
  [ -f "$dir/devvit.json" ] && games+=("$dir")
done

if [ ${#games[@]} -eq 0 ]; then
  echo "No games found in $GAMES_DIR"
  exit 1
fi

echo "Found ${#games[@]} game(s) to upload:"
for dir in "${games[@]}"; do
  name=$(basename "$dir")
  echo "  - $name"
done
echo ""

failed=()
succeeded=()

for dir in "${games[@]}"; do
  name=$(basename "$dir")
  echo "========================================="
  echo "  Building: $name"
  echo "========================================="

  if ! (cd "$dir" && npm run build); then
    echo "FAILED: $name (build)"
    failed+=("$name (build)")
    continue
  fi

  echo ""
  echo "  Uploading: $name"
  echo "-----------------------------------------"

  if ! (cd "$dir" && npx devvit upload); then
    echo "FAILED: $name (upload)"
    failed+=("$name (upload)")
    continue
  fi

  succeeded+=("$name")
  echo ""
done

echo ""
echo "========================================="
echo "  Summary"
echo "========================================="
echo "Succeeded: ${#succeeded[@]}/${#games[@]}"
for name in "${succeeded[@]}"; do
  echo "  ✓ $name"
done

if [ ${#failed[@]} -gt 0 ]; then
  echo ""
  echo "Failed: ${#failed[@]}"
  for name in "${failed[@]}"; do
    echo "  ✗ $name"
  done
  exit 1
fi
