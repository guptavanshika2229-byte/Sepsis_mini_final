import torch
import torch.nn as nn
import torch.nn.functional as F

class MultimodalSepsisModel(nn.Module):
    """
    Multimodal Deep Sequence Model for Sepsis Deterioration Prediction:
    - Time-series branch: 2-layer Bidirectional GRU processing hourly vitals & labs
    - Text branch: MLP Encoder processing clinical note embeddings
    - Fusion layer: Concatenates structured sequence & text representations
    - Classification head: Dense layers predicting 6-12h deterioration risk logits
    """
    def __init__(self, num_seq_features, text_dim, hidden_dim=64, num_layers=2, dropout=0.2):
        super(MultimodalSepsisModel, self).__init__()
        
        # 1. Time-series GRU Encoder
        self.gru = nn.GRU(
            input_size=num_seq_features,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0.0
        )
        
        # 2. Text Note Encoder
        self.text_encoder = nn.Sequential(
            nn.Linear(text_dim, 32),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Dropout(dropout)
        )
        
        # 3. Fusion & Classification Head
        # Bidirectional GRU produces (hidden_dim * 2), text produces 32
        fusion_dim = (hidden_dim * 2) + 32
        
        self.classifier = nn.Sequential(
            nn.Linear(fusion_dim, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 1)
        )

    def forward(self, x_seq, x_text):
        """
        x_seq: (batch_size, sequence_length, num_seq_features)
        x_text: (batch_size, text_dim)
        """
        # GRU forward pass
        gru_out, h_n = self.gru(x_seq)
        
        # Concatenate final forward and backward hidden states
        # h_n shape: (num_layers * 2, batch_size, hidden_dim)
        forward_final = h_n[-2, :, :]
        backward_final = h_n[-1, :, :]
        seq_rep = torch.cat([forward_final, backward_final], dim=-1)
        
        # Text forward pass
        text_rep = self.text_encoder(x_text)
        
        # Fused multimodal representation
        fused = torch.cat([seq_rep, text_rep], dim=-1)
        
        # Predict logits
        logits = self.classifier(fused)
        return logits
