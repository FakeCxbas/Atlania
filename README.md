# TERR-ANALOG // NASA Space Apps Challenge 2026

Terrestrial analog discovery and Analog Similarity Index (ASI) telemetry platform for the 2026 NASA Space Apps Challenge: **Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars**.

## Repository Structure

- `engine/`: Python 3.11+ scientific pipeline (`uv`) that fetches NASA POWER climatology data, computes 5-axis ASI scores against 4 lunar/Martian reference scenarios, and exports `frontend/public/data/analogs.json` and `analogs.geojson`.
- `frontend/`: Next.js 16 + Tailwind CSS + MapLibre GL Mission Control HUD (`Satellite`, `NASA GIBS`, and `Dark Vector` basemaps, site directory, and telemetry drawer).

## Quickstart After Cloning

### 1. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000`.

### 2. Scientific ASI Engine (Python / uv)
```bash
cd engine
uv sync
.venv/bin/python -m pytest tests
.venv/bin/python build_dataset.py
```

## Active Frontend Issues (Team Onboarding)

Pick an open issue, create a dedicated branch, and reference `closes #<id>` in your commit and Pull Request:

- **#2** — `feat(ui): add side-by-side Earth vs Moon/Mars target comparison view` ([Issue #2](https://github.com/FakeCxbas/nasa-space-apps-2026/issues/2))
- **#3** — `feat(map): add 3D terrain tilt, site telemetry popups, and NASA GIBS layer controls` ([Issue #3](https://github.com/FakeCxbas/nasa-space-apps-2026/issues/3))
- **#4** — `feat(ux): add ASI dossier export, methodology dialog, and mobile HUD drawer` ([Issue #4](https://github.com/FakeCxbas/nasa-space-apps-2026/issues/4))

View all open issues via GitHub CLI:
```bash
gh issue list
```

## Team Git Workflow

1. Never push directly to the default branch. Create a feature or fix branch:
   ```bash
   git checkout -b feat/issue-2-target-comparison
   ```
2. Use Conventional Commits (`feat(...)`, `fix(...)`, `docs(...)`, `test(...)`) and link the issue:
   ```bash
   git commit -m "feat(ui): add side-by-side target comparison view (closes #2)"
   ```
3. Push and open a Pull Request:
   ```bash
   git push -u origin feat/issue-2-target-comparison
   gh pr create --fill
   ```
