import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from sklearn.feature_extraction.text import TfidfVectorizer

from backend.models.feature_engineering import engineer_features, FEATURE_COLS

class TextEmbedder:
    """
    Lightweight TF-IDF Clinical Note Vectorizer mapping clinical note text
    to dense embedding vectors.
    """
    def __init__(self, max_features=64):
        self.vectorizer = TfidfVectorizer(max_features=max_features, stop_words='english')

    def fit_transform(self, texts):
        return self.vectorizer.fit_transform(texts).toarray().astype(np.float32)

    def transform(self, texts):
        return self.vectorizer.transform(texts).toarray().astype(np.float32)


class MultimodalICUDataset(Dataset):
    """
    PyTorch Dataset outputting:
    - x_seq: (T, num_vitals_features) sequence tensor
    - x_text: (text_dim,) text embedding vector
    - y: (1,) binary target label
    """
    def __init__(self, x_seq, x_text, y):
        self.x_seq = torch.tensor(x_seq, dtype=torch.float32)
        self.x_text = torch.tensor(x_text, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32).unsqueeze(-1)

    def __len__(self):
        return len(self.y)

    def __getitem__(self, idx):
        return self.x_seq[idx], self.x_text[idx], self.y[idx]


def build_patient_sequences(df, sequence_length=12, text_embedder=None, scaler=None, is_train=False):
    """
    Converts tabular time-series dataframe into sliding window sequences per patient.
    """
    df_engineered, feature_cols = engineer_features(df)
    
    if is_train:
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        df_engineered[feature_cols] = scaler.fit_transform(df_engineered[feature_cols])
    else:
        if scaler is not None:
            df_engineered[feature_cols] = scaler.transform(df_engineered[feature_cols])

    if text_embedder is None:
        text_embedder = TextEmbedder(max_features=64)
        text_embeddings = text_embedder.fit_transform(df_engineered['clinical_note'].fillna(''))
    else:
        text_embeddings = text_embedder.transform(df_engineered['clinical_note'].fillna(''))

    df_engineered['text_embed_idx'] = np.arange(len(df_engineered))

    sequences_x = []
    text_x = []
    labels_y = []

    for patient_id, p_df in df_engineered.groupby('patient_id'):
        p_df = p_df.sort_values('hour').reset_index(drop=True)
        feat_matrix = p_df[feature_cols].values.astype(np.float32)
        text_indices = p_df['text_embed_idx'].values
        targets = p_df['target_deterioration_6_12h'].values

        n_rows = len(p_df)
        if n_rows < sequence_length:
            continue

        for i in range(sequence_length - 1, n_rows):
            seq = feat_matrix[i - sequence_length + 1 : i + 1]
            txt_emb = text_embeddings[text_indices[i]]
            label = targets[i]

            sequences_x.append(seq)
            text_x.append(txt_emb)
            labels_y.append(label)

    sequences_x = np.array(sequences_x, dtype=np.float32)
    text_x = np.array(text_x, dtype=np.float32)
    labels_y = np.array(labels_y, dtype=np.float32)

    return sequences_x, text_x, labels_y, text_embedder, scaler, feature_cols
