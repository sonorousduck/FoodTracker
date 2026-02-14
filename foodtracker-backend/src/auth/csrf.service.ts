import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHmac } from 'crypto';

@Injectable()
export class CSRFService {
  private readonly csrfSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.csrfSecret = this.getCsrfSecret();
  }

  /**
   * Generate a random CSRF token
   * @returns A random hex string
   */
  generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Hash a CSRF token using HMAC-SHA256 with the CSRF secret
   * @param token - The CSRF token to hash
   * @returns The hashed token
   */
  hashToken(token: string): string {
    return createHmac('sha256', this.csrfSecret)
      .update(token)
      .digest('hex');
  }

  /**
   * Validate a CSRF token using the double-submit cookie pattern:
   * the cookie value and the X-CSRF-Token header value must match.
   * @param cookieToken - The CSRF token from the cookie
   * @param headerToken - The CSRF token from the request header
   * @returns True if the tokens match, false otherwise
   */
  validateToken(cookieToken: string, headerToken: string): boolean {
    if (!cookieToken || !headerToken) {
      return false;
    }

    return this.secureCompare(cookieToken, headerToken);
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   * @param a - First string
   * @param b - Second string
   * @returns True if strings are equal, false otherwise
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Get the CSRF secret from environment variables
   * @returns The CSRF secret
   */
  private getCsrfSecret(): string {
    const secret = this.configService.get<string>('CSRF_SECRET') ?? process.env.CSRF_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';

    if (!secret || secret.trim().length === 0) {
      if (isProduction) {
        throw new Error(
          'CSRF_SECRET environment variable must be set in production. ' +
          'Generate with: openssl rand -hex 32'
        );
      }

      // Development: use a static secret (will be regenerated on restart with JWT secret logic)
      const devSecret = randomBytes(32).toString('hex');
      console.warn(
        '⚠️  CSRF_SECRET not set. Generated random secret for development. ' +
        'For production, set CSRF_SECRET. Generate with: openssl rand -hex 32'
      );
      return devSecret;
    }

    if (isProduction && secret.length < 32) {
      throw new Error(
        'CSRF_SECRET must be at least 32 characters in production. ' +
        'Generate with: openssl rand -hex 32'
      );
    }

    return secret;
  }
}
