# ShockTwin synthetic GraphSAGE model

All generated networks and demo relationships are **Illustrative**. This is a real PyTorch Geometric GraphSAGE encoder with a learned MLP link decoder; its scores are not confirmed supplier relationships or calibrated real-world probabilities.

```bash
python -m pip install -r ml/requirements.txt
python ml/train.py
python ml/serve.py
python tests/test_gnn.py
```

Saved weights ship at `ml/model/weights.pt`; a normal demo start does not retrain. `train.py --seed 2026 --epochs 180` regenerates a synthetic clustered supply network, removes held-out positive edges before message passing, samples negatives using PyG, selects the best epoch using validation loss, and computes a separate test evaluation. `model/metrics.json`, `features.json`, `split.json` and `REPORT.md` record measured results and caveats. Training uses random node isolation for sparse-neighborhood robustness. No seeded hidden-link label is used for training.

POST `/predict` takes `nodes`, observed `links`, and `candidates`, and returns actual scores, observable feature evidence and model provenance. Node features use role, material family, tier and geography; pair features use observable material agreement, separation and role direction. Evidence describes association and is not a causal feature attribution. Invalid references, duplicate candidates and nonfinite/out-of-range coordinates are rejected. `/health` checks model load; `/metrics` reports synthetic evaluation metadata. Display 0.60 / priority review 0.80 are design thresholds, never automatic confirmation.

`Dockerfile` packages the saved model and endpoint on port 8080. Build from this directory with `docker build -t REGISTRY/shocktwin-ml:0.1 ml/` from the repository root; choose an authorized registry. The image uses an unprivileged user. `aicore/` contains parameterized SAP AI Core serving and training templates. Registry credentials, artifact-store configuration, API route compatibility, service entitlements and actual AI Core deployment remain **[VERIFY]**. The local Python flow is independently testable; the repository does not claim that uploading a template provisions a working SAP deployment.

The HTTP endpoint binds localhost by default. Put it behind authenticated internal networking in production; it is not a public multi-tenant API. CAP is responsible for authorizing and redacting the tenant graph before inference. CPU memory/latency at 10,000 nodes has not been benchmarked.
