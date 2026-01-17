import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { CreateRecipeIngredientDto } from './createrecipeingredient.dto';

export class CreateRecipeDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsInt()
  @Min(1)
  servings: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  calories?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients: CreateRecipeIngredientDto[];
}
