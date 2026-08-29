import os
import json
import pytest

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.explainability.explainer import PatientExplainer

def test_patient_explainer_initialization():
    explainer = PatientExplainer()
    assert explainer.df is not None, "Failed to load patient dataset in PatientExplainer"
    assert explainer.model is not None, "Failed to load model in PatientExplainer"


def test_get_explanation_contract_schema():
    explainer = PatientExplainer()
    explanation = explainer.get_explanation(patient_id="P001", top_n=5)

    assert "patient_id" in explanation
    assert "timestamp" in explanation
    assert "top_features" in explanation

    assert explanation["patient_id"] == "P001"
    assert isinstance(explanation["top_features"], list)
    assert len(explanation["top_features"]) == 5

    for item in explanation["top_features"]:
        assert "feature" in item
        assert "contribution" in item
        assert "direction" in item
        
        assert isinstance(item["feature"], str)
        assert isinstance(item["contribution"], (float, int))
        assert item["contribution"] >= 0.0
        assert item["direction"] in ["increases_risk", "decreases_risk"]


def test_explanation_sorting():
    explainer = PatientExplainer()
    explanation = explainer.get_explanation(patient_id="P002", top_n=5)
    
    top_features = explanation["top_features"]
    contributions = [item["contribution"] for item in top_features]

    # Verify descending sort order by contribution magnitude
    assert contributions == sorted(contributions, reverse=True)


def test_clinical_sanity_checks():
    explainer = PatientExplainer()
    explanation = explainer.get_explanation(patient_id="P001", top_n=5)
    
    feature_names = [item["feature"] for item in explanation["top_features"]]
    
    # Check that readable feature names are populated properly
    known_readable_terms = [
        "Heart Rate", "Systolic BP", "Diastolic BP", "Diastolic Blood Pressure", "Mean Arterial Pressure",
        "Respiration Rate", "Oxygen Saturation (SpO2)", "Temperature",
        "Serum Lactate", "White Blood Cell Count", "Serum Creatinine",
        "Platelet Count", "NEWS2 Score", "SOFA Score", "Patient Age"
    ]
    
    for fname in feature_names:
        assert any(term in fname for term in known_readable_terms), f"Unrecognized feature name formatting: {fname}"


def test_invalid_patient_error_handling():
    explainer = PatientExplainer()
    with pytest.raises(ValueError):
        explainer.get_explanation(patient_id="P999999", top_n=5)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
