# Frontend PRD — Sepsis / Deterioration Early Warning System
## 24-Hour Hackathon Build Plan

**Reference:** This document scopes the frontend half of the full project described in `PRD_Sepsis_Early_Warning_System.md`. Pair with `backend.md` for the API contract you'll be building against.

**Owner:** Frontend teammate
**Counterpart doc:** `backend.md`

---

## 1. Guiding Principle for the 24-Hour Version

The dashboard is the **judge-facing product** — it's what makes the causal counterfactuals and multimodal explainability actually *land* visually. Prioritize in this order:
1. Patient timeline with risk trajectory vs. baseline score (this alone tells the whole story)
2. Explanation panel (SHAP-style feature bars)
3. What-if intervention slider (the single most "wow" feature — protect time for this)
4. Chatbot panel
5. Patient list view (can be simple — a table is fine, doesn't need to be fancy)

**Key unblock strategy:** Don't wait on the backend. Build against **mock data matching the API contract** (Section 3 of `backend.md`) starting Hour 0, and swap in real API calls once backend endpoints go live (~Hour 15 per their plan).

---

## 2. Hour-by-Hour Phase Plan

### Phase 0 — Setup & Design Direction (Hour 0–2)
**Goal:** Get the shell running and agree on the API contract with backend.
- [ ] Scaffold the app (React recommended — fast, huge charting ecosystem)
- [ ] Pick a charting library: Recharts or Plotly.js (Recharts is faster to style well; Plotly is better if you want built-in zoom/pan on timelines)
- [ ] Review and confirm the API contract in `backend.md` Section 4 with your teammate — flag anything you need shaped differently *now*, before they start building
- [ ] Set up a `mockApi.js`/mock data layer that returns hardcoded JSON matching the exact contract shape, so every component you build works standalone
- [ ] Decide the visual language: color scale for risk (e.g., green <0.3, amber 0.3–0.6, red >0.6), typography, layout grid. Keep it clean and clinical — high contrast, no clutter, generous whitespace.

**Deliverable by Hour 2:** Running app shell + mock data layer + agreed API contract + visual style decided.

---

### Phase 1 — Patient List View (Hour 2–4)
**Goal:** The entry point of the app.
- [ ] Build a sortable/filterable table or card list of patients: ID, current risk score, risk level badge (color-coded), last updated time
- [ ] Sort by risk descending by default (highest-risk patients first — this is how a nurse would actually use it)
- [ ] Click-through to patient detail view
- [ ] Use mock `/patients` data for now

**Deliverable by Hour 4:** Working, clickable patient list.

---

### Phase 2 — Patient Timeline & Risk Trajectory (Hour 4–9)
**Goal:** This is the core visual — invest the most time here.
- [ ] Build the vitals/labs chart: multi-line or small-multiples chart of key variables (HR, MAP, lactate, etc.) over time
- [ ] Overlay the **model risk score** and **NEWS2/SOFA baseline score** on a shared or twin-axis chart — this comparison is your headline visual proof point
- [ ] Add a visual marker for the "predicted alert time" (when your model would have fired vs. when the baseline would have fired) — annotate the gap in hours directly on the chart if possible (e.g., a shaded region or callout: "8.5 hrs earlier warning")
- [ ] Add hover tooltips showing exact values at each timestamp
- [ ] Use mock `/patients/{id}/timeline` data initially

**Deliverable by Hour 9:** Fully working timeline chart with risk-vs-baseline comparison, using mock data.

---

### Phase 3 — Explanation Panel (Hour 9–12)
**Goal:** Show "why" next to the risk score.
- [ ] Build a horizontal bar chart (or simple styled list) of top contributing features, color-coded by direction (red = increases risk, blue/green = decreases risk), sized by contribution magnitude — classic SHAP-style waterfall or bar chart
- [ ] Position this panel next to or below the timeline, tied to whatever timestamp the user is currently viewing/hovering
- [ ] Use mock `/patients/{id}/explanation` data initially

**Deliverable by Hour 12:** Explanation panel rendering correctly against mock data.

---

### Phase 4 — What-If Intervention Slider (Hour 12–16)
**Goal:** The standout interactive feature — protect this time block.
- [ ] Build slider/input controls for key intervenable variables (e.g., MAP, fluids, vasopressor dose)
- [ ] On change, call the counterfactual endpoint (mock initially, real once backend is live) and update a live "predicted risk" readout
- [ ] Visualize the shift clearly: e.g., an animated needle/gauge or a "before → after" risk comparison, plus the caveat text from the backend response displayed subtly but visibly (builds trust, shows rigor to judges)
- [ ] Make this feel responsive and satisfying to interact with live during a demo — this is the moment judges will remember

**Deliverable by Hour 16:** Fully interactive what-if slider working against mock data, ready to swap to live API.

---

### Phase 5 — Chatbot Panel (Hour 16–18)
**Goal:** Conversational Q&A UI.
- [ ] Build a simple chat interface (message list + input box) docked in the patient detail view
- [ ] Wire it to call `/chat` (mock initially) with the current patient_id + user question
- [ ] Show a lightweight typing/loading indicator while waiting for a response
- [ ] Style responses clearly as "AI-generated, grounded in model data" (small label/disclaimer) — reinforces trustworthiness

**Deliverable by Hour 18:** Working chat UI against mock responses.

---

### Phase 6 — Real API Integration (Hour 18–20)
**Goal:** Swap mocks for the real backend, matching the sync point in `backend.md`.
- [ ] Replace mock data calls with real `fetch`/`axios` calls to backend endpoints
- [ ] Handle loading and error states gracefully (spinners, fallback messages) — don't let the UI break if backend is slow or returns an error
- [ ] Confirm response shapes match exactly; flag any mismatches to backend teammate immediately

**Deliverable by Hour 20:** Fully live, end-to-end integrated app.

---

### Phase 7 — Joint Integration Testing (Hour 20–22)
**Goal:** Shared session with backend teammate (block this time together).
- [ ] Walk through every feature end-to-end with real data
- [ ] Test the curated "hero" demo patients backend prepares
- [ ] Fix any UI bugs surfaced by real (messier) data — e.g., missing fields, unexpected nulls, extreme values breaking chart scales

**Deliverable by Hour 22:** Stable, bug-free end-to-end demo flow.

---

### Phase 8 — Visual Polish & Demo Rehearsal (Hour 22–24)
**Goal:** Make it look and feel finished.
- [ ] Polish spacing, alignment, color consistency, responsive behavior
- [ ] Add a simple landing/header (project name, one-line pitch) for when judges first see the screen
- [ ] Add subtle loading states/animations so nothing looks broken during the live demo
- [ ] Do a full dry run of the demo script with your teammate — know exactly which patient(s) you'll click through and in what order

**Deliverable by Hour 24:** Demo-ready, polished application.

---

## 3. Frontend Tech Stack

- **Framework:** React (fastest to prototype with, huge component ecosystem)
- **Charts:** Recharts (simpler, faster to style) or Plotly.js (more built-in interactivity)
- **Styling:** Tailwind CSS (fast, consistent, avoids bikeshedding on CSS during a time crunch)
- **State management:** React's built-in `useState`/`useContext` — do not reach for Redux, there's no time for that overhead
- **HTTP calls:** `axios` or native `fetch`
- **Icons:** `lucide-react` for clean, consistent iconography (risk badges, alert icons, etc.)

---

## 4. Mock Data Strategy (Critical for Parallel Work)

Build a small `mockData.js` file that mirrors **exactly** the JSON shapes in `backend.md` Section 4, for:
- `/patients` (3–5 mock patients with varying risk levels)
- `/patients/{id}/timeline` (a realistic-looking rising risk trajectory for at least one patient, with the baseline score rising later — this is what proves "hours gained" visually even before real data)
- `/patients/{id}/explanation`
- counterfactual response
- `/chat` response

This lets you build and demo the **entire frontend in isolation** if backend runs behind schedule — worst case, you can demo with realistic mock data and be transparent about it.

---

## 5. Sync Points With Backend

| Hour | Sync Point |
|---|---|
| 2 | API contract confirmed together |
| 15 | Backend endpoints go live — start swapping mocks for real calls |
| 20–22 | Joint integration testing session — **block this time on both calendars** |

---

## 6. Risks (Frontend-Specific)

| Risk | Mitigation |
|---|---|
| Backend runs late, blocking integration | Mock data layer means frontend is never blocked; swap-in is a small, isolated change if contract was respected |
| Charts look cluttered/unclear with real messy ICU data | Test early with intentionally messy mock data (missing values, spikes) so charts are robust before real data arrives |
| Slider/what-if feature isn't ready in time | This is the #1 priority interactive feature — if time runs short elsewhere, protect Phase 4's time block above all else except the core timeline |
| Demo breaks live due to network/API issues | Keep the mock data layer in the codebase as a "demo mode" fallback toggle, just in case |
