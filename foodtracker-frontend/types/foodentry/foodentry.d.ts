/**
 * Auto-generated from backend DTOs/Entities on 2025-09-06 07:48:25
 * Do not edit manually.
 */

import { User } from "../users/user";
import { Food } from "../food/food";
import { Recipe } from "../recipe/recipe";
import { Meal } from "../meal/meal";

export interface FoodEntry {
    id: number;
    user: User;
    food?: Food;
    recipe?: Recipe;
    servings: number;
    meal?: Meal;
    loggedAt: Date;
}
