import { Type } from "class-transformer";
import { IsString, ValidateNested } from "class-validator";
import { CreateFoodDto } from "src/food/dto/createfood.dto";

export class CreateFoodBarcodeDto {
  @IsString()
  barcode: string;

  @ValidateNested()
  @Type(() => CreateFoodDto)
  food: CreateFoodDto;
}
