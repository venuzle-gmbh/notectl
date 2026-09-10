#!/usr/bin/env bash
set -euo pipefail

ALL_PACKAGES=(
  "core:packages/core"
  "angular:packages/angular"
)

ROOT_DIR="$(pwd)"
trap 'cd "$ROOT_DIR"' EXIT

# --- Filter packages ---
FILTER="${1:-}"
PACKAGES=()

for entry in "${ALL_PACKAGES[@]}"; do
  key="${entry%%:*}"
  path="${entry#*:}"
  if [[ -z "$FILTER" || "$key" == "$FILTER" ]]; then
    PACKAGES+=("$path")
  fi
done

if [[ ${#PACKAGES[@]} -eq 0 ]]; then
  echo "❌ Unknown package: '$FILTER'"
  echo "   Available: ${ALL_PACKAGES[*]%%:*}"
  exit 1
fi

# --- Pre-flight checks ---
echo "🔍 Running pre-flight checks..."

echo "  → Building all packages..."
pnpm build

echo "  → Running tests..."
pnpm test

echo "  → Type checking..."
pnpm typecheck

echo "  → Linting..."
pnpm lint

echo "✅ All checks passed."

# --- Auth ---
USE_TOKEN=false
if [[ -n "${NPM_TOKEN:-}" ]]; then
  USE_TOKEN=true
  npm config set //registry.npmjs.org/:_authToken "${NPM_TOKEN}" >/dev/null
  echo "🔐 Using NPM_TOKEN for publish (no OTP required)."
fi

OTP=""

prompt_otp() {
  echo -n "Enter your npm OTP: "
  read -r OTP
  OTP="${OTP//[[:space:]]/}"
}

# --- Publish ---
publish_one() {
  local pkg="$1"
  echo
  echo "==============================="
  echo "📦 Publish: $pkg"
  echo "==============================="

  cd "$ROOT_DIR/$pkg"
  [[ -f package.json ]] || { echo "❌ package.json missing — skipping."; return 1; }

  local name version
  name=$(node -p "require('./package.json').name")
  version=$(node -p "require('./package.json').version")
  echo "  → $name@$version"

  if $USE_TOKEN; then
    npm publish --access public --tag=latest && { echo "✅ $name@$version published"; return 0; }
    echo "⚠️ Token-based publish failed. Falling back to OTP..."
    USE_TOKEN=false
  fi

  [[ -n "${OTP:-}" ]] || prompt_otp
  while true; do
    set +e
    npm publish --access public --tag=latest --otp="$OTP"
    status=$?
    set -e
    [[ $status -eq 0 ]] && { echo "✅ $name@$version published"; break; }
    echo -n "⚠️ Failed (exit $status). New OTP (Enter = retry): "
    read -r NEW_OTP
    NEW_OTP="${NEW_OTP//[[:space:]]/}"
    [[ -n "$NEW_OTP" ]] && OTP="$NEW_OTP"
    sleep 2
  done
}

echo
echo "🚀 Publishing ${#PACKAGES[@]} package(s)..."
for p in "${PACKAGES[@]}"; do publish_one "$p"; done

echo
echo "🎉 Done."
