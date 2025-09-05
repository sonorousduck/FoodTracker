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
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1000) // Cholesterol in mg
  cholesterol?: number; // Cholesterol per 100g (in mg)

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFoodMeasurementDto)
  measurements?: CreateFoodMeasurementDto[]; // Optional measurements to create with the food
}
