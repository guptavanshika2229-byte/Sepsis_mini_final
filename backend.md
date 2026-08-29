# Backend PRD — Sepsis / Deterioration Early Warning System
## 24-Hour Hackathon Build Plan

**Reference:** This document scopes the backend half of the full project described in `PRD_Sepsis_Early_Warning_System.md`. Where the original PRD describes an ideal-world system, this document describes what's realistically achievable by one person in 24 hours, with explicit scope cuts called out.

**Owner:** Backend teammate
**Counterpart doc:** `frontend.md`

---

## 1. Scope Cuts for the 24-Hour Version (Read This First)

To hit the judge-friendly differentiators (multimodal + causal + explainable) within 24 hours, simplify as follows:

| Original PRD Idea | 24-Hour Version |
|---|---|
| Full Structural Causal Model / do-calculus (DoWhy, EconML) | **Perturbation-based counterfactuals**: take the trained model, modify one input feature (e.g., MAP +10mmHg at time T), re-run inference, report the risk delta. This is *not* a rigorous causal estimate, but it's fast to build and still produces the "what-if" number the demo needs. Document this honestly as an approximation. |
| Time-series Transformer from scratch | Use a simpler, fast-to-train sequence model (LSTM/GRU) or even a windowed XGBoost with engineered lag/rolling features if time is tight. Only attempt a Transformer if Phase 2 finishes early. |
| Clinical-note-specific embedding model (ClinicalBERT) | Use a general pretrained sentence embedding model (e.g., `sentence-transformers`) if a clinical-specific one isn't quickly available. Only include the text branch at all if the dataset actually has notes — confirm this in Phase 0. |
| Full RAG chatbot | A constrained Q&A function: user selects/asks about a patient, the backend assembles the patient's current SHAP values + counterfactual results + top vitals into a context block, and passes that to an LLM API call with a strict prompt ("only use the provided data, don't invent clinical advice"). This is "RAG-lite," not a full retrieval pipeline. |

**Non-negotiable for the demo:** working risk prediction + at least one working counterfactual slider + SHAP explanation + the "hours early warning gained" metric. Everything else is a bonus if time allows.

---

## 2. Hour-by-Hour Phase Plan

### Phase 0 — Setup & Data Understanding (Hour 0–2)
**Goal:** Know exactly what you're working with before building anything.
- [ ] Load dataset, inspect schema: what vitals/labs exist, what's the sampling frequency, is there free text, what's the outcome/label field
- [ ] Confirm with teammate: does the dataset support a text branch? (Decide multimodal scope now, not later)
- [ ] Define the **deterioration label**: e.g., "event = 1 if [sepsis onset / ICU escalation / death] occurs, timestamped." Construct the 6–12 hour-ahead prediction window (features from time T, label = event in [T+6h, T+12h])
- [ ] Compute baseline **NEWS2 and/or SOFA scores** from the raw vitals/labs — this is your comparison baseline, needed for the headline metric later. Don't skip this; do it early since it's pure feature engineering, no modeling.
- [ ] **Freeze the API contract** (Section 4 below) and share it with the frontend teammate immediately — this unblocks their work.

**Deliverable by Hour 2:** Clean, labeled dataset + baseline scores computed + API contract shared.

---

### Phase 1 — Baseline Models (Hour 2–6)
**Goal:** Get a working, mediocre-but-functional model fast, so there's always something to demo.
- [ ] Feature engineering: rolling means/std, deltas, last-observed-value-carried-forward for missing data
- [ ] Train Logistic Regression, Random Forest, and XGBoost on tabular features
- [ ] Evaluate: AUROC, AUPRC, calibration
- [ ] Pick the best-performing simple model as the **fallback model** — this becomes your safety net if the deep model runs out of time
- [ ] Serialize this model (pickle/joblib) so it can be served immediately

**Deliverable by Hour 6:** At least one trained, serialized model with real metrics. This is your insurance policy.

---

