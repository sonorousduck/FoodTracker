/**
 * Auto-generated from backend DTOs/Entities on 2026-03-11 08:05:29
 * Do not edit manually.
 */

import { User } from "../users/user";

export enum FriendshipStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
}

export interface Friendship {
    id: number;
    requester: User;
    addressee: User;
    status: FriendshipStatus;
    createdAt: Date;
    updatedAt: Date;
}
