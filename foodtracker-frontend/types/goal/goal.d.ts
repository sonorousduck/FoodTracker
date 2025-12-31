/**
 * Auto-generated from backend DTOs/Entities on 2025-12-31 07:48:59
 * Do not edit manually.
 */

import { User } from "../users/user";

export interface Goal {
    id: number;
    name: string;
    value: number;
    goalType: GoalType;
    user: User;
    startDate: Date;
    endDate: Date;
    createdDate: Date;
}
