import { IsDate, IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const MEAL_TYPES = [0, 1, 2, 3] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export class CreateFoodEntryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  foodId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  recipeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  measurementId?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  servings: number;

  @Type(() => Number)
  @IsInt()
  @IsIn(MEAL_TYPES)
  mealType: MealType;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  loggedAt?: Date;
}
