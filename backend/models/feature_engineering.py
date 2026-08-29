import os
import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler

FEATURE_COLS = [
    'HR', 'SBP', 'DBP', 'MAP', 'RR', 'SpO2', 'Temp',
    'Lactate', 'WBC', 'Creatinine', 'Platelets',
    'age', 'news2_score', 'sofa_score'
]

def engineer_features(df):
    """
    Applies LOCF (Last Observed Carried Forward) imputation,
    computes rolling statistics (mean, std, min, max over 3h & 6h windows),
    and rate of change (deltas).
    """
    df_engineered = df.copy()
    
    # Ensure dataframe is sorted by patient and hour
    df_engineered = df_engineered.sort_values(['patient_id', 'hour']).reset_index(drop=True)
    
    # 1. Forward-fill missing values per patient (LOCF)
    for col in FEATURE_COLS:
        if col in df_engineered.columns:
            df_engineered[col] = df_engineered.groupby('patient_id')[col].ffill()
            # If initial values are missing, backward fill per patient then fill overall median
            df_engineered[col] = df_engineered.groupby('patient_id')[col].bfill()
            if df_engineered[col].isna().any():
                df_engineered[col] = df_engineered[col].fillna(df_engineered[col].median())

    # 2. Compute rolling statistics and deltas per patient
    engineered_cols = list(FEATURE_COLS)
    
    for col in ['HR', 'MAP', 'RR', 'SpO2', 'Lactate', 'WBC', 'news2_score', 'sofa_score']:
        # 3-hour rolling mean, std, min, max
        r3_mean = df_engineered.groupby('patient_id')[col].transform(lambda x: x.rolling(window=3, min_periods=1).mean())
        r3_std = df_engineered.groupby('patient_id')[col].transform(lambda x: x.rolling(window=3, min_periods=1).std()).fillna(0.0)
        
        # 6-hour rolling mean & std
        r6_mean = df_engineered.groupby('patient_id')[col].transform(lambda x: x.rolling(window=6, min_periods=1).mean())
        r6_std = df_engineered.groupby('patient_id')[col].transform(lambda x: x.rolling(window=6, min_periods=1).std()).fillna(0.0)

        # 3h and 6h deltas
        d3 = df_engineered.groupby('patient_id')[col].transform(lambda x: x.diff(periods=3)).fillna(0.0)
        d6 = df_engineered.groupby('patient_id')[col].transform(lambda x: x.diff(periods=6)).fillna(0.0)

        df_engineered[f'{col}_roll3_mean'] = r3_mean
        df_engineered[f'{col}_roll3_std'] = r3_std
        df_engineered[f'{col}_roll6_mean'] = r6_mean
        df_engineered[f'{col}_roll6_std'] = r6_std
        df_engineered[f'{col}_delta3'] = d3
        df_engineered[f'{col}_delta6'] = d6

        engineered_cols.extend([
            f'{col}_roll3_mean', f'{col}_roll3_std',
            f'{col}_roll6_mean', f'{col}_roll6_std',
            f'{col}_delta3', f'{col}_delta6'
        ])

    return df_engineered, engineered_cols


def prepare_data_splits(df, test_size=0.15, val_size=0.15, random_state=42):
    """
    Performs patient-level train/validation/test split to prevent temporal data leakage.
    """
    df_engineered, feature_names = engineer_features(df)
    
    patient_ids = df_engineered['patient_id'].unique()
    np.random.seed(random_state)
    np.random.shuffle(patient_ids)

    n_patients = len(patient_ids)
    n_test = int(n_patients * test_size)
    n_val = int(n_patients * val_size)

    test_patients = set(patient_ids[:n_test])
    val_patients = set(patient_ids[n_test:n_test + n_val])
    train_patients = set(patient_ids[n_test + n_val:])

    train_df = df_engineered[df_engineered['patient_id'].isin(train_patients)].copy()
    val_df = df_engineered[df_engineered['patient_id'].isin(val_patients)].copy()
    test_df = df_engineered[df_engineered['patient_id'].isin(test_patients)].copy()

    X_train_raw = train_df[feature_names]
    y_train = train_df['target_deterioration_6_12h'].values

    X_val_raw = val_df[feature_names]
    y_val = val_df['target_deterioration_6_12h'].values

    X_test_raw = test_df[feature_names]
    y_test = test_df['target_deterioration_6_12h'].values

    # Fit scaler strictly on training set
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train_raw)
    X_val = scaler.transform(X_val_raw)
    X_test = scaler.transform(X_test_raw)

    return {
        'X_train': X_train,
        'y_train': y_train,
        'X_val': X_val,
        'y_val': y_val,
        'X_test': X_test,
        'y_test': y_test,
        'feature_names': feature_names,
        'scaler': scaler,
        'train_df': train_df,
        'val_df': val_df,
        'test_df': test_df
    }


if __name__ == '__main__':
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'icu_patients.csv'))
    if not os.path.exists(data_path):
        from backend.data.generate_dataset import generate_synthetic_icu_dataset
        df = generate_synthetic_icu_dataset()
    else:
        df = pd.read_csv(data_path)

    split_data = prepare_data_splits(df)
    print("Feature Engineering completed successfully.")
    print(f"Total features extracted: {len(split_data['feature_names'])}")
    print(f"X_train shape: {split_data['X_train'].shape}, y_train pos rate: {np.mean(split_data['y_train']):.3f}")
    print(f"X_val shape: {split_data['X_val'].shape}, y_val pos rate: {np.mean(split_data['y_val']):.3f}")
    print(f"X_test shape: {split_data['X_test'].shape}, y_test pos rate: {np.mean(split_data['y_test']):.3f}")
