# Build Spec: "SENTINEL" — Deterministic Live Case Study Dashboard
### Marine Oil-Spill Attribution & Evidence-Generation System (Hackathon Prototype)

> **Prompt context for the AI agent building this:** You are building a **judged hackathon demo**, not a production surveillance system. All data is pre-scripted/synthetic or drawn from public historical datasets for a single fixed case study. Prioritize a flawless, deterministic, replayable demo over real-time correctness or live data integration. Every "AI" step should be a pre-baked, convincing playback of a plausible pipeline — the goal is to demonstrate the *reasoning architecture* of a spill-attribution system, not to ship a real detection model in the time available.

---

## 1. Project Goal

Build a single-page web dashboard that walks a judge through a 4-stage narrative for attributing an oil spill to a responsible vessel, ending in an exportable evidence report. The experience should feel like a real maritime domain-awareness tool used by a coast guard, but must run entirely off pre-processed, deterministic data so the demo never fails on stage.

**Case study to use:** pick one fixed, named historical or illustrative scenario (e.g., a spill scenario in the Bay of Bengal or Gulf of Kutch) and hard-code all data around it. Do not attempt to fetch live satellite or AIS feeds.

---

## 2. Tech Stack

- **Frontend:** React.js (Vite), Tailwind CSS for styling
- **Mapping/Visualization:** deck.gl (WebGL) for the map layers, animated particle trails, and vessel track overlays
- **Backend:** FastAPI (Python) — serves pre-computed JSON "scenario packs" and generates the PDF export
- **Database:** PostGIS (or, if time-constrained, a static GeoJSON/JSON fixture store standing in for it) — used to store and query the scenario's spatial data (spill polygon, drift track, vessel tracks, origin box)
- **PDF/Report generation:** a Python PDF library (e.g., ReportLab or WeasyPrint) to assemble the "GeoPDF" dossier from a template

**Guidance:** Keep the frontend and backend decoupled via a small REST API, but don't over-engineer — a hackathon judge cares about the on-screen narrative, not backend architecture purity.

---

## 3. Data to Pre-Generate (before writing UI code)

Before any UI work, generate and store static JSON fixtures for the single chosen case study:

