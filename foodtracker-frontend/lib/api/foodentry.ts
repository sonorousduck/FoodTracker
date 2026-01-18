import { apiMethods } from '@/lib/api';
import { CreateFoodEntryDto } from '@/types/foodentry/createfoodentry';
import { FoodEntry } from '@/types/foodentry/foodentry';
import { UpdateFoodEntryDto } from '@/types/foodentry/updatefoodentry';

export const createFoodEntry = async (
  payload: CreateFoodEntryDto,
): Promise<FoodEntry> => {
  return apiMethods.post<FoodEntry>('/foodentry/create', payload);
};

export const getFoodEntryHistory = async ({
  limit,
}: {
  limit?: number;
} = {}): Promise<FoodEntry[]> => {
  const params = new URLSearchParams();
  if (limit !== undefined) {
    params.set('limit', limit.toString());
  }
  const query = params.toString();
  return apiMethods.get<FoodEntry[]>(
    query ? `/foodentry/history?${query}` : '/foodentry/history',
  );
};

export const getDiaryEntries = async (date: string): Promise<FoodEntry[]> => {
  const params = new URLSearchParams({ date });
  return apiMethods.get<FoodEntry[]>(`/foodentry/diary?${params.toString()}`);
};

export const updateFoodEntry = async (
  id: number,
  payload: UpdateFoodEntryDto,
): Promise<FoodEntry> => {
  return apiMethods.put<FoodEntry>(`/foodentry/${id}`, payload);
};

export const deleteFoodEntry = async (id: number): Promise<boolean> => {
  return apiMethods.delete<boolean>(`/foodentry/${id}`);
};
