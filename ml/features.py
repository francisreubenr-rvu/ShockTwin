"""Observable, label-free node/pair features for the Illustrative supplier model."""

from __future__ import annotations

import math
from typing import Any

import torch

ROLES = ["company", "supplier", "plant"]
MATERIALS = ["resin", "metal", "electronics", "textile", "packaging"]
FEATURE_VERSION = "observable-features-v1"
NODE_DIM = len(ROLES) + len(MATERIALS) + 3
PAIR_DIM = 5


def normalized_node(node: dict[str, Any]) -> dict[str, Any]:
    role = str(node.get("type", node.get("role", "supplier"))).lower()
    material = str(node.get("materialId", node.get("material", "resin"))).lower()
    location = node.get("location")
    coordinates = location if isinstance(location, dict) else {}
    try:
        latitude = float(node.get("latitude", coordinates.get("latitude", 12.97)))
        longitude = float(node.get("longitude", coordinates.get("longitude", 77.59)))
        tier = float(node.get("tier", {"company": 0, "supplier": 1, "plant": 2}.get(role, 1)))
    except (TypeError, ValueError, OverflowError) as error:
        raise ValueError("Node coordinates and tier must be numeric") from error
    if not math.isfinite(latitude) or not -90 <= latitude <= 90:
        raise ValueError("Node latitude must be finite and between -90 and 90")
    if not math.isfinite(longitude) or not -180 <= longitude <= 180:
        raise ValueError("Node longitude must be finite and between -180 and 180")
    if not math.isfinite(tier) or not 0 <= tier <= 10:
        raise ValueError("Node tier must be between 0 and 10")
    return {**node, "type": role, "materialId": material, "latitude": latitude,
            "longitude": longitude, "tier": tier}


def haversine_km(first: dict[str, Any], second: dict[str, Any]) -> float:
    lat_a, lat_b = math.radians(first["latitude"]), math.radians(second["latitude"])
    delta_lat = lat_b - lat_a
    delta_lon = math.radians(second["longitude"] - first["longitude"])
    arc = math.sin(delta_lat / 2) ** 2 + math.cos(lat_a) * math.cos(lat_b) * math.sin(delta_lon / 2) ** 2
    return 6371.0088 * 2 * math.asin(min(1.0, math.sqrt(arc)))


def node_features(nodes: list[dict[str, Any]]) -> torch.Tensor:
    rows = []
    for raw in nodes:
        node = normalized_node(raw)
        rows.append([float(node["type"] == role) for role in ROLES]
                    + [float(node["materialId"] == material) for material in MATERIALS]
                    + [node["latitude"] / 90, node["longitude"] / 180,
                       min(node["tier"], 3) / 3])
    return torch.tensor(rows, dtype=torch.float32)


def pair_features(nodes: list[dict[str, Any]], pairs: torch.Tensor) -> torch.Tensor:
    normalized = [normalized_node(node) for node in nodes]
    rows = []
    for source_index, target_index in pairs.t().tolist():
        source, target = normalized[source_index], normalized[target_index]
        plausible_role = (source["type"], target["type"]) in {
            ("plant", "supplier"), ("supplier", "company")}
        rows.append([float(source["materialId"] == target["materialId"]),
                     min(haversine_km(source, target) / 1500, 2),
                     float(plausible_role),
                     max(-1, min((source["tier"] - target["tier"]) / 3, 1)),
                     float(source["type"] == "plant")])
    return torch.tensor(rows, dtype=torch.float32).reshape(-1, PAIR_DIM)


def evidence_for(source: dict[str, Any], target: dict[str, Any]) -> list[str]:
    source, target = normalized_node(source), normalized_node(target)
    material = source["materialId"]
    material_statement = (f"Shared observable material family: {material}"
                          if material == target["materialId"] else "Different observable material families")
    distance = haversine_km(source, target)
    tier_statement = ("Upstream plant to tier-1 supplier role is structurally plausible"
                      if source["type"] == "plant" and target["type"] == "supplier"
                      else f"Observable roles: {source['type']} → {target['type']}")
    return [material_statement, f"Illustrative coordinate separation: {distance:.1f} km", tier_statement]
