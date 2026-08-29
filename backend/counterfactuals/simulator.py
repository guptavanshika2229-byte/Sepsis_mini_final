import os
import json
import numpy as np
import pandas as pd
import joblib

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.data.generate_dataset import compute_news2, compute_sofa
from backend.models.feature_engineering import engineer_features, FEATURE_COLS

CAVEAT_STRING = "Estimated effect based on model re-simulation, not a validated causal claim."

class CounterfactualSimulator:
    """
    Counterfactual ("What-If") Simulation Engine:
    Simulates clinical interventions (e.g. MAP +10 mmHg, Lactate -1.5 mmol/L)
    by perturbing patient feature vectors and evaluating predicted risk delta.
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

    def _predict_risk_tabular(self, feat_dict):
        df_single = pd.DataFrame([feat_dict])
        for col in self.feature_names:
            if col not in df_single.columns:
                df_single[col] = 0.0
        X_raw = df_single[self.feature_names].values.astype(np.float32)
        X_scaled = self.scaler.transform(X_raw)
        prob = self.model.predict_proba(X_scaled)[0, 1]
        return float(prob)

    def _predict_risk_multimodal(self, patient_id):
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
            x_seq_t = torch.tensor(seq_x[[-1]], dtype=torch.float32)
            x_txt_t = torch.tensor(txt_x[[-1]], dtype=torch.float32)
            with torch.no_grad():
                logits = self.model(x_seq_t, x_txt_t)
                prob = torch.sigmoid(logits).item()
            return float(prob)
        else:
            return 0.50

    def get_counterfactual(self, patient_id, variable, delta, timestamp=None):
        """
        Runs a what-if perturbation simulation.
        Matches API Contract:
        {
          "original_risk": 0.55,
          "new_risk": 0.41,
          "risk_delta": -0.14,
          "caveat": "Estimated effect based on model re-simulation, not a validated causal claim."
        }
        """
        patient_rows = self.df[self.df['patient_id'] == patient_id]
        if patient_rows.empty:
            raise ValueError(f"Patient ID '{patient_id}' not found in dataset.")

        if timestamp is not None:
            t_match = patient_rows[patient_rows['timestamp'] == timestamp]
            if not t_match.empty:
                target_idx = t_match.index[-1]
            else:
                target_idx = patient_rows.index[-1]
        else:
            target_idx = patient_rows.index[-1]

        # 1. Compute original risk
        if self.is_multimodal:
            orig_risk = self._predict_risk_multimodal(patient_id)
        else:
            eng_row = self.df_engineered.loc[target_idx]
            orig_risk = self._predict_risk_tabular(eng_row.to_dict())

        # Alias resolution
        var_alias_map = {
            'map': 'MAP',
            'hr': 'HR',
            'sbp': 'SBP',
            'dbp': 'DBP',
            'rr': 'RR',
            'spo2': 'SpO2',
            'temp': 'Temp',
            'lactate': 'Lactate',
            'wbc': 'WBC',
            'creatinine': 'Creatinine',
            'platelets': 'Platelets'
        }
        clean_var = var_alias_map.get(variable.lower(), variable)

        if clean_var not in self.df.columns and clean_var not in FEATURE_COLS:
            raise ValueError(f"Unsupported variable '{variable}' for counterfactual simulation.")

        # 2. Perform perturbation in temporary copy of dataset
        df_perturbed = self.df.copy()
        current_val = df_perturbed.loc[target_idx, clean_var] if clean_var in df_perturbed.columns else 0.0
        new_val = max(0.0, current_val + delta)
        df_perturbed.loc[target_idx, clean_var] = new_val

        # Recalculate derived NEWS2 and SOFA scores for target row
        target_row_dict = df_perturbed.loc[target_idx].to_dict()
        df_perturbed.loc[target_idx, 'news2_score'] = compute_news2(target_row_dict)
        df_perturbed.loc[target_idx, 'sofa_score'] = compute_sofa(target_row_dict)

        # 3. Re-run feature engineering on perturbed patient data
        df_pert_eng, pert_feature_names = engineer_features(df_perturbed)

        # 4. Predict new risk probability
        if self.is_multimodal:
            p_pert_full = df_perturbed[df_perturbed['patient_id'] == patient_id].sort_values('hour')
            seq_len = self.multimodal_meta['seq_len']
            
            from backend.models.sequence_dataset import build_patient_sequences
            seq_x, txt_x, _, _, _, _ = build_patient_sequences(
                p_pert_full,
                sequence_length=seq_len,
                text_embedder=self.multimodal_meta['text_embedder'],
                scaler=self.multimodal_meta['scaler'],
                is_train=False
            )
            if len(seq_x) > 0:
                import torch
                x_seq_t = torch.tensor(seq_x[[-1]], dtype=torch.float32)
                x_txt_t = torch.tensor(txt_x[[-1]], dtype=torch.float32)
                with torch.no_grad():
                    logits = self.model(x_seq_t, x_txt_t)
                    new_risk = float(torch.sigmoid(logits).item())
            else:
                new_risk = orig_risk
        else:
            pert_eng_row = df_pert_eng.loc[target_idx]
            new_risk = self._predict_risk_tabular(pert_eng_row.to_dict())

        # Bound predictions to [0, 1]
        orig_risk = max(0.0, min(1.0, orig_risk))
        new_risk = max(0.0, min(1.0, new_risk))
        risk_delta = round(new_risk - orig_risk, 4)

        return {
            "original_risk": round(orig_risk, 4),
            "new_risk": round(new_risk, 4),
            "risk_delta": risk_delta,
            "caveat": CAVEAT_STRING
        }


if __name__ == '__main__':
    simulator = CounterfactualSimulator()
    sim_result = simulator.get_counterfactual(patient_id="P001", variable="MAP", delta=10)
    print("Sample Counterfactual Simulation Output:")
    print(json.dumps(sim_result, indent=2))
