import os
import pandas as pd
from sqlalchemy import create_engine, text

CSV_PATH = "/data/Telco-Customer-Churn.csv"

def main():

    host = os.environ["DB_HOST"]
    port = os.environ["DB_PORT"]
    db = os.environ["DB_NAME"]
    user = os.environ["DB_USER"]
    pwd = os.environ["DB_PASSWORD"]

    engine = create_engine(f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{db}")

    df = pd.read_csv(CSV_PATH)

    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")

    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE telco_customers"))

    df.to_sql("telco_customers", engine, if_exists="append", index=False)

    print("Dataset Telco cargado correctamente")

if __name__ == "__main__":
    main()