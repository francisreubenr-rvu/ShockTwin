"""Load saved GraphSAGE weights and score requested links without inventing confidence."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import torch
from torch_geometric.utils import to_undirected

from features import FEATURE_VERSION, evidence_for, node_features, pair_features
from modelclass import SupplierLinkModel

MODEL_DIR = Path(__file__).resolve().parent / "model"


class LinkPredictor:
    def __init__(self, model_dir: Path = MODEL_DIR):
        torch.set_num_threads(1)
        self.model_dir = Path(model_dir)
        checkpoint = torch.load(self.model_dir / "weights.pt", map_location="cpu", weights_only=True)
        if checkpoint["feature_version"] != FEATURE_VERSION:
            raise RuntimeError("Saved model and feature transformation versions disagree")
        self.version = checkpoint["model_version"]
        self.model = SupplierLinkModel(checkpoint["hidden_dim"], checkpoint["embedding_dim"])
        self.model.load_state_dict(checkpoint["state_dict"])
        self.model.eval()
        self.metrics = json.loads((self.model_dir / "metrics.json").read_text())

    def metadata(self) -> dict[str, Any]:
        return {"version": self.version, "trainingDomain": "synthetic",
                "metricsLabel": "Synthetic-data results", "metrics": self.metrics,
                "metricsSource": "ml/model/metrics.json", "displayThreshold": 0.60,
                "reviewThreshold": 0.80, "calibratedProbability": False,
                "evidenceMethod": "Observable input feature descriptions; not causal attribution"}

    def predict(self, nodes: list[dict[str, Any]], links: list[dict[str, Any]],
                candidates: list[dict[str, str]]) -> dict[str, Any]:
        if not nodes or len(nodes) > 10000:
            raise ValueError("Supply between 1 and 10000 nodes; 10000-node performance is unverified")
        if len(links) > 100000 or len(candidates) > 10000:
            raise ValueError("Request exceeds link/candidate limit")
        ids = [str(node.get("id", node.get("ID", ""))) for node in nodes]
        if any(not node_id for node_id in ids) or len(set(ids)) != len(ids):
            raise ValueError("Node ids must be nonempty and unique")
        lookup = {node_id: index for index, node_id in enumerate(ids)}
        edges = []
        for link in links:
            source, target = str(link.get("source", "")), str(link.get("target", ""))
            if source not in lookup or target not in lookup:
                raise ValueError("Observed link references an unknown node")
            if link.get("reviewStatus") == "rejected":
                continue
            if link.get("inferred") and link.get("reviewStatus") != "confirmed":
                continue
            edges.append((lookup[source], lookup[target]))
        requested, seen = [], set()
        for candidate in candidates:
            source, target = str(candidate.get("source", "")), str(candidate.get("target", ""))
            if source not in lookup or target not in lookup:
                raise ValueError("Candidate references an unknown node")
            if source == target:
                raise ValueError("Self-link candidates are not supported")
            if (source, target) in seen:
                raise ValueError("Candidate links must be unique")
            seen.add((source, target))
            requested.append((lookup[source], lookup[target]))
        if not requested:
            return {"illustrative": True, "predictions": [], "model": self.metadata()}
        edge_tensor = (torch.tensor(edges, dtype=torch.long).t().contiguous()
                       if edges else torch.empty((2, 0), dtype=torch.long))
        graph_edges = to_undirected(edge_tensor, num_nodes=len(nodes))
        pairs = torch.tensor(requested, dtype=torch.long).t().contiguous()
        with torch.inference_mode():
            logits = self.model(node_features(nodes), graph_edges, pairs, pair_features(nodes, pairs))
            scores = torch.sigmoid(logits).tolist()
        predictions = []
        for candidate, (source_index, target_index), score in zip(candidates, requested, scores):
            evidence = evidence_for(nodes[source_index], nodes[target_index])
            shared = nodes[source_index].get("materialId", nodes[source_index].get("material")) == nodes[target_index].get("materialId", nodes[target_index].get("material"))
            sentence = ("The model suggests this unconfirmed link because its material family, geographic separation and upstream/downstream roles resemble synthetic training patterns."
                        if shared else "The model scored this candidate using material, geographic and graph-role features; its differing material families warrant extra review.")
            predictions.append({"source": candidate["source"], "target": candidate["target"],
                                "confidence": float(score), "evidence": evidence,
                                "explanation": sentence, "modelVersion": self.version,
                                "aboveDisplayThreshold": score >= 0.60,
                                "highPriorityReview": score >= 0.80,
                                "illustrative": True})
        return {"illustrative": True, "predictions": predictions, "model": self.metadata()}


def main():
    parser = argparse.ArgumentParser(description="Score candidate supplier links using saved synthetic GraphSAGE weights")
    parser.add_argument("input", type=Path, help="JSON with nodes, links and candidates")
    parser.add_argument("--model-dir", type=Path, default=MODEL_DIR)
    args = parser.parse_args()
    request = json.loads(args.input.read_text())
    print(json.dumps(LinkPredictor(args.model_dir).predict(request["nodes"], request.get("links", []),
                                                        request.get("candidates", [])), indent=2))


if __name__ == "__main__":
    main()
