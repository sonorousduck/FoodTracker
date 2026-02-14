import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import type { Request } from 'express';

import { AuthLog, AuthEventType } from './entities/auth-log.entity';

interface LogEventOptions {
  userId?: number;
  email?: string;
  eventType: AuthEventType;
  success: boolean;
  request?: Request;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuthLog)
    private authLogRepository: Repository<AuthLog>,
  ) {}

  /**
   * Log an authentication event
   * @param options - Event details including type, user info, and request context
   */
  async logEvent(options: LogEventOptions): Promise<void> {
    try {
      const ipAddress = options.request
        ? this.extractIpAddress(options.request)
        : undefined;
      const userAgent = options.request?.headers['user-agent'];

      await this.authLogRepository.save({
        userId: options.userId,
        email: options.email,
        eventType: options.eventType,
        success: options.success,
        ipAddress,
        userAgent,
        metadata: options.metadata,
      });

      this.logger.log(
        `Auth event logged: ${options.eventType} for ${options.email || 'user ' + options.userId} (success: ${options.success})`
      );
    } catch (error) {
      this.logger.error(`Failed to log auth event: ${error.message}`);
      // Don't throw - logging failures shouldn't break authentication flow
    }
  }

  /**
   * Extract IP address from request, handling X-Forwarded-For header
   * @param request - Express request object
   * @returns IP address string
   */
  extractIpAddress(request: Request): string | undefined {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2, ...)
      // The first one is the original client IP
      if (typeof forwardedFor === 'string') {
        return forwardedFor.split(',')[0].trim();
      }
      if (Array.isArray(forwardedFor)) {
        return forwardedFor[0].trim();
      }
    }

    // Fallback to request.ip or request.socket.remoteAddress
    return request.ip || request.socket?.remoteAddress;
  }

  /**
   * Get recent failed login attempts for a user
   * @param email - User's email address
   * @param since - Time threshold (default: last 24 hours)
   * @returns Array of failed login attempts
   */
  async getRecentFailedLogins(
    email: string,
    since: Date = new Date(Date.now() - 24 * 60 * 60 * 1000),
  ): Promise<AuthLog[]> {
    return this.authLogRepository.find({
      where: {
        email,
        eventType: AuthEventType.LOGIN_FAILURE,
        success: false,
        createdAt: MoreThan(since),
      },
      order: {
        createdAt: 'DESC',
      },
      take: 10,
    });
  }

  /**
   * Get authentication history for a user
   * @param userId - User's ID
   * @param limit - Maximum number of records to return
   * @returns Array of auth log entries
   */
  async getUserLoginHistory(userId: number, limit: number = 20): Promise<AuthLog[]> {
    return this.authLogRepository.find({
      where: {
        userId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * Get authentication statistics for monitoring
   * @param since - Time threshold (default: last 24 hours)
   * @returns Statistics object with event counts
   */
  async getAuthStatistics(since: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    const logs = await this.authLogRepository.find({
      where: {
        createdAt: MoreThan(since),
      },
    });

    const stats = {
      totalEvents: logs.length,
      loginSuccess: 0,
      loginFailure: 0,
      registrations: 0,
      tokenRefreshSuccess: 0,
      tokenRefreshFailure: 0,
      logouts: 0,
    };

    logs.forEach((log) => {
      switch (log.eventType) {
        case AuthEventType.LOGIN_SUCCESS:
          stats.loginSuccess++;
          break;
        case AuthEventType.LOGIN_FAILURE:
          stats.loginFailure++;
          break;
        case AuthEventType.REGISTER:
          stats.registrations++;
          break;
        case AuthEventType.TOKEN_REFRESH:
          stats.tokenRefreshSuccess++;
          break;
        case AuthEventType.TOKEN_REFRESH_FAILURE:
          stats.tokenRefreshFailure++;
          break;
        case AuthEventType.LOGOUT:
          stats.logouts++;
          break;
      }
    });

    return stats;
  }
}
