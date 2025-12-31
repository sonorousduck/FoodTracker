/**
 * Auto-generated from backend DTOs/Entities on 2025-12-31 07:48:59
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
