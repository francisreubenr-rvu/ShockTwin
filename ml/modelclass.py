"""GraphSAGE encoder with an observable-feature-aware MLP link decoder."""

from __future__ import annotations

import torch
from torch import nn
from torch_geometric.nn import SAGEConv

from features import NODE_DIM, PAIR_DIM


class SupplierLinkModel(nn.Module):
    def __init__(self, hidden_dim: int = 48, embedding_dim: int = 32):
        super().__init__()
        self.conv1 = SAGEConv(NODE_DIM, hidden_dim)
        self.conv2 = SAGEConv(hidden_dim, embedding_dim)
        self.decoder = nn.Sequential(
            nn.Linear(embedding_dim * 4 + PAIR_DIM, 64), nn.ReLU(),
            nn.Dropout(0.10), nn.Linear(64, 32), nn.ReLU(), nn.Linear(32, 1))

    def encode(self, features: torch.Tensor, edges: torch.Tensor) -> torch.Tensor:
        return self.conv2(torch.relu(self.conv1(features, edges)), edges)

    def decode(self, embeddings: torch.Tensor, pairs: torch.Tensor,
               observable_pairs: torch.Tensor) -> torch.Tensor:
        source, target = embeddings[pairs[0]], embeddings[pairs[1]]
        combined = torch.cat([source, target, source * target,
                              torch.abs(source - target), observable_pairs], dim=1)
        return self.decoder(combined).squeeze(-1)

    def forward(self, features: torch.Tensor, edges: torch.Tensor,
                pairs: torch.Tensor, observable_pairs: torch.Tensor) -> torch.Tensor:
        return self.decode(self.encode(features, edges), pairs, observable_pairs)
