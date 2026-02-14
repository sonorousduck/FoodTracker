import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/createuser.dto';
import { UsersService } from 'src/users/users.service';
import { randomBytes, createHash } from 'crypto';
import type { Request } from 'express';

import { AuthResult } from './dto/authResult.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshResultDto } from './dto/refreshresult.dto';
import { PasswordService } from './password.service';
import { TokenRevocationService } from './token-revocation.service';
import { CSRFService } from './csrf.service';
import { AuditLogService } from './audit-log.service';
import { AuthEventType } from './entities/auth-log.entity';


type SignInData = { userId: number; email: string };
const accessTokenExpiresIn = '15m';
const refreshTokenTtlMs = 1000 * 60 * 60 * 24 * 30;

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private passwordService: PasswordService,
    private tokenRevocationService: TokenRevocationService,
    private csrfService: CSRFService,
    private auditLogService: AuditLogService,
  ) {}

  async authenticate(input: LoginDto, request?: Request): Promise<AuthResult> {
    const user = await this.validateUser(input);

    if (!user) {
      // Log failed login attempt
      await this.auditLogService.logEvent({
        email: input.email,
        eventType: AuthEventType.LOGIN_FAILURE,
        success: false,
        request,
        metadata: { reason: 'Invalid credentials' },
      });
      throw new ForbiddenException();
    }

    // Log successful login
    await this.auditLogService.logEvent({
      userId: user.userId,
      email: user.email,
      eventType: AuthEventType.LOGIN_SUCCESS,
      success: true,
      request,
    });

    return this.signIn(user);
  }

  async validateUser(input: LoginDto): Promise<SignInData | null> {
    const user = await this.userService.findOneByEmail(input.email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      input.password,
      user.password,
    );

    if (isPasswordValid) {
      return {
        userId: user.id,
        email: user.email,
      };
    }
    return null;
  }

  async signIn(user: SignInData): Promise<AuthResult> {
    const tokenPayload = {
      sub: user.userId,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload, {
      expiresIn: accessTokenExpiresIn,
    });
    const refreshToken = this.generateRefreshToken();
    const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenTtlMs);
    const csrfToken = this.csrfService.generateToken();

    await this.userService.updateRefreshToken(
      user.userId,
      this.hashToken(refreshToken),
      refreshTokenExpiresAt,
    );

    return {
      accessToken,
      refreshToken,
      username: user.email,
      userId: user.userId,
      csrfToken,
    };
  }

  async createUser(newUser: CreateUserDto, request?: Request) {
    const hashedPassword = await this.passwordService.hashPassword(newUser.password);
    const user = await this.userService.create({
      ...newUser,
      password: hashedPassword,
    });

    // Log registration
    await this.auditLogService.logEvent({
      userId: user.id,
      email: user.email,
      eventType: AuthEventType.REGISTER,
      success: true,
      request,
    });

    return this.signIn({ userId: user.id, email: user.email });
  }

  async refresh(refreshToken: string, request?: Request): Promise<RefreshResultDto> {
    const refreshTokenHash = this.hashToken(refreshToken);
    const user = await this.userService.findByRefreshTokenHash(refreshTokenHash);
    if (
      !user ||
      !user.refreshTokenHash ||
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt.getTime() < Date.now()
    ) {
      // Log failed token refresh
      await this.auditLogService.logEvent({
        eventType: AuthEventType.TOKEN_REFRESH_FAILURE,
        success: false,
        request,
        metadata: { reason: 'Invalid or expired refresh token' },
      });
      throw new ForbiddenException();
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id },
      { expiresIn: accessTokenExpiresIn },
    );
    const nextRefreshToken = this.generateRefreshToken();
    const nextRefreshTokenExpiresAt = new Date(Date.now() + refreshTokenTtlMs);
    await this.userService.updateRefreshToken(
      user.id,
      this.hashToken(nextRefreshToken),
      nextRefreshTokenExpiresAt,
    );

    // Log successful token refresh
    await this.auditLogService.logEvent({
      userId: user.id,
      email: user.email,
      eventType: AuthEventType.TOKEN_REFRESH,
      success: true,
      request,
    });

    return { accessToken, refreshToken: nextRefreshToken };
  }

  async logout(refreshToken: string, accessToken?: string, request?: Request): Promise<void> {
    const refreshTokenHash = this.hashToken(refreshToken);
    const user = await this.userService.findByRefreshTokenHash(refreshTokenHash);
    if (!user) {
      return;
    }

    // Clear refresh token from database
    await this.userService.clearRefreshToken(user.id);

    // Revoke access token if provided
    if (accessToken) {
      try {
        const decoded = this.jwtService.decode(accessToken) as { exp?: number };
        if (decoded && decoded.exp) {
          const expiresAt = new Date(decoded.exp * 1000);
          await this.tokenRevocationService.revokeToken(
            accessToken,
            user.id,
            'logout',
            expiresAt,
          );
        }
      } catch (error) {
        // Token may be invalid or expired, but we already cleared the refresh token
        // so we can safely ignore this error
      }
    }

    // Log logout
    await this.auditLogService.logEvent({
      userId: user.id,
      email: user.email,
      eventType: AuthEventType.LOGOUT,
      success: true,
      request,
    });
  }

  private generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