### Phase 2 — Multimodal / Sequence Model (Hour 6–10)
**Goal:** Build the differentiator model, time permitting.
- [ ] Build sequence model (LSTM/GRU) on the structured time-series windows
- [ ] If dataset has text notes: embed them (sentence-transformers or similar), concatenate/fuse with the sequence model's output before the final prediction head
- [ ] Train, evaluate against the same metrics as Phase 1
- [ ] **Checkpoint decision point (Hour 10):** if this model beats the baseline, use it as the "best model" for the demo; if not (or if not done), fall back to Phase 1's model. Don't burn the whole budget chasing a marginal gain.

**Deliverable by Hour 10:** Best available model chosen and locked in — no more model changes after this point except bug fixes.

---

### Phase 3 — Explainability Layer (Hour 10–13)
**Goal:** Every prediction needs a "why."
- [ ] Add SHAP (for tree/tabular models) or attention-weight extraction (for the sequence model) to produce per-prediction feature contributions
- [ ] Write a function: given a patient + timestamp, return top-N contributing features with direction (increased/decreased risk)
- [ ] Test this output looks clinically sane on a few sample patients (sanity check, not full validation)

**Deliverable by Hour 13:** `get_explanation(patient_id, timestamp)` returns structured feature-importance data.

---

### Phase 4 — Counterfactual ("What-If") Layer (Hour 13–15)
**Goal:** The single most differentiating demo feature.
- [ ] Implement perturbation-based counterfactuals (see Section 1 scope cut): take a patient's current feature vector, modify one variable (e.g., MAP, vasopressor dose, fluids) by a user-specified amount, re-run the model, return risk delta
- [ ] Expose this as a function callable per (patient, variable, delta) triple
- [ ] Add a one-line caveat string to every counterfactual response: `"Estimated effect based on model re-simulation, not a validated causal claim."`

**Deliverable by Hour 15:** `get_counterfactual(patient_id, variable, delta)` returns predicted new risk + delta + caveat text.

---

### Phase 5 — API Layer (Hour 15–18)
**Goal:** Expose everything to the frontend cleanly.
- [ ] Build FastAPI (recommended for speed) app with endpoints from Section 4
- [ ] Wire up model inference, explanation, and counterfactual functions to endpoints
- [ ] Add CORS support so the frontend (likely on a different port) can call it
- [ ] Add basic error handling (missing patient ID, malformed input) — don't over-engineer, just avoid crashes

**Deliverable by Hour 18:** All endpoints live and testable via Swagger UI (`/docs` with FastAPI) or Postman.

---

### Phase 6 — Chatbot Endpoint (Hour 18–20)
**Goal:** "Ask why" functionality.
- [ ] Build `/chat` endpoint: takes patient_id + free-text question
- [ ] Assemble context: current risk score, top SHAP features, most recent counterfactual results if any, key vitals trend
- [ ] Call an LLM API (e.g., Anthropic API) with a system prompt constraining it to only reason over the provided context and explicitly avoid inventing clinical recommendations beyond what the data supports
- [ ] Return the LLM's response as plain text

**Deliverable by Hour 20:** Working chatbot endpoint, tested with a few sample questions.

---

### Phase 7 — Integration Support (Hour 20–22)
**Goal:** Make sure frontend integration actually works.
- [ ] Sit with frontend teammate, run through every endpoint together against the real frontend calls
- [ ] Fix response shape mismatches, CORS issues, null/missing data edge cases
- [ ] Add sample/demo patients that are guaranteed to produce interesting (visually compelling) risk trajectories — curate 2–3 "hero" patients for the live demo

**Deliverable by Hour 22:** End-to-end flow works from frontend UI through to backend response, for at least the curated demo patients.

---

### Phase 8 — Metrics, Polish, Demo Prep (Hour 22–24)
**Goal:** Land the headline number and be demo-ready.
- [ ] Compute the **"hours of early warning gained"** metric: for each true deterioration event in the test set, find the time your model's risk score crosses its alert threshold vs. when NEWS2/SOFA crosses its threshold; report the average/median hours difference
- [ ] Prepare a short metrics summary (AUROC, AUPRC, hours gained) to hand to the frontend teammate or present directly
- [ ] Freeze the backend — no more changes except critical bug fixes
- [ ] Do a full dry run of the demo script with the frontend

