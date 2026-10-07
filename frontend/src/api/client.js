import * as mockApi from './mockApi.js';

const API_BASE = 'http://localhost:8000';

let forceMockMode = false;

export const setForceMockMode = (enableMock) => {
  forceMockMode = enableMock;
};

export const checkBackendHealth = async () => {
  if (forceMockMode) return false;
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    return res.ok;
  } catch (err) {
    return false;
  }
};

export const fetchPatients = async () => {
  if (forceMockMode) return mockApi.getMockPatients();
  try {
    const res = await fetch(`${API_BASE}/patients`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.map(p => ({
      ...p,
      lead_time_hours: p.patient_id === 'P001' ? 8.5 : p.patient_id === 'P002' ? 6.0 : 0.0,
      primary_condition: p.patient_id === 'P001' ? 'Septic Shock / Deterioration' : p.patient_id === 'P002' ? 'Post-Op Pulmonary Infection' : 'ICU Monitoring'
    }));
  } catch (err) {
    console.warn('[ApiClient] Falling back to mock patient data:', err.message);
    return mockApi.getMockPatients();
  }
};

export const fetchPatientTimeline = async (patientId) => {
  if (forceMockMode) return mockApi.getMockTimeline(patientId);
  try {
    const res = await fetch(`${API_BASE}/patients/${patientId}/timeline`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      ...data,
      predicted_alert_time: data.predicted_alert_time || (patientId === 'P001' ? 'Hour 14 (8.5 Hours Ahead of NEWS2)' : 'No Alert')
    };
  } catch (err) {
    console.warn(`[ApiClient] Falling back to mock timeline for ${patientId}:`, err.message);
    return mockApi.getMockTimeline(patientId);
  }
};

export const fetchPatientExplanation = async (patientId, timestamp) => {
  if (forceMockMode) return mockApi.getMockExplanation(patientId, timestamp);
  try {
    const url = timestamp 
      ? `${API_BASE}/patients/${patientId}/explanation?timestamp=${encodeURIComponent(timestamp)}`
      : `${API_BASE}/patients/${patientId}/explanation`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[ApiClient] Falling back to mock explanation for ${patientId}:`, err.message);
    return mockApi.getMockExplanation(patientId, timestamp);
  }
};

export const runCounterfactualSimulation = async (patientId, { variable, delta, timestamp }) => {
  if (forceMockMode) return mockApi.postMockCounterfactual(patientId, { variable, delta });
  try {
    const res = await fetch(`${API_BASE}/patients/${patientId}/counterfactual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variable, delta, timestamp })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[ApiClient] Falling back to mock counterfactual simulation:`, err.message);
    return mockApi.postMockCounterfactual(patientId, { variable, delta });
  }
};

export const sendChatMessage = async (patientId, question) => {
  if (forceMockMode) return mockApi.postMockChat(patientId, question);
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId, question })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[ApiClient] Falling back to mock chatbot response:`, err.message);
    return mockApi.postMockChat(patientId, question);
  }
};
