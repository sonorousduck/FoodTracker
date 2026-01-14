/**
 * Auto-generated from backend DTOs/Entities on 2026-01-14 07:48:19
 * Do not edit manually.
 */

import { User } from "../users/user";
import { FoodEntry } from "../foodentry/foodentry";

export interface Meal {
    id: string;
    user: User;
    name: string;
    foodEntries: FoodEntry[];
}
