import os
import json
import numpy as np
import pandas as pd
import torch
import pytest
import joblib

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.data.generate_dataset import generate_synthetic_icu_dataset
from backend.models.sequence_dataset import TextEmbedder, build_patient_sequences, MultimodalICUDataset
from backend.models.multimodal_model import MultimodalSepsisModel
from backend.models.train_phase2_multimodal import train_multimodal_sequence_model


def test_clinical_notes_in_dataset():
    df = generate_synthetic_icu_dataset(num_patients=5, hours_per_patient=12, random_state=101)
    
    assert 'clinical_note' in df.columns, "clinical_note column missing from dataset"
    assert df['clinical_note'].notna().all(), "Found missing clinical notes"
    assert len(df['clinical_note'].iloc[0]) > 10, "Clinical note text too short"


def test_sequence_dataset_and_vectorizer():
    df = generate_synthetic_icu_dataset(num_patients=10, hours_per_patient=24, random_state=202)
    
    embedder = TextEmbedder(max_features=32)
    embeddings = embedder.fit_transform(df['clinical_note'])
    assert embeddings.shape == (len(df), 32)

    seq_x, txt_x, y, text_emb, scaler, feat_names = build_patient_sequences(
        df, sequence_length=12, text_embedder=None, scaler=None, is_train=True
    )

    assert seq_x.ndim == 3
    assert seq_x.shape[1] == 12  # sequence length
    assert txt_x.ndim == 2
    assert txt_x.shape[1] == 64  # text features
    assert len(y) == len(seq_x) == len(txt_x)
    assert not np.isnan(seq_x).any()
    assert not np.isnan(txt_x).any()


def test_multimodal_model_forward_pass():
    batch_size = 8
    seq_len = 12
    num_features = 14
    text_dim = 64

    model = MultimodalSepsisModel(num_seq_features=num_features, text_dim=text_dim, hidden_dim=32, num_layers=1)
    
    x_seq = torch.randn(batch_size, seq_len, num_features)
    x_text = torch.randn(batch_size, text_dim)

    logits = model(x_seq, x_text)
    
    assert logits.shape == (batch_size, 1), f"Expected logits shape ({batch_size}, 1), got {logits.shape}"
    probs = torch.sigmoid(logits)
    assert (probs >= 0.0).all() and (probs <= 1.0).all()


def test_phase2_training_and_comparison():
    payload = train_multimodal_sequence_model(epochs=3, batch_size=16, random_state=303)

    assert payload is not None
    assert 'phase2_metrics' in payload
    assert 'AUROC' in payload['phase2_metrics']
    assert 'AUPRC' in payload['phase2_metrics']
    assert 'selected_primary_model' in payload

    saved_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../models/saved'))
    pt_path = os.path.join(saved_dir, 'multimodal_gru_model.pt')
    meta_path = os.path.join(saved_dir, 'multimodal_meta.joblib')
    json_path = os.path.join(saved_dir, 'phase2_metrics.json')

    assert os.path.exists(pt_path), "PyTorch model weights file missing"
    assert os.path.exists(meta_path), "Multimodal metadata joblib file missing"
    assert os.path.exists(json_path), "Phase 2 metrics JSON file missing"

    # Verify PyTorch model loading
    meta = joblib.load(meta_path)
    model = MultimodalSepsisModel(num_seq_features=meta['num_seq_features'], text_dim=meta['text_dim'])
    model.load_state_dict(torch.load(pt_path))
    model.eval()

    dummy_seq = torch.randn(2, meta['seq_len'], meta['num_seq_features'])
    dummy_txt = torch.randn(2, meta['text_dim'])
    with torch.no_grad():
        out = model(dummy_seq, dummy_txt)
    assert out.shape == (2, 1)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
