"""Reproducible synthetic-only GraphSAGE training; never claims real-world accuracy."""

from __future__ import annotations

import argparse
import hashlib
import json
import random
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import average_precision_score, precision_score, recall_score, roc_auc_score
from torch_geometric.utils import negative_sampling, to_undirected

from features import FEATURE_VERSION, MATERIALS, NODE_DIM, PAIR_DIM, node_features, pair_features
from modelclass import SupplierLinkModel

MODEL_DIR = Path(__file__).resolve().parent / "model"
MODEL_VERSION = "synthetic-graphsage-v1"


def generate_graph(seed: int = 2026):
    """Homophilic material/region clusters: 4 plants, 10 suppliers, 2 buyers each."""
    rng = random.Random(seed)
    regions = [(13.0, 77.6), (19.1, 72.9), (23.0, 72.6), (22.6, 88.4)]
    nodes, edges = [], []
    for material in MATERIALS:
        for region_number, (latitude, longitude) in enumerate(regions):
            cluster = f"{material}-{region_number}"
            role_indices = {}
            for role, count, tier in [("plant", 4, 2), ("supplier", 10, 1), ("company", 2, 0)]:
                role_indices[role] = []
                for ordinal in range(count):
                    role_indices[role].append(len(nodes))
                    nodes.append({"id": f"synthetic-{cluster}-{role}-{ordinal}", "type": role,
                                  "tier": tier, "materialId": material,
                                  "latitude": latitude + rng.uniform(-1.0, 1.0),
                                  "longitude": longitude + rng.uniform(-1.0, 1.0)})
            for supplier in role_indices["supplier"]:
                sources = [plant for plant in role_indices["plant"] if rng.random() < 0.8]
                for plant in sources or [rng.choice(role_indices["plant"])]:
                    edges.append((plant, supplier))
            for company in role_indices["company"]:
                for supplier in rng.sample(role_indices["supplier"], 7):
                    edges.append((supplier, company))
    return nodes, edges


def make_negatives(nodes, edges, count, seed):
    """PyG negative sampling, role-constrained and excluding every positive split."""
    torch.manual_seed(seed)
    random.seed(seed)
    positives = torch.tensor(edges, dtype=torch.long).t().contiguous()
    negative_set = set()
    for _ in range(20):
        sampled = negative_sampling(positives, num_nodes=len(nodes),
                                    num_neg_samples=min(len(nodes) * 10, count * 12))
        for source, target in sampled.t().tolist():
            roles = nodes[source]["type"], nodes[target]["type"]
            if roles in {("plant", "supplier"), ("supplier", "company")}:
                negative_set.add((source, target))
            if len(negative_set) >= count:
                return sorted(negative_set)[:count]
    raise RuntimeError("Unable to obtain enough distinct role-compatible negative edges")


def _edge_tensor(edges):
    return torch.tensor(edges, dtype=torch.long).t().contiguous()


