import argparse
import os
import re
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional

import mysql.connector
import pandas as pd
from tqdm import tqdm


class MyFoodDataImporter:
    FOOD_COLUMNS = [
        "sourceId",
        "name",
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
        "netCarbs",
        "solubleFiber",
        "insolubleFiber",
        "water",
        "pralScore",
        "omega3",
        "omega6",
        "monoFat",
        "polyFat",
        "ala",
        "epa",
        "dpa",
        "dha",
        "calcium",
        "iron",
        "potassium",
        "magnesium",
        "vitaminAiu",
        "vitaminArae",
        "vitaminC",
        "vitaminB12",
        "vitaminD",
        "vitaminD2",
        "vitaminD3",
        "vitaminDiu",
        "vitaminE",
        "phosphorus",
        "zinc",
        "copper",
        "manganese",
        "selenium",
        "fluoride",
        "molybdenum",
        "chlorine",
        "vitaminB1",
        "vitaminB2",
        "vitaminB3",
        "vitaminB5",
        "vitaminB6",
        "biotin",
        "folate",
        "folicAcid",
        "foodFolate",
        "folateDfe",
        "vitaminK",
        "dihydrophylloquinone",
        "menaquinone4",
        "choline",
        "betaine",
        "retinol",
        "caroteneBeta",
        "caroteneAlpha",
        "lycopene",
        "luteinZeaxanthin",
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

    def _clean_numeric(self, value) -> float:
        if pd.isna(value) or value in ("", "N/A", "NULL", "null", "None"):
            return 0.0
        try:
            return float(value)
        except (ValueError, TypeError):
            return 0.0

    def _create_abbreviation(self, description: str) -> str:
        cleaned = re.sub(r"^\d+\s*", "", description.lower())
        cleaned = re.sub(
            r"\s*(piece|pieces|slice|slices|cup|cups|tablespoon|teaspoon)\s*",
            r"\1",
            cleaned,
        )
        words = cleaned.split()
        if words:
            return words[0][:8]
        return description.lower().replace(" ", "")[:8]

    def _create_unit_label(self, description: str) -> str:
        cleaned = re.sub(r"^\d+(\.\d+)?\s*", "", description).strip()
        return cleaned or description.strip()

    def _build_measurements(self, row: Dict) -> List[Dict]:
        measurements = [
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

        for i in range(1, 10):
            weight_col = f"Serving Weight {i} (g)"
            desc_col = f"Serving Description {i} (g)"

            if weight_col in row and desc_col in row:
                weight = self._clean_numeric(row[weight_col])
                description = self._clean_string(row[desc_col])

                if weight > 0 and description:
                    measurements.append(
                        {
                            "name": description,
                            "unit": self._create_unit_label(description),
                            "abbreviation": self._create_abbreviation(description),
                            "weightInGrams": weight,
                            "isDefault": False,
                            "isFromSource": True,
                        }
                    )

        return measurements

    def _row_to_payload(self, row: Dict) -> Optional[Dict]:
        name = self._clean_string(row.get("Name"))
        if not name:
            return None

        food = {
            "sourceId": self._clean_string(row.get("ID")),
            "name": name,
            "calories": int(self._clean_numeric(row.get("Calories", 0))),
            "protein": self._clean_numeric(row.get("Protein (g)", 0)),
            "carbs": self._clean_numeric(row.get("Carbohydrate (g)", 0)),
            "fat": self._clean_numeric(row.get("Fat (g)", 0)),
            "fiber": self._clean_numeric(row.get("Fiber (g)", 0)),
            "sugar": self._clean_numeric(row.get("Sugars (g)", 0)),
            "sodium": self._clean_numeric(row.get("Sodium (mg)", 0)),
            "saturatedFat": self._clean_numeric(row.get("Saturated Fats (g)", 0)),
            "transFat": self._clean_numeric(row.get("Trans Fatty Acids (g)", 0)),
            "cholesterol": self._clean_numeric(row.get("Cholesterol (mg)", 0)),
            "addedSugar": self._clean_numeric(row.get("Added Sugar (g)", 0)),
            "netCarbs": self._clean_numeric(row.get("Net-Carbs (g)", 0)),
            "solubleFiber": self._clean_numeric(row.get("Soluble Fiber (g)", 0)),
            "insolubleFiber": self._clean_numeric(row.get("Insoluble Fiber (g)", 0)),
            "water": self._clean_numeric(row.get("Water (g)", 0)),
            "pralScore": self._clean_numeric(row.get("PRAL score", 0)),
            "omega3": self._clean_numeric(row.get("Omega 3s (mg)", 0)),
            "omega6": self._clean_numeric(row.get("Omega 6s (mg)", 0)),
            "monoFat": self._clean_numeric(row.get("Fatty acids, total monounsaturated (mg)", 0)),
            "polyFat": self._clean_numeric(row.get("Fatty acids, total polyunsaturated (mg)", 0)),
            "ala": self._clean_numeric(row.get("18:3 n-3 c,c,c (ALA) (mg)", 0)),
            "epa": self._clean_numeric(row.get("20:5 n-3 (EPA) (mg)", 0)),
            "dpa": self._clean_numeric(row.get("22:5 n-3 (DPA) (mg)", 0)),
            "dha": self._clean_numeric(row.get("22:6 n-3 (DHA) (mg)", 0)),
            "calcium": self._clean_numeric(row.get("Calcium (mg)", 0)),
            "iron": self._clean_numeric(row.get("Iron, Fe (mg)", 0)),
            "potassium": self._clean_numeric(row.get("Potassium, K (mg)", 0)),
            "magnesium": self._clean_numeric(row.get("Magnesium (mg)", 0)),
            "vitaminAiu": self._clean_numeric(row.get("Vitamin A, IU (IU)", 0)),
            "vitaminArae": self._clean_numeric(row.get("Vitamin A, RAE (mcg)", 0)),
            "vitaminC": self._clean_numeric(row.get("Vitamin C (mg)", 0)),
            "vitaminB12": self._clean_numeric(row.get("Vitamin B-12 (mcg)", 0)),
            "vitaminD": self._clean_numeric(row.get("Vitamin D (mcg)", 0)),
            "vitaminD2": self._clean_numeric(row.get("Vitamin D2 (ergocalciferol) (mcg)", 0)),
            "vitaminD3": self._clean_numeric(row.get("Vitamin D3 (cholecalciferol) (mcg)", 0)),
            "vitaminDiu": self._clean_numeric(row.get("Vitamin D (IU) (IU)", 0)),
            "vitaminE": self._clean_numeric(row.get("Vitamin E (Alpha-Tocopherol) (mg)", 0)),
            "phosphorus": self._clean_numeric(row.get("Phosphorus, P (mg)", 0)),
            "zinc": self._clean_numeric(row.get("Zinc, Zn (mg)", 0)),
            "copper": self._clean_numeric(row.get("Copper, Cu (mg)", 0)),
            "manganese": self._clean_numeric(row.get("Manganese (mg)", 0)),
            "selenium": self._clean_numeric(row.get("Selenium, Se (mcg)", 0)),
            "fluoride": self._clean_numeric(row.get("Fluoride, F (mcg)", 0)),
            "molybdenum": self._clean_numeric(row.get("Molybdenum (mcg)", 0)),
            "chlorine": self._clean_numeric(row.get("Chlorine (mg)", 0)),
            "vitaminB1": self._clean_numeric(row.get("Thiamin (B1) (mg)", 0)),
            "vitaminB2": self._clean_numeric(row.get("Riboflavin (B2) (mg)", 0)),
            "vitaminB3": self._clean_numeric(row.get("Niacin (B3) (mg)", 0)),
            "vitaminB5": self._clean_numeric(row.get("Pantothenic acid (B5) (mg)", 0)),
            "vitaminB6": self._clean_numeric(row.get("Vitamin B6 (mg)", 0)),
            "biotin": self._clean_numeric(row.get("Biotin (B7) (mcg)", 0)),
            "folate": self._clean_numeric(row.get("Folate (B9) (mcg)", 0)),
            "folicAcid": self._clean_numeric(row.get("Folic acid (mcg)", 0)),
            "foodFolate": self._clean_numeric(row.get("Food Folate (mcg)", 0)),
            "folateDfe": self._clean_numeric(row.get("Folate DFE (mcg)", 0)),
            "vitaminK": self._clean_numeric(row.get("Vitamin K (mcg)", 0)),
            "dihydrophylloquinone": self._clean_numeric(row.get("Dihydrophylloquinone (mcg)", 0)),
            "menaquinone4": self._clean_numeric(row.get("Menaquinone-4 (mcg)", 0)),
            "choline": self._clean_numeric(row.get("Choline (mg)", 0)),
            "betaine": self._clean_numeric(row.get("Betaine (mg)", 0)),
            "retinol": self._clean_numeric(row.get("Retinol (mcg)", 0)),
            "caroteneBeta": self._clean_numeric(row.get("Carotene, beta (mcg)", 0)),
            "caroteneAlpha": self._clean_numeric(row.get("Carotene, alpha (mcg)", 0)),
            "lycopene": self._clean_numeric(row.get("Lycopene (mcg)", 0)),
            "luteinZeaxanthin": self._clean_numeric(row.get("Lutein + Zeaxanthin (mcg)", 0)),
        }

        return {"food": food, "measurements": self._build_measurements(row)}

    def _validate_food_columns(self, conn: mysql.connector.MySQLConnection) -> None:
        cursor = conn.cursor()
        try:
            cursor.execute("SHOW COLUMNS FROM food")
            existing_columns = {str(row[0]) for row in cursor.fetchall()}
        finally:
            cursor.close()

        missing_columns = [col for col in self.FOOD_COLUMNS if col not in existing_columns]
        if missing_columns:
            raise RuntimeError(
                "Food table is missing required columns: " + ", ".join(missing_columns)
            )

    def _insert_or_update_food(self, cursor: mysql.connector.cursor.MySQLCursor, food: Dict) -> int:
        placeholders = ", ".join(["%s"] * len(self.FOOD_COLUMNS))
        columns_sql = ", ".join(self.FOOD_COLUMNS)
        update_columns = [col for col in self.FOOD_COLUMNS if col != "sourceId"]
        update_sql = ", ".join([f"{col}=VALUES({col})" for col in update_columns])

        sql = (
            f"INSERT INTO food ({columns_sql}) VALUES ({placeholders}) "
            f"ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), {update_sql}"
        )

        values = [food.get(col) for col in self.FOOD_COLUMNS]
        cursor.execute(sql, values)
        return int(cursor.lastrowid)

    def _find_food_id_by_name(
        self,
        cursor: mysql.connector.cursor.MySQLCursor,
        name: str,
    ) -> Optional[int]:
        cursor.execute(
            "SELECT id FROM food WHERE name = %s ORDER BY id LIMIT 1",
            (name,),
        )
        row = cursor.fetchone()
        if not row:
            return None
        return int(row[0])

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

    def _write_batch(self, conn: mysql.connector.MySQLConnection, batch: List[Dict], batch_id: int) -> Dict:
        started = time.perf_counter()
        cursor = conn.cursor()

        try:
            for item in batch:
                food_name = item["food"]["name"]
                food_id = self._find_food_id_by_name(cursor, food_name)
                if food_id is None:
                    food_id = self._insert_or_update_food(cursor, item["food"])
                self._ensure_measurements(cursor, food_id, item["measurements"])

            conn.commit()
            latency = time.perf_counter() - started
            return {"ok": True, "rows": len(batch), "batch_id": batch_id, "latency_s": latency, "error": ""}
        except mysql.connector.Error as exc:
            conn.rollback()
            latency = time.perf_counter() - started
            return {"ok": False, "rows": len(batch), "batch_id": batch_id, "latency_s": latency, "error": str(exc)}
        finally:
            cursor.close()

    def import_foods(self, batch_size: int = 100, max_error_examples: int = 10) -> None:
        print(f"Starting MyFoodData import from {self.csv_file_path}")
        print(
            "Target DB: "
            f"{self.db_config['user']}@{self.db_config['host']}:{self.db_config['port']}/{self.db_config['database']}"
        )
        print(f"Settings: batch_size={batch_size}")

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
            # The CSV has 3 non-data rows before the header row; skiprows=[0,1,2] drops them.
            for chunk in pd.read_csv(
                self.csv_file_path,
                skiprows=[0, 1, 2],
                chunksize=5000,
                low_memory=False,
            ):
                if "Name" not in chunk.columns:
                    raise RuntimeError(
                        "CSV header missing expected 'Name' column. "
                        f"Found columns: {', '.join(str(col) for col in chunk.columns)}"
                    )
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
        print(f"Rows skipped (missing name): {self.skipped_count}")
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
    parser = argparse.ArgumentParser(description="Import MyFoodData CSV directly into MySQL.")
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
    parser.add_argument("--batch-size", type=int, default=100, help="Rows per DB transaction.")
    parser.add_argument(
        "--max-error-examples",
        type=int,
        default=10,
        help="Maximum number of detailed errors to keep in summary.",
    )

    args = parser.parse_args()

    importer = MyFoodDataImporter(args.csv_file, args.env_file)
    importer.import_foods(
        batch_size=args.batch_size,
        max_error_examples=args.max_error_examples,
    )
