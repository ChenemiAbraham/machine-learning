"""
ML API for Juicyway Growth Platform

Serves ML models for:
- Churn prediction
- Fraud detection
- Product recommendations
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.churn_model import ChurnPredictor

app = FastAPI(
    title="Juicyway ML API",
    description="Machine learning models for growth and risk",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instances
churn_predictor = ChurnPredictor()

try:
    churn_predictor.load('models/churn_model.pkl')
    print("✓ Churn model loaded")
except Exception as e:
    print(f"⚠ Churn model not loaded: {e}")


# =====================================================
# REQUEST/RESPONSE MODELS
# =====================================================

class ChurnPredictionRequest(BaseModel):
    user_id: str
    transaction_count_7d: int = Field(ge=0)
    transaction_count_30d: int = Field(ge=0)
    transaction_count_90d: int = Field(ge=0)
    total_volume_30d: float = Field(ge=0)
    avg_transaction_value_30d: float = Field(ge=0)
    days_since_last_transaction: int = Field(ge=0)
    app_open_count_7d: int = Field(ge=0)
    app_open_count_30d: int = Field(ge=0)
    session_count_30d: int = Field(ge=0)
    days_since_last_app_open: int = Field(ge=0)
    kyc_completion_time_minutes: int = Field(ge=0)


class ChurnPredictionResponse(BaseModel):
    user_id: str
    churn_probability: float
    risk_level: str
    recommendation: str
    features_used: List[str]


class FraudScoreRequest(BaseModel):
    user_id: str
    transaction_amount: float
    transaction_velocity_1h: int
    new_beneficiary: bool
    device_change_recent: bool
    geo_location_change: bool
    amount_deviation_from_avg: float


class FraudScoreResponse(BaseModel):
    user_id: str
    fraud_score: float
    risk_level: str
    action: str
    reason: str


class HealthResponse(BaseModel):
    status: str
    models_loaded: Dict[str, bool]
    version: str


# =====================================================
# ENDPOINTS
# =====================================================

@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": {
            "churn": churn_predictor.model is not None,
            "fraud": False,  # Not implemented yet
            "recommendations": False,  # Not implemented yet
        },
        "version": "1.0.0",
    }


@app.post("/predict/churn", response_model=ChurnPredictionResponse)
async def predict_churn(request: ChurnPredictionRequest):
    """
    Predict churn probability for a user

    Returns probability and recommended action
    """
    if churn_predictor.model is None:
        raise HTTPException(status_code=503, detail="Churn model not loaded")

    try:
        features = request.dict()
        user_id = features.pop('user_id')

        prediction = churn_predictor.predict(features)

        recommendation = ""
        if prediction['risk_level'] == 'high':
            recommendation = "Trigger reactivation campaign (email + push notification)"
        elif prediction['risk_level'] == 'medium':
            recommendation = "Add to watchlist, monitor for 7 days"
        else:
            recommendation = "No action needed"

        return {
            "user_id": user_id,
            "churn_probability": prediction['churn_probability'],
            "risk_level": prediction['risk_level'],
            "recommendation": recommendation,
            "features_used": prediction['features_used'],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/predict/fraud", response_model=FraudScoreResponse)
async def predict_fraud(request: FraudScoreRequest):
    """
    Score transaction for fraud risk

    Uses rule-based system (ML model to be trained)
    """
    score = 0.0

    # High velocity = suspicious
    if request.transaction_velocity_1h > 5:
        score += 0.3

    # New beneficiary + high amount = suspicious
    if request.new_beneficiary and request.transaction_amount > 1000:
        score += 0.2

    # Device change = suspicious
    if request.device_change_recent:
        score += 0.15

    # Geo location change = suspicious
    if request.geo_location_change:
        score += 0.15

    # Large deviation from average = suspicious
    if request.amount_deviation_from_avg > 3.0:
        score += 0.2

    score = min(score, 1.0)

    if score > 0.7:
        risk_level = "high"
        action = "block_and_verify"
        reason = "Multiple fraud indicators detected"
    elif score > 0.4:
        risk_level = "medium"
        action = "manual_review"
        reason = "Some suspicious patterns detected"
    else:
        risk_level = "low"
        action = "allow"
        reason = "Normal transaction pattern"

    return {
        "user_id": request.user_id,
        "fraud_score": score,
        "risk_level": risk_level,
        "action": action,
        "reason": reason,
    }


@app.get("/models/info")
async def model_info():
    """Get information about loaded models"""
    info = {
        "churn_model": {
            "loaded": churn_predictor.model is not None,
            "features": churn_predictor.feature_names if churn_predictor.model else [],
        },
        "fraud_model": {
            "loaded": False,
            "type": "rule_based",
        },
        "recommendations": {
            "loaded": False,
            "type": "placeholder",
        },
    }

    return info


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
