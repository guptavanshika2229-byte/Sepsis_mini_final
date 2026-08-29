import os
import json
import pytest

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.counterfactuals.simulator import CounterfactualSimulator, CAVEAT_STRING

def test_counterfactual_simulator_initialization():
    simulator = CounterfactualSimulator()
    assert simulator.df is not None, "Failed to load patient dataset in CounterfactualSimulator"
    assert simulator.model is not None, "Failed to load model in CounterfactualSimulator"


def test_counterfactual_api_contract_schema():
    simulator = CounterfactualSimulator()
    result = simulator.get_counterfactual(patient_id="P001", variable="MAP", delta=10)

    required_keys = ["original_risk", "new_risk", "risk_delta", "caveat"]
    for key in required_keys:
        assert key in result, f"Missing required key '{key}' in counterfactual output"

    assert 0.0 <= result["original_risk"] <= 1.0
    assert 0.0 <= result["new_risk"] <= 1.0
    
    expected_delta = round(result["new_risk"] - result["original_risk"], 4)
    assert result["risk_delta"] == pytest.approx(expected_delta, abs=1e-3)
    
    assert result["caveat"] == CAVEAT_STRING


def test_clinical_plausibility_map_elevation():
    simulator = CounterfactualSimulator()
    # MAP elevation should not increase deterioration risk for hypotensive/deteriorating patients
    result = simulator.get_counterfactual(patient_id="P001", variable="MAP", delta=15)
    
    assert result["risk_delta"] <= 0.05, f"Unexpected risk jump after MAP restoration: {result['risk_delta']}"


def test_multiple_variable_perturbations():
    simulator = CounterfactualSimulator()
    
    vars_to_test = [
        ("HR", -10),
        ("Lactate", -1.0),
        ("SpO2", 3),
        ("RR", -4)
    ]
    
    for var, delta in vars_to_test:
        res = simulator.get_counterfactual(patient_id="P002", variable=var, delta=delta)
        assert "original_risk" in res
        assert "new_risk" in res
        assert "risk_delta" in res
        assert res["caveat"] == CAVEAT_STRING


def test_invalid_variable_and_patient_errors():
    simulator = CounterfactualSimulator()
    
    with pytest.raises(ValueError):
        simulator.get_counterfactual(patient_id="P99999", variable="MAP", delta=10)
        
    with pytest.raises(ValueError):
        simulator.get_counterfactual(patient_id="P001", variable="NonExistentVariable", delta=10)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
