# AGENTS.md — CreatureStudio

This file tells you (the Codex agent) exactly how to run the CreatureStudio
backend and frontend inside the Codex environment and how to capture a
preview of the running app using Playwright.

The main goals:

1. Always use the **preinstalled Node.js 20 and npm** provided by the
   environment. Do **not** manually install Node.
2. Start the **FastAPI backend** on port **8000**, bound to `0.0.0.0`.
3. Start the **Vite frontend** in **preview mode** on port **4173**,
   bound to `0.0.0.0`, with the `/creaturestudio/` base.
4. Use `browser_container.run_playwright_script` with
   `ports_to_forward: [4173, 8000]` and capture a screenshot of
   `http://127.0.0.1:4173/creaturestudio/`.

---

## Project overview

- Repository name: **CreatureStudio**
- Backend: **FastAPI** in `backend/`
- Frontend: **Vite + Three.js** in `frontend/`
- Shared blueprints: `shared/blueprints/ElephantBlueprint.json` etc.

The running system for previews is:

- Backend API: `http://127.0.0.1:8000`
- Frontend UI: `http://127.0.0.1:4173/creaturestudio/`

---

## Environment expectations

When working in the Codex environment:

- Assume the working directory is `/workspace/creaturestudio`.
- The environment configuration already sets **Node.js 20** and **npm**
  as preinstalled packages.
- You should be able to run:

  ```bash
  node -v
  npm -v
