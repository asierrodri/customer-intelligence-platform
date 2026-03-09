import json
import os
import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report
)

ARTIFACTS_DIR = "/app/artifacts"
DATA_PATH = "/data/telco_features.csv"


def load_data(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(f"No se encontró el dataset en: {path}")
    return pd.read_csv(path)


def split_features_target(df: pd.DataFrame):
    df = df.copy()

    if "Churn" not in df.columns:
        raise ValueError("La columna target 'Churn' no existe en el dataset.")

    # columnas que no deben entrar al modelo
    drop_cols = [col for col in ["Churn", "id"] if col in df.columns]

    X = df.drop(columns=drop_cols)
    y = df["Churn"]

    return X, y


def build_preprocessor(X: pd.DataFrame) -> ColumnTransformer:
    categorical_cols = X.select_dtypes(include=["object", "category"]).columns.tolist()
    numeric_cols = X.select_dtypes(include=["int64", "float64", "int32", "float32"]).columns.tolist()

    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore"))
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, numeric_cols),
            ("cat", categorical_pipeline, categorical_cols),
        ]
    )

    return preprocessor


def train_pipeline(X_train: pd.DataFrame, y_train: pd.Series) -> Pipeline:
    preprocessor = build_preprocessor(X_train)

    model = LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        random_state=42
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model)
        ]
    )

    pipeline.fit(X_train, y_train)
    return pipeline


def evaluate_model(pipeline: Pipeline, X_test: pd.DataFrame, y_test: pd.Series) -> dict:
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred)), 4),
        "recall": round(float(recall_score(y_test, y_pred)), 4),
        "f1": round(float(f1_score(y_test, y_pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_proba)), 4),
    }

    print("\n=== METRICS ===")
    for k, v in metrics.items():
        print(f"{k}: {v}")

    print("\n=== CLASSIFICATION REPORT ===")
    print(classification_report(y_test, y_pred))

    return metrics


def save_artifacts(pipeline: Pipeline, metrics: dict, X_columns: list[str]) -> None:
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)

    model_path = os.path.join(ARTIFACTS_DIR, "model.joblib")
    metrics_path = os.path.join(ARTIFACTS_DIR, "metrics.json")
    columns_path = os.path.join(ARTIFACTS_DIR, "feature_columns.json")

    joblib.dump(pipeline, model_path)

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    with open(columns_path, "w", encoding="utf-8") as f:
        json.dump(X_columns, f, indent=2)

    print(f"\nModelo guardado en: {model_path}")
    print(f"Métricas guardadas en: {metrics_path}")
    print(f"Columnas guardadas en: {columns_path}")


def main():
    print("\n=== LOADING DATA ===")
    df = load_data(DATA_PATH)
    print(df.shape)

    X, y = split_features_target(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    print("\n=== TRAIN / TEST SHAPES ===")
    print("X_train:", X_train.shape)
    print("X_test :", X_test.shape)

    pipeline = train_pipeline(X_train, y_train)
    metrics = evaluate_model(pipeline, X_test, y_test)
    save_artifacts(pipeline, metrics, X.columns.tolist())
    save_feature_importance(pipeline)

def save_feature_importance(pipeline: Pipeline) -> None:
    import os
    import json
    import numpy as np

    preprocessor = pipeline.named_steps["preprocessor"]
    model = pipeline.named_steps["model"]

    feature_names = preprocessor.get_feature_names_out()
    coefficients = model.coef_[0]

    feature_importance = [
        {
            "feature": feature,
            "importance": round(float(abs(coef)), 4),
            "coefficient": round(float(coef), 4)
        }
        for feature, coef in zip(feature_names, coefficients)
    ]

    feature_importance = sorted(
        feature_importance,
        key=lambda x: x["importance"],
        reverse=True
    )

    path = os.path.join(ARTIFACTS_DIR, "feature_importance.json")

    with open(path, "w", encoding="utf-8") as f:
        json.dump(feature_importance[:15], f, indent=2)

    print(f"Feature importance guardado en: {path}")


if __name__ == "__main__":
    main()