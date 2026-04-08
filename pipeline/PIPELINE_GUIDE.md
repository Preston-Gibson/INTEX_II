# ML Pipeline Guide

Two independent pipelines share the same ETL foundation. Run them in order:
**ETL first, then train, then infer.**

---

## Prerequisites

### 1. Python environment
```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment variables
Create a `.env` file in the `pipeline/` directory (already gitignored):
```
PG_HOST=localhost
PG_PORT=5432
PG_DB=intex
PG_USER=postgres
PG_PASSWORD=your_password
```
For Supabase, set `PG_HOST` to your Supabase host and update the credentials accordingly.

---

## Step 1 — ETL (run once, or whenever source data changes)

Loads CSVs into the operational schema and builds all warehouse modeling tables.

```bash
cd pipeline/jobs
python etl.py
```

This runs four phases:
- **Phase A** — loads all CSVs into `operational` schema
- **Phase B** — builds `warehouse.fact_residents_ml` (risk model features)
- **Phase C** — builds `warehouse.fact_donors_ml` (donor model features)
- **Phase D** — builds `warehouse.fact_resident_outcomes_ml` (outcome model features)

---

## Pipeline 1 — Donor Models

Predicts **churn** (will a donor stop giving?) and **donation type** (Monetary / In-Kind / Time / Skills).

### Train
```bash
cd pipeline/jobs
python train_donor.py
```
Outputs to `pipeline/artifacts/`:
- `donor_churn_model.sav` + `donor_churn_metadata.json` + `donor_churn_metrics.json`
- `donor_type_model.sav` + `donor_type_metadata.json` + `donor_type_metrics.json`

### Run inference
```bash
cd pipeline/jobs
python inference_donor.py
```
Writes predictions to `operational.donor_predictions` (one row per supporter):

| Column | Description |
|---|---|
| `predicted_churn` | True / False |
| `prob_churn` | Probability of churning (0–1) |
| `predicted_don_type` | Most likely next donation type |
| `prob_monetary` | Probability of Monetary donation |
| `prob_in_kind` | Probability of In-Kind donation |
| `prob_time` | Probability of Time donation |
| `prob_skills` | Probability of Skills donation |

---

## Pipeline 2 — Resident Outcome Models

Predicts three things per resident:
1. **Reintegration outcome** — Completed / In Progress / Not Started / On Hold
2. **Reintegration type** — Foster Care / Family Reunification / Independent Living / Adoption
3. **Education completion** — Completed / InProgress / NotStarted

### Train
```bash
cd pipeline/jobs
python train_resident.py
```
Outputs to `pipeline/artifacts/`:
- `reintegration_outcome_model.sav` + metadata + metrics
- `reintegration_type_model.sav` + metadata + metrics
- `education_completion_model.sav` + metadata + metrics

### Run inference
```bash
cd pipeline/jobs
python inference_resident.py
```
Writes predictions to `operational.resident_outcome_predictions` (one row per resident):

| Column | Description |
|---|---|
| `predicted_reintegration_outcome` | Most likely outcome status |
| `prob_completed` | Probability of successful reintegration |
| `prob_in_progress` | Probability of still in progress |
| `prob_not_started` | Probability of not yet started |
| `prob_on_hold` | Probability of on hold |
| `predicted_reintegration_type` | Most likely reintegration pathway |
| `predicted_edu_completion` | Most likely education completion status |
| `prob_edu_completed` | Probability of completing education |
| `prob_edu_in_progress` | Probability of still in progress |
| `prob_edu_not_started` | Probability of not yet started |

---

## Existing Pipeline — Resident Risk Model

The original risk model (predicts Low / Medium / High / Critical risk level) still runs independently:

```bash
cd pipeline/jobs
python train.py        # trains risk_model.sav
python inference.py    # writes to operational.resident_risk_predictions
```

---

## Full run (all pipelines)

```bash
cd pipeline/jobs
python etl.py
python train.py
python train_donor.py
python train_resident.py
python inference.py
python inference_donor.py
python inference_resident.py
```

---

## Artifacts directory

All trained models and their metadata live in `pipeline/artifacts/`. These files are gitignored — retrain on each new deployment or when source data changes significantly.

## Retraining cadence

| Pipeline | When to retrain |
|---|---|
| Donor models | When new donations/supporters are added |
| Resident outcome models | Monthly, or after batch data updates |
| Risk model | Monthly, or after significant case data updates |
