import os
import json
import pytest
from fastapi.testclient import TestClient

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.api.main import app, CAVEAT_STRING

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_get_patients_contract():
    response = client.get("/patients")
    assert response.status_code == 200
    data = response.json()
    
    assert isinstance(data, list)
    assert len(data) > 0

    first_item = data[0]
    required_keys = ["patient_id", "current_risk", "risk_level", "last_updated"]
    for key in required_keys:
        assert key in first_item, f"Missing key '{key}' in GET /patients item"

    assert 0.0 <= first_item["current_risk"] <= 1.0
    assert first_item["risk_level"] in ["high", "moderate", "low"]


def test_get_patient_timeline_contract():
    response = client.get("/patients/P001/timeline")
    assert response.status_code == 200
    data = response.json()

    required_keys = ["patient_id", "timestamps", "vitals", "model_risk", "news2_score", "sofa_score"]
    for key in required_keys:
        assert key in data, f"Missing key '{key}' in GET /patients/P001/timeline"

    assert data["patient_id"] == "P001"
    n_steps = len(data["timestamps"])
    assert n_steps > 0

    assert len(data["model_risk"]) == n_steps
    assert len(data["news2_score"]) == n_steps
    assert len(data["sofa_score"]) == n_steps

    vitals = data["vitals"]
    assert "HR" in vitals
    assert "MAP" in vitals
    assert "lactate" in vitals
    assert len(vitals["HR"]) == n_steps


def test_get_patient_explanation_contract():
    response = client.get("/patients/P001/explanation")
    assert response.status_code == 200
    data = response.json()

    assert data["patient_id"] == "P001"
    assert "timestamp" in data
    assert "top_features" in data
    assert isinstance(data["top_features"], list)
    assert len(data["top_features"]) > 0

    for feat in data["top_features"]:
        assert "feature" in feat
        assert "contribution" in feat
        assert "direction" in feat
        assert feat["direction"] in ["increases_risk", "decreases_risk"]


def test_post_patient_counterfactual_contract():
    payload = {
        "variable": "MAP",
        "delta": 10.0
    }
    response = client.post("/patients/P001/counterfactual", json=payload)
    assert response.status_code == 200
    data = response.json()

    required_keys = ["original_risk", "new_risk", "risk_delta", "caveat"]
    for key in required_keys:
        assert key in data, f"Missing key '{key}' in POST /patients/P001/counterfactual"

    assert 0.0 <= data["original_risk"] <= 1.0
    assert 0.0 <= data["new_risk"] <= 1.0
    assert data["caveat"] == CAVEAT_STRING


def test_error_handling():
    # Test 404 for non-existent patient
    resp_404 = client.get("/patients/NON_EXISTENT_PATIENT_999/timeline")
    assert resp_404.status_code == 404

    # Test 400 for invalid variable counterfactual
    bad_payload = {"variable": "INVALID_VITALS_VARIABLE_XYZ", "delta": 5.0}
    resp_400 = client.post("/patients/P001/counterfactual", json=bad_payload)
    assert resp_400.status_code == 400


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
