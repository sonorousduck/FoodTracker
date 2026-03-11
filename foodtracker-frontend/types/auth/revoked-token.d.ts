/**
 * Auto-generated from backend DTOs/Entities on 2026-03-11 08:05:29
 * Do not edit manually.
 */


export interface RevokedToken {
    id: number;
    tokenHash: string;
    userId: number;
    reason?: string;
    revokedAt: Date;
    expiresAt: Date;
}
