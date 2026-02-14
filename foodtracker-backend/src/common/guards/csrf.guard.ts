import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { CSRFService } from '../../auth/csrf.service';

const SKIP_CSRF_KEY = 'skipCsrf';

/**
 * Decorator to skip CSRF validation for specific routes
 */
export const SkipCsrf = () => {
  const { SetMetadata } = require('@nestjs/common');
  return SetMetadata(SKIP_CSRF_KEY, true);
};

@Injectable()
export class CSRFGuard implements CanActivate {
  private readonly logger = new Logger(CSRFGuard.name);

  constructor(
    private readonly csrfService: CSRFService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Check if route has @SkipCsrf() decorator
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    // Skip CSRF validation for safe methods (GET, HEAD, OPTIONS)
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(request.method)) {
      return true;
    }

    // Skip CSRF validation for requests using Bearer token authentication (mobile clients)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return true;
    }

    // For cookie-based authentication, validate CSRF token
    const csrfTokenFromCookie = request.cookies?.csrfToken;
    const csrfTokenFromHeader = request.headers['x-csrf-token'] as string;

    if (!csrfTokenFromCookie || !csrfTokenFromHeader) {
      this.logger.warn(
        `CSRF validation failed: Missing token. Method: ${request.method}, Path: ${request.path}`
      );
      throw new ForbiddenException(
        'CSRF token missing. Please include X-CSRF-Token header.'
      );
    }

    const isValid = this.csrfService.validateToken(
      csrfTokenFromCookie,
      csrfTokenFromHeader,
    );

    if (!isValid) {
      this.logger.warn(
        `CSRF validation failed: Invalid token. Method: ${request.method}, Path: ${request.path}`
      );
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
