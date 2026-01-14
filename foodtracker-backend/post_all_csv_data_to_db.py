import json
import time
from typing import Dict, List, Optional

import pandas as pd
import requests


class FoodImporter:
    def __init__(self, csv_file_path: str, api_base_url: str = "http://localhost:3001"):
        self.csv_file_path = csv_file_path
        self.api_base_url = api_base_url
        self.success_count = 0
        self.error_count = 0
        self.errors = []

    def clean_numeric_value(self, value) -> float:
        """Clean and convert numeric values, handling NaN and empty strings"""
        if pd.isna(value) or value == '' or value == 'N/A':
            return 0.0
        try:
            return float(value)
        except (ValueError, TypeError):
            return 0.0

    def clean_string_value(self, value) -> Optional[str]:
        """Clean string values, handling NaN and empty strings"""
        if pd.isna(value) or value == '' or value == 'N/A':
            return None
        return str(value).strip()

    def extract_measurements(self, row) -> List[Dict]:
        """Extract serving measurements from CSV row"""
        measurements = []

        # Add the standard 100g measurement (since all nutritional data is per 100g)
        measurements.append({
            "name": "100 grams",
            "abbreviation": "100g",
            "unit": "g",
            "weightInGrams": 100.0,
            "isDefault": True,
            "isFromSource": True
        })

        measurements.append({
            "name": "1 gram",
            "abbreviation": "1g",
            "unit": "g",
            "weightInGrams": 1.0,
            "isDefault": False,
            "isFromSource": True
        })

        # Extract up to 9 serving measurements from CSV
        for i in range(1, 10):
            weight_col = f"Serving Weight {i} (g)"
            desc_col = f"Serving Description {i} (g)"

            if weight_col in row and desc_col in row:
                weight = self.clean_numeric_value(row[weight_col])
                description = self.clean_string_value(row[desc_col])

                if weight > 0 and description:
                    # Create abbreviation from description
                    abbrev = self.create_abbreviation(description)
                    unit_label = self.create_unit_label(description)

                    measurements.append({
                        "name": description,
                        "unit": unit_label,
                        "abbreviation": abbrev,
                        "weightInGrams": weight,
                        "isDefault": False,
                        "isFromSource": True
                    })

        return measurements

    def create_abbreviation(self, description: str) -> str:
        """Create abbreviation from serving description"""
        # Remove numbers and common words, take first part
        import re

        # Remove leading numbers and common words
        cleaned = re.sub(r'^\d+\s*', '', description.lower())
        cleaned = re.sub(r'\s*(piece|pieces|slice|slices|cup|cups|tablespoon|teaspoon)\s*', r'\1', cleaned)

        # Take first meaningful word, max 8 characters
        words = cleaned.split()
        if words:
            return words[0][:8]
        return description.lower().replace(' ', '')[:8]

    def create_unit_label(self, description: str) -> str:
        """Extract a unit label without the numeric portion."""
        import re

        cleaned = re.sub(r'^\d+(\.\d+)?\s*', '', description).strip()
        return cleaned or description.strip()

    def convert_csv_row_to_food_dto(self, row) -> Dict:
        """Convert CSV row to CreateFoodDto format"""

        # Extract measurements
        measurements = self.extract_measurements(row)

        # Build the food DTO
        food_dto = {
            "sourceId": self.clean_string_value(row.get("ID")),
            "name": self.clean_string_value(row.get("Name", "")),
            "foodGroup": self.clean_string_value(row.get("Food Group")),

            # All nutritional values are per 100g in the CSV
            "calories": int(self.clean_numeric_value(row.get("Calories", 0))),
            "protein": self.clean_numeric_value(row.get("Protein (g)", 0)),
            "carbs": self.clean_numeric_value(row.get("Carbohydrate (g)", 0)),
            "fat": self.clean_numeric_value(row.get("Fat (g)", 0)),
            "fiber": self.clean_numeric_value(row.get("Fiber (g)", 0)),
            "sugar": self.clean_numeric_value(row.get("Sugars (g)", 0)),
            "sodium": self.clean_numeric_value(row.get("Sodium (mg)", 0)),

            "saturatedFat": self.clean_numeric_value(row.get("Saturated Fats (g)", 0)),
            "transFat": self.clean_numeric_value(row.get("Trans Fatty Acids (g)", 0)),
            "cholesterol": self.clean_numeric_value(row.get("Cholesterol (mg)", 0)),
            "addedSugar": self.clean_numeric_value(row.get("Added Sugar (g)", 0)),
            "netCarbs": self.clean_numeric_value(row.get("Net-Carbs (g)", 0)),
            "solubleFiber": self.clean_numeric_value(row.get("Soluble Fiber (g)", 0)),
            "insolubleFiber": self.clean_numeric_value(row.get("Insoluble Fiber (g)", 0)),
            "water": self.clean_numeric_value(row.get("Water (g)", 0)),
            "pralScore": self.clean_numeric_value(row.get("PRAL score", 0)),
            "omega3": self.clean_numeric_value(row.get("Omega 3s (mg)", 0)),
            "omega6": self.clean_numeric_value(row.get("Omega 6s (mg)", 0)),
            "calcium": self.clean_numeric_value(row.get("Calcium (mg)", 0)),
            "iron": self.clean_numeric_value(row.get("Iron, Fe (mg)", 0)),
            "potassium": self.clean_numeric_value(row.get("Potassium, K (mg)", 0)),
            "magnesium": self.clean_numeric_value(row.get("Magnesium (mg)", 0)),
            "vitaminAiu": self.clean_numeric_value(row.get("Vitamin A, IU (IU)", 0)),
            "vitaminArae": self.clean_numeric_value(row.get("Vitamin A, RAE (mcg)", 0)),
            "vitaminC": self.clean_numeric_value(row.get("Vitamin C (mg)", 0)),
            "vitaminB12": self.clean_numeric_value(row.get("Vitamin B-12 (mcg)", 0)),
            "vitaminD": self.clean_numeric_value(row.get("Vitamin D (mcg)", 0)),
            "vitaminE": self.clean_numeric_value(row.get("Vitamin E (Alpha-Tocopherol) (mg)", 0)),
            "phosphorus": self.clean_numeric_value(row.get("Phosphorus, P (mg)", 0)),
            "zinc": self.clean_numeric_value(row.get("Zinc, Zn (mg)", 0)),
            "copper": self.clean_numeric_value(row.get("Copper, Cu (mg)", 0)),
            "manganese": self.clean_numeric_value(row.get("Manganese (mg)", 0)),
            "selenium": self.clean_numeric_value(row.get("Selenium, Se (mcg)", 0)),
            "fluoride": self.clean_numeric_value(row.get("Fluoride, F (mcg)", 0)),
            "molybdenum": self.clean_numeric_value(row.get("Molybdenum (mcg)", 0)),
            "chlorine": self.clean_numeric_value(row.get("Chlorine (mg)", 0)),
            "vitaminB1": self.clean_numeric_value(row.get("Thiamin (B1) (mg)", 0)),
            "vitaminB2": self.clean_numeric_value(row.get("Riboflavin (B2) (mg)", 0)),
            "vitaminB3": self.clean_numeric_value(row.get("Niacin (B3) (mg)", 0)),
            "vitaminB5": self.clean_numeric_value(row.get("Pantothenic acid (B5) (mg)", 0)),
            "vitaminB6": self.clean_numeric_value(row.get("Vitamin B6 (mg)", 0)),
            "biotin": self.clean_numeric_value(row.get("Biotin (B7) (mcg)", 0)),
            "folate": self.clean_numeric_value(row.get("Folate (B9) (mcg)", 0)),
            "folicAcid": self.clean_numeric_value(row.get("Folic acid (mcg)", 0)),
            "foodFolate": self.clean_numeric_value(row.get("Food Folate (mcg)", 0)),
            "folateDfe": self.clean_numeric_value(row.get("Folate DFE (mcg)", 0)),
            "choline": self.clean_numeric_value(row.get("Choline (mg)", 0)),
            "betaine": self.clean_numeric_value(row.get("Betaine (mg)", 0)),
            "retinol": self.clean_numeric_value(row.get("Retinol (mcg)", 0)),
            "caroteneBeta": self.clean_numeric_value(row.get("Carotene, beta (mcg)", 0)),
            "caroteneAlpha": self.clean_numeric_value(row.get("Carotene, alpha (mcg)", 0)),
            "lycopene": self.clean_numeric_value(row.get("Lycopene (mcg)", 0)),
            "luteinZeaxanthin": self.clean_numeric_value(row.get("Lutein + Zeaxanthin (mcg)", 0)),
            "vitaminD2": self.clean_numeric_value(row.get("Vitamin D2 (ergocalciferol) (mcg)", 0)),
            "vitaminD3": self.clean_numeric_value(row.get("Vitamin D3 (cholecalciferol) (mcg)", 0)),
            "vitaminDiu": self.clean_numeric_value(row.get("Vitamin D (IU) (IU)", 0)),
            "vitaminK": self.clean_numeric_value(row.get("Vitamin K (mcg)", 0)),
            "dihydrophylloquinone": self.clean_numeric_value(row.get("Dihydrophylloquinone (mcg)", 0)),
            "menaquinone4": self.clean_numeric_value(row.get("Menaquinone-4 (mcg)", 0)),
            "monoFat": self.clean_numeric_value(row.get("Fatty acids, total monounsaturated (mg)", 0)),
            "polyFat": self.clean_numeric_value(row.get("Fatty acids, total polyunsaturated (mg)", 0)),
            "ala": self.clean_numeric_value(row.get("18:3 n-3 c,c,c (ALA) (mg)", 0)),
            "epa": self.clean_numeric_value(row.get("20:5 n-3 (EPA) (mg)", 0)),
            "dpa": self.clean_numeric_value(row.get("22:5 n-3 (DPA) (mg)", 0)),
            "dha": self.clean_numeric_value(row.get("22:6 n-3 (DHA) (mg)", 0)),

            # Include measurements
            "measurements": measurements
        }

        return food_dto

    def post_food_to_api(self, food_dto: Dict) -> bool:
        """Send POST request to create food"""
        try:
            url = f"{self.api_base_url}/food/csv-create"

            headers = {
                "Content-Type": "application/json",
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoic29ub3JvdXNkdWNrQGdtYWlsLmNvbSIsImlhdCI6MTc1NzEyMzE2NSwiZXhwIjoxNzY1NzYzMTY1fQ.nLgqQWdaeGGG01grAncOHXzU_GyZc66T7tdmTLyD6Xg"
            }

            response = requests.post(
                url,
                json=food_dto,
                headers=headers,
                timeout=30
            )

            if response.status_code in [200, 201]:
                print(f"✅ Successfully created: {food_dto['name']}")
                self.success_count += 1
                return True
            else:
                error_msg = f"❌ Failed to create {food_dto['name']}: {response.status_code} - {response.text}"
                print(error_msg)
                self.errors.append({
                    'food': food_dto['name'],
                    'error': error_msg,
                    'status_code': response.status_code
                })
                self.error_count += 1
                return False

        except requests.exceptions.RequestException as e:
            error_msg = f"❌ Network error for {food_dto['name']}: {str(e)}"
            print(error_msg)
            self.errors.append({
                'food': food_dto['name'],
                'error': error_msg,
                'status_code': 'NETWORK_ERROR'
            })
            self.error_count += 1
            return False

    def import_foods(self, batch_size: int = 50, delay_between_batches: float = 0.25):
        """Import all foods from CSV to API"""
        print(f"🚀 Starting import from {self.csv_file_path}")
        print(f"📡 Target API: {self.api_base_url}/food/csv")

        try:
            # Read CSV file
            df = pd.read_csv(self.csv_file_path)
            total_rows = len(df)

            print(f"📊 Found {total_rows} foods to import")
            print(f"⚙️  Batch size: {batch_size}, Delay: {delay_between_batches}s")
            print("-" * 50)

            # Process in batches to be nice to your API
            for batch_start in range(3, total_rows, batch_size):
                batch_end = min(batch_start + batch_size, total_rows)
                batch_number = (batch_start // batch_size) + 1

                print(f"\n📦 Processing batch {batch_number} (rows {batch_start+1}-{batch_end})")

                # Process each row in the batch
                for index in range(batch_start, batch_end):
                    row = df.iloc[index]

                    # Skip rows without name
                    if pd.isna(row.get('Name')) or row.get('Name') == '':
                        print(f"⏭️  Skipping row {index+1}: No name")
                        continue

                    # Convert to DTO and post
                    food_dto = self.convert_csv_row_to_food_dto(row)
                    self.post_food_to_api(food_dto)

                    # Small delay between requests to be nice to your server
                    time.sleep(0.05)

                # Delay between batches
                if batch_end < total_rows:
                    print(f"⏳ Waiting {delay_between_batches}s before next batch...")
                    time.sleep(delay_between_batches)

        except FileNotFoundError:
            print(f"❌ ERROR: CSV file not found: {self.csv_file_path}")
            return
        except pd.errors.EmptyDataError:
            print(f"❌ ERROR: CSV file is empty: {self.csv_file_path}")
            return
        except Exception as e:
            print(f"❌ ERROR: Unexpected error reading CSV: {str(e)}")
            return

        # Print summary
        print("\n" + "="*50)
        print("📊 IMPORT SUMMARY")
        print("="*50)
        print(f"✅ Successful imports: {self.success_count}")
        print(f"❌ Failed imports: {self.error_count}")
        print(f"📈 Success rate: {(self.success_count/(self.success_count+self.error_count)*100):.1f}%" if (self.success_count+self.error_count) > 0 else "N/A")

        if self.errors:
            print(f"\n🚨 First 5 errors:")
            for error in self.errors[:5]:
                print(f"   - {error['food']}: {error['status_code']}")

            # Optionally save errors to file
            with open('import_errors.json', 'w') as f:
                json.dump(self.errors, f, indent=2)
            print(f"💾 All errors saved to: import_errors.json")

    def test_connection(self):
        """Test if the API is reachable"""
        try:
            response = requests.get(f"{self.api_base_url}/food/all", timeout=10, headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoic29ub3JvdXNkdWNrQGdtYWlsLmNvbSIsImlhdCI6MTc2ODEzODAzNCwiZXhwIjoxNzc2Nzc4MDM0fQ.a0Kiw9AfCiQsNc78aDWrgyD7Zxok56kR6Hd3Bu-ZH-w"})
            if response.status_code == 200:
                print("✅ API connection successful")
                return True
            else:
                print(f"⚠️  API responded with status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Cannot connect to API: {str(e)}")
            return False

# Usage example
if __name__ == "__main__":
    # Configuration
    CSV_FILE_PATH = "../data/MyFoodData Nutrition Facts SpreadSheet Release 1.4 - SR Legacy and FNDDS.csv"
    API_BASE_URL = "http://localhost:3001"

    # Create importer
    importer = FoodImporter(CSV_FILE_PATH, API_BASE_URL)

    # Test connection first
    if not importer.test_connection():
        print("❌ Exiting due to connection issues")
        exit(1)

    # Start import
    importer.import_foods(
        batch_size=10,      # Process 5 foods at a time
        delay_between_batches=0.5  # Wait 2 seconds between batches
    )

    print("\n🎉 Import process completed!")

# Alternative: Simple single-food test
def test_single_food_import():
    """Test importing a single food item"""
    test_food = {
        "sourceId": "TEST001",
        "name": "Test Banana",
        "foodGroup": "Fruits",
        "calories": 89,
        "protein": 1.09,
        "carbs": 22.84,
        "fat": 0.33,
        "fiber": 2.6,
        "sugar": 12.23,
        "sodium": 1,
        "saturatedFat": 0.112,
        "cholesterol": 0,
        "measurements": [
            {
                "name": "100 grams",
                "abbreviation": "100g",
                "unit": 100,
                "weightInGrams": 100,
                "isDefault": True,
                "isFromSource": True
            },
            {
                "name": "1 medium banana",
                "unit": 1,
                "abbreviation": "medium",
                "weightInGrams": 118,
                "isDefault": False,
                "isFromSource": True
            }
        ]
    }

    try:
        response = requests.post(
            "http://localhost:3000/food/csv-create",
            json=test_food,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"Test response: {response.status_code}")
        print(f"Response body: {response.text}")
    except Exception as e:
        print(f"Test failed: {e}")

# Uncomment to run test:
# test_single_food_import()
