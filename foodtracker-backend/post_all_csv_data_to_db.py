import pandas as pd
import requests
import json
import time
from typing import Dict, List, Optional

class FoodImporter:
    def __init__(self, csv_file_path: str, api_base_url: str = "http://localhost:3000"):
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
            "unit": 100,
            "weightInGrams": 100.0,
            "isDefault": True,
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
                    
                    measurements.append({
                        "name": description,
                        "unit": description[0],
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
            response = requests.get(f"{self.api_base_url}/food/all", timeout=10, headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoic29ub3JvdXNkdWNrQGdtYWlsLmNvbSIsImlhdCI6MTc1NzEyMzE2NSwiZXhwIjoxNzY1NzYzMTY1fQ.nLgqQWdaeGGG01grAncOHXzU_GyZc66T7tdmTLyD6Xg"})
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
    CSV_FILE_PATH = "/Users/sonorousduck/Downloads/Copy of MyFoodData Nutrition Facts SpreadSheet Detailed Release 1.0 - SR Legacy and FNDDS.csv" 
    API_BASE_URL = "http://localhost:3000"
    
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