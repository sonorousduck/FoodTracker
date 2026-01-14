/**
 * Auto-generated from backend DTOs/Entities on 2026-01-14 07:48:19
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
