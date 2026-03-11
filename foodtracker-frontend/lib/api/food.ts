import { apiMethods } from '@/lib/api';
import { CreateFoodDto } from '@/types/food/createfood';
import { Food } from '@/types/food/food';
import { FoodMeasurement } from '@/types/foodmeasurement/foodmeasurement';


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

export const createFood = async (payload: CreateFoodDto): Promise<Food> => {
  return apiMethods.post<Food>('/food/create', payload);
};

export const getFoodMeasurements = async (foodId: number): Promise<FoodMeasurement[]> => {
  const params = new URLSearchParams({ foodId: foodId.toString() });
  return apiMethods.get<FoodMeasurement[]>(`/foodmeasurement?${params.toString()}`);
};
