"""
Churn Prediction Model

Predicts probability that a user will churn (not transact in next 30 days)
Uses LightGBM for fast, accurate predictions
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, precision_recall_curve, auc
import lightgbm as lgb
import joblib
from typing import Dict, List
import psycopg2
from datetime import datetime, timedelta


class ChurnPredictor:
    """Churn prediction model using LightGBM"""

    def __init__(self):
        self.model = None
        self.feature_names = [
            'transaction_count_7d',
            'transaction_count_30d',
            'transaction_count_90d',
            'total_volume_30d',
            'avg_transaction_value_30d',
            'days_since_last_transaction',
            'app_open_count_7d',
            'app_open_count_30d',
            'session_count_30d',
            'days_since_last_app_open',
            'kyc_completion_time_minutes',
        ]

    def prepare_training_data(self, conn_string: str) -> pd.DataFrame:
        """
        Prepare training data from Postgres

        Label: churned = 1 if no transaction in last 30 days AND had previous transaction
        """
        conn = psycopg2.connect(conn_string)

        query = """
        WITH user_features AS (
            SELECT
                user_id,
                transaction_count_7d,
                transaction_count_30d,
                transaction_count_90d,
                total_volume_30d,
                avg_transaction_value_30d,
                days_since_last_transaction,
                app_open_count_7d,
                app_open_count_30d,
                session_count_30d,
                days_since_last_app_open,
                kyc_completion_time_minutes,
                updated_at
            FROM ml_user_features
            WHERE transaction_count_90d > 0  -- Only users who have transacted
        ),
        labels AS (
            SELECT
                user_id,
                CASE
                    WHEN days_since_last_transaction > 30 THEN 1
                    ELSE 0
                END AS churned
            FROM user_features
        )
        SELECT
            f.*,
            l.churned
        FROM user_features f
        JOIN labels l ON f.user_id = l.user_id
        """

        df = pd.read_sql_query(query, conn)
        conn.close()

        return df

    def train(self, df: pd.DataFrame) -> Dict:
        """
        Train churn prediction model

        Returns:
            Dict with training metrics
        """
        X = df[self.feature_names]
        y = df['churned']

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
        print(f"Churn rate: {y.mean():.2%}")

        train_data = lgb.Dataset(X_train, label=y_train)
        test_data = lgb.Dataset(X_test, label=y_test, reference=train_data)

        params = {
            'objective': 'binary',
            'metric': 'auc',
            'boosting_type': 'gbdt',
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.9,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'verbose': 0,
            'random_state': 42,
        }

        self.model = lgb.train(
            params,
            train_data,
            num_boost_round=100,
            valid_sets=[test_data],
            callbacks=[lgb.early_stopping(stopping_rounds=10)],
        )

        y_pred_proba = self.model.predict(X_test)
        roc_auc = roc_auc_score(y_test, y_pred_proba)

        precision, recall, _ = precision_recall_curve(y_test, y_pred_proba)
        pr_auc = auc(recall, precision)

        feature_importance = dict(
            zip(self.feature_names, self.model.feature_importance().tolist())
        )

        metrics = {
            'roc_auc': float(roc_auc),
            'pr_auc': float(pr_auc),
            'feature_importance': feature_importance,
            'train_samples': len(X_train),
            'test_samples': len(X_test),
            'churn_rate': float(y.mean()),
        }

        print(f"\n✓ Model trained!")
        print(f"  ROC AUC: {roc_auc:.4f}")
        print(f"  PR AUC: {pr_auc:.4f}")
        print(f"\nTop 5 features:")
        for feature, importance in sorted(
            feature_importance.items(), key=lambda x: x[1], reverse=True
        )[:5]:
            print(f"  {feature}: {importance:.2f}")

        return metrics

    def predict(self, features: Dict[str, float]) -> Dict:
        """
        Predict churn probability for a single user

        Args:
            features: Dict mapping feature names to values

        Returns:
            Dict with prediction and risk level
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        feature_values = [features.get(name, 0) for name in self.feature_names]
        X = pd.DataFrame([feature_values], columns=self.feature_names)

        churn_probability = float(self.model.predict(X)[0])

        risk_level = 'low'
        if churn_probability > 0.7:
            risk_level = 'high'
        elif churn_probability > 0.4:
            risk_level = 'medium'

        return {
            'churn_probability': churn_probability,
            'risk_level': risk_level,
            'features_used': self.feature_names,
        }

    def save(self, path: str):
        """Save model to disk"""
        if self.model is None:
            raise ValueError("No model to save")

        joblib.dump(
            {
                'model': self.model,
                'feature_names': self.feature_names,
            },
            path,
        )
        print(f"✓ Model saved to {path}")

    def load(self, path: str):
        """Load model from disk"""
        data = joblib.load(path)
        self.model = data['model']
        self.feature_names = data['feature_names']
        print(f"✓ Model loaded from {path}")


def main():
    """Train and save churn model"""
    print("Training churn prediction model...\n")

    predictor = ChurnPredictor()

    conn_string = "host=localhost port=54322 dbname=postgres user=postgres password=postgres"

    df = predictor.prepare_training_data(conn_string)
    print(f"Loaded {len(df)} samples\n")

    metrics = predictor.train(df)

    predictor.save('churn_model.pkl')

    print("\n✓ Training complete!")


if __name__ == '__main__':
    main()
