/**
 * Auto-generated from backend DTOs/Entities on 2025-09-05 22:19:56
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
