/**
 * Auto-generated from backend DTOs/Entities on 2025-09-05 22:19:56
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
