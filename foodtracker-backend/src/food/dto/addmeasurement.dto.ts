import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsPositive, IsString } from "class-validator";


export class AddMeasurementDto {
  @IsString()
  name!: string;

  @IsString()
  abbreviation!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  weightInGrams!: number;

  @IsOptional()
  @Transform(({ value }) => Boolean(value))
  isDefault?: boolean = false;
}
