/**
 * Auto-generated from backend DTOs/Entities on 2026-01-14 07:48:19
 * Do not edit manually.
 */

import { Food } from "../food/food";
import { FoodEntry } from "../foodentry/foodentry";
import { Meal } from "../meal/meal";
import { Recipe } from "../recipe/recipe";
import { Weight } from "../weight/weight";
import { Goal } from "../goal/goal";

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
    weightEntries: ReadonlyArray<Weight>;
    goals: ReadonlyArray<Goal>;
}
