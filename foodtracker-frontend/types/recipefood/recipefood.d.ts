/**
 * Auto-generated from backend DTOs/Entities on 2026-01-17 13:01:35
 * Do not edit manually.
 */

import { Recipe } from "../recipe/recipe";
import { Food } from "../food/food";

export interface RecipeFood {
    id?: string;
    recipe: Recipe;
    food: Food;
    servings: number;
    measurementId?: number | null;
}
