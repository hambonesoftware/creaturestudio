# AGENTS.md

## Overview

This repository contains a web application with:

- A **FastAPI** backend
- A **Vite** frontend served at `/creaturestudio/`
- **Playwright** end-to-end tests to drive the UI in a real browser

A ChatGPT Codex agent working in this repo should:

1. Install backend and frontend dependencies.
2. Start the backend API server.
3. Start the Vite frontend dev server on port **4173** with the `/creaturestudio/` base path.
4. Use **Playwright** to open the running app and run tests (or smoke checks) against it.

Internet access may be disabled after the Codex setup phase, so all dependencies must be installed up-front.

---

## Repository Layout (expected)

Adjust if your actual paths differ.

- `backend/`
  - FastAPI app entrypoint: `app/main.py`
  - Requirements: `backend/requirements.txt`
- `frontend/`
  - Vite app, Playwright tests, and config
  - `package.json`
  - `playwright.config.(ts|js)`
  - `tests/` or `playwright/` directory for end-to-end tests

---

## Tooling and Runtime Requirements

The Codex agent should assume:

- **Python**: 3.10–3.12
- **Node.js**: 18+ (20+ preferred)
- **Package managers**:
  - `pip` for Python
  - `npm` (or `pnpm`/`yarn` if already used by `package.json`)
- **Playwright**:
  - Installed via `npx playwright install --with-deps` inside `frontend/`

---

## Backend: How to Set Up and Run

### One-time backend setup

From the **repo root**:

```bash
cd backend

python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

pip install --upgrade pip
pip install -r requirements.txt
