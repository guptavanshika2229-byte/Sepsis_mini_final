import os
import json
import pytest
from fastapi.testclient import TestClient

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.api.main import app

client = TestClient(app)

def test_hero_patients_exist():
    response = client.get("/patients")
    assert response.status_code == 200
    patients = response.json()
    
    patient_ids = [p["patient_id"] for p in patients]
    assert "P001" in patient_ids, "Hero Patient P001 missing from /patients"
    assert "P002" in patient_ids, "Hero Patient P002 missing from /patients"
    assert "P003" in patient_ids, "Hero Patient P003 missing from /patients"


def test_hero_p001_high_risk_and_early_alert():
    response = client.get("/patients/P001/timeline")
    assert response.status_code == 200
    data = response.json()

    assert data["patient_id"] == "P001"
    assert data["predicted_alert_time"] is not None

    model_risks = data["model_risk"]
    news2_scores = data["news2_score"]

    # Hero P001 should reach high risk (>= 0.70)
    assert max(model_risks) >= 0.70

    # Early alert check: find first hour where model_risk >= 0.65
    model_alert_idx = next(i for i, r in enumerate(model_risks) if r >= 0.65)
    
    # Baseline NEWS2 alert threshold (score >= 5)
    news2_alert_idx = next((i for i, s in enumerate(news2_scores) if s >= 5), len(news2_scores) - 1)

    # Verify model flags alert hours earlier than baseline NEWS2
    assert model_alert_idx < news2_alert_idx, f"Model alert ({model_alert_idx}h) did not precede NEWS2 alert ({news2_alert_idx}h)"
    hours_gained = news2_alert_idx - model_alert_idx
    assert hours_gained >= 4, f"Early warning lead time ({hours_gained}h) less than target threshold"


def test_hero_p002_counterfactual_response():
    payload = {"variable": "MAP", "delta": 10.0}
    response = client.post("/patients/P002/counterfactual", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "original_risk" in data
    assert "new_risk" in data
    assert data["risk_delta"] <= 0.0, "MAP elevation did not reduce risk for hero patient P002"


def test_hero_p003_stable_course():
    response = client.get("/patients/P003/timeline")
    assert response.status_code == 200
    data = response.json()

    model_risks = data["model_risk"]
    assert max(model_risks) < 0.25, f"Stable hero patient P003 exceeded low risk threshold: max {max(model_risks)}"


def test_risk_level_query_filtering():
    resp_high = client.get("/patients?risk_level=high")
    assert resp_high.status_code == 200
    high_patients = resp_high.json()
    assert all(p["risk_level"] == "high" for p in high_patients)

    resp_low = client.get("/patients?risk_level=low")
    assert resp_low.status_code == 200
    low_patients = resp_low.json()
    assert all(p["risk_level"] == "low" for p in low_patients)


def test_edge_case_null_safety():
    # Test timeline for P001, P002, P003 ensuring no NaNs or null values in lists
    for pid in ["P001", "P002", "P003"]:
        res = client.get(f"/patients/{pid}/timeline")
        assert res.status_code == 200
        tdata = res.json()
        
        for k, vlist in tdata["vitals"].items():
            assert not any(v is None for v in vlist), f"Found null in vitals '{k}' for patient {pid}"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
