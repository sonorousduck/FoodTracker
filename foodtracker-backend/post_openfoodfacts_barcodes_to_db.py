import sys
import time
from typing import Dict, Iterable, List, Optional

import pandas as pd
import requests
from tqdm import tqdm


class OpenFoodFactsImporter:
    def __init__(
        self,
        csv_file_path: str,
        api_base_url: str = "http://localhost:3001",
        auth_token: Optional[str] = None,
    ):
        self.csv_file_path = csv_file_path
        self.api_base_url = api_base_url
        self.auth_token = auth_token
        self.success_count = 0
        self.error_count = 0
        self.errors: List[str] = []

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers

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
        # Heuristic: values <= 10 likely represent grams, otherwise assume already in mg.
        if value <= 10:
            return self._grams_to_mg(value)
        return value

    def _sodium_mg(self, row: Dict) -> float:
        sodium_g = self._clean_numeric(row.get("sodium_100g", 0))
        if sodium_g > 0:
            return self._grams_to_mg(sodium_g)

        salt_g = self._clean_numeric(row.get("salt_100g", 0))
        if salt_g > 0:
            # Sodium is roughly 40% of salt by weight.
            return self._grams_to_mg(salt_g) * 0.4

        return 0.0

    def _calories(self, row: Dict) -> int:
        kcal = self._clean_numeric(row.get("energy-kcal_100g", 0))
        if kcal > 0:
            return int(round(kcal))

        kj = self._clean_numeric(row.get("energy-kj_100g", 0)) or self._clean_numeric(row.get("energy_100g", 0))
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
            "measurements": self._build_measurements(),
        }

        return {"barcode": barcode, "food": food}

    def _post_batch(self, batch: List[Dict]) -> bool:
        try:
            response = requests.post(
                f"{self.api_base_url}/food-barcodes/bulk",
                json=batch,
                headers=self._headers(),
                timeout=60,
            )
            if response.status_code in (401, 403):
                message = f"Unauthorized response ({response.status_code}). Aborting import."
                print(f"🚫 {message}")
                raise RuntimeError(message)
            if response.status_code in (200, 201):
                self.success_count += len(batch)
                return True

            self.error_count += len(batch)
            self.errors.append(f"{response.status_code}: {response.text}")
            return False
        except requests.exceptions.RequestException as exc:
            self.error_count += len(batch)
            self.errors.append(str(exc))
            return False

    def import_barcodes(self, batch_size: int = 500, delay_between_batches: float = 0.25):
        print(f"🚀 Starting OpenFoodFacts import from {self.csv_file_path}")
        print(f"📡 Target API: {self.api_base_url}/food-barcodes/bulk")

        print("📥 Reading header to determine available columns...")
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
        print(f"✅ Using {len(usecols)} columns from CSV.")

        batch: List[Dict] = []
        processed_rows = 0
        posted_batches = 0
        progress = tqdm(
            total=None,
            unit="rows",
            desc="Processing rows",
            leave=True,
            dynamic_ncols=True,
            file=sys.stdout,
            disable=False,
        )
        print("🧭 Progress bar initialized.")

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
                        progress.update(1)
                        continue

                    batch.append(payload)
                    progress.update(1)

                    if len(batch) >= batch_size:
                        self._post_batch(batch)
                        posted_batches += 1
                        batch = []
                        time.sleep(delay_between_batches)
        finally:
            progress.close()

        if batch:
            self._post_batch(batch)
            posted_batches += 1

        print(f"📦 Batches posted: {posted_batches}")
        print(f"🧾 Rows processed: {processed_rows}")
        print("\n" + "=" * 50)
        print("📊 IMPORT SUMMARY")
        print("=" * 50)
        print(f"✅ Successful rows sent: {self.success_count}")
        print(f"❌ Failed rows sent: {self.error_count}")
        if self.errors:
            print(f"🚨 First 3 errors: {self.errors[:3]}")


if __name__ == "__main__":
    CSV_FILE_PATH = "/home/telesto/en.openfoodfacts.org.products.csv"
    API_BASE_URL = "http://localhost:3001"
    AUTH_TOKEN = None

    importer = OpenFoodFactsImporter(CSV_FILE_PATH, API_BASE_URL, AUTH_TOKEN)
    importer.import_barcodes(batch_size=50, delay_between_batches=0.1)
