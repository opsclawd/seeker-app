#!/usr/bin/env bash
set -euo pipefail

# This script is intentionally *non-destructive*: it prints what to do and verifies versions.

required_solana="2.3.0"
required_anchor="0.32.1"
required_node="22.22.0"
required_pnpm="10.29.3"
required_rust="1.93.1"

echo "== seeker-app bootstrap =="
echo

echo "Rust toolchain (host):"
echo "  required: rustc ${required_rust}"
if command -v rustc >/dev/null 2>&1; then
  echo "  current:  $(rustc --version)"
else
  echo "  current:  (rustc not found)"
fi

echo

echo "Node:" 
echo "  required: v${required_node}"
if command -v node >/dev/null 2>&1; then
  echo "  current:  $(node -v)"
else
  echo "  current:  (node not found)"
fi

echo

echo "pnpm:" 
echo "  required: ${required_pnpm}"
if command -v pnpm >/dev/null 2>&1; then
  echo "  current:  $(pnpm -v)"
else
  echo "  current:  (pnpm not found)"
fi

echo

echo "Solana/Agave CLI:" 
echo "  required: solana-cli ${required_solana}"
if command -v solana >/dev/null 2>&1; then
  echo "  current:  $(solana --version)"
else
  echo "  current:  (solana not found)"
fi

echo

echo "Anchor:" 
echo "  required: anchor-cli ${required_anchor}"
if command -v anchor >/dev/null 2>&1; then
  echo "  current:  $(anchor --version)"
else
  echo "  current:  (anchor not found)"
fi

echo

echo "Next steps:"
echo "  1) Install/pin missing tools per README"
echo "  2) pnpm install"
