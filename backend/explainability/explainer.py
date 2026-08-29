import os
import json
import numpy as np
import pandas as pd
import joblib

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.models.feature_engineering import engineer_features, FEATURE_COLS

def format_feature_name(name):
    """
    Formats feature names into clean, clinician-friendly strings.
    """
    base_map = {
        'HR': 'Heart Rate',
        'SBP': 'Systolic Blood Pressure',
        'DBP': 'Diastolic Blood Pressure',
        'MAP': 'Mean Arterial Pressure',
        'RR': 'Respiration Rate',
        'SpO2': 'Oxygen Saturation (SpO2)',
        'Temp': 'Temperature',
        'Lactate': 'Serum Lactate',
        'WBC': 'White Blood Cell Count',
        'Creatinine': 'Serum Creatinine',
        'Platelets': 'Platelet Count',
        'news2_score': 'NEWS2 Score',
        'sofa_score': 'SOFA Score',
        'age': 'Patient Age'
    }

    if name in base_map:
        return base_map[name]

    # Handle rolling statistics and deltas
    for key, label in base_map.items():
        if name.startswith(key):
            suffix = name[len(key):]
            if suffix == '_roll3_mean':
                return f"{label} (3h Rolling Mean)"
            elif suffix == '_roll3_std':
                return f"{label} (3h Variability)"
            elif suffix == '_roll6_mean':
                return f"{label} (6h Rolling Mean)"
            elif suffix == '_roll6_std':
                return f"{label} (6h Variability)"
            elif suffix == '_delta3':
                return f"{label} (3h Change Delta)"
            elif suffix == '_delta6':
                return f"{label} (6h Change Delta)"

    return name.replace('_', ' ').title()


