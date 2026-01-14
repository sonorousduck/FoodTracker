/**
 * Auto-generated from backend DTOs/Entities on 2026-01-14 07:48:19
 * Do not edit manually.
 */

import { Food } from "../food/food";

export interface FoodMeasurement {
    id: number;
    food: Food;
    unit: string;
    name: string;
    abbreviation: string;
    weightInGrams: number;
    isDefault: boolean;
    isActive: boolean;
    isFromSource: boolean;
}
