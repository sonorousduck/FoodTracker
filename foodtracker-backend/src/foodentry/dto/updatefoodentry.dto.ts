import { IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const MEAL_TYPES = [0, 1, 2, 3] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export class UpdateFoodEntryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  servings?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  measurementId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(MEAL_TYPES)
  mealType?: MealType;
}
