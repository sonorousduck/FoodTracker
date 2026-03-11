/**
 * Auto-generated from backend DTOs/Entities on 2026-03-11 08:05:29
 * Do not edit manually.
 */

import { Food } from "../food/food";
import { FoodEntry } from "../foodentry/foodentry";
import { Meal } from "../meal/meal";
import { Recipe } from "../recipe/recipe";
import { Weight } from "../weight/weight";
import { Goal } from "../goal/goal";
import { Friendship } from "../friends/friendship";

export interface User {
    id: number;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    foods: ReadonlyArray<Food>;
    foodEntries: ReadonlyArray<FoodEntry>;
    meals: ReadonlyArray<Meal>;
    recipes: ReadonlyArray<Recipe>;
    weightEntries: ReadonlyArray<Weight>;
    goals: ReadonlyArray<Goal>;
    friendRequestsSent: ReadonlyArray<Friendship>;
    friendRequestsReceived: ReadonlyArray<Friendship>;
}
