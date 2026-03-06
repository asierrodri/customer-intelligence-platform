import os
import json
import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from features.build_features import build_features

MODEL_PATH = "/app/artifacts/model.joblib"
COLUMNS_PATH = "/app/artifacts/feature_columns.json"

app = FastAPI(title="CIP ML Service", version="0.2.0")


class TelcoPredictRequest(BaseModel):
    gender: str
    SeniorCitizen: int
    Partner: str
    Dependents: str
    tenure: int
    PhoneService: str
    MultipleLines: str
    InternetService: str
    OnlineSecurity: str
    OnlineBackup: str
    DeviceProtection: str
    TechSupport: str
    StreamingTV: str
    StreamingMovies: str
    Contract: str
    PaperlessBilling: str
    PaymentMethod: str
    MonthlyCharges: float
    TotalCharges: float
    id: int | None = Field(default=None)


class TelcoPredictResponse(BaseModel):
    churn_probability: float
    churn_prediction: int
    model_version: str


def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"No se encontró el modelo en {MODEL_PATH}")
    return joblib.load(MODEL_PATH)


def load_feature_columns():
    if not os.path.exists(COLUMNS_PATH):
        raise FileNotFoundError(f"No se encontró feature_columns.json en {COLUMNS_PATH}")
    with open(COLUMNS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


model = None
feature_columns = None


@app.on_event("startup")
def startup_event():
    global model, feature_columns
    model = load_model()
    feature_columns = load_feature_columns()


@app.get("/health")
def health():
    model_loaded = model is not None
    return {
        "status": "ok",
        "model_loaded": model_loaded
    }


@app.post("/telco/predict", response_model=TelcoPredictResponse)
def telco_predict(req: TelcoPredictRequest):
    try:
        raw_df = pd.DataFrame([req.model_dump()])

        # Añadimos target dummy solo para reutilizar la función de build_features
        raw_df["Churn"] = "No"

        featured_df = build_features(raw_df)

        # Nos quedamos solo con columnas de entrada del modelo
        X = featured_df.drop(columns=[col for col in ["Churn", "id"] if col in featured_df.columns])

        # Reordenamos columnas según entrenamiento
        missing_cols = [col for col in feature_columns if col not in X.columns]
        extra_cols = [col for col in X.columns if col not in feature_columns]

        if missing_cols:
            raise ValueError(f"Faltan columnas requeridas por el modelo: {missing_cols}")

        if extra_cols:
            X = X.drop(columns=extra_cols)

        X = X[feature_columns]

        churn_probability = float(model.predict_proba(X)[0, 1])
        churn_prediction = int(model.predict(X)[0])

        return TelcoPredictResponse(
            churn_probability=round(churn_probability, 4),
            churn_prediction=churn_prediction,
            model_version="telco_logreg_v1"
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))