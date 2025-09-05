import { IsString, IsNumber, IsPositive, IsOptional } from "class-validator";
import { Transform } from "class-transformer";


export class CreateFoodMeasurementDto {
  @IsString()
  name: string; // "1 cup", "1 tablespoon", "100g"

  @IsString()
  abbreviation: string; // "cup", "tbsp", "100g"

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  weightInGrams: number; // How many grams this measurement represents

  @IsOptional()
  @Transform(({ value }) => Boolean(value))
  isDefault?: boolean = false;

  @IsOptional()
  @Transform(({ value }) => Boolean(value))
  isFromSource?: boolean = false;
}
