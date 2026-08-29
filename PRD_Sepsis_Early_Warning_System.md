# Product Requirements Document (PRD)
## Multimodal Sepsis / Patient Deterioration Early Warning System with Causal Explainability

**Version:** 1.0
**Date:** August 27, 2026
**Owner:** [Your Name]
**Status:** Draft

---

## 1. Executive Summary

ICU patients can deteriorate rapidly, and by the time standard clinical scores (NEWS2, SOFA, qSOFA) flag danger, the window for effective intervention has often already narrowed. This project builds a **multimodal machine learning system** that predicts patient deterioration **6–12 hours before** it becomes clinically obvious using existing tools, and — critically — explains **why** the risk is rising and **what intervention** might reduce it.

Unlike typical risk-scoring tools that output a single number, this system combines:
- **Structured time-series data** (vitals, labs) via sequence models (LSTM/GRU/Transformer)
- **Unstructured clinical notes** via LLM-based embeddings (NLP)
- **A causal reasoning layer** that estimates the effect of hypothetical interventions (e.g., "if MAP were raised by 10 mmHg two hours ago, how would risk change?")
- **An explainability layer** (SHAP + attention visualization) so clinicians can trust and act on the output
- **A conversational assistant (chatbot)** that lets doctors/nurses ask natural-language questions about *why* a patient's risk is what it is
- **A clinical dashboard** showing patient timelines, risk trajectories, and an interactive "what-if" intervention simulator

---

## 2. Problem Statement

Sepsis and general clinical deterioration in ICU settings are leading causes of preventable death. Current early warning scores (NEWS2, SOFA, qSOFA) are:
- **Reactive**, not predictive — they flag deterioration close to when it happens, not well in advance
- **Single-modality** — they ignore rich information in clinical notes, nursing observations, and treatment history
- **Black-box or purely score-based** — they tell you *that* risk is high, not *why*, and never tell you *what to do about it*

Clinicians need a tool that gives them **more lead time**, **transparent reasoning**, and **actionable guidance** — not just another number on a monitor.

---

## 3. Goals & Objectives

| Goal | Description |
|---|---|
| **Primary Goal** | Predict patient deterioration 6–12 hours earlier than NEWS2/SOFA-based alerts |
| **Secondary Goal** | Provide causal, actionable explanations ("why" and "what would help") rather than only correlational feature importance |
| **Tertiary Goal** | Deliver an intuitive, clinician-friendly dashboard + chatbot interface that could plausibly be used in a real ICU workflow |
| **Academic/Demo Goal** | Benchmark multiple ML approaches, report the best model transparently, and produce a compelling, judge-friendly comparison against clinical baselines |

### Non-Goals (Out of Scope for v1)
- Real-time integration with actual hospital EHR systems (this is a research/demo prototype)
- Regulatory (FDA/CE) clearance or clinical validation as a medical device
- Fully automated treatment recommendations without human-in-the-loop review
- Support for pediatric or neonatal ICU populations (assume adult ICU unless dataset says otherwise)

---

## 4. Target Users & Personas

| Persona | Needs |
|---|---|
| **ICU Physician** | Wants an early, trustworthy alert with clear reasoning and suggested interventions to validate against clinical judgment |
| **ICU Nurse** | Wants a simple visual risk trajectory to prioritize which patients to check on first during rounds |
| **Clinical Data Scientist / Researcher (secondary)** | Wants access to model performance metrics, feature importances, and causal graphs for auditing/trust |
| **Hackathon/Project Judges (for demo context)** | Want a clear "early warning gained vs baseline" number and a compelling live demo |

---

## 5. Key Use Cases / User Stories

1. **As an ICU doctor**, I want to see a patient's deterioration risk trend over time, so I can decide if intervention is needed before it becomes an emergency.
2. **As an ICU nurse**, I want a sorted list/dashboard of patients by risk level, so I know who to check on first.
3. **As a doctor**, I want to ask "why is this patient's risk increasing?" in plain language and get an answer referencing specific vitals/labs/notes.
4. **As a doctor**, I want to simulate "what if I raise MAP by 10 mmHg" and see the predicted effect on risk, so I can weigh intervention options.
5. **As a data scientist**, I want to compare multiple models (e.g., XGBoost, LSTM, Transformer, ensemble) on the same evaluation metrics, so I can justify why the best model was chosen.
6. **As a judge/evaluator**, I want to see a single clear metric — "hours of early warning gained vs. NEWS2/SOFA" — to understand the system's value immediately.

---

## 6. System Overview / Functional Requirements

### 6.1 Data Ingestion & Preprocessing
- Ingest structured time-series data: vitals (HR, BP, MAP, RR, SpO2, Temp), labs (lactate, WBC, creatinine, platelets, etc.)
- Ingest unstructured data: clinical/nursing notes (if available in dataset)
- Handle missing data (common in ICU data) via imputation strategies (forward-fill, model-based imputation, missingness indicators)
- Time-align multimodal streams into consistent time windows (e.g., hourly bins)
- Compute baseline clinical scores (NEWS2, SOFA, qSOFA) from the same data for later benchmarking

