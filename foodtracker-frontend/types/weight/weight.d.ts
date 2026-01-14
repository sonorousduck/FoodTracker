/**
 * Auto-generated from backend DTOs/Entities on 2026-01-14 07:48:19
 * Do not edit manually.
 */

import { User } from "../users/user";

export interface Weight {
    id: number;
    weightEntry: number;
    date: Date;
    user: User;
    createdDate: Date;
}
