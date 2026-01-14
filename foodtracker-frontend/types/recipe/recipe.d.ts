/**
 * Auto-generated from backend DTOs/Entities on 2026-01-14 07:48:19
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
