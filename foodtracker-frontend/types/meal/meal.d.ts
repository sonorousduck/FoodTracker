/**
 * Auto-generated from backend DTOs/Entities on 2025-09-06 17:45:03
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
