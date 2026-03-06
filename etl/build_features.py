import os
import pandas as pd
import numpy as np
from sqlalchemy import create_engine

def get_engine():
    host = os.environ["DB_HOST"]
    port = os.environ["DB_PORT"]
    db = os.environ["DB_NAME"]
    user = os.environ["DB_USER"]
    pwd = os.environ["DB_PASSWORD"]
    return create_engine(f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{db}")

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # -----------------------------
    # Basic cleaning
    # -----------------------------
    if "TotalCharges" in df.columns:
        df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")

    # Quitamos customerID porque no aporta al modelo
    if "customerID" in df.columns:
        df = df.drop(columns=["customerID"])

    # Eliminamos filas con nulos clave
    df = df.dropna(subset=["TotalCharges", "Churn"])

    # -----------------------------
    # Target cleaning
    # -----------------------------
    df["Churn"] = df["Churn"].map({"Yes": 1, "No": 0})

    # -----------------------------
    # New business-driven features
    # -----------------------------
    if "tenure" in df.columns:
        bins = [0, 6, 12, 24, 36, 48, 60, 72]
        labels = ["0-6", "7-12", "13-24", "25-36", "37-48", "49-60", "61-72"]
        df["tenure_bucket"] = pd.cut(
            df["tenure"],
            bins=bins,
            labels=labels,
            include_lowest=True
        )

        df["is_new_customer"] = np.where(df["tenure"] <= 6, 1, 0)

    if {"TotalCharges", "tenure"}.issubset(df.columns):
        df["avg_monthly_value"] = np.where(
            df["tenure"] > 0,
            df["TotalCharges"] / df["tenure"],
            df["MonthlyCharges"]
        )

    if "Contract" in df.columns:
        df["is_month_to_month"] = np.where(df["Contract"] == "Month-to-month", 1, 0)

    if "PaymentMethod" in df.columns:
        df["uses_electronic_check"] = np.where(df["PaymentMethod"] == "Electronic check", 1, 0)

    if "PaperlessBilling" in df.columns:
        df["PaperlessBilling"] = df["PaperlessBilling"].map({"Yes": 1, "No": 0})

    if "Partner" in df.columns:
        df["Partner"] = df["Partner"].map({"Yes": 1, "No": 0})

    if "Dependents" in df.columns:
        df["Dependents"] = df["Dependents"].map({"Yes": 1, "No": 0})

    if "PhoneService" in df.columns:
        df["PhoneService"] = df["PhoneService"].map({"Yes": 1, "No": 0})

    if "MultipleLines" in df.columns:
        df["MultipleLines"] = df["MultipleLines"].replace({
            "No phone service": "No"
        })

    service_cols = [
        "OnlineSecurity",
        "OnlineBackup",
        "DeviceProtection",
        "TechSupport",
        "StreamingTV",
        "StreamingMovies"
    ]

    for col in service_cols:
        if col in df.columns:
            df[col] = df[col].replace({"No internet service": "No"})

    if set(service_cols).issubset(df.columns):
        df["num_additional_services"] = (
            (df[service_cols] == "Yes").sum(axis=1)
        )

    return df

def main():
    engine = get_engine()
    df = pd.read_sql("SELECT * FROM telco_customers", engine)

    print("\n=== ORIGINAL SHAPE ===")
    print(df.shape)

    features_df = build_features(df)

    print("\n=== FEATURED SHAPE ===")
    print(features_df.shape)

    print("\n=== DTYPES ===")
    print(features_df.dtypes.sort_index())

    print("\n=== MISSING VALUES (top) ===")
    miss = features_df.isna().mean().sort_values(ascending=False)
    print(miss[miss > 0].head(20))

    print("\n=== PREVIEW ===")
    print(features_df.head())

    output_path = "/data/telco_features.csv"
    features_df.to_csv(output_path, index=False)
    features_df.to_csv(output_path, index=False)

    print(f"\nFeature dataset saved to: {output_path}")

if __name__ == "__main__":
    main()