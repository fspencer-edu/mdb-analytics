import os
import pandas as pd
import mariadb
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
CSV_PATH = os.path.join(BASE_DIR, "data", "data.csv")

load_dotenv(ENV_PATH)


def clean_text(value):
    if pd.isna(value):
        return None
    return str(value).strip().title()


def get_connection():
    return mariadb.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3307")),
        user=os.getenv("DB_USER", "analytics_user"),
        password=os.getenv("DB_PASSWORD", "analytics_pass"),
        database=os.getenv("DB_NAME", "analytics_db"),
    )


def load_csv():
    df = pd.read_csv(CSV_PATH)

    df["city"] = df["city"].apply(clean_text)
    df["province"] = df["province"].apply(clean_text)
    df["year"] = pd.to_numeric(df["year"], errors="coerce")
    df["month"] = pd.to_numeric(df["month"], errors="coerce")
    df["avg_rent"] = pd.to_numeric(df["avg_rent"], errors="coerce")

    df = df.dropna(subset=["city", "province", "year", "month", "avg_rent"])
    df = df.drop_duplicates()

    df["year"] = df["year"].astype(int)
    df["month"] = df["month"].astype(int)

    return df


def clear_tables(cur):
    cur.execute("DELETE FROM monthly_rent")
    cur.execute("DELETE FROM cities")
    cur.execute("DELETE FROM staging_rent_data")


def insert_staging(cur, df):
    sql = """
        INSERT INTO staging_rent_data (city, province, year, month, avg_rent)
        VALUES (?, ?, ?, ?, ?)
    """
    for row in df.itertuples(index=False):
        cur.execute(sql, (row.city, row.province, row.year, row.month, float(row.avg_rent)))


def transform_data(cur):
    cur.execute("""
        INSERT INTO cities (city_name, province)
        SELECT DISTINCT city, province
        FROM staging_rent_data
        WHERE city IS NOT NULL AND province IS NOT NULL
    """)

    cur.execute("""
        INSERT INTO monthly_rent (city_id, year, month, avg_rent)
        SELECT c.city_id, s.year, s.month, s.avg_rent
        FROM staging_rent_data s
        JOIN cities c
          ON c.city_name = s.city
         AND c.province = s.province
    """)


def main():
    df = load_csv()

    conn = get_connection()
    cur = conn.cursor()

    try:
        clear_tables(cur)
        insert_staging(cur, df)
        transform_data(cur)
        conn.commit()
        print("ETL complete.")
    except Exception as e:
        conn.rollback()
        print(f"ETL failed: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()