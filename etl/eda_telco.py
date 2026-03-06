import os
import pandas as pd
from sqlalchemy import create_engine

def get_engine():
    host = os.environ["DB_HOST"]
    port = os.environ["DB_PORT"]
    db = os.environ["DB_NAME"]
    user = os.environ["DB_USER"]
    pwd = os.environ["DB_PASSWORD"]
    return create_engine(f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{db}")

def main():
    engine = get_engine()
    df = pd.read_sql("SELECT * FROM telco_customers", engine)

    print("\n=== SHAPE ===")
    print(df.shape)

    print("\n=== TARGET (Churn) ===")
    churn_counts = df["Churn"].value_counts(dropna=False)
    churn_rate = (df["Churn"].eq("Yes").mean()) * 100
    print(churn_counts)
    print(f"Churn rate: {churn_rate:.2f}%")

    print("\n=== MISSING VALUES (top) ===")
    miss = df.isna().mean().sort_values(ascending=False)
    print(miss[miss > 0].head(20))

    print("\n=== QUICK SANITY (TotalCharges) ===")
    if "TotalCharges" in df.columns:
        print(df["TotalCharges"].describe())

    print("\n=== CHURN BY CONTRACT ===")
    if "Contract" in df.columns:
        tmp = df.groupby("Contract")["Churn"].apply(lambda s: (s.eq("Yes").mean())*100).sort_values(ascending=False)
        print(tmp)

    print("\n=== CHURN BY PAYMENT METHOD ===")
    if "PaymentMethod" in df.columns:
        tmp = df.groupby("PaymentMethod")["Churn"].apply(lambda s: (s.eq("Yes").mean())*100).sort_values(ascending=False)
        print(tmp)

    print("\n=== CHURN BY TENURE BUCKET ===")
    if "tenure" in df.columns:
        bins = [0, 6, 12, 24, 36, 48, 60, 72]
        labels = ["0-6","7-12","13-24","25-36","37-48","49-60","61-72"]
        df["tenure_bucket"] = pd.cut(df["tenure"], bins=bins, labels=labels, include_lowest=True)
        tmp = df.groupby("tenure_bucket")["Churn"].apply(lambda s: (s.eq("Yes").mean())*100)
        print(tmp)

if __name__ == "__main__":
    main()