**Deliverable by Hour 24:** Final metrics ready, backend frozen and stable, demo rehearsed.

---

## 3. Backend Tech Stack

- **Language:** Python
- **Modeling:** scikit-learn, XGBoost, PyTorch (for LSTM/GRU if time allows)
- **Explainability:** `shap`
- **Embeddings (if text used):** `sentence-transformers`
- **API:** FastAPI + Uvicorn
- **Chatbot LLM call:** Anthropic API (or whichever is fastest to wire up)
- **Serialization:** `joblib`/`pickle` for sklearn/XGBoost, `torch.save` for deep models

---

## 4. API Contract (Freeze This Early — Share with Frontend by Hour 2)

### `GET /patients`
Returns list of patients with current risk snapshot for the dashboard list view.
```json
[
  {
    "patient_id": "P001",
    "current_risk": 0.72,
    "risk_level": "high",
    "last_updated": "2026-08-28T10:00:00Z"
  }
]
```

### `GET /patients/{patient_id}/timeline`
Returns vitals/labs history + risk trajectory + baseline score trajectory for the detail view.
```json
{
  "patient_id": "P001",
  "timestamps": ["2026-08-28T04:00:00Z", "2026-08-28T05:00:00Z"],
  "vitals": {
    "HR": [88, 95],
    "MAP": [70, 65],
    "lactate": [1.2, 2.1]
  },
  "model_risk": [0.30, 0.55],
  "news2_score": [3, 5],
  "sofa_score": [1, 2],
  "predicted_alert_time": "2026-08-28T09:00:00Z"
}
```

### `GET /patients/{patient_id}/explanation?timestamp=...`
Returns SHAP/attention-based explanation for a specific point in time.
```json
{
  "patient_id": "P001",
  "timestamp": "2026-08-28T05:00:00Z",
  "top_features": [
    {"feature": "lactate", "contribution": 0.18, "direction": "increases_risk"},
    {"feature": "MAP", "contribution": -0.09, "direction": "decreases_risk"}
  ]
}
```

### `POST /patients/{patient_id}/counterfactual`
Runs a what-if simulation.
Request:
```json
{ "timestamp": "2026-08-28T05:00:00Z", "variable": "MAP", "delta": 10 }
```
Response:
```json
{
  "original_risk": 0.55,
  "new_risk": 0.41,
  "risk_delta": -0.14,
  "caveat": "Estimated effect based on model re-simulation, not a validated causal claim."
}
```

### `POST /chat`
Chatbot Q&A endpoint.
Request:
```json
{ "patient_id": "P001", "question": "Why is this patient's risk increasing?" }
```
Response:
```json
{ "answer": "Risk is rising primarily due to increasing lactate and falling MAP over the last 2 hours..." }
```

**Note to both of you:** if any field names change during development, update this section immediately and re-share — mismatches here are the #1 cause of last-minute integration bugs.

---

## 5. Sync Points With Frontend

| Hour | Sync Point |
|---|---|
| 2 | API contract frozen and shared |
| 10 | Confirm which model is final (in case response shape/confidence fields change) |
| 15 | All core endpoints live for frontend to start real integration (before this, frontend uses mocks) |
| 20–22 | Joint integration testing session — **block this time on both calendars** |

---

## 6. Risks (Backend-Specific)

| Risk | Mitigation |
|---|---|
| Deep model doesn't train well in time | Phase 1 baseline model is the guaranteed fallback — never delete it |
| Causal/counterfactual layer too ambitious | Perturbation-based approach only (Section 1) — do not attempt a real SCM in 24 hours |
| LLM chatbot hallucinates | Strict system prompt + only pass real computed data as context, never let it free-generate clinical facts |
| Missing data breaks inference | Add defensive imputation/defaults in the API layer, not just in training |
