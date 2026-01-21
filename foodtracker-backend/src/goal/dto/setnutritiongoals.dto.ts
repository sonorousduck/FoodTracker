import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class SetNutritionGoalsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  calorieGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  proteinGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  carbsGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fatGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  proteinPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  carbsPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fatPercent?: number;
}
