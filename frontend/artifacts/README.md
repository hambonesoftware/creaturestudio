# Lighting Preview Artifacts

Preview PNGs are intentionally **not committed** to keep the repository small. To review lighting changes, generate fresh captures locally and avoid adding them to git.

## How to regenerate previews
1. Start the backend (`uvicorn app.main:app --host 0.0.0.0 --port 8000`).
2. Start the frontend (`npm run dev -- --host 0.0.0.0 --port 4173 --base /creaturestudio/`).
3. Open `http://127.0.0.1:4173/creaturestudio/debug_preview_elephant.html`.
4. Capture screenshots for All-Around and Studio lighting as needed, but do **not** commit the resulting PNGs.
