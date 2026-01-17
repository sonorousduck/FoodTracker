import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateRecipeIngredientDto {
  @IsInt()
  @Min(1)
  foodId: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  servings: number;

  @IsOptional()
  @IsInt()
  measurementId?: number | null;
}
