import argparse
import csv
import os
import re
import sys
from pathlib import Path
from typing import Dict, Optional

import mysql.connector
from tqdm import tqdm


class FdcPortionMeasurementImporter:
    def __init__(
        self,
        fdc_dir: str,
        env_file_path: Optional[str] = None,
        batch_size: int = 1000,
    ):
        self.fdc_dir = Path(fdc_dir)
        self.env_file_path = env_file_path
        self.batch_size = max(batch_size, 1)
        self.db_config = self._load_db_config(env_file_path)

        self.rows_scanned = 0
        self.inserted = 0
        self.skipped_existing = 0
        self.skipped_missing_food = 0
        self.skipped_invalid = 0
        self.errors = 0

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
        if value is None:
            return None
        cleaned = str(value).strip()
        if cleaned in ("", "N/A", "NULL", "null", "None"):
            return None
        return cleaned

    def _clean_numeric(self, value) -> float:
        if value is None:
            return 0.0
        if isinstance(value, str):
            stripped = value.strip()
            if stripped in ("", "N/A", "NULL", "null", "None"):
                return 0.0
            stripped = stripped.replace(",", "")
            match = re.search(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", stripped)
            if not match:
                return 0.0
            try:
                return float(match.group(0))
            except ValueError:
                return 0.0
        try:
            return float(value)
        except (ValueError, TypeError):
            return 0.0

    def _create_abbreviation(self, description: str) -> str:
        cleaned = re.sub(r"^\d+(\.\d+)?\s*", "", description.lower()).strip()
        words = cleaned.split()
        if words:
            return words[0][:8]
        return description.lower().replace(" ", "")[:8]

    def _format_amount(self, amount: float) -> Optional[str]:
        if amount <= 0:
            return None
        if amount.is_integer():
            return str(int(amount))
        return f"{amount:g}"

    def _build_measurement(self, row: Dict[str, str], unit_name: str) -> Optional[Dict]:
        gram_weight = self._clean_numeric(row.get("gram_weight"))
        if gram_weight <= 0:
            return None

        amount = self._clean_numeric(row.get("amount"))
        modifier = self._clean_string(row.get("modifier")) or ""
        description = self._clean_string(row.get("portion_description"))
        if description:
            name = description
        else:
            amount_text = self._format_amount(amount) or ""
            parts = [amount_text, modifier, unit_name]
            name = " ".join([part for part in parts if part]).strip() or unit_name

        return {
            "unit": unit_name,
            "name": name,
            "abbreviation": self._create_abbreviation(name),
            "weightInGrams": gram_weight,
            "isDefault": False,
            "isFromSource": True,
        }

    def _load_unit_lookup(self) -> Dict[str, str]:
        measure_unit_path = self.fdc_dir / "measure_unit.csv"
        if not measure_unit_path.exists():
            raise FileNotFoundError(f"Missing required file: {measure_unit_path}")

        unit_lookup: Dict[str, str] = {}
        with measure_unit_path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                unit_id = self._clean_string(row.get("id"))
                name = self._clean_string(row.get("name"))
                if unit_id and name:
                    unit_lookup[unit_id] = name
        return unit_lookup

    def _ensure_measurement(
        self,
        cursor: mysql.connector.cursor.MySQLCursor,
        food_id: int,
        measurement: Dict,
    ) -> bool:
        sql = (
            "INSERT INTO food_measurement "
            "(foodId, unit, name, abbreviation, weightInGrams, isDefault, isActive, isFromSource) "
            "SELECT %s, %s, %s, %s, %s, %s, %s, %s "
            "FROM DUAL WHERE NOT EXISTS ("
            "SELECT 1 FROM food_measurement "
            "WHERE foodId = %s AND unit = %s AND name = %s AND abbreviation = %s "
            "AND ABS(weightInGrams - %s) < 0.01"
            ")"
        )
        cursor.execute(
            sql,
            (
                food_id,
                measurement["unit"],
                measurement["name"],
                measurement["abbreviation"],
                measurement["weightInGrams"],
                1 if measurement.get("isDefault") else 0,
                1,
                1 if measurement.get("isFromSource") else 0,
                food_id,
                measurement["unit"],
                measurement["name"],
                measurement["abbreviation"],
                measurement["weightInGrams"],
            ),
        )
        return bool(cursor.rowcount and cursor.rowcount > 0)

    def run(self) -> None:
        portion_path = self.fdc_dir / "food_portion.csv"
        if not portion_path.exists():
            raise FileNotFoundError(f"Missing required file: {portion_path}")

        print(f"Starting FDC portion measurement import from {portion_path}")
        print(
            "Target DB: "
            f"{self.db_config['user']}@{self.db_config['host']}:{self.db_config['port']}/{self.db_config['database']}"
        )
        print(f"Settings: batch_size={self.batch_size}")

        unit_lookup = self._load_unit_lookup()
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor()
        food_id_cache: Dict[str, int] = {}
        pending = 0

        try:
            with portion_path.open(newline="", encoding="utf-8") as handle:
                reader = csv.DictReader(handle)
                for row in tqdm(reader, desc="FDC portions", unit="rows", file=sys.stdout):
                    self.rows_scanned += 1

                    fdc_id = self._clean_string(row.get("fdc_id"))
                    if not fdc_id:
                        self.skipped_invalid += 1
                        continue

                    food_id = food_id_cache.get(fdc_id)
                    if food_id is None:
                        cursor.execute("SELECT id FROM food WHERE sourceId = %s LIMIT 1", (fdc_id,))
                        result = cursor.fetchone()
                        if not result:
                            food_id = 0
                        else:
                            food_id = int(result[0])
                        food_id_cache[fdc_id] = food_id
                        if len(food_id_cache) > 50000:
                            food_id_cache.clear()

                    if food_id == 0:
                        self.skipped_missing_food += 1
                        continue

                    unit_id = self._clean_string(row.get("measure_unit_id")) or ""
                    unit_name = unit_lookup.get(unit_id, "unit")
                    measurement = self._build_measurement(row, unit_name)
                    if measurement is None:
                        self.skipped_invalid += 1
                        continue

                    try:
                        if self._ensure_measurement(cursor, food_id, measurement):
                            self.inserted += 1
                        else:
                            self.skipped_existing += 1
                        pending += 1
                    except mysql.connector.Error:
                        conn.rollback()
                        pending = 0
                        self.errors += 1
                        continue

                    if pending >= self.batch_size:
                        conn.commit()
                        pending = 0
        finally:
            if pending:
                conn.commit()
            cursor.close()
            conn.close()

        print(f"Rows scanned: {self.rows_scanned}")
        print(f"Measurements inserted: {self.inserted}")
        print(f"Measurements skipped (already existed): {self.skipped_existing}")
        print(f"Rows skipped (food not found): {self.skipped_missing_food}")
        print(f"Rows skipped (invalid data): {self.skipped_invalid}")
        print(f"Row errors: {self.errors}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Import FDC food_portion.csv measurements into food_measurement table."
    )
    parser.add_argument(
        "--fdc-dir",
        default="../data/FoodData_Central_foundation_food_csv_2025-12-18",
        help="Directory containing food_portion.csv and measure_unit.csv.",
    )
    parser.add_argument(
        "--env-file",
        default=None,
        help="Optional path to .env file with DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME.",
    )
    parser.add_argument("--batch-size", type=int, default=1000, help="Rows per DB transaction.")

    args = parser.parse_args()

    importer = FdcPortionMeasurementImporter(
        fdc_dir=args.fdc_dir,
        env_file_path=args.env_file,
        batch_size=args.batch_size,
    )
    importer.run()
