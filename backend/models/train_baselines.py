import os
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
import xgboost as xgb

from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.data.generate_dataset import generate_synthetic_icu_dataset
from backend.models.feature_engineering import prepare_data_splits


def train_and_evaluate_baselines(csv_path=None):
    """
    Trains Logistic Regression, Random Forest, and XGBoost baselines.
    Evaluates AUROC, AUPRC, and Brier Score.
    Selects, serializes, and saves the best performing fallback model.
    """
    if csv_path is None or not os.path.exists(csv_path):
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data'))
        os.makedirs(data_dir, exist_ok=True)
        csv_path = os.path.join(data_dir, 'icu_patients.csv')
        if not os.path.exists(csv_path):
            print("Generating dataset for model training...")
            df_raw = generate_synthetic_icu_dataset(num_patients=120, hours_per_patient=48)
            df_raw.to_csv(csv_path, index=False)
        else:
            df_raw = pd.read_csv(csv_path)
    else:
        df_raw = pd.read_csv(csv_path)

    print("Extracting features and creating patient-level splits...")
    splits = prepare_data_splits(df_raw)
    
    X_train, y_train = splits['X_train'], splits['y_train']
    X_val, y_val = splits['X_val'], splits['y_val']
    X_test, y_test = splits['X_test'], splits['y_test']
    feature_names = splits['feature_names']
    scaler = splits['scaler']

    pos_weight = (len(y_train) - np.sum(y_train)) / max(1, np.sum(y_train))

    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=8, class_weight='balanced', random_state=42),
        'XGBoost': xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.05, scale_pos_weight=pos_weight, eval_metric='logloss', random_state=42)
    }

    results = {}
    fitted_models = {}

    for model_name, model in models.items():
        print(f"\n--- Training {model_name} ---")
        model.fit(X_train, y_train)
        
        y_test_proba = model.predict_proba(X_test)[:, 1]

        auroc = float(roc_auc_score(y_test, y_test_proba))
        auprc = float(average_precision_score(y_test, y_test_proba))
        brier = float(brier_score_loss(y_test, y_test_proba))

        print(f"{model_name} Test Performance -> AUROC: {auroc:.4f} | AUPRC: {auprc:.4f} | Brier Score: {brier:.4f}")

        results[model_name] = {
            'AUROC': auroc,
            'AUPRC': auprc,
            'Brier_Score': brier
        }
        fitted_models[model_name] = model

    # Select best model based on composite metric (AUPRC + AUROC)
    best_model_name = max(results.keys(), key=lambda m: results[m]['AUPRC'] + results[m]['AUROC'])
    best_model = fitted_models[best_model_name]
    best_metrics = results[best_model_name]

    print(f"\n==========================================")
    print(f"Selected Fallback Model: {best_model_name}")
    print(f"Metrics: AUROC={best_metrics['AUROC']:.4f}, AUPRC={best_metrics['AUPRC']:.4f}, Brier={best_metrics['Brier_Score']:.4f}")
    print(f"==========================================\n")

    # Serialize artifacts
    saved_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'saved'))
    os.makedirs(saved_dir, exist_ok=True)

    model_artifact_path = os.path.join(saved_dir, 'fallback_baseline_model.joblib')
    metrics_json_path = os.path.join(saved_dir, 'baseline_metrics.json')

    artifact = {
        'model_name': best_model_name,
        'model': best_model,
        'scaler': scaler,
        'feature_names': feature_names,
        'metrics': best_metrics,
        'all_model_results': results
    }

    joblib.dump(artifact, model_artifact_path)
    print(f"Serialized fallback model saved to: {model_artifact_path}")

    metrics_payload = {
        'selected_model': best_model_name,
        'metrics': results
    }
    with open(metrics_json_path, 'w') as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"Baseline metrics exported to: {metrics_json_path}")

    return artifact


if __name__ == '__main__':
    train_and_evaluate_baselines()
