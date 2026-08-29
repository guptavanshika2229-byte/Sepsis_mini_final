import os
import json
import pytest

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.models.evaluate_phase8_metrics import compute_all_metrics
import backend_demo_summary

SAVED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models', 'saved'))
METRICS_JSON_PATH = os.path.join(SAVED_DIR, 'metrics_summary.json')

def test_evaluate_phase8_metrics_execution():
    summary = compute_all_metrics()

    assert os.path.exists(METRICS_JSON_PATH), "metrics_summary.json file was not created"
    assert "headline_metric" in summary
    assert "model_leaderboard" in summary
    assert "hero_demo_patients" in summary

    hm = summary["headline_metric"]
    assert "early_warning_hours_gained" in hm
    assert hm["early_warning_hours_gained"] >= 6.0, f"Early warning lead time ({hm['early_warning_hours_gained']}h) below 6.0h target"


def test_model_leaderboard_rankings():
    if not os.path.exists(METRICS_JSON_PATH):
        compute_all_metrics()

    with open(METRICS_JSON_PATH, 'r') as f:
        summary = json.load(f)

    leaderboard = summary["model_leaderboard"]
    assert len(leaderboard) == 4

    top_model = leaderboard[0]
    assert top_model["rank"] == 1
    assert "Multimodal" in top_model["model_name"]
    assert top_model["auroc"] >= 0.90


def test_hero_patients_metadata_in_summary():
    if not os.path.exists(METRICS_JSON_PATH):
        compute_all_metrics()

    with open(METRICS_JSON_PATH, 'r') as f:
        summary = json.load(f)

    heroes = summary["hero_demo_patients"]
    hero_ids = [h["patient_id"] for h in heroes]
    assert "P001" in hero_ids
    assert "P002" in hero_ids
    assert "P003" in hero_ids


def test_demo_summary_cli_tool(capsys):
    backend_demo_summary.display_summary()
    captured = capsys.readouterr()

    assert "SEPSIS & PATIENT DETERIORATION EARLY WARNING SYSTEM" in captured.out
    assert "EARLY WARNING GAINED" in captured.out
    assert "P001" in captured.out


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
