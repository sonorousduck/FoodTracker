/**
 * Auto-generated from backend DTOs/Entities on 2026-03-11 08:05:29
 * Do not edit manually.
 */

import { Food } from "../food/food";

export interface FoodBarcode {
    id: number;
    barcode: string;
    food: Food;
    createdAt: Date;
}
