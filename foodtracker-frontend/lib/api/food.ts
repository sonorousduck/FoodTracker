import { apiMethods } from '@/lib/api';
import { Food } from '@/types/food/food';

export const searchFoods = async (
  query: string,
  limit: number = 20,
): Promise<Food[]> => {
  const params = new URLSearchParams({
    name: query,
    limit: limit.toString(),
  });

  return apiMethods.get<Food[]>(`/food?${params.toString()}`);
};
