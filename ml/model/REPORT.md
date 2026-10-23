# Synthetic-data model report

Model `synthetic-graphsage-v1` was trained with seed 2026. All data is **Illustrative**.

Held-out synthetic test ROC-AUC: 0.997194; average precision: 0.996485. Precision at 0.5: 0.992857; recall at 0.5: 0.992857.

These are actual results computed by train.py, not a paper's published metrics. See metrics.json for exact values, split sizes, selected epoch and weights checksum.

Synthetic homophilic material/region generator; these results do not measure real supplier-network accuracy.

Transductive edge split shares nodes and material/region patterns; it is not a held-out-company or temporal evaluation.

Most sampled negatives are geographically/material incompatible; this task may be much easier than real hidden-link detection.

Confidence is an uncalibrated model score, not a verified relationship probability.

Evidence lists describe observable features, not causal feature attribution.

No real supplier links, PO records, invoices, customs records or model-accuracy benchmarks were used. The demo candidates are inferred from their observable synthetic features using these saved weights. The display threshold 0.60 and priority-review threshold 0.80 are design settings and never auto-confirm a link.
