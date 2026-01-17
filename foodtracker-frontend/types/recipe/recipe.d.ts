/**
 * Auto-generated from backend DTOs/Entities on 2026-01-17 13:01:35
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
    ingredients: ReadonlyArray<RecipeFood>;
}