def train(seed=2026, epochs=180, output_dir=MODEL_DIR):
    torch.set_num_threads(1)
    torch.manual_seed(seed)
    np.random.seed(seed)
    random.seed(seed)
    nodes, edges = generate_graph(seed)
    random.Random(seed).shuffle(edges)
    n_train, n_validation = int(len(edges) * 0.7), int(len(edges) * 0.15)
    positive_train = edges[:n_train]
    positive_validation = edges[n_train:n_train + n_validation]
    positive_test = edges[n_train + n_validation:]
    all_negatives = make_negatives(nodes, edges, len(edges), seed + 1)
    random.Random(seed + 2).shuffle(all_negatives)
    negative_train = all_negatives[:n_train]
    negative_validation = all_negatives[n_train:n_train + n_validation]
    negative_test = all_negatives[n_train + n_validation:]
    x = node_features(nodes)
    # Neither validation nor test positive edges participate in message passing.
    message_edges = to_undirected(_edge_tensor(positive_train))
    model = SupplierLinkModel()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.004, weight_decay=1e-4)

    def tensors(positives, negatives):
        pairs = _edge_tensor(positives + negatives)
        labels = torch.cat([torch.ones(len(positives)), torch.zeros(len(negatives))])
        return pairs, pair_features(nodes, pairs), labels

    train_pairs, train_observable, train_labels = tensors(positive_train, negative_train)
    validation_pairs, validation_observable, validation_labels = tensors(positive_validation, negative_validation)
    test_pairs, test_observable, test_labels = tensors(positive_test, negative_test)
    best_loss, best_state, best_epoch = float("inf"), None, 0
    for epoch in range(1, epochs + 1):
        model.train()
        optimizer.zero_grad()
        # Feature-only inference is exercised by randomly isolating nodes; no demo labels are used.
        keep_nodes = torch.rand(len(nodes)) > 0.25
        keep_edges = keep_nodes[message_edges[0]] & keep_nodes[message_edges[1]]
        logits = model(x, message_edges[:, keep_edges], train_pairs, train_observable)
        loss = torch.nn.functional.binary_cross_entropy_with_logits(logits, train_labels)
        loss.backward()
        optimizer.step()
        model.eval()
        with torch.no_grad():
            validation_logits = model(x, message_edges, validation_pairs, validation_observable)
            validation_loss = torch.nn.functional.binary_cross_entropy_with_logits(validation_logits, validation_labels).item()
        if validation_loss < best_loss:
            best_loss, best_epoch = validation_loss, epoch
            best_state = {key: value.detach().clone() for key, value in model.state_dict().items()}
    model.load_state_dict(best_state)
    model.eval()
    with torch.no_grad():
        scores = torch.sigmoid(model(x, message_edges, test_pairs, test_observable)).numpy()
    labels = test_labels.numpy()
    classification = scores >= 0.5
    positives_set = set(positive_train)
    reverse_set = {(target, source) for source, target in positive_train}
    heldout_leak = sum(edge in positives_set or edge in reverse_set for edge in positive_test + positive_validation)
    metrics = {
        "label": "Synthetic-data results", "illustrative": True,
        "modelVersion": MODEL_VERSION, "seed": seed, "epochsRequested": epochs,
        "selectedEpoch": best_epoch, "selectionCriterion": "minimum validation binary cross entropy",
        "test": {"rocAuc": float(roc_auc_score(labels, scores)),
                 "averagePrecision": float(average_precision_score(labels, scores)),
                 "precisionAt05": float(precision_score(labels, classification, zero_division=0)),
                 "recallAt05": float(recall_score(labels, classification, zero_division=0)),
                 "positiveEdges": len(positive_test), "negativeEdges": len(negative_test)},
        "split": {"nodes": len(nodes), "positiveEdges": len(edges),
                  "trainPositive": n_train, "validationPositive": n_validation,
                  "testPositive": len(positive_test), "messagePassingPositiveEdges": n_train,
                  "heldOutEdgesLeakedIntoMessagePassing": heldout_leak,
                  "method": "Random disjoint edge split; 70% training, 15% validation, remainder test; same synthetic nodes across splits",
                  "negativeSampling": "PyG sampled nonedges, constrained to plausible role directions; all positives excluded; balanced test labels"},
        "limitations": [
            "Synthetic homophilic material/region generator; these results do not measure real supplier-network accuracy.",
            "Transductive edge split shares nodes and material/region patterns; it is not a held-out-company or temporal evaluation.",
            "Most sampled negatives are geographically/material incompatible; this task may be much easier than real hidden-link detection.",
            "Confidence is an uncalibrated model score, not a verified relationship probability.",
            "Evidence lists describe observable features, not causal feature attribution."],
        "trainedAt": datetime.now(timezone.utc).isoformat(),
    }
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    weights_path = output_dir / "weights.pt"
    torch.save({"state_dict": best_state, "model_version": MODEL_VERSION,
                "feature_version": FEATURE_VERSION, "hidden_dim": 48, "embedding_dim": 32}, weights_path)
    metrics["weightsSha256"] = hashlib.sha256(weights_path.read_bytes()).hexdigest()
    (output_dir / "metrics.json").write_text(json.dumps(metrics, indent=2) + "\n")
    feature_metadata = {"version": FEATURE_VERSION, "nodeDimension": NODE_DIM, "pairDimension": PAIR_DIM,
                        "nodeFeatures": ["role one-hot", "material family one-hot", "latitude / 90", "longitude / 180", "tier / 3"],
                        "pairFeatures": ["shared material", "distance / 1500 capped at 2", "plausible role direction", "tier difference / 3", "source is plant"],
                        "messagePassing": "Bidirectional observed training links only",
                        "augmentation": "Randomly isolate 25% of nodes each training epoch for sparse/isolated-node robustness",
                        "unknownCategory": "All-zero one-hot; predictions out of synthetic vocabulary require review"}
    (output_dir / "features.json").write_text(json.dumps(feature_metadata, indent=2) + "\n")
    # Save split provenance, not raw business transactions; the entire graph is generated.
    (output_dir / "split.json").write_text(json.dumps({"seed": seed,
        "trainingPositive": positive_train, "validationPositive": positive_validation,
        "testPositive": positive_test, "trainingNegative": negative_train,
        "validationNegative": negative_validation, "testNegative": negative_test}, indent=2) + "\n")
    (output_dir / "REPORT.md").write_text(
        "# Synthetic-data model report\n\n"
        f"Model `{MODEL_VERSION}` was trained with seed {seed}. All data is **Illustrative**.\n\n"
        f"Held-out synthetic test ROC-AUC: {metrics['test']['rocAuc']:.6f}; average precision: {metrics['test']['averagePrecision']:.6f}. "
        f"Precision at 0.5: {metrics['test']['precisionAt05']:.6f}; recall at 0.5: {metrics['test']['recallAt05']:.6f}.\n\n"
        "These are actual results computed by train.py, not a paper's published metrics. "
        "See metrics.json for exact values, split sizes, selected epoch and weights checksum.\n\n"
        + "\n\n".join(metrics["limitations"]) + "\n\n"
        "No real supplier links, PO records, invoices, customs records or model-accuracy benchmarks were used. "
        "The demo candidates are inferred from their observable synthetic features using these saved weights. "
        "The display threshold 0.60 and priority-review threshold 0.80 are design settings and never auto-confirm a link.\n")
    print(json.dumps(metrics, indent=2))
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--epochs", type=int, default=180)
    parser.add_argument("--output-dir", type=Path, default=MODEL_DIR)
    arguments = parser.parse_args()
    if arguments.epochs < 1 or arguments.epochs > 2000:
        parser.error("epochs must be between 1 and 2000")
    train(arguments.seed, arguments.epochs, arguments.output_dir)
