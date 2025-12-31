/**
 * Auto-generated from backend DTOs/Entities on 2025-12-31 07:48:59
 * Do not edit manually.
 */

import { Food } from "./food";

export interface AllFoodsDto {
    foods: Food[];
    totalCount: number;
    pageNumber: number;
    limit: number;
}
