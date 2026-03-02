"""
Convert population_district.parquet to simplified columnar JSON (one array per field).
Saves to simplified_district_data.json in the same folder. No data loss.
Run: D:\\python.exe scripts/parquet-to-simplified-json.py
"""
import json
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.path.insert(0, "D:\\Lib\\site-packages")

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PARQUET_PATH = PROJECT_ROOT / "public" / "District Dosm Data" / "json files" / "population_district.parquet"
OUTPUT_PATH = PROJECT_ROOT / "public" / "District Dosm Data" / "json files" / "simplified_district_data.json"


def main():
    if not PARQUET_PATH.exists():
        print(f"Parquet not found: {PARQUET_PATH}")
        sys.exit(1)

    print(f"Reading {PARQUET_PATH}...")
    df = pd.read_parquet(PARQUET_PATH)

    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")

    # Columnar: one array per column (no repeated keys, same data)
    simplified = {
        "state": df["state"].tolist(),
        "district": df["district"].tolist(),
        "date": df["date"].tolist(),
        "sex": df["sex"].tolist(),
        "age": df["age"].tolist(),
        "ethnicity": df["ethnicity"].tolist(),
        "population": df["population"].tolist(),
    }
    n = len(simplified["state"])
    print(f"Writing {n} rows (columnar) to {OUTPUT_PATH}...")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(simplified, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Done. Saved to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
