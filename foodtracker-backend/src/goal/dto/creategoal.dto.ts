import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { GoalType } from './goaltype';


export class CreateGoalDto {
  @IsString()
  name?: string;

  @IsNumber()
  value: number;

  @IsEnum(GoalType)
  goalType: GoalType;

  @IsOptional()
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;
}
