/**
 * Auto-generated from backend DTOs/Entities on 2025-09-06 17:45:03
 * Do not edit manually.
 */

import { User } from "../users/user";
import { RecipeFood } from "../recipefood/recipefood";

export interface Recipe {
    id: number;
    user: User;
    title: string;
    servings: number;
    calories?: number;
    fat?: number;
    carbs?: number;
    protein?: number;
    ingredients: ReadonlyArray<RecipeFood>;
}
