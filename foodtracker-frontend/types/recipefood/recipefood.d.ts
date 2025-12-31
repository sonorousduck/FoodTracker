/**
 * Auto-generated from backend DTOs/Entities on 2025-12-31 07:48:59
 * Do not edit manually.
 */

import { Recipe } from "../recipe/recipe";
import { Food } from "../food/food";

export interface RecipeFood {
    id: string;
    recipe: Recipe;
    food: Food;
    amount: number;
}
