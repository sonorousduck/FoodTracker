import argparse
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional

import mysql.connector
import pandas as pd
from tqdm import tqdm


class OpenFoodFactsImporter:
    FOOD_COLUMNS = [
        "sourceId",
        "name",
        "brand",
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "transFat",
        "cholesterol",
        "addedSugar",
        "solubleFiber",
        "insolubleFiber",
        "water",
        "omega3",
        "omega6",
        "monoFat",
        "polyFat",
        "ala",
        "epa",
        "dha",
        "calcium",
        "iron",
        "potassium",
        "magnesium",
        "phosphorus",
        "zinc",
        "copper",
        "manganese",
        "selenium",
        "fluoride",
        "molybdenum",
        "chlorine",
        "vitaminArae",
        "vitaminC",
        "vitaminB1",
        "vitaminB2",
        "vitaminB3",
        "vitaminB6",
        "vitaminB12",
        "folate",
        "vitaminD",
        "vitaminE",
        "vitaminK",
        "betaine",
        "choline",
        "caroteneBeta",
    ]

    def __init__(
        self,
        csv_file_path: str,
        env_file_path: Optional[str] = None,
    ):
        self.csv_file_path = csv_file_path
        self.env_file_path = env_file_path

        self.success_count = 0
        self.error_count = 0
        self.skipped_count = 0
        self.submitted_count = 0
        self.batch_success_count = 0
        self.batch_fail_count = 0
        self.errors: List[str] = []

        self.db_config = self._load_db_config(env_file_path)

    def _load_db_config(self, env_file_path: Optional[str]) -> Dict[str, object]:
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
        if pd.isna(value) or value == "" or value == "N/A":
            return None
        return str(value).strip()

    def _clean_numeric(self, value) -> float:
        if pd.isna(value) or value == "" or value == "N/A":
            return 0.0
        try:
            return float(value)
        except (ValueError, TypeError):
            return 0.0

    def _grams_to_mg(self, value: float) -> float:
        return value * 1000.0

    def _maybe_g_to_mg(self, value: float) -> float:
        if value <= 10:
            return self._grams_to_mg(value)
        return value

    def _sodium_mg(self, row: Dict) -> float:
        sodium_g = self._clean_numeric(row.get("sodium_100g", 0))
        if sodium_g > 0:
            return self._grams_to_mg(sodium_g)

        salt_g = self._clean_numeric(row.get("salt_100g", 0))
        if salt_g > 0:
            return self._grams_to_mg(salt_g) * 0.4

        return 0.0

    def _calories(self, row: Dict) -> int:
        kcal = self._clean_numeric(row.get("energy-kcal_100g", 0))
        if kcal > 0:
            return int(round(kcal))

        kj = self._clean_numeric(row.get("energy-kj_100g", 0)) or self._clean_numeric(
            row.get("energy_100g", 0)
        )
        if kj > 0:
            return int(round(kj / 4.184))

        return 0

    def _build_measurements(self) -> List[Dict]:
        return [
            {
                "name": "100 grams",
                "abbreviation": "100g",
                "unit": "g",
                "weightInGrams": 100.0,
                "isDefault": True,
                "isFromSource": True,
            },
            {
                "name": "1 gram",
                "abbreviation": "1g",
                "unit": "g",
                "weightInGrams": 1.0,
                "isDefault": False,
                "isFromSource": True,
            },
        ]

    def _row_to_payload(self, row: Dict) -> Optional[Dict]:
        barcode = self._clean_string(row.get("code"))
        name = self._clean_string(row.get("product_name")) or self._clean_string(row.get("generic_name"))

        if not barcode or not name:
            return None

        food = {
            "sourceId": barcode,
            "name": name,
            "brand": self._clean_string(row.get("brands")),
            "foodGroup": self._clean_string(row.get("categories_en")),
            "calories": self._calories(row),
            "protein": self._clean_numeric(row.get("proteins_100g", 0)),
            "carbs": self._clean_numeric(row.get("carbohydrates_100g", 0)),
            "fat": self._clean_numeric(row.get("fat_100g", 0)),
            "fiber": self._clean_numeric(row.get("fiber_100g", 0)),
            "sugar": self._clean_numeric(row.get("sugars_100g", 0)),
            "sodium": self._sodium_mg(row),
            "saturatedFat": self._clean_numeric(row.get("saturated-fat_100g", 0)),
            "transFat": self._clean_numeric(row.get("trans-fat_100g", 0)),
            "cholesterol": self._maybe_g_to_mg(self._clean_numeric(row.get("cholesterol_100g", 0))),
            "addedSugar": self._clean_numeric(row.get("added-sugars_100g", 0)),
            "solubleFiber": self._clean_numeric(row.get("soluble-fiber_100g", 0)),
            "insolubleFiber": self._clean_numeric(row.get("insoluble-fiber_100g", 0)),
            "water": self._clean_numeric(row.get("water_100g", 0)),
            "omega3": self._maybe_g_to_mg(self._clean_numeric(row.get("omega-3-fat_100g", 0))),
            "omega6": self._maybe_g_to_mg(self._clean_numeric(row.get("omega-6-fat_100g", 0))),
            "monoFat": self._maybe_g_to_mg(self._clean_numeric(row.get("monounsaturated-fat_100g", 0))),
            "polyFat": self._maybe_g_to_mg(self._clean_numeric(row.get("polyunsaturated-fat_100g", 0))),
            "ala": self._maybe_g_to_mg(self._clean_numeric(row.get("alpha-linolenic-acid_100g", 0))),
            "epa": self._maybe_g_to_mg(self._clean_numeric(row.get("eicosapentaenoic-acid_100g", 0))),
            "dha": self._maybe_g_to_mg(self._clean_numeric(row.get("docosahexaenoic-acid_100g", 0))),
            "calcium": self._clean_numeric(row.get("calcium_100g", 0)),
            "iron": self._clean_numeric(row.get("iron_100g", 0)),
            "potassium": self._clean_numeric(row.get("potassium_100g", 0)),
            "magnesium": self._clean_numeric(row.get("magnesium_100g", 0)),
            "phosphorus": self._clean_numeric(row.get("phosphorus_100g", 0)),
            "zinc": self._clean_numeric(row.get("zinc_100g", 0)),
            "copper": self._clean_numeric(row.get("copper_100g", 0)),
            "manganese": self._clean_numeric(row.get("manganese_100g", 0)),
            "selenium": self._clean_numeric(row.get("selenium_100g", 0)),
            "fluoride": self._clean_numeric(row.get("fluoride_100g", 0)),
            "molybdenum": self._clean_numeric(row.get("molybdenum_100g", 0)),
            "chlorine": self._clean_numeric(row.get("chloride_100g", 0)),
            "vitaminArae": self._clean_numeric(row.get("vitamin-a_100g", 0)),
            "vitaminC": self._clean_numeric(row.get("vitamin-c_100g", 0)),
            "vitaminB1": self._clean_numeric(row.get("vitamin-b1_100g", 0)),
            "vitaminB2": self._clean_numeric(row.get("vitamin-b2_100g", 0)),
            "vitaminB3": self._clean_numeric(row.get("vitamin-pp_100g", 0)),
            "vitaminB6": self._clean_numeric(row.get("vitamin-b6_100g", 0)),
            "vitaminB12": self._clean_numeric(row.get("vitamin-b12_100g", 0)),
            "folate": self._clean_numeric(row.get("folates_100g", 0) or row.get("vitamin-b9_100g", 0)),
            "vitaminD": self._clean_numeric(row.get("vitamin-d_100g", 0)),
            "vitaminE": self._clean_numeric(row.get("vitamin-e_100g", 0)),
            "vitaminK": self._clean_numeric(row.get("vitamin-k_100g", 0)),
            "betaine": self._clean_numeric(row.get("betaine_100g", 0)),
            "choline": self._clean_numeric(row.get("choline_100g", 0)),
            "caroteneBeta": self._clean_numeric(row.get("beta-carotene_100g", 0)),
        }

        return {"barcode": barcode, "food": food, "measurements": self._build_measurements()}

    def _insert_or_update_food(self, cursor: mysql.connector.cursor.MySQLCursor, food: Dict) -> int:
        placeholders = ", ".join(["%s"] * len(self.FOOD_COLUMNS))
        columns_sql = ", ".join(self.FOOD_COLUMNS)
        update_columns = [column for column in self.FOOD_COLUMNS if column != "sourceId"]
        update_sql = ", ".join([f"{column}=VALUES({column})" for column in update_columns])

        sql = (
            f"INSERT INTO food ({columns_sql}) VALUES ({placeholders}) "
            f"ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), {update_sql}"
        )

        values = [food.get(column) for column in self.FOOD_COLUMNS]
        cursor.execute(sql, values)
        return int(cursor.lastrowid)

    def _validate_food_columns(self, conn: mysql.connector.MySQLConnection) -> None:
        cursor = conn.cursor()
        try:
            cursor.execute("SHOW COLUMNS FROM food")
            existing_columns = {str(row[0]) for row in cursor.fetchall()}
        finally:
            cursor.close()

        missing_columns = [column for column in self.FOOD_COLUMNS if column not in existing_columns]
        if missing_columns:
            raise RuntimeError(
                "Food table is missing required columns for this importer: "
                + ", ".join(missing_columns)
            )

    def _ensure_measurements(
        self,
        cursor: mysql.connector.cursor.MySQLCursor,
        food_id: int,
        measurements: List[Dict],
    ) -> None:
        sql = (
            "INSERT INTO food_measurement "
            "(foodId, unit, name, abbreviation, weightInGrams, isDefault, isActive, isFromSource) "
            "SELECT %s, %s, %s, %s, %s, %s, %s, %s "
            "FROM DUAL WHERE NOT EXISTS ("
            "SELECT 1 FROM food_measurement WHERE foodId = %s AND abbreviation = %s"
            ")"
        )

        for measurement in measurements:
            abbreviation = measurement["abbreviation"]
            cursor.execute(
                sql,
                (
                    food_id,
                    measurement["unit"],
                    measurement["name"],
                    abbreviation,
                    measurement["weightInGrams"],
                    1 if measurement.get("isDefault") else 0,
                    1,
                    1 if measurement.get("isFromSource") else 0,
                    food_id,
                    abbreviation,
                ),
            )

    def _insert_or_update_barcode(
        self,
        cursor: mysql.connector.cursor.MySQLCursor,
        barcode: str,
        food_id: int,
    ) -> None:
        sql = (
            "INSERT INTO food_barcode (barcode, foodId) VALUES (%s, %s) "
            "ON DUPLICATE KEY UPDATE foodId=VALUES(foodId)"
        )
        cursor.execute(sql, (barcode, food_id))

    def _write_batch(self, conn: mysql.connector.MySQLConnection, batch: List[Dict], batch_id: int) -> Dict:
        started = time.perf_counter()
        cursor = conn.cursor()

        try:
            for item in batch:
                food_id = self._insert_or_update_food(cursor, item["food"])
                self._ensure_measurements(cursor, food_id, item["measurements"])
                self._insert_or_update_barcode(cursor, item["barcode"], food_id)

            conn.commit()
            latency = time.perf_counter() - started
            return {
                "ok": True,
                "rows": len(batch),
                "batch_id": batch_id,
                "latency_s": latency,
                "error": "",
            }
        except mysql.connector.Error as exc:
            conn.rollback()
            latency = time.perf_counter() - started
            return {
                "ok": False,
                "rows": len(batch),
                "batch_id": batch_id,
                "latency_s": latency,
                "error": str(exc),
            }
        finally:
            cursor.close()

    def import_barcodes(
        self,
        batch_size: int = 100,
        max_error_examples: int = 10,
    ):
        print(f"Starting OpenFoodFacts import from {self.csv_file_path}")
        print(
            "Target DB: "
            f"{self.db_config['user']}@{self.db_config['host']}:{self.db_config['port']}/{self.db_config['database']}"
        )
        print(f"Settings: batch_size={batch_size}")

        print("Reading header to determine available columns...")
        header = pd.read_csv(self.csv_file_path, sep="\t", nrows=0)
        available_columns = set(header.columns)
        desired_columns = {
            "code",
            "product_name",
            "generic_name",
            "brands",
            "categories_en",
            "energy-kcal_100g",
            "energy-kj_100g",
            "energy_100g",
            "fat_100g",
            "saturated-fat_100g",
            "trans-fat_100g",
            "cholesterol_100g",
            "carbohydrates_100g",
            "sugars_100g",
            "added-sugars_100g",
            "fiber_100g",
            "soluble-fiber_100g",
            "insoluble-fiber_100g",
            "proteins_100g",
            "salt_100g",
            "sodium_100g",
            "omega-3-fat_100g",
            "omega-6-fat_100g",
            "monounsaturated-fat_100g",
            "polyunsaturated-fat_100g",
            "alpha-linolenic-acid_100g",
            "eicosapentaenoic-acid_100g",
            "docosahexaenoic-acid_100g",
            "water_100g",
            "calcium_100g",
            "iron_100g",
            "potassium_100g",
            "magnesium_100g",
            "phosphorus_100g",
            "zinc_100g",
            "copper_100g",
            "manganese_100g",
            "selenium_100g",
            "fluoride_100g",
            "molybdenum_100g",
            "chloride_100g",
            "vitamin-a_100g",
            "vitamin-b1_100g",
            "vitamin-b2_100g",
            "vitamin-pp_100g",
            "vitamin-b6_100g",
            "vitamin-b9_100g",
            "folates_100g",
            "vitamin-b12_100g",
            "vitamin-c_100g",
            "vitamin-d_100g",
            "vitamin-e_100g",
            "vitamin-k_100g",
            "beta-carotene_100g",
            "betaine_100g",
            "choline_100g",
        }

        usecols = sorted(desired_columns.intersection(available_columns))
        if "code" not in usecols:
            raise ValueError("CSV is missing required 'code' column.")
        print(f"Using {len(usecols)} columns from CSV.")

        batch: List[Dict] = []
        processed_rows = 0
        submitted_batches = 0
        total_latency_s = 0.0
        started_at = time.perf_counter()

        rows_progress = tqdm(
            total=None,
            unit="rows",
            desc="Rows scanned",
            leave=True,
            dynamic_ncols=True,
            file=sys.stdout,
            disable=False,
            position=0,
        )
        batches_progress = tqdm(
            total=None,
            unit="batch",
            desc="Batches written",
            leave=True,
            dynamic_ncols=True,
            file=sys.stdout,
            disable=False,
            position=1,
        )

        conn = mysql.connector.connect(**self.db_config)
        self._validate_food_columns(conn)

        def flush_batch(force: bool = False) -> None:
            nonlocal batch, submitted_batches, total_latency_s
            if not batch:
                return
            if not force and len(batch) < batch_size:
                return

            submitted_batches += 1
            self.submitted_count += len(batch)
            result = self._write_batch(conn, batch, submitted_batches)
            total_latency_s += result["latency_s"]
            batches_progress.update(1)

            if result["ok"]:
                self.success_count += result["rows"]
                self.batch_success_count += 1
                tqdm.write(
                    f"OK    batch={result['batch_id']} rows={result['rows']} latency={result['latency_s']:.2f}s"
                )
            else:
                self.error_count += result["rows"]
                self.batch_fail_count += 1
                if len(self.errors) < max_error_examples:
                    self.errors.append(
                        f"batch={result['batch_id']} rows={result['rows']} error={result['error']}"
                    )
                tqdm.write(
                    f"FAIL  batch={result['batch_id']} rows={result['rows']} error={result['error']}"
                )

            batch = []

        try:
            for chunk in pd.read_csv(
                self.csv_file_path,
                sep="\t",
                usecols=usecols,
                chunksize=5000,
                dtype={"code": str},
                low_memory=False,
            ):
                for row in chunk.to_dict(orient="records"):
                    processed_rows += 1
                    payload = self._row_to_payload(row)
                    if payload is None:
                        self.skipped_count += 1
                        rows_progress.update(1)
                        continue

                    batch.append(payload)
                    rows_progress.update(1)

                    if len(batch) >= batch_size:
                        flush_batch(force=True)

            flush_batch(force=True)
        finally:
            conn.close()
            rows_progress.close()
            batches_progress.close()

        elapsed_s = max(time.perf_counter() - started_at, 0.0001)
        avg_latency_s = total_latency_s / max(self.batch_success_count + self.batch_fail_count, 1)

        print(f"Batches written: {submitted_batches}")
        print(f"Rows processed: {processed_rows}")
        print(f"Rows skipped (missing barcode/name): {self.skipped_count}")
        print(f"Rows submitted: {self.submitted_count}")
        print(f"Successful rows written: {self.success_count}")
        print(f"Failed rows written: {self.error_count}")
        print(f"Successful batches: {self.batch_success_count}")
        print(f"Failed batches: {self.batch_fail_count}")
        print(f"Avg batch latency: {avg_latency_s:.2f}s")
        print(f"Throughput: {self.success_count / elapsed_s:.1f} successful rows/sec")

        print("\n" + "=" * 50)
        print("IMPORT SUMMARY")
        print("=" * 50)
        if self.errors:
            print(f"First {len(self.errors)} errors: {self.errors}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import OpenFoodFacts barcodes directly into MySQL.")
    parser.add_argument(
        "--csv-file",
        default="/home/telesto/en.openfoodfacts.org.products.csv",
        help="Path to OpenFoodFacts TSV file.",
    )
    parser.add_argument(
        "--env-file",
        default=None,
        help="Optional path to .env file containing DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME.",
    )
    parser.add_argument("--batch-size", type=int, default=100, help="Rows per DB transaction.")
    parser.add_argument(
        "--max-error-examples",
        type=int,
        default=10,
        help="Maximum number of detailed errors to keep in summary.",
    )

    args = parser.parse_args()

    importer = OpenFoodFactsImporter(args.csv_file, args.env_file)
    importer.import_barcodes(
        batch_size=args.batch_size,
        max_error_examples=args.max_error_examples,
    )
