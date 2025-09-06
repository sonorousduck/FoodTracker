/**
 * Auto-generated from backend DTOs/Entities on 2025-09-06 07:48:25
 * Do not edit manually.
 */

import { CreateFoodMeasurementDto } from "../foodmeasurement/createfoodmeasurement";

export interface CreateFoodDto {
    sourceId?: string;
    name: string;
    brand?: string;
    foodGroup?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    saturatedFat?: number;
    cholesterol?: number;
    measurements?: CreateFoodMeasurementDto[];
}
