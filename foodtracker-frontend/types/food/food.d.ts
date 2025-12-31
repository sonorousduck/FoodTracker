/**
 * Auto-generated from backend DTOs/Entities on 2025-12-31 07:48:59
 * Do not edit manually.
 */

import { User } from "../users/user";
import { RecipeFood } from "../recipefood/recipefood";
import { FoodMeasurement } from "../foodmeasurement/foodmeasurement";

export interface Food {
    id: number;
    sourceId?: string;
    name: string;
    brand?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    createdBy?: User;
    recipeFoods: ReadonlyArray<RecipeFood>;
    measurements: ReadonlyArray<FoodMeasurement>;
    createdAt: Date;
}
