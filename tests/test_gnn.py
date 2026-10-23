"""Smoke and contract checks for actual saved synthetic GraphSAGE inference."""

import json
import math
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "ml"))

from predict import LinkPredictor  # noqa: E402


class GraphSAGESmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.predictor = LinkPredictor()
        cls.nodes = [{"id": "plant", "type": "plant", "tier": 2, "materialId": "resin", "latitude": 13.1, "longitude": 79.2}]
        cls.nodes += [{"id": f"s{number}", "type": "supplier", "tier": 1, "materialId": "resin", "latitude": 12.9 + number / 20, "longitude": 77.6} for number in range(1, 4)]
        cls.candidates = [{"source": "plant", "target": f"s{number}"} for number in range(1, 4)]

    def test_real_scores_and_provenance(self):
        result = self.predictor.predict(self.nodes, [], self.candidates)
        self.assertEqual(len(result["predictions"]), 3)
        self.assertEqual(result["model"]["trainingDomain"], "synthetic")
        for item in result["predictions"]:
            self.assertTrue(math.isfinite(item["confidence"]))
            self.assertGreaterEqual(item["confidence"], 0)
            self.assertLessEqual(item["confidence"], 1)
            self.assertEqual(len(item["evidence"]), 3)
            self.assertTrue(item["modelVersion"])

    def test_prediction_changes_when_material_evidence_changes(self):
        compatible = self.predictor.predict(self.nodes, [], [self.candidates[0]])["predictions"][0]["confidence"]
        changed = [dict(node) for node in self.nodes]
        changed[1]["materialId"] = "electronics"
        incompatible = self.predictor.predict(changed, [], [self.candidates[0]])["predictions"][0]["confidence"]
        self.assertNotAlmostEqual(compatible, incompatible, places=4)

    def test_unknown_ids_and_nonfinite_coordinates_fail(self):
        with self.assertRaisesRegex(ValueError, "unknown node"):
            self.predictor.predict(self.nodes, [], [{"source": "absent", "target": "s1"}])
        changed = [dict(node) for node in self.nodes]
        changed[0]["latitude"] = float("nan")
        with self.assertRaisesRegex(ValueError, "latitude"):
            self.predictor.predict(changed, [], self.candidates)
        changed[0]["latitude"] = None
        with self.assertRaisesRegex(ValueError, "numeric"):
            self.predictor.predict(changed, [], self.candidates)

    def test_measured_evaluation_and_disjoint_splits(self):
        metadata = self.predictor.metadata()["metrics"]
        self.assertEqual(metadata["label"], "Synthetic-data results")
        self.assertEqual(metadata["split"]["heldOutEdgesLeakedIntoMessagePassing"], 0)
        for key in ["rocAuc", "averagePrecision", "precisionAt05", "recallAt05"]:
            self.assertGreaterEqual(metadata["test"][key], 0)
            self.assertLessEqual(metadata["test"][key], 1)
        splits = json.loads((ROOT / "ml/model/split.json").read_text())
        train, test, validation = [set(map(tuple, splits[key])) for key in ["trainingPositive", "testPositive", "validationPositive"]]
        self.assertFalse(train & test)
        self.assertFalse(train & validation)
        self.assertFalse(test & validation)


if __name__ == "__main__":
    unittest.main()
