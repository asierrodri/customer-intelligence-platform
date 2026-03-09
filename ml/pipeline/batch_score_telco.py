import os
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(APP_DIR))

import joblib
import pandas as pd
from sqlalchemy import create_engine


MODEL_PATH = Path("/app/artifacts/model.joblib")
MODEL_VERSION = "v1.0.0"

from features.build_features import build_features


def get_db_engine():
    db_user = os.getenv("DB_USER", "root")
    db_password = os.getenv("DB_PASSWORD", "root")
    db_host = os.getenv("DB_HOST", "mysql")
    db_port = os.getenv("DB_PORT", "3306")
    db_name = os.getenv("DB_NAME", "cip")

    connection_url = (
        f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    )
    return create_engine(connection_url)


def load_customers(engine):
    query = """
        SELECT *
        FROM telco_customers
    """
    return pd.read_sql(query, engine)


def prepare_features(df: pd.DataFrame):
    df = df.copy()

    # Normalización mínima por si el dataset viene como Telco original de Kaggle/IBM
    if "customerID" in df.columns and "customer_key" not in df.columns:
        df["customer_key"] = df["customerID"]

    if "MonthlyCharges" in df.columns and "monthly_charges" not in df.columns:
        df["monthly_charges"] = df["MonthlyCharges"]

    if "Contract" in df.columns and "contract_type" not in df.columns:
        df["contract_type"] = df["Contract"]

    # TotalCharges a veces viene como string con huecos
    if "TotalCharges" in df.columns:
        df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")

    # Si existe target real, la conservamos aparte pero no la usamos para predecir
    actual_churn = None
    if "Churn" in df.columns:
        actual_churn = df["Churn"].map({"Yes": 1, "No": 0}).fillna(df["Churn"])

    df = build_features(df)

    # columnas que NO deben entrar al modelo
    drop_cols = [
        col for col in ["customerID", "customer_key", "Churn", "actual_churn"]
        if col in df.columns
    ]

    X = df.drop(columns=drop_cols, errors="ignore")

    return df, X, actual_churn


def build_predictions_dataframe(df_original, probabilities, actual_churn=None):
    result = pd.DataFrame({
        "customer_key": df_original["customer_key"],
        "churn_proba": probabilities.round(6),
        "prediction": (probabilities >= 0.5).astype(int),
        "risk_level": pd.cut(
            probabilities,
            bins=[-0.01, 0.4, 0.7, 1.0],
            labels=["low", "medium", "high"]
        ).astype(str),
        "tenure": df_original["tenure"] if "tenure" in df_original.columns else None,
        "monthly_charges": (
            pd.to_numeric(df_original["monthly_charges"], errors="coerce")
            if "monthly_charges" in df_original.columns
            else None
        ),
        "contract_type": (
            df_original["contract_type"] if "contract_type" in df_original.columns else None
        ),
        "model_version": MODEL_VERSION,
    })

    if actual_churn is not None:
        result["actual_churn"] = pd.to_numeric(actual_churn, errors="coerce")

    return result


def insert_predictions(engine, df_predictions: pd.DataFrame):
    df_predictions.to_sql(
        "predictions_telco",
        con=engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=500,
    )


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Modelo no encontrado en: {MODEL_PATH}")

    print("Cargando modelo...")
    model = joblib.load(MODEL_PATH)

    print("Conectando a la base de datos...")
    engine = get_db_engine()

    print("Leyendo clientes desde telco_customers...")
    df = load_customers(engine)
    print(f"Clientes cargados: {len(df)}")

    if df.empty:
        print("No hay clientes en telco_customers")
        sys.exit(0)

    print("Preparando features...")
    df_original, X, actual_churn = prepare_features(df)

    print("Generando probabilidades...")
    probabilities = model.predict_proba(X)[:, 1]

    print("Construyendo dataframe de predicciones...")
    df_predictions = build_predictions_dataframe(df_original, probabilities, actual_churn)

    print("Insertando predicciones en predictions_telco...")
    insert_predictions(engine, df_predictions)

    print("Proceso completado.")
    print(df_predictions.head())


if __name__ == "__main__":
    main()