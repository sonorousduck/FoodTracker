import argparse
import csv
import json
import os
import re
import sqlite3
import sys
import tempfile
import time
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

import mysql.connector
import pandas as pd
import requests
from tqdm import tqdm


class FdcOpenFoodFactsImporter:
    IMPORT_STAGES = ("fdc", "fdc-portions", "openfoodfacts")
    FOOD_COLUMNS = [
        "sourceId",
        "isCsvFood",
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
        fdc_dir: Path,
        openfoodfacts_csv: Path,
        env_file_path: Optional[str],
        batch_size: int,
        max_foods: Optional[int],
        max_openfoodfacts: Optional[int],
        start_at: str = "fdc",
        stop_after: Optional[str] = None,
        es_url: str = "http://localhost:9200",
        es_index: str = "foods",
        skip_es_reindex: bool = False,
        drop_elasticsearch_db: bool = False,
    ) -> None:
        self.fdc_dir = fdc_dir
        self.openfoodfacts_csv = openfoodfacts_csv
        self.env_file_path = env_file_path
        self.batch_size = batch_size
        self.max_foods = max_foods
        self.max_openfoodfacts = max_openfoodfacts
        self.start_at = start_at
        self.stop_after = stop_after
        self.es_url = es_url.rstrip("/")
        self.es_index = es_index
        self.skip_es_reindex = skip_es_reindex
        self.drop_elasticsearch_db = drop_elasticsearch_db

        self.success_count = 0
        self.error_count = 0
        self.skipped_count = 0
        self.measurements_added_count = 0
        self.barcodes_added_count = 0
        self.openfoodfacts_new_count = 0
        self.openfoodfacts_matched_count = 0

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
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return None
        cleaned = str(value).strip()
        if not cleaned or cleaned in ("N/A", "NULL", "null", "None", "nan"):
            return None
        return cleaned

    def _clean_numeric(self, value) -> float:
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return 0.0
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped or stripped in ("N/A", "NULL", "null", "None", "nan"):
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

    def _standardize_food_name(self, value: Optional[str]) -> Optional[str]:
        cleaned = self._clean_string(value)
        if not cleaned:
            return None

        normalized_whitespace = re.sub(r"\s+", " ", cleaned)
        lowered = normalized_whitespace.lower()
        title_cased = re.sub(
            r"[a-z]+(?:'[a-z]+)?",
            lambda match: match.group(0).capitalize(),
            lowered,
        )
        return title_cased

    def _create_abbreviation(self, description: str) -> str:
        cleaned = re.sub(r"^\d+\s*", "", description.lower())
        words = cleaned.split()
        if words:
            return words[0][:8]
        return description.lower().replace(" ", "")[:8]

    def _create_unit_label(self, description: str) -> str:
        cleaned = re.sub(r"^\d+(\.\d+)?\s*", "", description).strip()
        return cleaned or description.strip()

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
            self.measurements_added_count += 1

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
        self.barcodes_added_count += 1

    def _build_default_measurements(self) -> List[Dict]:
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

    def _build_portion_measurement(self, portion: Dict, unit_name: str) -> Optional[Dict]:
        gram_weight = self._clean_numeric(portion.get("gram_weight"))
        if gram_weight <= 0:
            return None

        amount = self._clean_numeric(portion.get("amount"))
        modifier = self._clean_string(portion.get("modifier")) or ""
        description = self._clean_string(portion.get("portion_description"))

        if description:
            name = description
        else:
            parts = [str(amount) if amount else "", modifier, unit_name]
            name = " ".join([part for part in parts if part]).strip() or unit_name

        abbreviation = self._create_abbreviation(name)

        return {
            "name": name,
            "abbreviation": abbreviation,
            "unit": unit_name,
            "weightInGrams": gram_weight,
            "isDefault": False,
            "isFromSource": True,
        }

    def _parse_serving_grams(self, value: Optional[str]) -> Optional[float]:
        if not value:
            return None
        match = re.search(r"(\d+(?:\.\d+)?)\s*g", value, re.IGNORECASE)
        if not match:
            return None
        try:
            return float(match.group(1))
        except ValueError:
            return None

    def _load_nutrient_lookup(self, path: Path) -> Dict[str, List[Tuple[int, str]]]:
        lookup: Dict[str, List[Tuple[int, str]]] = {}
        with path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                name = row.get("name")
                nutrient_id = row.get("id")
                unit_name = row.get("unit_name")
                if not name or not nutrient_id or not unit_name:
                    continue
                try:
                    lookup.setdefault(name, []).append((int(nutrient_id), unit_name))
                except ValueError:
                    continue
        return lookup

    def _fdc_nutrient_ids(
        self,
        nutrient_lookup: Dict[str, List[Tuple[int, str]]],
    ) -> Dict[str, List[int]]:
        def ids_for(names: Iterable[str], unit_filter: Optional[str] = None) -> List[int]:
            result: List[int] = []
            for name in names:
                nutrients = nutrient_lookup.get(name, [])
                for nutrient_id, unit_name in nutrients:
                    if unit_filter and unit_name.lower() != unit_filter.lower():
                        continue
                    result.append(nutrient_id)
            return result

        return {
            "calories": ids_for(["Energy", "Energy (Atwater General Factors)"], unit_filter="KCAL"),
            "energy_kj": ids_for(["Energy"], unit_filter="kJ"),
            "protein": ids_for(["Protein"]),
            "fat": ids_for(["Total lipid (fat)"]),
            "carbs": ids_for(["Carbohydrate, by difference"]),
            "fiber": ids_for(["Fiber, total dietary"]),
            "sugar": ids_for(["Total Sugars", "Sugars, Total"]),
            "added_sugar": ids_for(["Sugars, added"]),
            "sodium": ids_for(["Sodium, Na"]),
            "saturated_fat": ids_for(["Fatty acids, total saturated"]),
            "trans_fat": ids_for(["Fatty acids, total trans"]),
            "trans_fat_alt": ids_for(
                [
                    "Fatty acids, total trans-monoenoic",
                    "Fatty acids, total trans-dienoic",
                    "Fatty acids, total trans-polyenoic",
                ]
            ),
            "cholesterol": ids_for(["Cholesterol"]),
            "soluble_fiber": ids_for(["Fiber, soluble"]),
            "insoluble_fiber": ids_for(["Fiber, insoluble"]),
            "water": ids_for(["Water"]),
            "mono_fat": ids_for(["Fatty acids, total monounsaturated"]),
            "poly_fat": ids_for(["Fatty acids, total polyunsaturated"]),
            "calcium": ids_for(["Calcium, Ca"]),
            "iron": ids_for(["Iron, Fe"]),
            "potassium": ids_for(["Potassium, K"]),
            "magnesium": ids_for(["Magnesium, Mg"]),
            "vitamin_aiu": ids_for(["Vitamin A, IU"]),
            "vitamin_arae": ids_for(["Vitamin A, RAE"]),
            "vitamin_c": ids_for(["Vitamin C, total ascorbic acid"]),
            "vitamin_b12": ids_for(["Vitamin B-12"]),
            "vitamin_d": ids_for(["Vitamin D (D2 + D3)"]),
            "vitamin_d2": ids_for(["Vitamin D2 (ergocalciferol)"]),
            "vitamin_d3": ids_for(["Vitamin D3 (cholecalciferol)"]),
            "vitamin_e": ids_for(["Vitamin E (alpha-tocopherol)"]),
            "phosphorus": ids_for(["Phosphorus, P"]),
            "zinc": ids_for(["Zinc, Zn"]),
            "copper": ids_for(["Copper, Cu"]),
            "manganese": ids_for(["Manganese, Mn"]),
            "selenium": ids_for(["Selenium, Se"]),
            "fluoride": ids_for(["Fluoride, F"]),
            "molybdenum": ids_for(["Molybdenum, Mo"]),
            "vitamin_b1": ids_for(["Thiamin"]),
            "vitamin_b2": ids_for(["Riboflavin"]),
            "vitamin_b3": ids_for(["Niacin"]),
            "vitamin_b5": ids_for(["Pantothenic acid"]),
            "vitamin_b6": ids_for(["Vitamin B-6"]),
            "biotin": ids_for(["Biotin"]),
            "folate": ids_for(["Folate, total"]),
            "folic_acid": ids_for(["Folic acid"]),
            "food_folate": ids_for(["Folate, food"]),
            "folate_dfe": ids_for(["Folate, DFE"]),
            "choline": ids_for(["Choline, total"]),
            "betaine": ids_for(["Betaine"]),
            "retinol": ids_for(["Retinol"]),
            "carotene_beta": ids_for(["Carotene, beta"]),
            "carotene_alpha": ids_for(["Carotene, alpha"]),
            "lycopene": ids_for(["Lycopene"]),
            "lutein_zeaxanthin": ids_for(["Lutein + zeaxanthin"]),
            "vitamin_k": ids_for(["Vitamin K (phylloquinone)"]),
        }

    def _extract_fdc_nutrients(
        self,
        amounts: Dict[int, float],
        nutrient_ids: Dict[str, List[int]],
    ) -> Dict[str, float]:
        def first_amount(ids: List[int]) -> float:
            for nutrient_id in ids:
                if nutrient_id in amounts:
                    return amounts[nutrient_id]
            return 0.0

        calories = first_amount(nutrient_ids["calories"])
        if calories <= 0:
            energy_kj_ids = nutrient_ids["energy_kj"]
            if energy_kj_ids and energy_kj_ids[0] in amounts:
                calories = amounts[energy_kj_ids[0]] / 4.184

        trans_fat = first_amount(nutrient_ids["trans_fat"])
        if trans_fat <= 0:
            trans_fat = sum(amounts.get(nutrient_id, 0.0) for nutrient_id in nutrient_ids["trans_fat_alt"])

        vitamin_d = first_amount(nutrient_ids["vitamin_d"])
        vitamin_d_iu = vitamin_d * 40 if vitamin_d > 0 else 0.0

        return {
            "calories": round(calories),
            "protein": first_amount(nutrient_ids["protein"]),
            "fat": first_amount(nutrient_ids["fat"]),
            "carbs": first_amount(nutrient_ids["carbs"]),
            "fiber": first_amount(nutrient_ids["fiber"]),
            "sugar": first_amount(nutrient_ids["sugar"]),
            "sodium": first_amount(nutrient_ids["sodium"]),
            "saturatedFat": first_amount(nutrient_ids["saturated_fat"]),
            "transFat": trans_fat,
            "cholesterol": first_amount(nutrient_ids["cholesterol"]),
            "addedSugar": first_amount(nutrient_ids["added_sugar"]),
            "solubleFiber": first_amount(nutrient_ids["soluble_fiber"]),
            "insolubleFiber": first_amount(nutrient_ids["insoluble_fiber"]),
            "water": first_amount(nutrient_ids["water"]),
            "monoFat": first_amount(nutrient_ids["mono_fat"]) * 1000.0,
            "polyFat": first_amount(nutrient_ids["poly_fat"]) * 1000.0,
            "calcium": first_amount(nutrient_ids["calcium"]),
            "iron": first_amount(nutrient_ids["iron"]),
            "potassium": first_amount(nutrient_ids["potassium"]),
            "magnesium": first_amount(nutrient_ids["magnesium"]),
            "vitaminAiu": first_amount(nutrient_ids["vitamin_aiu"]),
            "vitaminArae": first_amount(nutrient_ids["vitamin_arae"]),
            "vitaminC": first_amount(nutrient_ids["vitamin_c"]),
            "vitaminB12": first_amount(nutrient_ids["vitamin_b12"]),
            "vitaminD": vitamin_d,
            "vitaminD2": first_amount(nutrient_ids["vitamin_d2"]),
            "vitaminD3": first_amount(nutrient_ids["vitamin_d3"]),
            "vitaminDiu": vitamin_d_iu,
            "vitaminE": first_amount(nutrient_ids["vitamin_e"]),
            "phosphorus": first_amount(nutrient_ids["phosphorus"]),
            "zinc": first_amount(nutrient_ids["zinc"]),
            "copper": first_amount(nutrient_ids["copper"]),
            "manganese": first_amount(nutrient_ids["manganese"]),
            "selenium": first_amount(nutrient_ids["selenium"]),
            "fluoride": first_amount(nutrient_ids["fluoride"]),
            "molybdenum": first_amount(nutrient_ids["molybdenum"]),
            "vitaminB1": first_amount(nutrient_ids["vitamin_b1"]),
            "vitaminB2": first_amount(nutrient_ids["vitamin_b2"]),
            "vitaminB3": first_amount(nutrient_ids["vitamin_b3"]),
            "vitaminB5": first_amount(nutrient_ids["vitamin_b5"]),
            "vitaminB6": first_amount(nutrient_ids["vitamin_b6"]),
            "biotin": first_amount(nutrient_ids["biotin"]),
            "folate": first_amount(nutrient_ids["folate"]),
            "folicAcid": first_amount(nutrient_ids["folic_acid"]),
            "foodFolate": first_amount(nutrient_ids["food_folate"]),
            "folateDfe": first_amount(nutrient_ids["folate_dfe"]),
            "choline": first_amount(nutrient_ids["choline"]),
            "betaine": first_amount(nutrient_ids["betaine"]),
            "retinol": first_amount(nutrient_ids["retinol"]),
            "caroteneBeta": first_amount(nutrient_ids["carotene_beta"]),
            "caroteneAlpha": first_amount(nutrient_ids["carotene_alpha"]),
            "lycopene": first_amount(nutrient_ids["lycopene"]),
            "luteinZeaxanthin": first_amount(nutrient_ids["lutein_zeaxanthin"]),
            "vitaminK": first_amount(nutrient_ids["vitamin_k"]),
        }

    def _iter_fdc_nutrients(self, path: Path) -> Iterable[Tuple[str, Dict[int, float]]]:
        with path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            current_fdc: Optional[str] = None
            nutrients: Dict[int, float] = {}
            for row in reader:
                fdc_id = row.get("fdc_id")
                nutrient_id = row.get("nutrient_id")
                if not fdc_id or not nutrient_id:
                    continue
                if current_fdc is None:
                    current_fdc = fdc_id
                if fdc_id != current_fdc:
                    yield current_fdc, nutrients
                    nutrients = {}
                    current_fdc = fdc_id
                try:
                    nutrient_key = int(nutrient_id)
                except ValueError:
                    continue
                amount = self._clean_numeric(row.get("amount"))
                nutrients[nutrient_key] = amount
            if current_fdc is not None:
                yield current_fdc, nutrients

    def _build_lookup_db(self) -> Path:
        tmp_file = tempfile.NamedTemporaryFile(prefix="fdc_lookup_", suffix=".sqlite", delete=False)
        tmp_file.close()
        db_path = Path(tmp_file.name)
        conn = sqlite3.connect(db_path)
        conn.execute(
            "CREATE TABLE food_meta (fdc_id TEXT PRIMARY KEY, description TEXT, data_type TEXT)"
        )
        conn.execute(
            "CREATE TABLE branded_meta ("
            "fdc_id TEXT PRIMARY KEY, "
            "brand_owner TEXT, "
            "brand_name TEXT, "
            "gtin_upc TEXT, "
            "serving_size REAL, "
            "serving_size_unit TEXT, "
            "household_serving_fulltext TEXT"
            ")"
        )
        conn.commit()

        self._populate_food_meta(conn)
        self._populate_branded_meta(conn)

        conn.commit()
        conn.close()
        return db_path

    def _populate_food_meta(self, conn: sqlite3.Connection) -> None:
        path = self.fdc_dir / "food.csv"
        with path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            rows = []
            for row in reader:
                fdc_id = row.get("fdc_id")
                description = row.get("description")
                data_type = row.get("data_type")
                if not fdc_id or not description:
                    continue
                rows.append((fdc_id, description, data_type))
                if len(rows) >= 5000:
                    conn.executemany(
                        "INSERT OR REPLACE INTO food_meta (fdc_id, description, data_type) "
                        "VALUES (?, ?, ?)",
                        rows,
                    )
                    rows = []
            if rows:
                conn.executemany(
                    "INSERT OR REPLACE INTO food_meta (fdc_id, description, data_type) "
                    "VALUES (?, ?, ?)",
                    rows,
                )

    def _populate_branded_meta(self, conn: sqlite3.Connection) -> None:
        path = self.fdc_dir / "branded_food.csv"
        if not path.exists():
            return
        with path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            rows = []
            for row in reader:
                fdc_id = row.get("fdc_id")
                if not fdc_id:
                    continue
                brand_owner = self._clean_string(row.get("brand_owner"))
                brand_name = self._clean_string(row.get("brand_name"))
                gtin_upc = self._clean_string(row.get("gtin_upc"))
                serving_size = self._clean_numeric(row.get("serving_size"))
                serving_size_unit = self._clean_string(row.get("serving_size_unit"))
                household_serving = self._clean_string(row.get("household_serving_fulltext"))
                rows.append(
                    (
                        fdc_id,
                        brand_owner,
                        brand_name,
                        gtin_upc,
                        serving_size,
                        serving_size_unit,
                        household_serving,
                    )
                )
                if len(rows) >= 5000:
                    conn.executemany(
                        "INSERT OR REPLACE INTO branded_meta "
                        "(fdc_id, brand_owner, brand_name, gtin_upc, serving_size, "
                        "serving_size_unit, household_serving_fulltext) "
                        "VALUES (?, ?, ?, ?, ?, ?, ?)",
                        rows,
                    )
                    rows = []
            if rows:
                conn.executemany(
                    "INSERT OR REPLACE INTO branded_meta "
                    "(fdc_id, brand_owner, brand_name, gtin_upc, serving_size, "
                    "serving_size_unit, household_serving_fulltext) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    rows,
                )

    def _lookup_food_meta(self, conn: sqlite3.Connection, fdc_id: str) -> Optional[Tuple[str, str]]:
        cursor = conn.execute(
            "SELECT description, data_type FROM food_meta WHERE fdc_id = ?",
            (fdc_id,),
        )
        return cursor.fetchone()

    def _lookup_branded_meta(
        self,
        conn: sqlite3.Connection,
        fdc_id: str,
    ) -> Optional[Tuple[Optional[str], Optional[str], Optional[str], float, Optional[str], Optional[str]]]:
        cursor = conn.execute(
            "SELECT brand_owner, brand_name, gtin_upc, serving_size, serving_size_unit, "
            "household_serving_fulltext FROM branded_meta WHERE fdc_id = ?",
            (fdc_id,),
        )
        return cursor.fetchone()

    def _fdc_to_food_payload(
        self,
        fdc_id: str,
        name: str,
        brand: Optional[str],
        nutrient_values: Dict[str, float],
    ) -> Dict[str, object]:
        base: Dict[str, object] = {
            "sourceId": fdc_id,
            "isCsvFood": True,
            "name": name,
            "brand": brand,
            "calories": int(nutrient_values.get("calories", 0)),
            "protein": nutrient_values.get("protein", 0.0),
            "carbs": nutrient_values.get("carbs", 0.0),
            "fat": nutrient_values.get("fat", 0.0),
            "fiber": nutrient_values.get("fiber", 0.0),
            "sugar": nutrient_values.get("sugar", 0.0),
            "sodium": nutrient_values.get("sodium", 0.0),
            "saturatedFat": nutrient_values.get("saturatedFat", 0.0),
            "transFat": nutrient_values.get("transFat", 0.0),
            "cholesterol": nutrient_values.get("cholesterol", 0.0),
            "addedSugar": nutrient_values.get("addedSugar", 0.0),
            "netCarbs": 0.0,
            "solubleFiber": nutrient_values.get("solubleFiber", 0.0),
            "insolubleFiber": nutrient_values.get("insolubleFiber", 0.0),
            "water": nutrient_values.get("water", 0.0),
            "pralScore": 0.0,
            "omega3": 0.0,
            "omega6": 0.0,
            "monoFat": nutrient_values.get("monoFat", 0.0),
            "polyFat": nutrient_values.get("polyFat", 0.0),
            "ala": 0.0,
            "epa": 0.0,
            "dpa": 0.0,
            "dha": 0.0,
            "calcium": nutrient_values.get("calcium", 0.0),
            "iron": nutrient_values.get("iron", 0.0),
            "potassium": nutrient_values.get("potassium", 0.0),
            "magnesium": nutrient_values.get("magnesium", 0.0),
            "vitaminAiu": nutrient_values.get("vitaminAiu", 0.0),
            "vitaminArae": nutrient_values.get("vitaminArae", 0.0),
            "vitaminC": nutrient_values.get("vitaminC", 0.0),
            "vitaminB12": nutrient_values.get("vitaminB12", 0.0),
            "vitaminD": nutrient_values.get("vitaminD", 0.0),
            "vitaminD2": nutrient_values.get("vitaminD2", 0.0),
            "vitaminD3": nutrient_values.get("vitaminD3", 0.0),
            "vitaminDiu": nutrient_values.get("vitaminDiu", 0.0),
            "vitaminE": nutrient_values.get("vitaminE", 0.0),
            "phosphorus": nutrient_values.get("phosphorus", 0.0),
            "zinc": nutrient_values.get("zinc", 0.0),
            "copper": nutrient_values.get("copper", 0.0),
            "manganese": nutrient_values.get("manganese", 0.0),
            "selenium": nutrient_values.get("selenium", 0.0),
            "fluoride": nutrient_values.get("fluoride", 0.0),
            "molybdenum": nutrient_values.get("molybdenum", 0.0),
            "chlorine": 0.0,
            "vitaminB1": nutrient_values.get("vitaminB1", 0.0),
            "vitaminB2": nutrient_values.get("vitaminB2", 0.0),
            "vitaminB3": nutrient_values.get("vitaminB3", 0.0),
            "vitaminB5": nutrient_values.get("vitaminB5", 0.0),
            "vitaminB6": nutrient_values.get("vitaminB6", 0.0),
            "biotin": nutrient_values.get("biotin", 0.0),
            "folate": nutrient_values.get("folate", 0.0),
            "folicAcid": nutrient_values.get("folicAcid", 0.0),
            "foodFolate": nutrient_values.get("foodFolate", 0.0),
            "folateDfe": nutrient_values.get("folateDfe", 0.0),
            "vitaminK": nutrient_values.get("vitaminK", 0.0),
            "dihydrophylloquinone": 0.0,
            "menaquinone4": 0.0,
            "choline": nutrient_values.get("choline", 0.0),
            "betaine": nutrient_values.get("betaine", 0.0),
            "retinol": nutrient_values.get("retinol", 0.0),
            "caroteneBeta": nutrient_values.get("caroteneBeta", 0.0),
            "caroteneAlpha": nutrient_values.get("caroteneAlpha", 0.0),
            "lycopene": nutrient_values.get("lycopene", 0.0),
            "luteinZeaxanthin": nutrient_values.get("luteinZeaxanthin", 0.0),
        }
        return base

    def _run_fdc_import(self, conn: mysql.connector.MySQLConnection, lookup_db: Path) -> None:
        self._validate_food_columns(conn)
        nutrient_lookup = self._load_nutrient_lookup(self.fdc_dir / "nutrient.csv")
        nutrient_ids = self._fdc_nutrient_ids(nutrient_lookup)

        lookup_conn = sqlite3.connect(lookup_db)
        cursor = conn.cursor()
        batch_count = 0
        processed = 0

        for fdc_id, amounts in tqdm(
            self._iter_fdc_nutrients(self.fdc_dir / "food_nutrient.csv"),
            desc="FDC foods",
        ):
            meta = self._lookup_food_meta(lookup_conn, fdc_id)
            if not meta:
                self.skipped_count += 1
                continue
            name, _data_type = meta
            name = self._standardize_food_name(name)
            if not name:
                self.skipped_count += 1
                continue

            branded = self._lookup_branded_meta(lookup_conn, fdc_id)
            brand = None
            barcode = None
            serving_measurement = None
            if branded:
                brand_owner, brand_name, upc, serving_size, serving_unit, household = branded
                brand = brand_owner or brand_name
                if upc:
                    barcode = upc
                if serving_size and serving_unit and serving_unit.lower().startswith("g"):
                    measurement_name = household or f"{serving_size} {serving_unit}"
                    serving_measurement = {
                        "name": measurement_name,
                        "abbreviation": self._create_abbreviation(measurement_name),
                        "unit": serving_unit,
                        "weightInGrams": float(serving_size),
                        "isDefault": False,
                        "isFromSource": True,
                    }

            nutrient_values = self._extract_fdc_nutrients(amounts, nutrient_ids)
            food_payload = self._fdc_to_food_payload(
                fdc_id=fdc_id,
                name=name,
                brand=brand,
                nutrient_values=nutrient_values,
            )

            try:
                food_id = self._insert_or_update_food(cursor, food_payload)
                self._ensure_measurements(cursor, food_id, self._build_default_measurements())
                if serving_measurement:
                    self._ensure_measurements(cursor, food_id, [serving_measurement])
                if barcode:
                    self._insert_or_update_barcode(cursor, barcode, food_id)
                self.success_count += 1
                batch_count += 1
                processed += 1
            except mysql.connector.Error:
                conn.rollback()
                self.error_count += 1
                continue

            if batch_count >= self.batch_size:
                conn.commit()
                batch_count = 0

            if self.max_foods and processed >= self.max_foods:
                break

        if batch_count:
            conn.commit()

        cursor.close()
        lookup_conn.close()

    def _run_fdc_portions(self, conn: mysql.connector.MySQLConnection) -> None:
        portion_path = self.fdc_dir / "food_portion.csv"
        measure_unit_path = self.fdc_dir / "measure_unit.csv"
        if not portion_path.exists() or not measure_unit_path.exists():
            return

        unit_lookup: Dict[str, str] = {}
        with measure_unit_path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                unit_id = row.get("id")
                name = row.get("name")
                if unit_id and name:
                    unit_lookup[unit_id] = name

        cursor = conn.cursor()
        food_id_cache: Dict[str, int] = {}
        batch_count = 0

        with portion_path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in tqdm(reader, desc="FDC portions"):
                fdc_id = row.get("fdc_id")
                if not fdc_id:
                    continue

                food_id = food_id_cache.get(fdc_id)
                if food_id is None:
                    cursor.execute("SELECT id FROM food WHERE sourceId = %s LIMIT 1", (fdc_id,))
                    result = cursor.fetchone()
                    if not result:
                        food_id_cache[fdc_id] = 0
                        continue
                    food_id = int(result[0])
                    food_id_cache[fdc_id] = food_id
                    if len(food_id_cache) > 50000:
                        food_id_cache.clear()

                if food_id == 0:
                    continue

                unit_name = unit_lookup.get(row.get("measure_unit_id") or "", "unit")
                measurement = self._build_portion_measurement(row, unit_name)
                if not measurement:
                    continue

                try:
                    self._ensure_measurements(cursor, food_id, [measurement])
                    batch_count += 1
                except mysql.connector.Error:
                    conn.rollback()
                    continue

                if batch_count >= self.batch_size:
                    conn.commit()
                    batch_count = 0

        if batch_count:
            conn.commit()

        cursor.close()

    def _openfoodfacts_payload(self, row: Dict) -> Optional[Dict]:
        barcode = self._clean_string(row.get("code"))
        name = self._standardize_food_name(row.get("product_name")) or self._standardize_food_name(
            row.get("generic_name")
        )

        if not barcode or not name:
            return None

        energy_kcal = self._clean_numeric(row.get("energy-kcal_100g"))
        energy_kj = self._clean_numeric(row.get("energy-kj_100g")) or self._clean_numeric(
            row.get("energy_100g")
        )
        calories = int(round(energy_kcal or (energy_kj / 4.184 if energy_kj else 0)))

        food = {
            "sourceId": barcode,
            "isCsvFood": False,
            "name": name,
            "brand": self._clean_string(row.get("brands")),
            "calories": calories,
            "protein": self._clean_numeric(row.get("proteins_100g", 0)),
            "carbs": self._clean_numeric(row.get("carbohydrates_100g", 0)),
            "fat": self._clean_numeric(row.get("fat_100g", 0)),
            "fiber": self._clean_numeric(row.get("fiber_100g", 0)),
            "sugar": self._clean_numeric(row.get("sugars_100g", 0)),
            "sodium": self._openfoodfacts_sodium(row),
            "saturatedFat": self._clean_numeric(row.get("saturated-fat_100g", 0)),
            "transFat": self._clean_numeric(row.get("trans-fat_100g", 0)),
            "cholesterol": self._maybe_g_to_mg(self._clean_numeric(row.get("cholesterol_100g", 0))),
            "addedSugar": self._clean_numeric(row.get("added-sugars_100g", 0)),
            "netCarbs": 0.0,
            "solubleFiber": self._clean_numeric(row.get("soluble-fiber_100g", 0)),
            "insolubleFiber": self._clean_numeric(row.get("insoluble-fiber_100g", 0)),
            "water": self._clean_numeric(row.get("water_100g", 0)),
            "pralScore": 0.0,
            "omega3": self._maybe_g_to_mg(self._clean_numeric(row.get("omega-3-fat_100g", 0))),
            "omega6": self._maybe_g_to_mg(self._clean_numeric(row.get("omega-6-fat_100g", 0))),
            "monoFat": self._maybe_g_to_mg(self._clean_numeric(row.get("monounsaturated-fat_100g", 0))),
            "polyFat": self._maybe_g_to_mg(self._clean_numeric(row.get("polyunsaturated-fat_100g", 0))),
            "ala": self._maybe_g_to_mg(self._clean_numeric(row.get("alpha-linolenic-acid_100g", 0))),
            "epa": self._maybe_g_to_mg(self._clean_numeric(row.get("eicosapentaenoic-acid_100g", 0))),
            "dpa": 0.0,
            "dha": self._maybe_g_to_mg(self._clean_numeric(row.get("docosahexaenoic-acid_100g", 0))),
            "calcium": self._clean_numeric(row.get("calcium_100g", 0)),
            "iron": self._clean_numeric(row.get("iron_100g", 0)),
            "potassium": self._clean_numeric(row.get("potassium_100g", 0)),
            "magnesium": self._clean_numeric(row.get("magnesium_100g", 0)),
            "vitaminAiu": 0.0,
            "vitaminArae": self._clean_numeric(row.get("vitamin-a_100g", 0)),
            "vitaminC": self._clean_numeric(row.get("vitamin-c_100g", 0)),
            "vitaminB12": self._clean_numeric(row.get("vitamin-b12_100g", 0)),
            "vitaminD": self._clean_numeric(row.get("vitamin-d_100g", 0)),
            "vitaminD2": 0.0,
            "vitaminD3": 0.0,
            "vitaminDiu": 0.0,
            "vitaminE": self._clean_numeric(row.get("vitamin-e_100g", 0)),
            "phosphorus": self._clean_numeric(row.get("phosphorus_100g", 0)),
            "zinc": self._clean_numeric(row.get("zinc_100g", 0)),
            "copper": self._clean_numeric(row.get("copper_100g", 0)),
            "manganese": self._clean_numeric(row.get("manganese_100g", 0)),
            "selenium": self._clean_numeric(row.get("selenium_100g", 0)),
            "fluoride": self._clean_numeric(row.get("fluoride_100g", 0)),
            "molybdenum": self._clean_numeric(row.get("molybdenum_100g", 0)),
            "chlorine": self._clean_numeric(row.get("chloride_100g", 0)),
            "vitaminB1": self._clean_numeric(row.get("vitamin-b1_100g", 0)),
            "vitaminB2": self._clean_numeric(row.get("vitamin-b2_100g", 0)),
            "vitaminB3": self._clean_numeric(row.get("vitamin-pp_100g", 0)),
            "vitaminB5": 0.0,
            "vitaminB6": self._clean_numeric(row.get("vitamin-b6_100g", 0)),
            "biotin": self._clean_numeric(row.get("biotin_100g", 0)),
            "folate": self._clean_numeric(row.get("folates_100g", 0) or row.get("vitamin-b9_100g", 0)),
            "folicAcid": 0.0,
            "foodFolate": 0.0,
            "folateDfe": 0.0,
            "vitaminK": self._clean_numeric(row.get("vitamin-k_100g", 0)),
            "dihydrophylloquinone": 0.0,
            "menaquinone4": 0.0,
            "choline": self._clean_numeric(row.get("choline_100g", 0)),
            "betaine": self._clean_numeric(row.get("betaine_100g", 0)),
            "retinol": 0.0,
            "caroteneBeta": self._clean_numeric(row.get("beta-carotene_100g", 0)),
            "caroteneAlpha": 0.0,
            "lycopene": self._clean_numeric(row.get("lycopene_100g", 0)),
            "luteinZeaxanthin": self._clean_numeric(row.get("lutein-zeaxanthin_100g", 0)),
        }

        measurements = self._build_default_measurements()
        serving_size = self._clean_string(row.get("serving_size"))
        serving_quantity = self._clean_numeric(row.get("serving_quantity"))
        serving_unit = self._clean_string(row.get("serving_quantity_unit"))
        serving_grams = self._parse_serving_grams(serving_size)
        if serving_grams is None and serving_quantity and serving_unit and serving_unit.lower().startswith("g"):
            serving_grams = serving_quantity
            if not serving_size:
                serving_size = f"{serving_quantity} {serving_unit}"

        if serving_grams and serving_size:
            measurements.append(
                {
                    "name": serving_size,
                    "abbreviation": self._create_abbreviation(serving_size),
                    "unit": self._create_unit_label(serving_size),
                    "weightInGrams": float(serving_grams),
                    "isDefault": False,
                    "isFromSource": True,
                }
            )

        return {"barcode": barcode, "food": food, "measurements": measurements}

    def _openfoodfacts_sodium(self, row: Dict) -> float:
        sodium_g = self._clean_numeric(row.get("sodium_100g", 0))
        if sodium_g > 0:
            return sodium_g * 1000.0

        salt_g = self._clean_numeric(row.get("salt_100g", 0))
        if salt_g > 0:
            return salt_g * 1000.0 * 0.4

        return 0.0

    def _maybe_g_to_mg(self, value: float) -> float:
        if value <= 10:
            return value * 1000.0
        return value

    def _ensure_food_match_index(self, conn: mysql.connector.MySQLConnection) -> None:
        cursor = conn.cursor()
        try:
            cursor.execute("SHOW INDEX FROM food WHERE Key_name = 'idx_food_name_calories'")
            has_index = cursor.fetchone() is not None
            if not has_index:
                print("Creating MySQL index idx_food_name_calories on food(name, calories)...")
                cursor.execute("CREATE INDEX idx_food_name_calories ON food (name, calories)")
                conn.commit()
        finally:
            cursor.close()

    def _build_food_match_lookup(
        self, conn: mysql.connector.MySQLConnection
    ) -> Dict[Tuple[str, int], int]:
        print("Building in-memory food match lookup (name+calories)...")
        self._ensure_food_match_index(conn)

        count_cursor = conn.cursor()
        try:
            count_cursor.execute("SELECT COUNT(*) FROM food")
            result = count_cursor.fetchone()
            total_rows = int(result[0]) if result else 0
        finally:
            count_cursor.close()

        lookup: Dict[Tuple[str, int], int] = {}
        cursor = conn.cursor(dictionary=True)
        progress = tqdm(
            total=total_rows,
            unit="rows",
            desc="Food lookup rows",
            leave=True,
            dynamic_ncols=True,
            file=sys.stdout,
            disable=False,
        )
        try:
            cursor.execute("SELECT id, name, calories FROM food ORDER BY id ASC")
            while True:
                rows = cursor.fetchmany(10000)
                if not rows:
                    break
                for row in rows:
                    raw_name = row.get("name")
                    calories_raw = row.get("calories")
                    if not raw_name or calories_raw is None:
                        continue
                    key = (str(raw_name).lower(), int(calories_raw))
                    # Keep the first inserted id as canonical match.
                    lookup.setdefault(key, int(row["id"]))
                progress.update(len(rows))
        finally:
            progress.close()
            cursor.close()

        print(f"Food match lookup keys: {len(lookup)}")
        return lookup

    def _run_openfoodfacts(self, conn: mysql.connector.MySQLConnection) -> None:
        if not self.openfoodfacts_csv.exists():
            print(f"OpenFoodFacts CSV not found: {self.openfoodfacts_csv}")
            return

        cursor = conn.cursor()
        self._validate_food_columns(conn)
        food_match_lookup = self._build_food_match_lookup(conn)

        print("Reading OpenFoodFacts header to determine available columns...")
        header = pd.read_csv(self.openfoodfacts_csv, sep="\t", nrows=0)
        available_columns = set(header.columns)
        desired_columns = {
            "code",
            "product_name",
            "generic_name",
            "brands",
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
            "vitamin-c_100g",
            "vitamin-b1_100g",
            "vitamin-b2_100g",
            "vitamin-pp_100g",
            "vitamin-b6_100g",
            "vitamin-b12_100g",
            "folates_100g",
            "vitamin-b9_100g",
            "vitamin-d_100g",
            "vitamin-e_100g",
            "vitamin-k_100g",
            "betaine_100g",
            "choline_100g",
            "beta-carotene_100g",
            "lycopene_100g",
            "lutein-zeaxanthin_100g",
            "biotin_100g",
            "serving_size",
            "serving_quantity",
            "serving_quantity_unit",
        }
        usecols = [column for column in desired_columns if column in available_columns]
        print(f"OpenFoodFacts columns selected: {len(usecols)}")

        match_cache: Dict[Tuple[str, int], Optional[int]] = {}
        batch_count = 0
        processed = 0
        scanned = 0
        skipped_before = self.skipped_count
        errors_before = self.error_count
        next_heartbeat_at = time.perf_counter() + 30.0
        chunk_index = 0
        progress = tqdm(
            total=None,
            unit="rows",
            desc="OpenFoodFacts rows scanned",
            leave=True,
            dynamic_ncols=True,
            file=sys.stdout,
            disable=False,
        )

        try:
            for chunk in pd.read_csv(
                self.openfoodfacts_csv,
                sep="\t",
                usecols=usecols,
                chunksize=5000,
                dtype=str,
                low_memory=False,
            ):
                chunk_index += 1
                chunk_started_at = time.perf_counter()
                rows = chunk.to_dict(orient="records")
                scanned += len(rows)
                progress.update(len(rows))

                for row in rows:
                    payload = self._openfoodfacts_payload(row)
                    if not payload:
                        self.skipped_count += 1
                        continue

                    food = payload["food"]
                    barcode = payload["barcode"]
                    name = food["name"]
                    calories = int(food["calories"])
                    match_key = (name.lower(), calories)

                    food_id = match_cache.get(match_key)
                    if food_id is None:
                        food_id = food_match_lookup.get(match_key, 0)
                        match_cache[match_key] = food_id
                        if len(match_cache) > 50000:
                            match_cache.clear()

                    try:
                        if food_id:
                            self._ensure_measurements(cursor, food_id, payload["measurements"])
                            self._insert_or_update_barcode(cursor, barcode, food_id)
                            self.openfoodfacts_matched_count += 1
                        else:
                            new_food_id = self._insert_or_update_food(cursor, food)
                            self._ensure_measurements(cursor, new_food_id, payload["measurements"])
                            self._insert_or_update_barcode(cursor, barcode, new_food_id)
                            food_match_lookup[match_key] = new_food_id
                            match_cache[match_key] = new_food_id
                            self.openfoodfacts_new_count += 1
                    except mysql.connector.Error:
                        conn.rollback()
                        self.error_count += 1
                        continue

                    batch_count += 1
                    processed += 1

                    if batch_count >= self.batch_size:
                        conn.commit()
                        batch_count = 0

                    if self.max_openfoodfacts and processed >= self.max_openfoodfacts:
                        conn.commit()
                        return

                now = time.perf_counter()
                if now >= next_heartbeat_at:
                    progress.write(
                        "OpenFoodFacts heartbeat | "
                        f"scanned={scanned} processed={processed} "
                        f"new={self.openfoodfacts_new_count} matched={self.openfoodfacts_matched_count} "
                        f"skipped={self.skipped_count - skipped_before} errors={self.error_count - errors_before}"
                    )
                    next_heartbeat_at = now + 30.0

                if chunk_index % 10 == 0:
                    chunk_elapsed = max(time.perf_counter() - chunk_started_at, 0.0001)
                    progress.write(
                        f"OpenFoodFacts chunk {chunk_index} "
                        f"({len(rows)} rows) in {chunk_elapsed:.2f}s"
                    )
        finally:
            progress.close()

        if batch_count:
            conn.commit()

        cursor.close()

    def _build_es_index_payload(self) -> Dict[str, object]:
        return {
            "settings": {
                "analysis": {
                    "filter": {
                        "edge_ngram_filter": {
                            "type": "edge_ngram",
                            "min_gram": 1,
                            "max_gram": 20,
                        }
                    },
                    "normalizer": {
                        "lowercase_normalizer": {
                            "type": "custom",
                            "filter": ["lowercase"],
                        }
                    },
                    "analyzer": {
                        "name_prefix_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "edge_ngram_filter"],
                        },
                        "name_prefix_search": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase"],
                        },
                    },
                }
            },
            "mappings": {
                "properties": {
                    "name": {
                        "type": "text",
                        "fields": {
                            "keyword": {
                                "type": "keyword",
                                "normalizer": "lowercase_normalizer",
                            },
                            "prefix": {
                                "type": "text",
                                "analyzer": "name_prefix_analyzer",
                                "search_analyzer": "name_prefix_search",
                            },
                        },
                    },
                    "brand": {
                        "type": "text",
                        "fields": {
                            "keyword": {
                                "type": "keyword",
                                "normalizer": "lowercase_normalizer",
                            },
                        },
                    },
                    "isCsvFood": {
                        "type": "boolean",
                    },
                }
            },
        }

    def _delete_es_index(self) -> None:
        response = requests.delete(f"{self.es_url}/{self.es_index}", timeout=30)
        if response.status_code in (200, 404):
            return

        response.raise_for_status()

    def _drop_es_db(self) -> None:
        response = requests.delete(f"{self.es_url}/_all", timeout=60)
        if response.status_code in (200, 404):
            return

        response.raise_for_status()

    def _create_es_index(self) -> None:
        payload = self._build_es_index_payload()
        response = requests.put(f"{self.es_url}/{self.es_index}", json=payload, timeout=30)
        response.raise_for_status()

    def _bulk_index_foods(self) -> int:
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, brand, isCsvFood FROM food ORDER BY id ASC")
        indexed_count = 0
        bulk_size = 500
        try:
            while True:
                rows = cursor.fetchmany(bulk_size)
                if not rows:
                    break

                lines: List[str] = []
                for row in rows:
                    food_id = int(row["id"])
                    lines.append(
                        '{"index":{"_index":"%s","_id":"%s"}}' % (self.es_index, str(food_id))
                    )
                    lines.append(
                        '{"name":%s,"brand":%s,"isCsvFood":%s}'
                        % (
                            json.dumps(row["name"]),
                            json.dumps(row["brand"]),
                            "true" if bool(row["isCsvFood"]) else "false",
                        )
                    )

                body = "\n".join(lines) + "\n"
                response = requests.post(
                    f"{self.es_url}/_bulk",
                    data=body.encode("utf-8"),
                    headers={"Content-Type": "application/x-ndjson"},
                    timeout=60,
                )
                response.raise_for_status()
                response_json = response.json()
                if response_json.get("errors"):
                    raise RuntimeError("Elasticsearch bulk indexing reported errors.")

                indexed_count += len(rows)
                if indexed_count % 5000 == 0:
                    print(f"Elasticsearch rows indexed: {indexed_count}")
        finally:
            cursor.close()
            conn.close()

        return indexed_count

    def _reindex_es_direct(self) -> None:
        if self.skip_es_reindex:
            print("Skipping Elasticsearch reindex.")
            return

        if self.drop_elasticsearch_db:
            print(f"Dropping all Elasticsearch indices at {self.es_url} ...")
            self._drop_es_db()
        else:
            print(f"Deleting Elasticsearch index '{self.es_index}' at {self.es_url} ...")
            self._delete_es_index()
        print(f"Creating Elasticsearch index '{self.es_index}' ...")
        self._create_es_index()
        print("Bulk indexing foods into Elasticsearch ...")
        indexed_count = self._bulk_index_foods()
        print(f"Elasticsearch reindex complete. Foods indexed: {indexed_count}")

    def run(self) -> None:
        start = time.perf_counter()
        conn = mysql.connector.connect(**self.db_config)
        start_idx = self.IMPORT_STAGES.index(self.start_at)
        stop_target = self.stop_after or self.IMPORT_STAGES[-1]
        stop_idx = self.IMPORT_STAGES.index(stop_target)
        if stop_idx < start_idx:
            raise ValueError("--stop-after cannot be earlier than --start-at.")

        run_fdc = start_idx <= 0 <= stop_idx
        run_fdc_portions = start_idx <= 1 <= stop_idx
        run_openfoodfacts = start_idx <= 2 <= stop_idx
        lookup_db: Optional[Path] = None
        try:
            if run_fdc:
                lookup_db = self._build_lookup_db()
                print("Importing FoodData Central foods...")
                self._run_fdc_import(conn, lookup_db)
            if run_fdc_portions:
                print("Adding FoodData Central portions...")
                self._run_fdc_portions(conn)
            if run_openfoodfacts:
                print("Importing OpenFoodFacts foods/barcodes...")
                self._run_openfoodfacts(conn)
        finally:
            conn.close()
            if lookup_db:
                try:
                    lookup_db.unlink()
                except OSError:
                    pass

        self._reindex_es_direct()

        elapsed = time.perf_counter() - start
        print("IMPORT SUMMARY")
        print(f"FDC foods inserted/updated: {self.success_count}")
        print(f"OpenFoodFacts new foods: {self.openfoodfacts_new_count}")
        print(f"OpenFoodFacts matched foods: {self.openfoodfacts_matched_count}")
        print(f"Measurements inserted: {self.measurements_added_count}")
        print(f"Barcodes inserted: {self.barcodes_added_count}")
        print(f"Skipped rows: {self.skipped_count}")
        print(f"Errors: {self.error_count}")
        print(f"Elapsed seconds: {elapsed:.2f}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Import FoodData Central + OpenFoodFacts CSV data directly into MySQL."
    )
    parser.add_argument(
        "--fdc-dir",
        default="../data/FoodData_Central_csv_2025-12-18",
        help="Path to the FoodData Central CSV directory.",
    )
    parser.add_argument(
        "--openfoodfacts-csv",
        default="../data/en.openfoodfacts.org.products.csv",
        help="Path to the OpenFoodFacts TSV file.",
    )
    parser.add_argument("--env-file", default=None, help="Path to a .env file with DB credentials.")
    parser.add_argument("--batch-size", type=int, default=500, help="DB commit batch size.")
    parser.add_argument("--max-foods", type=int, default=None, help="Limit FDC foods for testing.")
    parser.add_argument(
        "--max-openfoodfacts", type=int, default=None, help="Limit OpenFoodFacts rows for testing."
    )
    parser.add_argument(
        "--start-at",
        choices=FdcOpenFoodFactsImporter.IMPORT_STAGES,
        default="fdc",
        help="Import stage to start at.",
    )
    parser.add_argument(
        "--stop-after",
        choices=FdcOpenFoodFactsImporter.IMPORT_STAGES,
        default=None,
        help="Optional import stage to stop after.",
    )
    parser.add_argument(
        "--es-url",
        default=os.getenv("ES_URL", "http://localhost:9200"),
        help="Elasticsearch base URL.",
    )
    parser.add_argument(
        "--es-index",
        default=os.getenv("ES_FOOD_INDEX", "foods"),
        help="Elasticsearch index name for foods.",
    )
    parser.add_argument(
        "--skip-es-reindex",
        action="store_true",
        help="Skip direct Elasticsearch delete/create/reindex at the end of the import.",
    )
    parser.add_argument(
        "--drop-elastic-search-db",
        action="store_true",
        help="Drop all Elasticsearch indices before recreating and indexing foods.",
    )

    args = parser.parse_args()

    importer = FdcOpenFoodFactsImporter(
        fdc_dir=Path(args.fdc_dir),
        openfoodfacts_csv=Path(args.openfoodfacts_csv),
        env_file_path=args.env_file,
        batch_size=args.batch_size,
        max_foods=args.max_foods,
        max_openfoodfacts=args.max_openfoodfacts,
        start_at=args.start_at,
        stop_after=args.stop_after,
        es_url=args.es_url,
        es_index=args.es_index,
        skip_es_reindex=args.skip_es_reindex,
        drop_elasticsearch_db=args.drop_elastic_search_db,
    )
    importer.run()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