### 6.2 Modeling Layer (Multimodal)
- **Structured branch:** Time-series model — candidates: LSTM/GRU, Temporal Convolutional Network (TCN), or Transformer (e.g., a lightweight time-series transformer)
- **Text branch:** Clinical notes embedded using a pretrained clinical/biomedical language model (e.g., ClinicalBERT-style embeddings, or general embeddings if clinical-specific ones aren't available in the dataset)
- **Fusion layer:** Combine structured + text embeddings (e.g., concatenation + attention-based fusion, or a gated fusion network) to produce a unified risk representation
- **Baseline models:** Also implement simpler baselines (Logistic Regression, Random Forest, XGBoost on tabular features) to demonstrate performance uplift from the multimodal deep approach
- **Output:** Predicted probability of deterioration event within the next 6–12 hour window (binary or time-to-event framing)

### 6.3 Causal Explainability Layer
- Build a simplified **Structural Causal Model (SCM)** or apply **do-calculus-based estimation** (e.g., using libraries like `DoWhy`, `EconML`, or `CausalNex`) over a defined causal graph of key clinical variables (e.g., MAP → organ perfusion → risk; lactate → risk; vasopressor dose → MAP → risk)
- Support **counterfactual queries**: "If [variable] had been [value] at [time], what would predicted risk be?"
- Clearly document assumptions and limitations of the causal model (causal claims from observational ICU data require strong caveats — this should be presented as a decision-support estimate, not ground truth)

### 6.4 Explainability & Interpretability
- **SHAP values** for feature-level contribution to each prediction (structured features)
- **Attention weight visualization** for the time-series and text models (which time points / which note phrases mattered most)
- **Causal counterfactual explanations** paired with the above (e.g., "Lactate trend contributed most to rising risk; raising MAP by 10 mmHg is estimated to reduce risk by X%")

### 6.5 Conversational Assistant (Chatbot)
- Natural-language Q&A interface for clinicians, e.g.:
  - "Why is this patient's risk high?"
  - "What changed in the last 2 hours?"
  - "What intervention would help most right now?"
- Chatbot should ground its answers in the model's SHAP/attention/causal outputs (retrieval-augmented over the patient's current feature explanations) — **not** hallucinate free-form medical advice
- Should clearly disclose it is a decision-support tool, not a replacement for clinical judgment

### 6.6 Clinical Dashboard (Frontend)
- **Patient list view:** sortable/filterable list of ICU patients by current risk level
- **Patient detail view:**
  - Vitals/labs timeline (interactive charts)
  - Risk trajectory over time, with a marker for "predicted deterioration window"
  - Comparison overlay: model risk score vs. NEWS2/SOFA score over time
  - Explanation panel: top contributing factors (SHAP/attention)
  - **"What-if" intervention slider(s):** adjust variables like MAP, fluids, vasopressor dose and see live-updated predicted risk (powered by the causal layer)
  - Embedded chatbot panel for free-text Q&A
- Clean, medical-grade UI: high contrast, clear color-coding for risk (e.g., green/amber/red), minimal cognitive load, responsive design

### 6.7 Model Evaluation & Benchmarking
- Report standard ML metrics: AUROC, AUPRC, sensitivity/specificity, calibration curves
- **Headline metric:** "Hours of early warning gained" — compare the time at which your model's risk crosses an alert threshold vs. when NEWS2/SOFA crosses their respective alert thresholds, for the same deterioration events
- Present a model leaderboard (baseline models vs. multimodal deep model) so the "best model" is chosen transparently and shown to the user/judges

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Dashboard should update patient views within 1–2 seconds; batch model inference for a patient should complete within a few seconds for demo purposes |
| **Data Privacy** | Treat all patient data as sensitive (PHI). Use de-identified/anonymized data. No real patient identifiers in UI, logs, or chatbot context. If dataset is not pre-anonymized, anonymize before use |
| **Reliability** | Model outputs should include a confidence indicator; system should gracefully handle missing data instead of failing |
| **Scalability** | Prototype scope: should handle at least a few hundred simulated concurrent patients for demo purposes (not necessarily production-scale) |
| **Explainability requirement** | Every risk score shown to a clinician must be accompanied by at least one explanation (SHAP/attention/causal) — no bare number without context |
| **Ethical/Safety Disclaimer** | System must clearly state it is a research prototype / decision-support aid, not a certified medical device, and not for real clinical use without regulatory validation |

---

## 8. Technical Architecture (High-Level)

