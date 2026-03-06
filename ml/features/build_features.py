import pandas as pd
import numpy as np


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    if "TotalCharges" in df.columns:
        df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")

    if "customerID" in df.columns:
        df = df.drop(columns=["customerID"])

    if "Churn" in df.columns:
        df = df.dropna(subset=["TotalCharges", "Churn"])
        df["Churn"] = df["Churn"].map({"Yes": 1, "No": 0}).fillna(df["Churn"])
    else:
        df = df.dropna(subset=["TotalCharges"])

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

    if {"TotalCharges", "tenure", "MonthlyCharges"}.issubset(df.columns):
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
        df["PaperlessBilling"] = df["PaperlessBilling"].map({"Yes": 1, "No": 0}).fillna(df["PaperlessBilling"])

    if "Partner" in df.columns:
        df["Partner"] = df["Partner"].map({"Yes": 1, "No": 0}).fillna(df["Partner"])

    if "Dependents" in df.columns:
        df["Dependents"] = df["Dependents"].map({"Yes": 1, "No": 0}).fillna(df["Dependents"])

    if "PhoneService" in df.columns:
        df["PhoneService"] = df["PhoneService"].map({"Yes": 1, "No": 0}).fillna(df["PhoneService"])

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
        df["num_additional_services"] = (df[service_cols] == "Yes").sum(axis=1)

    return df