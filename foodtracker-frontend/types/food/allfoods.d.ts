/**
 * Auto-generated from backend DTOs/Entities on 2025-09-06 07:48:25
 * Do not edit manually.
 */

import { Food } from "./food";

export interface AllFoodsDto {
    foods: Food[];
    totalCount: number;
    pageNumber: number;
    limit: number;
}