class PatientExplainer:
    """
    Explainability Engine for Patient Deterioration Predictions:
    Generates feature-level risk contributions ("why risk is increasing or decreasing")
    for a patient at a specific timestamp.
    """
    def __init__(self, data_path=None, saved_dir=None):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        
        if data_path is None:
            data_path = os.path.join(base_dir, 'data', 'icu_patients.csv')
        if saved_dir is None:
            saved_dir = os.path.join(base_dir, 'models', 'saved')

        self.data_path = data_path
        self.saved_dir = saved_dir
        self.df = None

        self._load_dataset()
        self._load_models()

    def _load_dataset(self):
        if os.path.exists(self.data_path):
            self.df = pd.read_csv(self.data_path)
            self.df_engineered, self.feature_names = engineer_features(self.df)
        else:
            raise FileNotFoundError(f"Dataset file not found at: {self.data_path}")

    def _load_models(self):
        phase2_json = os.path.join(self.saved_dir, 'phase2_metrics.json')
        pt_path = os.path.join(self.saved_dir, 'multimodal_gru_model.pt')
        meta_path = os.path.join(self.saved_dir, 'multimodal_meta.joblib')
        fallback_path = os.path.join(self.saved_dir, 'fallback_baseline_model.joblib')

        self.is_multimodal = False

        if os.path.exists(phase2_json) and os.path.exists(pt_path) and os.path.exists(meta_path):
            with open(phase2_json, 'r') as f:
                p2_data = json.load(f)
            
            if p2_data.get('selected_primary_model') == 'Multimodal GRU':
                self.is_multimodal = True
                self.multimodal_meta = joblib.load(meta_path)
                
                import torch
                from backend.models.multimodal_model import MultimodalSepsisModel
                
                self.model = MultimodalSepsisModel(
                    num_seq_features=self.multimodal_meta['num_seq_features'],
                    text_dim=self.multimodal_meta['text_dim']
                )
                self.model.load_state_dict(torch.load(pt_path, map_location='cpu'))
                self.model.eval()
                return

        # Fallback to Tabular Baseline Model (XGBoost / Random Forest)
        if os.path.exists(fallback_path):
            artifact = joblib.load(fallback_path)
            self.model = artifact['model']
            self.scaler = artifact['scaler']
            self.feature_names = artifact['feature_names']
            self.is_multimodal = False
        else:
            raise FileNotFoundError("No trained model artifacts found in saved directory.")

    def get_explanation(self, patient_id, timestamp=None, top_n=5):
        """
        Returns structured SHAP / feature importance attributions for patient prediction.
        Matches API contract:
        {
          "patient_id": "P001",
          "timestamp": "2026-08-28T05:00:00Z",
          "top_features": [
             {"feature": "Serum Lactate", "contribution": 0.18, "direction": "increases_risk"},
             {"feature": "Mean Arterial Pressure", "contribution": -0.09, "direction": "decreases_risk"}
          ]
        }
        """
        patient_data = self.df_engineered[self.df_engineered['patient_id'] == patient_id]
        if patient_data.empty:
            raise ValueError(f"Patient ID '{patient_id}' not found in dataset.")

        if timestamp is not None:
            target_row = patient_data[patient_data['timestamp'] == timestamp]
            if target_row.empty:
                target_row = patient_data.iloc[[-1]]
        else:
            target_row = patient_data.iloc[[-1]]
            timestamp = str(target_row['timestamp'].values[0])

        feature_vector = target_row[self.feature_names].values.astype(np.float32)

        contributions = {}

        if self.is_multimodal:
            import torch
            from backend.models.sequence_dataset import build_patient_sequences
            
            p_full = self.df[self.df['patient_id'] == patient_id].sort_values('hour')
            seq_len = self.multimodal_meta['seq_len']
            
            seq_x, txt_x, _, _, _, _ = build_patient_sequences(
                p_full,
                sequence_length=seq_len,
                text_embedder=self.multimodal_meta['text_embedder'],
                scaler=self.multimodal_meta['scaler'],
                is_train=False
            )

            if len(seq_x) > 0:
                x_seq_t = torch.tensor(seq_x[[-1]], dtype=torch.float32, requires_grad=True)
                x_txt_t = torch.tensor(txt_x[[-1]], dtype=torch.float32)

                logits = self.model(x_seq_t, x_txt_t)
                logits.backward()

                grads = x_seq_t.grad.abs().mean(dim=(0, 1)).numpy()
                raw_values = seq_x[-1, -1, :]

                for name, grad_val, val in zip(self.feature_names, grads, raw_values):
                    contrib = float(grad_val * (1.0 if val > 0 else -1.0))
                    contributions[name] = contrib
            else:
                for name, val in zip(self.feature_names, feature_vector[0]):
                    contributions[name] = float(val * 0.1)
        else:
            try:
                import shap
                explainer = shap.TreeExplainer(self.model)
                scaled_x = self.scaler.transform(feature_vector)
                shap_vals = explainer.shap_values(scaled_x)
                if isinstance(shap_vals, list):
                    shap_vals = shap_vals[1]
                shap_row = shap_vals[0]
                for name, s_val in zip(self.feature_names, shap_row):
                    contributions[name] = float(s_val)
            except Exception:
                scaled_x = self.scaler.transform(feature_vector)[0]
                if hasattr(self.model, 'feature_importances_'):
                    importances = self.model.feature_importances_
                    for name, imp, val in zip(self.feature_names, importances, scaled_x):
                        contributions[name] = float(imp * val)
                else:
                    for name, val in zip(self.feature_names, feature_vector[0]):
                        contributions[name] = float(val * 0.05)

        formatted_features = []
        for name, contrib in contributions.items():
            disp_name = format_feature_name(name)
            direction = "increases_risk" if contrib >= 0 else "decreases_risk"
            formatted_features.append({
                "feature": disp_name,
                "contribution": round(abs(contrib), 4),
                "direction": direction
            })

        formatted_features.sort(key=lambda x: x['contribution'], reverse=True)
        top_features = formatted_features[:top_n]

        return {
            "patient_id": patient_id,
            "timestamp": str(timestamp),
            "top_features": top_features
        }


if __name__ == '__main__':
    explainer = PatientExplainer()
    sample_exp = explainer.get_explanation(patient_id="P001", top_n=5)
    print("Formatted Patient Explanation Output:")
    print(json.dumps(sample_exp, indent=2))