```
┌───────────────────┐     ┌────────────────────┐
│ Structured Vitals/ │     │  Clinical Notes     │
│ Labs (Time-Series) │     │  (Text)             │
└─────────┬──────────┘     └─────────┬───────────┘
          │                          │
   Time-Series Model           Text Embedding Model
   (LSTM/TCN/Transformer)      (ClinicalBERT-style)
          │                          │
          └───────────┬──────────────┘
                       │
               Fusion Layer (Attention)
                       │
        ┌──────────────┴───────────────┐
        │                               │
 Risk Prediction Head          Causal Layer (SCM / do-calculus)
   (Deterioration Prob.)         (Counterfactual Estimator)
        │                               │
        └──────────────┬────────────────┘
                       │
             Explainability Layer
           (SHAP + Attention + Causal)
                       │
        ┌──────────────┴───────────────┐
        │                               │
   Clinical Dashboard              Chatbot (RAG over
   (React/Plotly/etc.)             explanation outputs)
```

---

## 9. Data Requirements

To move from PRD to implementation, the following will be needed from your dataset:

- **Structured features:** vitals (HR, RR, SpO2, BP/MAP, Temp), labs (lactate, WBC, creatinine, platelets, bilirubin, etc.), timestamps per reading
- **Outcome labels:** deterioration event definition (e.g., sepsis onset, transfer to higher acuity, mortality, need for vasopressors/ventilation) with timestamps, so a 6–12 hour prediction window can be constructed
- **Clinical notes (optional but core to the "multimodal" differentiator):** free-text nursing/physician notes with timestamps
- **Patient identifiers:** should be anonymized/pseudonymized (e.g., patient_id, not name/MRN)
- **Metadata:** admission time, unit type, demographics (age, sex) if available, for stratified evaluation

### On sharing your dataset
You don't need to share the dataset to finalize this PRD — the document above is dataset-agnostic. However, once you're ready to move into the **data exploration / EDA phase**, sharing it (or a sample/schema of it) will let me:
- Confirm which of the features above are actually available
- Design the exact preprocessing and feature engineering steps
- Define the deterioration label precisely
- Decide which causal graph variables are feasible given what's in the data

So: **not required now, but needed before we start building.** Feel free to upload it whenever you're ready.

---

## 10. Success Metrics

| Metric | Target / Purpose |
|---|---|
| Hours of early warning gained vs. NEWS2/SOFA | Primary headline metric — the more hours gained, the stronger the pitch |
| AUROC / AUPRC on deterioration prediction | Standard ML rigor metric |
| Calibration (reliability diagram) | Ensures predicted probabilities are trustworthy, not just rank-ordered |
| Counterfactual plausibility (qualitative review) | Sanity-check that causal "what-if" outputs align with clinical intuition |
| Dashboard usability (informal feedback) | Can a non-technical clinician understand the risk + explanation within seconds? |

---

## 11. Milestones / Suggested Timeline

| Phase | Deliverable |
|---|---|
| 1. Data Exploration & Labeling | EDA, define deterioration label, baseline NEWS2/SOFA computation |
| 2. Baseline Models | Logistic Regression / Random Forest / XGBoost on tabular features |
| 3. Multimodal Deep Model | Time-series model + text embeddings + fusion layer |
| 4. Causal Layer | Define causal graph, implement counterfactual estimation |
| 5. Explainability | SHAP + attention visualizations wired into model outputs |
| 6. Chatbot | RAG-based Q&A grounded in explanation outputs |
| 7. Dashboard | Frontend build: patient list, timeline, what-if slider, chatbot panel |
| 8. Evaluation & Benchmarking | Compute "hours early warning gained" and full metrics leaderboard |
| 9. Polish & Demo Prep | UI polish, storytelling, demo script |

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Dataset lacks clinical notes (text modality) | Fall back to structured-only model; keep architecture modular so text branch can be added later |
| Causal model overclaims certainty | Clearly label counterfactual outputs as "estimated effect based on model assumptions," with confidence ranges |
| Class imbalance (deterioration events are rare) | Use appropriate resampling, class weighting, and AUPRC (not just AUROC) |
| Small dataset size limits deep model performance | Include strong baselines; consider transfer learning for text embeddings |
| Chatbot hallucination risk | Constrain chatbot responses to retrieval over actual model outputs (SHAP/attention/causal results), not open-ended generation |

---

## 13. Disclaimers

This system is a **research/educational prototype**. It is **not** a certified medical device and should **never** be used for real patient care decisions without proper clinical validation, regulatory approval, and oversight by qualified medical professionals.

---

## Appendix: Suggested Tech Stack

- **Modeling:** Python, PyTorch/TensorFlow, XGBoost, HuggingFace Transformers (for clinical text embeddings), SHAP, DoWhy/EconML (causal inference)
- **Backend:** FastAPI or Flask serving model inference + chatbot RAG logic
- **Frontend:** React + a charting library (Plotly/Recharts/D3) for the dashboard
- **Data storage:** CSV/Parquet for prototype scale, or a lightweight DB (PostgreSQL/SQLite) if needed
