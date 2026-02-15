import argparse
import os
import sys
import time
import urllib.request
from pathlib import Path
from typing import Dict, List, Optional

import mysql.connector
import pandas as pd
from tqdm import tqdm


class CsvFoodBackfill:
    def __init__(
        self,
        csv_file_path: str,
        env_file_path: Optional[str] = None,
        api_url: Optional[str] = None,
        update_batch_size: int = 1000,
    ):
        self.csv_file_path = csv_file_path
        self.env_file_path = env_file_path
        self.api_url = api_url
        self.update_batch_size = update_batch_size
        self.db_config = self._load_db_config(env_file_path)
        self.updated_rows = 0
        self.scanned_rows = 0

    def _load_db_config(self, env_file_path: Optional[str]) -> Dict:
        if env_file_path:
            env_path = Path(env_file_path)
        else:
            env_path = Path(__file__).with_name(".env")

        if env_path.exists():
            self._load_env_file(env_path)

        host = os.getenv("DB_HOST")
        port = os.getenv("DB_PORT", "3306")
        user = os.getenv("DB_USER")
        password = os.getenv("DB_PASSWORD")
        database = os.getenv("DB_NAME")

        missing = [
            key
            for key, value in {
                "DB_HOST": host,
                "DB_USER": user,
                "DB_PASSWORD": password,
                "DB_NAME": database,
            }.items()
            if not value
        ]

        if missing:
            raise ValueError(
                f"Missing required DB settings: {', '.join(missing)}. "
                f"Set them in environment or {env_path}."
            )

        try:
            parsed_port = int(port)
        except ValueError as exc:
            raise ValueError(f"Invalid DB_PORT value: {port}") from exc

        return {
            "host": host,
            "port": parsed_port,
            "user": user,
            "password": password,
            "database": database,
            "autocommit": False,
        }

    def _load_env_file(self, env_path: Path) -> None:
        for line in env_path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, raw_value = stripped.split("=", 1)
            key = key.strip()
            value = raw_value.strip()
            if value.startswith(("'", '"')) and value.endswith(("'", '"')) and len(value) >= 2:
                value = value[1:-1]
            os.environ.setdefault(key, value)

    def _clean_string(self, value) -> Optional[str]:
        if pd.isna(value) or value in ("", "N/A", "NULL", "null", "None"):
            return None
        return str(value).strip()

    def _update_is_csv_food(
        self,
        cursor: mysql.connector.cursor.MySQLCursor,
        source_ids: List[str],
    ) -> int:
        if not source_ids:
            return 0
        placeholders = ", ".join(["%s"] * len(source_ids))
        sql = f"UPDATE food SET isCsvFood = 1 WHERE sourceId IN ({placeholders})"
        cursor.execute(sql, source_ids)
        return cursor.rowcount or 0

    def backfill(self) -> None:
        print(f"Starting CSV backfill from {self.csv_file_path}")
        print(
            "Target DB: "
            f"{self.db_config['user']}@{self.db_config['host']}:{self.db_config['port']}/{self.db_config['database']}"
        )

        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor()
        started_at = time.perf_counter()

        progress = tqdm(
            total=None,
            unit="rows",
            desc="Rows scanned",
            leave=True,
            dynamic_ncols=True,
            file=sys.stdout,
            disable=False,
        )

        try:
            for chunk in pd.read_csv(
                self.csv_file_path,
                skiprows=[0, 1, 2],
                chunksize=5000,
                low_memory=False,
            ):
                if "ID" not in chunk.columns:
                    raise RuntimeError(
                        "CSV header missing expected 'ID' column. "
                        f"Found columns: {', '.join(str(col) for col in chunk.columns)}"
                    )

                ids = [
                    cleaned
                    for raw_value in chunk["ID"].tolist()
                    if (cleaned := self._clean_string(raw_value))
                ]
                self.scanned_rows += len(chunk)
                progress.update(len(chunk))

                if not ids:
                    continue

                unique_ids = list(dict.fromkeys(ids))
                for i in range(0, len(unique_ids), self.update_batch_size):
                    batch = unique_ids[i : i + self.update_batch_size]
                    self.updated_rows += self._update_is_csv_food(cursor, batch)
                conn.commit()
        finally:
            cursor.close()
            conn.close()
            progress.close()

        elapsed_s = max(time.perf_counter() - started_at, 0.0001)
        print(f"Rows scanned: {self.scanned_rows}")
        print(f"Rows updated: {self.updated_rows}")
        print(f"Elapsed: {elapsed_s:.2f}s")

    def recreate_index(self) -> None:
        if not self.api_url:
            return
        print(f"Calling recreate index endpoint: {self.api_url}")
        request = urllib.request.Request(self.api_url, method="POST")
        with urllib.request.urlopen(request, timeout=30) as response:
            status = response.status
            body = response.read().decode("utf-8").strip()
        print(f"Recreate index response: {status} {body}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Backfill food.isCsvFood from CSV source IDs and recreate the search index."
    )
    parser.add_argument(
        "--csv-file",
        default="../data/MyFoodData Nutrition Facts SpreadSheet Release 1.4 - SR Legacy and FNDDS.csv",
        help="Path to MyFoodData CSV file.",
    )
    parser.add_argument(
        "--env-file",
        default=None,
        help="Optional path to .env file with DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME.",
    )
    parser.add_argument(
        "--recreate-index-url",
        default="http://localhost:3000/food/recreate-index",
        help="URL for the recreate index endpoint.",
    )
    parser.add_argument(
        "--skip-recreate-index",
        action="store_true",
        help="Skip calling the recreate index endpoint.",
    )
    parser.add_argument(
        "--update-batch-size",
        type=int,
        default=1000,
        help="How many source IDs to update per statement.",
    )

    args = parser.parse_args()

    backfill = CsvFoodBackfill(
        args.csv_file,
        env_file_path=args.env_file,
        api_url=None if args.skip_recreate_index else args.recreate_index_url,
        update_batch_size=args.update_batch_size,
    )
    backfill.backfill()
    backfill.recreate_index()
