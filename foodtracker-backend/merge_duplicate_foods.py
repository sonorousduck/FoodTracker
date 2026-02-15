import argparse
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import mysql.connector
from tqdm import tqdm


class DuplicateFoodMerger:
    def __init__(self, env_file_path: Optional[str] = None):
        self.env_file_path = env_file_path
        self.db_config = self._load_db_config(env_file_path)
        self.groups_processed = 0
        self.foods_deleted = 0
        self.measurements_updated = 0
        self.entries_updated = 0
        self.recipe_foods_updated = 0
        self.barcodes_updated = 0

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

    def _fetch_duplicate_groups(
        self, cursor: mysql.connector.cursor.MySQLCursor
    ) -> List[Tuple[str, int, List[int]]]:
        cursor.execute(
            "SELECT name, calories, GROUP_CONCAT(id ORDER BY id) AS ids, COUNT(*) AS cnt "
            "FROM food GROUP BY name, calories HAVING cnt > 1"
        )
        results: List[Tuple[str, int, List[int]]] = []
        for name, calories, ids_str, _ in cursor.fetchall():
            ids = [int(value) for value in str(ids_str).split(",") if value]
            if len(ids) < 2:
                continue
            results.append((name, int(calories), ids))
        return results

    def merge(self) -> None:
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor()

        try:
            groups = self._fetch_duplicate_groups(cursor)
            for name, calories, ids in tqdm(
                groups,
                desc="Duplicate groups merged",
                unit="group",
                dynamic_ncols=True,
            ):
                canonical_id = ids[0]
                duplicate_ids = ids[1:]
                if not duplicate_ids:
                    continue

                try:
                    for duplicate_id in duplicate_ids:
                        cursor.execute(
                            "UPDATE food_measurement SET foodId = %s WHERE foodId = %s",
                            (canonical_id, duplicate_id),
                        )
                        self.measurements_updated += cursor.rowcount

                        cursor.execute(
                            "UPDATE food_entry SET foodId = %s WHERE foodId = %s",
                            (canonical_id, duplicate_id),
                        )
                        self.entries_updated += cursor.rowcount

                        cursor.execute(
                            "UPDATE recipe_food SET foodId = %s WHERE foodId = %s",
                            (canonical_id, duplicate_id),
                        )
                        self.recipe_foods_updated += cursor.rowcount

                        cursor.execute(
                            "UPDATE food_barcode SET foodId = %s WHERE foodId = %s",
                            (canonical_id, duplicate_id),
                        )
                        self.barcodes_updated += cursor.rowcount

                        cursor.execute("DELETE FROM food WHERE id = %s", (duplicate_id,))
                        self.foods_deleted += cursor.rowcount

                    conn.commit()
                    self.groups_processed += 1
                except mysql.connector.Error:
                    conn.rollback()
                    raise
        finally:
            cursor.close()
            conn.close()

        print("Duplicate food merge complete.")
        print(f"Groups processed: {self.groups_processed}")
        print(f"Foods deleted: {self.foods_deleted}")
        print(f"Measurements updated: {self.measurements_updated}")
        print(f"Food entries updated: {self.entries_updated}")
        print(f"Recipe foods updated: {self.recipe_foods_updated}")
        print(f"Barcodes updated: {self.barcodes_updated}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Merge duplicate foods by name + calories and repoint related rows."
    )
    parser.add_argument(
        "--env-file",
        default=None,
        help="Optional path to .env file with DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME.",
    )
    args = parser.parse_args()

    merger = DuplicateFoodMerger(args.env_file)
    merger.merge()
