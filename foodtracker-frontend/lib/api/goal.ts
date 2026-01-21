import { apiMethods } from '@/lib/api';
import { Goal } from '@/types/goal/goal';
import { GoalType } from '@/types/goal/goaltype';
import { SetNutritionGoalsDto } from '@/types/goal/setnutritiongoals';

export type CurrentGoalsResponse = Partial<Record<GoalType, Goal>>;

export const getCurrentGoals = async (): Promise<CurrentGoalsResponse> => {
  return apiMethods.get<CurrentGoalsResponse>('/goal/current');
};

export const setNutritionGoals = async (
  payload: SetNutritionGoalsDto,
): Promise<ReadonlyArray<Goal>> => {
  return apiMethods.post<ReadonlyArray<Goal>>('/goal/nutrition', payload);
};
