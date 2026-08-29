import os
import json
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import joblib

from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.data.generate_dataset import generate_synthetic_icu_dataset
from backend.models.sequence_dataset import build_patient_sequences, MultimodalICUDataset
from backend.models.multimodal_model import MultimodalSepsisModel


def train_multimodal_sequence_model(epochs=15, batch_size=32, lr=0.001, random_state=42):
    """
    Trains PyTorch Multimodal GRU model on 12-hour time-series sequences + clinical text notes.
    Evaluates AUROC, AUPRC, Brier Score.
    Compares against Phase 1 baseline and saves model artifacts & metrics.
    """
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data/icu_patients.csv'))
    if not os.path.exists(csv_path):
        print("Generating multimodal ICU dataset...")
        df_raw = generate_synthetic_icu_dataset(num_patients=120, hours_per_patient=48, random_state=random_state)
        df_raw.to_csv(csv_path, index=False)
    else:
        df_raw = pd.read_csv(csv_path)

    # Patient-level train/val/test splits
    patient_ids = df_raw['patient_id'].unique()
    np.random.seed(random_state)
    np.random.shuffle(patient_ids)

    n_patients = len(patient_ids)
    n_test = int(n_patients * 0.15)
    n_val = int(n_patients * 0.15)

    test_pts = set(patient_ids[:n_test])
    val_pts = set(patient_ids[n_test:n_test + n_val])
    train_pts = set(patient_ids[n_test + n_val:])

    train_df = df_raw[df_raw['patient_id'].isin(train_pts)].copy()
    val_df = df_raw[df_raw['patient_id'].isin(val_pts)].copy()
    test_df = df_raw[df_raw['patient_id'].isin(test_pts)].copy()

    # Build sequence data
    seq_len = 12
    x_seq_tr, x_txt_tr, y_tr, text_embedder, scaler, feat_names = build_patient_sequences(
        train_df, sequence_length=seq_len, text_embedder=None, scaler=None, is_train=True
    )
    x_seq_val, x_txt_val, y_val, _, _, _ = build_patient_sequences(
        val_df, sequence_length=seq_len, text_embedder=text_embedder, scaler=scaler, is_train=False
    )
    x_seq_te, x_txt_te, y_te, _, _, _ = build_patient_sequences(
        test_df, sequence_length=seq_len, text_embedder=text_embedder, scaler=scaler, is_train=False
    )

    print(f"Sequence datasets created:")
    print(f"Train sequences: {x_seq_tr.shape}, Text: {x_txt_tr.shape}, Pos rate: {np.mean(y_tr):.3f}")
    print(f"Val sequences:   {x_seq_val.shape}, Text: {x_txt_val.shape}, Pos rate: {np.mean(y_val):.3f}")
    print(f"Test sequences:  {x_seq_te.shape}, Text: {x_txt_te.shape}, Pos rate: {np.mean(y_te):.3f}")

    train_ds = MultimodalICUDataset(x_seq_tr, x_txt_tr, y_tr)
    val_ds = MultimodalICUDataset(x_seq_val, x_txt_val, y_val)
    test_ds = MultimodalICUDataset(x_seq_te, x_txt_te, y_te)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False)

    num_seq_features = x_seq_tr.shape[2]
    text_dim = x_txt_tr.shape[1]

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using compute device: {device}")

    model = MultimodalSepsisModel(
        num_seq_features=num_seq_features,
        text_dim=text_dim,
        hidden_dim=64,
        num_layers=2,
        dropout=0.2
    ).to(device)

    # Calculate class weighting for imbalanced loss
    pos_count = np.sum(y_tr)
    neg_count = len(y_tr) - pos_count
    pos_weight_val = neg_count / max(1, pos_count)
    pos_weight = torch.tensor([pos_weight_val], dtype=torch.float32).to(device)

    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)

    best_val_loss = float('inf')
    best_model_weights = None

    print("\n--- Training Multimodal GRU Model ---")
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for b_seq, b_txt, b_y in train_loader:
            b_seq, b_txt, b_y = b_seq.to(device), b_txt.to(device), b_y.to(device)
            
            optimizer.zero_grad()
            logits = model(b_seq, b_txt)
            loss = criterion(logits, b_y)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            train_loss += loss.item() * len(b_y)

        train_loss /= len(train_ds)

        # Validation phase
        model.eval()
        val_loss = 0.0
        val_preds, val_targets = [], []
        with torch.no_grad():
            for b_seq, b_txt, b_y in val_loader:
                b_seq, b_txt, b_y = b_seq.to(device), b_txt.to(device), b_y.to(device)
                logits = model(b_seq, b_txt)
                loss = criterion(logits, b_y)
                val_loss += loss.item() * len(b_y)
                probs = torch.sigmoid(logits).cpu().numpy()
                val_preds.extend(probs.flatten())
                val_targets.extend(b_y.cpu().numpy().flatten())

        val_loss /= len(val_ds)
        val_auroc = roc_auc_score(val_targets, val_preds) if len(np.unique(val_targets)) > 1 else 0.5
        val_auprc = average_precision_score(val_targets, val_preds)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_model_weights = model.state_dict().copy()

        if epoch % 5 == 0 or epoch == epochs:
            print(f"Epoch {epoch:02d}/{epochs:02d} | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val AUROC: {val_auroc:.4f} | Val AUPRC: {val_auprc:.4f}")

    # Load best weights for final evaluation
    if best_model_weights is not None:
        model.load_state_dict(best_model_weights)

    # Test Set Evaluation
    model.eval()
    test_preds, test_targets = [], []
    with torch.no_grad():
        for b_seq, b_txt, b_y in test_loader:
            b_seq, b_txt, b_y = b_seq.to(device), b_txt.to(device), b_y.to(device)
            logits = model(b_seq, b_txt)
            probs = torch.sigmoid(logits).cpu().numpy()
            test_preds.extend(probs.flatten())
            test_targets.extend(b_y.cpu().numpy().flatten())

    test_preds = np.array(test_preds)
    test_targets = np.array(test_targets)

    test_auroc = float(roc_auc_score(test_targets, test_preds))
    test_auprc = float(average_precision_score(test_targets, test_preds))
    test_brier = float(brier_score_loss(test_targets, test_preds))

    print(f"\n==========================================")
    print(f"Phase 2 Multimodal GRU Test Performance:")
    print(f"AUROC:       {test_auroc:.4f}")
    print(f"AUPRC:       {test_auprc:.4f}")
    print(f"Brier Score: {test_brier:.4f}")
    print(f"==========================================\n")

    # Load Phase 1 baseline metrics for decision checkpoint
    saved_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'saved'))
    os.makedirs(saved_dir, exist_ok=True)
    baseline_json_path = os.path.join(saved_dir, 'baseline_metrics.json')

    phase1_best_score = 0.0
    phase1_model_name = "XGBoost"
    phase1_metrics = {}

    if os.path.exists(baseline_json_path):
        with open(baseline_json_path, 'r') as f:
            p1_data = json.load(f)
            phase1_model_name = p1_data.get('selected_model', 'XGBoost')
            phase1_metrics = p1_data.get('metrics', {}).get(phase1_model_name, {})
            phase1_best_score = phase1_metrics.get('AUPRC', 0.0) + phase1_metrics.get('AUROC', 0.0)

    multimodal_score = test_auprc + test_auroc
    use_multimodal_as_primary = multimodal_score >= phase1_best_score

    print(f"Checkpoint Decision Point (Hour 10):")
    print(f"Phase 1 ({phase1_model_name}) Score (AUROC+AUPRC): {phase1_best_score:.4f}")
    print(f"Phase 2 (Multimodal GRU) Score (AUROC+AUPRC):   {multimodal_score:.4f}")

    if use_multimodal_as_primary:
        print(">>> DECISION: Phase 2 Multimodal GRU model selected as Primary Model for demo!")
        selected_model_type = "Multimodal GRU"
    else:
        print(">>> DECISION: Phase 1 Tabular model retained as Primary Model; Multimodal GRU stored as secondary option.")
        selected_model_type = phase1_model_name

    # Save PyTorch model state and preprocessors
    pt_path = os.path.join(saved_dir, 'multimodal_gru_model.pt')
    torch.save(model.state_dict(), pt_path)
    
    meta_path = os.path.join(saved_dir, 'multimodal_meta.joblib')
    joblib.dump({
        'scaler': scaler,
        'text_embedder': text_embedder,
        'feature_names': feat_names,
        'num_seq_features': num_seq_features,
        'text_dim': text_dim,
        'seq_len': seq_len
    }, meta_path)

    phase2_payload = {
        'phase2_model': 'Multimodal GRU',
        'phase2_metrics': {
            'AUROC': test_auroc,
            'AUPRC': test_auprc,
            'Brier_Score': test_brier
        },
        'phase1_baseline_comparison': {
            'baseline_model': phase1_model_name,
            'baseline_metrics': phase1_metrics
        },
        'selected_primary_model': selected_model_type,
        'multimodal_outperforms': use_multimodal_as_primary
    }

    phase2_json_path = os.path.join(saved_dir, 'phase2_metrics.json')
    with open(phase2_json_path, 'w') as f:
        json.dump(phase2_payload, f, indent=2)

    print(f"Phase 2 metrics saved to: {phase2_json_path}")
    return phase2_payload


if __name__ == '__main__':
    train_multimodal_sequence_model()
