/**
 * Auto-generated from backend DTOs/Entities on 2026-01-17 14:05:06
 * Do not edit manually.
 */

import { User } from "../users/user";
import { Food } from "../food/food";
import { FoodMeasurement } from "../foodmeasurement/foodmeasurement";
import { Recipe } from "../recipe/recipe";
import { Meal } from "../meal/meal";

export interface FoodEntry {
    id: number;
    user: User;
    food?: Food;
    measurement?: FoodMeasurement;
    recipe?: Recipe;
    servings: number;
    meal?: Meal;
    loggedAt: Date;
}
