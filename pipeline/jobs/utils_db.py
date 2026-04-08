"""
Database helpers for PostgreSQL.

Two tools are provided:
  - pg_conn(schema)  — raw psycopg2 connection, used for DDL and INSERT/UPDATE
  - get_engine(schema) — SQLAlchemy engine, required by pandas to_sql / read_sql
"""

from contextlib import contextmanager

import psycopg2
from sqlalchemy import create_engine

from config import PG_DB, PG_HOST, PG_PASSWORD, PG_PORT, PG_USER


def _dsn() -> str:
    """psycopg2 connection string."""
    return (
        f"host={PG_HOST} port={PG_PORT} dbname={PG_DB} "
        f"user={PG_USER} password={PG_PASSWORD}"
    )


def _url() -> str:
    """SQLAlchemy connection URL."""
    return f"postgresql+psycopg2://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DB}"


@contextmanager
def pg_conn(schema: str = "public"):
    """
    Yields a psycopg2 connection with search_path set to the given schema.
    Use this for raw SQL: CREATE TABLE, INSERT, UPDATE, DELETE.
    """
    conn = psycopg2.connect(_dsn(), options=f"-c search_path={schema},public")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_engine(schema: str = "public"):
    """
    Returns a SQLAlchemy engine with search_path set to the given schema.
    Use this for pandas read_sql() and to_sql().
    """
    return create_engine(
        _url(),
        connect_args={"options": f"-c search_path={schema},public"},
    )


def ensure_schemas(schemas: list[str]):
    """Create schemas if they don't already exist (runs as the connected user)."""
    # Must run outside a transaction — use autocommit
    conn = psycopg2.connect(_dsn())
    conn.autocommit = True
    with conn.cursor() as cur:
        for schema in schemas:
            cur.execute(f"CREATE SCHEMA IF NOT EXISTS {schema}")
    conn.close()


def ensure_resident_outcome_predictions_table(schema: str = "operational"):
    """Create the resident outcome predictions table if it doesn't exist."""
    with pg_conn(schema) as conn:
        with conn.cursor() as cur:
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS {schema}.resident_outcome_predictions (
                    resident_id                     INTEGER PRIMARY KEY,
                    predicted_reintegration_outcome TEXT,
                    prob_completed                  DOUBLE PRECISION,
                    prob_in_progress                DOUBLE PRECISION,
                    prob_not_started                DOUBLE PRECISION,
                    prob_on_hold                    DOUBLE PRECISION,
                    predicted_reintegration_type    TEXT,
                    predicted_edu_completion        TEXT,
                    prob_edu_completed              DOUBLE PRECISION,
                    prob_edu_in_progress            DOUBLE PRECISION,
                    prob_edu_not_started            DOUBLE PRECISION,
                    prediction_ts                   TIMESTAMPTZ
                )
            """)


def ensure_donor_predictions_table(schema: str = "operational"):
    """Create the donor predictions table if it doesn't exist."""
    with pg_conn(schema) as conn:
        with conn.cursor() as cur:
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS {schema}.donor_predictions (
                    supporter_id          INTEGER PRIMARY KEY,
                    predicted_churn       BOOLEAN,
                    prob_churn            DOUBLE PRECISION,
                    predicted_don_type    TEXT,
                    prob_monetary         DOUBLE PRECISION,
                    prob_in_kind          DOUBLE PRECISION,
                    prob_time             DOUBLE PRECISION,
                    prob_skills           DOUBLE PRECISION,
                    prediction_ts         TIMESTAMPTZ
                )
            """)


def ensure_risk_predictions_table(schema: str = "operational"):
    """Create the predictions table if it doesn't exist."""
    with pg_conn(schema) as conn:
        with conn.cursor() as cur:
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS {schema}.resident_risk_predictions (
                    resident_id   INTEGER PRIMARY KEY,
                    predicted_risk TEXT,
                    prob_low       DOUBLE PRECISION,
                    prob_medium    DOUBLE PRECISION,
                    prob_high      DOUBLE PRECISION,
                    prob_critical  DOUBLE PRECISION,
                    prediction_ts  TIMESTAMPTZ
                )
            """)


def ensure_social_predictions_table(schema: str = "operational"):
    """Create the social media predictions table if it doesn't exist."""
    with pg_conn(schema) as conn:
        with conn.cursor() as cur:
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS {schema}.social_media_predictions (
                    post_id                    INTEGER          PRIMARY KEY,
                    predicted_engagement_tier  TEXT,
                    prob_engagement_low        DOUBLE PRECISION,
                    prob_engagement_medium     DOUBLE PRECISION,
                    prob_engagement_high       DOUBLE PRECISION,
                    predicted_has_donations    INTEGER,
                    prob_has_donations         DOUBLE PRECISION,
                    prediction_ts              TIMESTAMPTZ
                )
            """)