1. **`scene.json`** — SAR image metadata + a fixed segmentation polygon (as GeoJSON) representing the "detected" slick, plus fabricated-but-plausible sensor stats (chlorophyll index, wind speed, confidence score).
2. **`drift_hindcast.json`** — a sequence of particle positions across ~8 hourly timesteps, going backward from the spill polygon to a converging "origin box" (a small bounding rectangle with lat/lon + estimated origin time). This can be generated with a simple synthetic backward-advection script (doesn't need to call real OpenDrift/ocean current APIs — a scripted approximation is fine for the demo, but structure the code so a real OpenDrift call could be swapped in later).
3. **`ais_tracks.json`** — 2–5 fabricated vessel trajectories near the origin box/time window, one of which has a gap ("AIS blackout") and a deceleration anomaly. Each vessel has an MMSI, type, and pre-computed track points.
4. **`scores.json`** — pre-computed Tri-Factor suspicion scores for each vessel (see scoring formula below), with the flagged vessel scoring highest.

All four files should be internally consistent (same timestamps, same coordinate reference frame) so the narrative holds together visually.

---

## 4. UI Structure — 4 Stages

Build this as a single dashboard with a persistent map (deck.gl) and a stage-stepper / tab control on the side. Each stage reveals new layers on the same map rather than navigating to a new page, so the judge experiences continuity.

### Stage 1 — Satellite Ingestion & False-Positive Filter
- Map loads with a base layer + a SAR radar image overlay for the incident scene.
- Button: **"Toggle AI Segmentation Mask"** → animates in a neon-outlined polygon (from `scene.json`) over the slick.
- Side panel shows sensor readout, styled as a log/telemetry readout, e.g.:
  - Chlorophyll Index: 0.08 (Biogenic Algae Rejected)
  - Surface Wind: 14.2 m/s
  - Classification: Petroleum Slick Confirmed — 98.4% Confidence
- Use a short CSS transition/animation so the polygon draws in — this is the single most "wow" moment of Stage 1, worth polishing.

### Stage 2 — Reverse Lagrangian Particle Hindcasting
- Button: **"Run Reverse Ocean Hindcast"** + a timeline slider from T=0 to T=-8h.
- As the slider moves backward, animate particle points (from `drift_hindcast.json`) tracing backward across the map, converging into a glowing rectangular "Origin Space-Time Box."
- Label the box with its estimated (x₀, y₀, t₀).
- Keep this deterministic and scrubbable both directions — judges often replay sliders, so make sure going forward/backward doesn't break the animation state.

### Stage 3 — AIS Telemetry & Tri-Factor Scoring
- Button: **"Query AIS Vessel Tracks"** → overlays vessel trajectories (from `ais_tracks.json`) that pass through/near the origin box.
- Side panel: interactive leaderboard, sorted by suspicion score, e.g.:
  - Vessel 1 (Crude Carrier, MMSI 419001842) — Score 94.8% — FLAGGED: AIS Blackout (42 min) + 6.2 kt Deceleration Anomaly
  - Vessel 2 (Container Ship) — Score 21.4% — Normal transit
- **Tri-Factor scoring formula** (define explicitly and show it in a tooltip/info icon — judges like seeing the actual method, not just a black-box number):
  1. **Spatial-temporal overlap** with the origin box (higher = more overlap)
  2. **AIS gap duration** (longer blackout = higher suspicion)
  3. **Speed/course anomaly** relative to the vessel's baseline transit speed
  - Combine as a weighted score, e.g. `score = 0.4*overlap + 0.35*blackout_norm + 0.25*speed_anomaly_norm`, scaled to 0–100%. Keep the weights visible in the UI or docs — this is your "proof of logic" surface.
- Clicking a vessel row highlights its track on the map and shows its full particulars (name/type placeholder, flag, last-known-position).

### Stage 4 — Automated Evidence Export
- Button: **"Generate Legal Dossier"** → calls the FastAPI backend, which renders a PDF from a template embedding:
  - Case metadata (scenario name, timestamp of generation)
  - A static map snapshot (or exported deck.gl canvas image) showing spill polygon + origin box + flagged vessel track
  - Coordinates and timestamps for the spill and origin box
  - The suspect vessel's particulars and Tri-Factor score breakdown
  - A disclaimer line noting this is a prototype/demo output, not an operational legal document
- Trigger a browser download of the generated PDF immediately.

---

## 5. Visual/UX Direction

- Dark, "command-and-control" theme: near-black background, high-contrast map, neon/glow accent colors (cyan, amber, red) for overlays — evokes a maritime ops center.
- Keep a persistent top bar showing the 4-stage progress (Radar AI → Physics Engine → AIS Scoring → Dossier) so judges always know where they are in the story.
- Every "AI/compute" action should have a short (1–2s) loading/processing animation before the result appears — this sells the illusion of live computation even though the data is pre-baked.
- Keep transitions snappy; avoid long fake-loading delays that could bore judges during a live demo.

---

## 6. Explicit Build Constraints for the Agent

- **Do not attempt real integrations** with live SAR feeds, live AIS APIs, or real OpenDrift ocean model runs — time budget doesn't allow it and it isn't needed for the demo. Use the pre-generated fixtures described in Section 3.
- **Determinism over realism:** every button press should produce the exact same result every time, so the demo is rehearsable and never fails live.
- Structure code so backend endpoints (`/api/scene`, `/api/hindcast`, `/api/ais`, `/api/scores`, `/api/dossier`) are clearly separated, even if they just read static JSON — this makes it easy to narrate "this is powered by a FastAPI backend" truthfully.
- Keep the whole thing runnable locally with two commands (`npm run dev` for frontend, `uvicorn main:app --reload` for backend) and document this in a top-level `README.md`.
- Target build time: **under 2 hours** for a working end-to-end click-through of all 4 stages plus PDF export. Build stage-by-stage and get each one visually working before adding polish.

---

## 7. Suggested Build Order

1. Scaffold React + FastAPI, get a basic deck.gl map rendering.
2. Generate the four JSON fixtures (Section 3) — this unblocks everything else.
3. Build Stage 1 UI + polygon overlay.
4. Build Stage 2 slider + particle animation.
5. Build Stage 3 leaderboard + track overlay.
6. Build Stage 4 PDF export endpoint + download trigger.
7. Polish: dark theme, transitions, stage-progress bar, README.

---

## 8. What to Hand Back

A working local repo with:
- `/frontend` (React app)
- `/backend` (FastAPI app + fixture generation scripts)
- `/data` (the four JSON fixtures)
- `README.md` with run instructions and a one-paragraph description of the scenario used
