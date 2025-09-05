import { IsString, IsNumber, IsPositive, IsOptional } from "class-validator";
import { Transform } from "class-transformer";


export class AddMeasurementDto {
  @IsString()
  name: string;

  @IsString()
  abbreviation: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  weightInGrams: number;

  @IsOptional()
  @Transform(({ value }) => Boolean(value))
  isDefault?: boolean = false;
}
