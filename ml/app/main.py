from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="CIP ML Service", version="0.1.0")

class TelcoPredictRequest(BaseModel):
    payload: dict  # más adelante lo tipamos bien

class TelcoPredictResponse(BaseModel):
    churn_proba: float
    model_version: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/telco/predict", response_model=TelcoPredictResponse)
def telco_predict(req: TelcoPredictRequest):
    # Placeholder: luego aquí cargaremos el modelo real (joblib) y preprocess pipeline
    return TelcoPredictResponse(churn_proba=0.42, model_version="telco_v0")