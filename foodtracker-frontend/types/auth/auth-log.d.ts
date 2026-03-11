/**
 * Auto-generated from backend DTOs/Entities on 2026-03-11 08:05:29
 * Do not edit manually.
 */


export enum AuthEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  REGISTER = 'REGISTER',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_REFRESH_FAILURE = 'TOKEN_REFRESH_FAILURE',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
}

export interface AuthLog {
    id: number;
    userId?: number;
    eventType: AuthEventType;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    metadata?: Record<string, any>;
    createdAt: Date;
}
