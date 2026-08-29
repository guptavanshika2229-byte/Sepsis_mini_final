import os
import json
import numpy as np
import pandas as pd
import pytest
import joblib

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.data.generate_dataset import generate_synthetic_icu_dataset, compute_news2, compute_sofa
from backend.models.feature_engineering import engineer_features, prepare_data_splits
from backend.models.train_baselines import train_and_evaluate_baselines


def test_dataset_generation_and_scores():
    df = generate_synthetic_icu_dataset(num_patients=10, hours_per_patient=24, random_state=123)
    
    assert len(df) == 240
    assert df['patient_id'].nunique() == 10
    
    required_cols = [
        'patient_id', 'timestamp', 'hour', 'HR', 'SBP', 'MAP', 'RR', 'SpO2',
        'Temp', 'Lactate', 'Creatinine', 'Platelets', 'news2_score', 'sofa_score',
        'target_deterioration_6_12h'
    ]
    for col in required_cols:
        assert col in df.columns, f"Missing required column: {col}"

    # Verify NEWS2 score range
    assert df['news2_score'].min() >= 0
    assert df['news2_score'].max() <= 20

    # Verify SOFA score range
    assert df['sofa_score'].min() >= 0
    assert df['sofa_score'].max() <= 24

    # Verify individual score calculations
    normal_row = {'RR': 16, 'SpO2': 98, 'SBP': 120, 'HR': 75, 'Temp': 37.0}
    assert compute_news2(normal_row) == 0

    sick_row = {'RR': 26, 'SpO2': 90, 'SBP': 85, 'HR': 135, 'Temp': 39.5}
    assert compute_news2(sick_row) >= 10


def test_feature_engineering_pipeline():
    df = generate_synthetic_icu_dataset(num_patients=15, hours_per_patient=24, random_state=456)
    splits = prepare_data_splits(df, test_size=0.2, val_size=0.2, random_state=456)

    X_train = splits['X_train']
    X_val = splits['X_val']
    X_test = splits['X_test']

    # Check shapes
    assert X_train.shape[0] > 0
    assert X_val.shape[0] > 0
    assert X_test.shape[0] > 0

    # Ensure no NaN values in engineered features
    assert not np.isnan(X_train).any(), "NaN values found in X_train"
    assert not np.isnan(X_val).any(), "NaN values found in X_val"
    assert not np.isnan(X_test).any(), "NaN values found in X_test"

    # Ensure no patient data leakage between splits
    train_pts = set(splits['train_df']['patient_id'].unique())
    val_pts = set(splits['val_df']['patient_id'].unique())
    test_pts = set(splits['test_df']['patient_id'].unique())

    assert train_pts.isdisjoint(val_pts), "Data leakage between train and val sets"
    assert train_pts.isdisjoint(test_pts), "Data leakage between train and test sets"
    assert val_pts.isdisjoint(test_pts), "Data leakage between val and test sets"


def test_baseline_training_and_serialization():
    # Train baseline models
    artifact = train_and_evaluate_baselines()

    assert artifact is not None
    assert 'model' in artifact
    assert 'scaler' in artifact
    assert 'feature_names' in artifact

    saved_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../models/saved'))
    model_path = os.path.join(saved_dir, 'fallback_baseline_model.joblib')
    metrics_path = os.path.join(saved_dir, 'baseline_metrics.json')

    assert os.path.exists(model_path), "Saved model artifact file missing"
    assert os.path.exists(metrics_path), "Metrics JSON file missing"

    # Verify JSON structure
    with open(metrics_path, 'r') as f:
        metrics_data = json.load(f)

    assert 'selected_model' in metrics_data
    assert 'metrics' in metrics_data
    assert 'Logistic Regression' in metrics_data['metrics']
    assert 'Random Forest' in metrics_data['metrics']
    assert 'XGBoost' in metrics_data['metrics']

    # Check performance requirements
    selected = metrics_data['selected_model']
    selected_metrics = metrics_data['metrics'][selected]
    assert selected_metrics['AUROC'] >= 0.70, f"Selected model AUROC ({selected_metrics['AUROC']}) is below threshold 0.70"
    assert selected_metrics['AUPRC'] > 0.10, f"Selected model AUPRC ({selected_metrics['AUPRC']}) is below threshold 0.10"


def test_serialized_model_inference():
    saved_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../models/saved'))
    model_path = os.path.join(saved_dir, 'fallback_baseline_model.joblib')

    assert os.path.exists(model_path), "Saved model file does not exist for inference test"
    
    loaded_artifact = joblib.load(model_path)
    model = loaded_artifact['model']
    scaler = loaded_artifact['scaler']
    feature_names = loaded_artifact['feature_names']

    # Create dummy raw input vector with matching length
    raw_sample = np.random.randn(1, len(feature_names))
    scaled_sample = scaler.transform(raw_sample)

    risk_prob = model.predict_proba(scaled_sample)[0, 1]

    assert isinstance(float(risk_prob), float)
    assert 0.0 <= risk_prob <= 1.0, f"Risk probability {risk_prob} outside range [0, 1]"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
