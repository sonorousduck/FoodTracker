/**
 * Auto-generated from backend DTOs/Entities on 2026-01-17 13:01:35
 * Do not edit manually.
 */

import { CreateRecipeIngredientDto } from "./createrecipeingredient";

export interface CreateRecipeDto {
    title: string;
    servings: number;
    calories?: number;
    ingredients: CreateRecipeIngredientDto[];
}
