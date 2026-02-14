import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHash } from 'crypto';

import { RevokedToken } from './entities/revoked-token.entity';

@Injectable()
export class TokenRevocationService implements OnModuleInit {
  private readonly logger = new Logger(TokenRevocationService.name);
  private revokedTokensCache: Set<string> = new Set();
  private lastCacheRefresh: Date = new Date(0);
  private readonly cacheRefreshIntervalMs = 60000; // 1 minute

  constructor(
    @InjectRepository(RevokedToken)
    private revokedTokenRepository: Repository<RevokedToken>,
  ) {}

  async onModuleInit() {
    await this.refreshCache();
  }

  /**
   * Revoke an access token
   * @param token - The JWT access token to revoke
   * @param userId - The user ID who owns the token
   * @param reason - Optional reason for revocation (e.g., 'logout', 'password_change')
   * @param expiresAt - When the token naturally expires
   */
  async revokeToken(
    token: string,
    userId: number,
    reason: string = 'logout',
    expiresAt: Date,
  ): Promise<void> {
    const tokenHash = this.hashToken(token);

    try {
      // Check if already revoked
      const existing = await this.revokedTokenRepository.findOne({
        where: { tokenHash },
      });

      if (existing) {
        this.logger.debug(`Token already revoked: ${tokenHash.substring(0, 8)}...`);
        return;
      }

      // Store in database
      await this.revokedTokenRepository.save({
        tokenHash,
        userId,
        reason,
        expiresAt,
      });

      // Add to cache
      this.revokedTokensCache.add(tokenHash);

      this.logger.log(
        `Token revoked for user ${userId}. Reason: ${reason}. Hash: ${tokenHash.substring(0, 8)}...`,
      );
    } catch (error) {
      this.logger.error(`Failed to revoke token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if a token has been revoked
   * @param token - The JWT access token to check
   * @returns True if the token is revoked, false otherwise
   */
  async isTokenRevoked(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);

    // Refresh cache if stale
    if (Date.now() - this.lastCacheRefresh.getTime() > this.cacheRefreshIntervalMs) {
      await this.refreshCache();
    }

    // Check cache first (fast path)
    if (this.revokedTokensCache.has(tokenHash)) {
      return true;
    }

    // Fallback to database (slow path for cache misses)
    const revokedToken = await this.revokedTokenRepository.findOne({
      where: { tokenHash },
    });

    if (revokedToken) {
      // Add to cache for future checks
      this.revokedTokensCache.add(tokenHash);
      return true;
    }

    return false;
  }

  /**
   * Refresh the in-memory cache of revoked tokens
   * Loads all non-expired revoked tokens from the database
   */
  async refreshCache(): Promise<void> {
    try {
      const now = new Date();
      const revokedTokens = await this.revokedTokenRepository.find({
        where: {
          expiresAt: LessThan(new Date(now.getTime() + 86400000)), // Next 24 hours
        },
        select: ['tokenHash'],
      });

      this.revokedTokensCache = new Set(revokedTokens.map((rt) => rt.tokenHash));
      this.lastCacheRefresh = now;

      this.logger.debug(`Cache refreshed with ${this.revokedTokensCache.size} revoked tokens`);
    } catch (error) {
      this.logger.error(`Failed to refresh cache: ${error.message}`);
    }
  }

  /**
   * Cleanup expired revoked tokens from the database
   * Runs daily via cron job
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      const result = await this.revokedTokenRepository.delete({
        expiresAt: LessThan(now),
      });

      this.logger.log(
        `Cleaned up ${result.affected || 0} expired revoked tokens`,
      );

      // Refresh cache after cleanup
      await this.refreshCache();
    } catch (error) {
      this.logger.error(`Failed to cleanup expired tokens: ${error.message}`);
    }
  }

  /**
   * Hash a token using SHA-256
   * @param token - The token to hash
   * @returns The hex-encoded hash
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
