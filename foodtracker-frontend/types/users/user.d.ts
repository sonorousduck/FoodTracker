/**
 * Auto-generated from backend DTOs/Entities on 2025-09-05 22:19:56
 * Do not edit manually.
 */

import { Food } from "../food/food";
import { FoodEntry } from "../foodentry/foodentry";
import { Meal } from "../meal/meal";
import { Recipe } from "../recipe/recipe";

export interface User {
    id: number;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    foods: ReadonlyArray<Food>;
    foodEntries: ReadonlyArray<FoodEntry>;
    meals: ReadonlyArray<Meal>;
    recipes: ReadonlyArray<Recipe>;
}
