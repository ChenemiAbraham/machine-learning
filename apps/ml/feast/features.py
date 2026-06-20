"""
Feast Feature Definitions for Juicyway Growth Platform

Features for ML models:
- Churn prediction
- Fraud detection
- Product recommendations
"""

from datetime import timedelta
from feast import Entity, FeatureView, Field, FileSource, PushSource
from feast.types import Float32, Float64, Int64, String


# =====================================================
# ENTITIES
# =====================================================

user = Entity(
    name="user_id",
    description="Unique user identifier",
)


# =====================================================
# DATA SOURCES
# =====================================================

# User transaction features (from Postgres)
user_transaction_stats_source = PushSource(
    name="user_transaction_stats_push_source",
    batch_source=FileSource(
        path="s3://bookovia-hopsworks/feast-offline-store/user_transaction_stats.parquet",
        timestamp_field="event_timestamp",
    ),
)

# User engagement features (from Postgres)
user_engagement_stats_source = PushSource(
    name="user_engagement_stats_push_source",
    batch_source=FileSource(
        path="s3://bookovia-hopsworks/feast-offline-store/user_engagement_stats.parquet",
        timestamp_field="event_timestamp",
    ),
)


# =====================================================
# FEATURE VIEWS
# =====================================================

user_transaction_features = FeatureView(
    name="user_transaction_features",
    entities=[user],
    ttl=timedelta(days=1),
    schema=[
        Field(name="transaction_count_7d", dtype=Int64),
        Field(name="transaction_count_30d", dtype=Int64),
        Field(name="transaction_count_90d", dtype=Int64),
        Field(name="total_volume_7d", dtype=Float64),
        Field(name="total_volume_30d", dtype=Float64),
        Field(name="total_volume_90d", dtype=Float64),
        Field(name="avg_transaction_value_30d", dtype=Float64),
        Field(name="days_since_last_transaction", dtype=Int64),
        Field(name="max_transaction_amount", dtype=Float64),
        Field(name="min_transaction_amount", dtype=Float64),
        Field(name="transaction_amount_stddev", dtype=Float64),
        Field(name="unique_recipients_30d", dtype=Int64),
        Field(name="failed_transaction_count_30d", dtype=Int64),
        Field(name="failed_transaction_rate_30d", dtype=Float32),
    ],
    source=user_transaction_stats_source,
    tags={"team": "growth", "use_case": "churn_fraud"},
)

user_engagement_features = FeatureView(
    name="user_engagement_features",
    entities=[user],
    ttl=timedelta(days=1),
    schema=[
        Field(name="app_open_count_7d", dtype=Int64),
        Field(name="app_open_count_30d", dtype=Int64),
        Field(name="session_count_7d", dtype=Int64),
        Field(name="session_count_30d", dtype=Int64),
        Field(name="avg_session_duration_30d", dtype=Float32),
        Field(name="days_since_last_app_open", dtype=Int64),
        Field(name="days_since_signup", dtype=Int64),
    ],
    source=user_engagement_stats_source,
    tags={"team": "growth", "use_case": "churn"},
)

user_kyc_features = FeatureView(
    name="user_kyc_features",
    entities=[user],
    ttl=timedelta(days=90),
    schema=[
        Field(name="kyc_completion_time_minutes", dtype=Int64),
        Field(name="kyc_attempt_count", dtype=Int64),
        Field(name="kyc_failed_attempts", dtype=Int64),
        Field(name="days_since_kyc_complete", dtype=Int64),
    ],
    source=user_transaction_stats_source,  # Reuse source for demo
    tags={"team": "growth", "use_case": "fraud"},
)


# =====================================================
# FEATURE SERVICES (for model serving)
# =====================================================

from feast import FeatureService

churn_prediction_features = FeatureService(
    name="churn_prediction_v1",
    features=[
        user_transaction_features[
            [
                "transaction_count_7d",
                "transaction_count_30d",
                "total_volume_30d",
                "days_since_last_transaction",
            ]
        ],
        user_engagement_features[
            [
                "app_open_count_7d",
                "app_open_count_30d",
                "days_since_last_app_open",
                "days_since_signup",
            ]
        ],
    ],
    tags={"model": "churn_v1", "owner": "growth_team"},
)

fraud_detection_features = FeatureService(
    name="fraud_detection_v1",
    features=[
        user_transaction_features[
            [
                "transaction_count_7d",
                "avg_transaction_value_30d",
                "max_transaction_amount",
                "transaction_amount_stddev",
                "failed_transaction_rate_30d",
            ]
        ],
        user_kyc_features[
            [
                "kyc_completion_time_minutes",
                "kyc_attempt_count",
                "kyc_failed_attempts",
            ]
        ],
    ],
    tags={"model": "fraud_v1", "owner": "risk_team"},
)
