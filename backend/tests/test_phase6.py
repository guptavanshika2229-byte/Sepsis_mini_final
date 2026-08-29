import os
import json
import pytest
from fastapi.testclient import TestClient

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.api.main import app
from backend.chatbot.assistant import ClinicalChatbotAssistant, CHATBOT_DISCLAIMER

client = TestClient(app)

def test_chatbot_assistant_standalone():
    assistant = ClinicalChatbotAssistant()
    res = assistant.generate_answer(patient_id="P001", question="Why is this patient's risk increasing?")
    
    assert "answer" in res
    assert isinstance(res["answer"], str)
    assert len(res["answer"]) > 20
    assert CHATBOT_DISCLAIMER.strip() in res["answer"]


def test_post_chat_api_contract_schema():
    payload = {
        "patient_id": "P001",
        "question": "Why is this patient's risk increasing?"
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "answer" in data
    assert isinstance(data["answer"], str)
    assert len(data["answer"]) > 10


def test_chat_grounded_vitals_inclusion():
    payload = {
        "patient_id": "P001",
        "question": "What changed in the last 2 hours?"
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    answer = response.json()["answer"]

    # Verify answer references grounded patient metrics
    assert "P001" in answer
    assert any(term in answer for term in ["Heart Rate", "MAP", "SpO2", "vitals", "trajectory"])


def test_chat_simulation_guidance():
    payload = {
        "patient_id": "P001",
        "question": "What intervention would help most right now?"
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    answer = response.json()["answer"]

    assert "MAP" in answer or "simulation" in answer
    assert "risk" in answer


def test_chat_invalid_patient_error_handling():
    payload = {
        "patient_id": "NON_EXISTENT_PATIENT_999",
        "question": "Why?"
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 404


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
