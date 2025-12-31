/**
 * Auto-generated from backend DTOs/Entities on 2025-12-31 07:48:59
 * Do not edit manually.
 */

import { Food } from "../food/food";

export interface FoodMeasurement {
    id: number;
    food: Food;
    unit: number;
    name: string;
    abbreviation: string;
    weightInGrams: number;
    isDefault: boolean;
    isActive: boolean;
    isFromSource: boolean;
}
