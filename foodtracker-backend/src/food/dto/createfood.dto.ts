import { IsOptional, IsString, IsNumber, Min, Max, IsArray, ValidateNested } from "class-validator";
import { CreateFoodMeasurementDto } from "src/foodmeasurement/dto/createfoodmeasurement.dto";
import { Type, Transform } from "class-transformer";


export class CreateFoodDto {
  @IsOptional()
  @IsString()
  sourceId?: string; // Original ID from CSV for reference

  @IsString()
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  brand?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  foodGroup?: string; // From CSV "Food Group" column

  // All nutritional values are per 100g
  @IsNumber()
  @Min(0)
  @Max(9999) // Reasonable max calories per 100g
  calories: number; // Calories per 100g

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100) // Reasonable max protein per 100g
  protein: number; // Protein per 100g

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  carbs: number; // Carbohydrate per 100g

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  fat: number; // Fat per 100g

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  fiber: number; // Fiber per 100g

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  sugar: number; // Sugars per 100g

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(50000) // Sodium can be high in some foods (in mg)
  sodium: number; // Sodium per 100g (in mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  saturatedFat?: number; // Saturated Fats per 100g

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  transFat?: number; // Trans Fatty Acids per 100g

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1000) // Cholesterol in mg
  cholesterol?: number; // Cholesterol per 100g (in mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  addedSugar?: number; // Added Sugar per 100g

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  netCarbs?: number; // Net carbs per 100g

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  solubleFiber?: number; // Soluble fiber per 100g

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  insolubleFiber?: number; // Insoluble fiber per 100g

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  water?: number; // Water per 100g

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  pralScore?: number; // PRAL score per 100g

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  omega3?: number; // Omega 3s per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  omega6?: number; // Omega 6s per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  calcium?: number; // Calcium per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  iron?: number; // Iron per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  potassium?: number; // Potassium per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  magnesium?: number; // Magnesium per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  vitaminAiu?: number; // Vitamin A IU per 100g

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  vitaminArae?: number; // Vitamin A RAE per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  vitaminC?: number; // Vitamin C per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  vitaminB12?: number; // Vitamin B-12 per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  vitaminD?: number; // Vitamin D per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  vitaminE?: number; // Vitamin E per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  phosphorus?: number; // Phosphorus per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  zinc?: number; // Zinc per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  copper?: number; // Copper per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  manganese?: number; // Manganese per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  selenium?: number; // Selenium per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  fluoride?: number; // Fluoride per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  molybdenum?: number; // Molybdenum per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  chlorine?: number; // Chlorine per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  vitaminB1?: number; // Thiamin (B1) per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  vitaminB2?: number; // Riboflavin (B2) per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  vitaminB3?: number; // Niacin (B3) per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  vitaminB5?: number; // Pantothenic acid (B5) per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  vitaminB6?: number; // Vitamin B6 per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  biotin?: number; // Biotin (B7) per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  folate?: number; // Folate (B9) per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  folicAcid?: number; // Folic acid per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  foodFolate?: number; // Food folate per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  folateDfe?: number; // Folate DFE per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  choline?: number; // Choline per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  betaine?: number; // Betaine per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  retinol?: number; // Retinol per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  caroteneBeta?: number; // Carotene, beta per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  caroteneAlpha?: number; // Carotene, alpha per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  lycopene?: number; // Lycopene per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  luteinZeaxanthin?: number; // Lutein + Zeaxanthin per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  vitaminD2?: number; // Vitamin D2 per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  vitaminD3?: number; // Vitamin D3 per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  vitaminDiu?: number; // Vitamin D per 100g (IU)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  vitaminK?: number; // Vitamin K per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  dihydrophylloquinone?: number; // Dihydrophylloquinone per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  menaquinone4?: number; // Menaquinone-4 per 100g (mcg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  monoFat?: number; // Monounsaturated fat per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  polyFat?: number; // Polyunsaturated fat per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  ala?: number; // ALA per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  epa?: number; // EPA per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  dpa?: number; // DPA per 100g (mg)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  dha?: number; // DHA per 100g (mg)

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFoodMeasurementDto)
  measurements?: CreateFoodMeasurementDto[]; // Optional measurements to create with the food
}
