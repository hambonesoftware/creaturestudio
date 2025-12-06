# AGENTS.md — CreatureStudio2

These are instructions for **ChatGPT / Codex agents** working in this repo.

The goal is to:
- Make small, **surgical changes** (lighting, materials, rendering, behavior, etc.)
- Avoid touching `node_modules` or system tooling
- Only run the backend/frontend when it is genuinely useful
- Keep git history clean and focused on **source files**, not generated artifacts

Assume the working directory is the repo root (e.g. `/workspace/creaturestudio2`).

---

## 1. What you MUST NOT do

To keep the repo clean and avoid the problems in earlier runs:

1. **Do NOT edit or commit `node_modules`**
   - Never stage or commit anything under:
     - `frontend/node_modules/**`
     - `backend/.venv/**`
     - `dist/`, `.pytest_cache/`, `.mypy_cache/`, etc.
   - If you see changes in `node_modules` (e.g. from the environment’s auto-install):
     - Use:
       ```bash
       git restore frontend/node_modules
       git clean -fd frontend/node_modules
       ```
       or an equivalent clean-up command.
   - Only source files should end up in commits.

2. **Do NOT change global git remotes or branches**
   - Do NOT add/remove `origin`, rename branches, or delete branches.
   - Work only on the current branch that the environment gives you (usually `work`).

3. **Avoid reinstalling everything unless strictly needed**
   - The environment may already run `pip install -r requirements.txt` and `npm ci`.
   - Do NOT create extra virtualenvs or re-run heavy installs unless:
     - You changed `requirements.txt` or `package.json`, and
     - You specifically need to validate that change.

4. **Do NOT spend a long time debugging port-forwarding**
   - If you cannot reach the Vite preview or FastAPI from Playwright/browser tools after **one** reasonable attempt:
     - Stop trying to debug container networking.
     - Explain the situation in the final answer and describe expected behavior instead of providing a screenshot.

---

## 2. Repository layout (high-level)

The repo is structured like this (names may be slightly different, but the idea is):

```text
creaturestudio2/
  backend/           # FastAPI backend
  frontend/          # Vite + Three.js frontend
  shared/            # Blueprint JSON, templates, shared data
  docs/              # Rulebook / documentation
  Elephant/          # Reference-only Elephant implementation from Zoo (optional)
  AGENTS.md          # This file
