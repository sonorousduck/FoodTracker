/**
 * Auto-generated from backend DTOs/Entities on 2026-01-17 14:52:16
 * Do not edit manually.
 */


export const MEAL_TYPES = [0, 1, 2, 3] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export interface CreateFoodEntryDto {
    foodId?: number;
    recipeId?: number;
    measurementId?: number;
    servings: number;
    mealType: MealType;
    loggedAt?: Date;
}
