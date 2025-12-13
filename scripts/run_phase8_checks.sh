#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

run_backend_tests() {
  echo "[phase8] Running backend pytest..."
  (cd "$ROOT_DIR/backend" && pytest)
}

run_frontend_runtime_smoke() {
  echo "[phase8] Running frontend runtime smoke test..."
  (cd "$ROOT_DIR/frontend" && npm run --silent test:runtime)
}

run_frontend_parity_contract() {
  echo "[phase8] Running frontend elephant parity contract test..."
  (cd "$ROOT_DIR/frontend" && node ./tests/parity/elephant_golden_contract.test.js)
}

run_backend_tests
run_frontend_runtime_smoke
run_frontend_parity_contract

echo "[phase8] QA checks complete."
