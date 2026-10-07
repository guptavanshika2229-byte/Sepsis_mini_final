// Standalone Mock API Layer for Offline/Standalone Development
// Matches exact JSON schemas specified in backend.md Section 4

export const MOCK_PATIENTS = [
  {
    patient_id: "P001",
    current_risk: 0.88,
    risk_level: "high",
    last_updated: "2026-08-28T18:00:00Z",
    age: 67,
    gender: "M",
    primary_condition: "Septic Shock / Deterioration",
    lead_time_hours: 8.5
  },
  {
    patient_id: "P002",
    current_risk: 0.54,
    risk_level: "moderate",
    last_updated: "2026-08-28T18:00:00Z",
    age: 72,
    gender: "F",
    primary_condition: "Post-Op Pulmonary Infection",
    lead_time_hours: 6.0
  },
  {
    patient_id: "P003",
    current_risk: 0.08,
    risk_level: "low",
    last_updated: "2026-08-28T18:00:00Z",
    age: 54,
    gender: "M",
    primary_condition: "Stable ICU Monitoring",
    lead_time_hours: 0.0
  },
  {
    patient_id: "P004",
    current_risk: 0.76,
    risk_level: "high",
    last_updated: "2026-08-28T18:00:00Z",
    age: 81,
    gender: "F",
    primary_condition: "Severe Urosepsis",
    lead_time_hours: 7.2
  },
  {
    patient_id: "P005",
    current_risk: 0.22,
    risk_level: "low",
    last_updated: "2026-08-28T18:00:00Z",
    age: 49,
    gender: "M",
    primary_condition: "Trauma Recovery",
    lead_time_hours: 0.0
  }
];

export const getMockPatients = async () => {
  return [...MOCK_PATIENTS];
};

export const getMockTimeline = async (patientId = "P001") => {
  const isHighRisk = patientId === "P001" || patientId === "P004";
  const isModRisk = patientId === "P002";
  
  const timestamps = [];
  const model_risk = [];
  const news2_score = [];
  const sofa_score = [];
  const hr = [];
  const map = [];
  const lactate = [];
  const spo2 = [];

  for (let t = 1; t <= 24; t++) {
    const timeStr = `Hour ${t}`;
    timestamps.push(timeStr);
    
    if (isHighRisk) {
      // Risk spikes around hour 14; NEWS2 fires later around hour 22
      const riskVal = t < 10 ? 0.15 + t * 0.02 : Math.min(0.95, 0.35 + (t - 10) * 0.05);
      const news2Val = t < 18 ? 2 + Math.floor(t / 6) : Math.min(10, 5 + Math.floor((t - 18) / 1.5));
      const sofaVal = t < 16 ? 1 + Math.floor(t / 8) : Math.min(8, 3 + Math.floor((t - 16) / 2));
      
      model_risk.push(parseFloat(riskVal.toFixed(2)));
      news2_score.push(news2Val);
      sofa_score.push(sofaVal);
      
      hr.push(Math.round(75 + t * 1.8));
      map.push(Math.round(85 - t * 1.2));
      lactate.push(parseFloat((1.0 + (t > 10 ? (t - 10) * 0.28 : 0.05 * t)).toFixed(1)));
      spo2.push(Math.round(98 - (t > 12 ? (t - 12) * 0.6 : 0.2 * t)));
    } else if (isModRisk) {
      const riskVal = Math.min(0.58, 0.12 + t * 0.02);
      model_risk.push(parseFloat(riskVal.toFixed(2)));
      news2_score.push(Math.min(5, Math.floor(t / 4)));
      sofa_score.push(Math.min(3, Math.floor(t / 7)));
      
      hr.push(Math.round(72 + t * 0.6));
      map.push(Math.round(82 - t * 0.4));
      lactate.push(parseFloat((1.1 + t * 0.05).toFixed(1)));
      spo2.push(Math.round(97 - t * 0.2));
    } else {
      model_risk.push(parseFloat((0.05 + (Math.sin(t) * 0.03)).toFixed(2)));
      news2_score.push(1);
      sofa_score.push(0);
      
      hr.push(Math.round(70 + Math.sin(t) * 3));
      map.push(Math.round(88 + Math.cos(t) * 2));
      lactate.push(1.0);
      spo2.push(98);
    }
  }

  return {
    patient_id: patientId,
    timestamps,
    vitals: {
      HR: hr,
      MAP: map,
      lactate: lactate,
      SpO2: spo2
    },
    model_risk,
    news2_score,
    sofa_score,
    predicted_alert_time: isHighRisk ? "Hour 14 (8.5 Hours Ahead of NEWS2)" : "No Alert",
    lead_time_gained_hours: isHighRisk ? 8.5 : isModRisk ? 6.0 : 0
  };
};

