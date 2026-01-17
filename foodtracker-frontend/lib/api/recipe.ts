import { apiMethods } from '@/lib/api';
import { CreateRecipeDto } from '@/types/recipe/createrecipe';
import { Recipe } from '@/types/recipe/recipe';
import { UpdateRecipeDto } from '@/types/recipe/updaterecipe';

type GetRecipesParams = {
  search?: string;
  limit?: number;
  page?: number;
};

export const createRecipe = async (
  payload: CreateRecipeDto,
): Promise<Recipe> => {
  return apiMethods.post<Recipe>('/recipe/create', payload);
};

export const getRecipe = async (id: number): Promise<Recipe> => {
  const params = new URLSearchParams({ id: id.toString() });
  return apiMethods.get<Recipe>(`/recipe?${params.toString()}`);
};

export const getRecipes = async (
  { search, limit, page }: GetRecipesParams = {},
): Promise<Recipe[]> => {
  const params = new URLSearchParams();
  if (search) {
    params.set('search', search);
  }
  if (limit !== undefined) {
    params.set('limit', limit.toString());
  }
  if (page !== undefined) {
    params.set('page', page.toString());
  }
  const query = params.toString();
  return apiMethods.get<Recipe[]>(query ? `/recipe?${query}` : '/recipe');
};

export const updateRecipe = async (
  id: number,
  payload: UpdateRecipeDto,
): Promise<Recipe> => {
  return apiMethods.put<Recipe>(`/recipe/${id}`, payload);
};

export const deleteRecipe = async (id: number): Promise<boolean> => {
  return apiMethods.delete<boolean>(`/recipe/${id}`);
};
