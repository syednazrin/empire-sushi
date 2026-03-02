"""
Convert population_district.parquet to JSON and save in the same folder.
Run: python scripts/parquet-to-json.py (or D:\\python.exe if needed)
"""
import json
import sys
from pathlib import Path

# Add D:\ to path so pandas/pyarrow are found when run from project dir
if sys.platform == "win32":
    sys.path.insert(0, "D:\\Lib\\site-packages")

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PARQUET_PATH = PROJECT_ROOT / "public" / "District Dosm Data" / "json files" / "population_district.parquet"
OUTPUT_PATH = PROJECT_ROOT / "public" / "District Dosm Data" / "json files" / "population_district.json"


def main():
    if not PARQUET_PATH.exists():
        print(f"Parquet not found: {PARQUET_PATH}")
        sys.exit(1)

    print(f"Reading {PARQUET_PATH}...")
    df = pd.read_parquet(PARQUET_PATH)

    # Convert dates to ISO strings for JSON
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")

    records = df.to_dict(orient="records")
    print(f"Writing {len(records)} records to {OUTPUT_PATH}...")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=0)

    print(f"Done. Saved to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