export const getMockExplanation = async (patientId = "P001", timestamp = "Hour 18") => {
  if (patientId === "P001" || patientId === "P004") {
    return {
      patient_id: patientId,
      timestamp: timestamp,
      top_features: [
        { feature: "Lactate Elevation", contribution: 0.32, direction: "increases_risk", value: "4.8 mmol/L" },
        { feature: "Mean Arterial Pressure (MAP)", contribution: 0.26, direction: "increases_risk", value: "55 mmHg" },
        { feature: "Heart Rate (HR)", contribution: 0.18, direction: "increases_risk", value: "118 bpm" },
        { feature: "Respiratory Rate", contribution: 0.12, direction: "increases_risk", value: "26 /min" },
        { feature: "Oxygen Saturation (SpO2)", contribution: -0.05, direction: "decreases_risk", value: "94%" }
      ]
    };
  }
  return {
    patient_id: patientId,
    timestamp: timestamp,
    top_features: [
      { feature: "Mean Arterial Pressure (MAP)", contribution: -0.12, direction: "decreases_risk", value: "84 mmHg" },
      { feature: "Lactate", contribution: 0.04, direction: "increases_risk", value: "1.2 mmol/L" },
      { feature: "Heart Rate (HR)", contribution: 0.03, direction: "increases_risk", value: "74 bpm" }
    ]
  };
};

export const postMockCounterfactual = async (patientId, { variable, delta }) => {
  const currentRisk = patientId === "P001" ? 0.88 : 0.54;
  let newRisk = currentRisk;

  if (variable === "MAP" && delta > 0) {
    newRisk = Math.max(0.12, currentRisk - (delta * 0.025));
  } else if (variable === "lactate" && delta < 0) {
    newRisk = Math.max(0.10, currentRisk + (delta * 0.15));
  } else {
    newRisk = Math.max(0.10, currentRisk - 0.15);
  }

  newRisk = parseFloat(newRisk.toFixed(2));
  const riskDelta = parseFloat((newRisk - currentRisk).toFixed(2));

  return {
    original_risk: currentRisk,
    new_risk: newRisk,
    risk_delta: riskDelta,
    caveat: "Estimated effect based on PyTorch Multimodal GRU perturbation model. Not a validated causal assertion."
  };
};

export const postMockChat = async (patientId, question) => {
  const qLower = question.toLowerCase();
  let answer = "";

  if (qLower.includes("why") || qLower.includes("risk") || qLower.includes("increasing")) {
    answer = `Patient ${patientId}'s deterioration risk has risen to High (0.88). The primary clinical drivers are acute hyperlactatemia (4.8 mmol/L, +0.32 risk contribution) and progressive hypotension with MAP dropping to 55 mmHg (+0.26 risk contribution). The multimodal deep learning model flagged this pattern 8.5 hours ahead of conventional NEWS2 scoring.`;
  } else if (qLower.includes("recommend") || qLower.includes("do") || qLower.includes("treat")) {
    answer = `Based on current trajectory data for ${patientId}, counterfactual analysis shows that restoring MAP by +10 mmHg (via IV fluid bolus or early vasopressor initiation) reduces predicted sepsis risk from 0.88 to 0.63. Immediate serum lactate re-check and broad-spectrum antibiotic evaluation are indicated.`;
  } else {
    answer = `Patient ${patientId} is currently monitored under the Sepsis Early Warning System. Vital trends show HR 118 bpm, MAP 55 mmHg, and SpO2 94%. Early model alerts indicate impending deterioration.`;
  }

  return { answer };
};
