import { apiMethods } from '@/lib/api';
import { FriendProfile } from '@/types/friends/friendprofile';
import { FriendRequest } from '@/types/friends/friendrequest';
import { FoodEntry } from '@/types/foodentry/foodentry';
import { Recipe } from '@/types/recipe/recipe';

export const searchFriends = async ({
  firstName,
  lastName,
  limit,
}: {
  firstName?: string;
  lastName?: string;
  limit?: number;
}): Promise<FriendProfile[]> => {
  const params = new URLSearchParams();
  if (firstName) {
    params.set('firstName', firstName);
  }
  if (lastName) {
    params.set('lastName', lastName);
  }
  if (limit != null) {
    params.set('limit', limit.toString());
  }
  const query = params.toString();
  return apiMethods.get<FriendProfile[]>(
    query ? `/friends/search?${query}` : '/friends/search',
  );
};

export const requestFriend = async (userId: number): Promise<void> => {
  await apiMethods.post('/friends/request', { userId });
};

export const acceptFriendRequest = async (friendshipId: number): Promise<void> => {
  await apiMethods.post('/friends/accept', { friendshipId });
};

export const rejectFriendRequest = async (friendshipId: number): Promise<void> => {
  await apiMethods.post('/friends/reject', { friendshipId });
};

export const getFriends = async (): Promise<FriendProfile[]> => {
  return apiMethods.get<FriendProfile[]>('/friends');
};

export const getPendingFriendRequests = async (): Promise<FriendRequest[]> => {
  return apiMethods.get<FriendRequest[]>('/friends/requests');
};

export const getFriendProfile = async (friendId: number): Promise<FriendProfile> => {
  return apiMethods.get<FriendProfile>(`/friends/${friendId}`);
};

export const getFriendDiary = async (
  friendId: number,
  date: string,
): Promise<FoodEntry[]> => {
  const params = new URLSearchParams({ date });
  return apiMethods.get<FoodEntry[]>(
    `/friends/${friendId}/diary?${params.toString()}`,
  );
};

export const getFriendRecipes = async ({
  friendId,
  search,
  limit,
  page,
}: {
  friendId: number;
  search?: string;
  limit?: number;
  page?: number;
}): Promise<Recipe[]> => {
  const params = new URLSearchParams();
  if (search) {
    params.set('search', search);
  }
  if (limit != null) {
    params.set('limit', limit.toString());
  }
  if (page != null) {
    params.set('page', page.toString());
  }
  const query = params.toString();
  return apiMethods.get<Recipe[]>(
    query
      ? `/friends/${friendId}/recipes?${query}`
      : `/friends/${friendId}/recipes`,
  );
};

export const importFriendRecipe = async (
  friendId: number,
  recipeId: number,
): Promise<Recipe> => {
  return apiMethods.post<Recipe>(
    `/friends/${friendId}/recipes/${recipeId}/import`,
  );
};
