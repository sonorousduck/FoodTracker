/**
 * Auto-generated from backend DTOs/Entities on 2026-01-14 07:48:19
 * Do not edit manually.
 */

import { Food } from "./food";

export interface AllFoodsDto {
    foods: Food[];
    totalCount: number;
    pageNumber: number;
    limit: number;
}
