import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the pipeline/ directory (one level up from jobs/)
_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(_ENV_PATH)

# PostgreSQL connection params — read from environment / .env file
PG_HOST     = os.environ.get("PG_HOST", "localhost")
PG_PORT     = int(os.environ.get("PG_PORT", 5432))
PG_DB       = os.environ.get("PG_DB", "intex")
PG_USER     = os.environ.get("PG_USER", "postgres")
PG_PASSWORD = os.environ.get("PG_PASSWORD", "")

# Schema names  (replaces the two separate .db files)
OPERATIONAL_SCHEMA = "operational"
WAREHOUSE_SCHEMA   = "warehouse"

# Artifact paths (model files stay on disk — unchanged)
PIPELINE_DIR      = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR     = PIPELINE_DIR / "artifacts"
DATA_DIR          = PIPELINE_DIR / "data"          # raw CSVs only

RISK_MODEL_PATH    = ARTIFACTS_DIR / "risk_model.sav"
RISK_METADATA_PATH = ARTIFACTS_DIR / "risk_metadata.json"
RISK_METRICS_PATH  = ARTIFACTS_DIR / "risk_metrics.json"

ENGAGEMENT_MODEL_PATH    = ARTIFACTS_DIR / "engagement_model.sav"
ENGAGEMENT_METADATA_PATH = ARTIFACTS_DIR / "engagement_metadata.json"
ENGAGEMENT_METRICS_PATH  = ARTIFACTS_DIR / "engagement_metrics.json"

DONATION_MODEL_PATH    = ARTIFACTS_DIR / "donation_model.sav"
DONATION_METADATA_PATH = ARTIFACTS_DIR / "donation_metadata.json"
DONATION_METRICS_PATH  = ARTIFACTS_DIR / "donation_metrics.json"
