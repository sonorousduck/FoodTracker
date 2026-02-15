import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/createuser.dto';
import { UsersService } from 'src/users/users.service';
import type { Request } from 'express';

import { AuthResult } from './dto/authResult.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';
import { TokenRevocationService } from './token-revocation.service';
import { CSRFService } from './csrf.service';
import { AuditLogService } from './audit-log.service';
import { AuthEventType } from './entities/auth-log.entity';


type SignInData = { userId: number; email: string };
const tokenExpiresIn = '30d';
const tokenTtlMs = 1000 * 60 * 60 * 24 * 30;

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
      expiresIn: tokenExpiresIn,
    });
    const csrfToken = this.csrfService.generateToken();

    return {
      accessToken,
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

  async logout(accessToken: string | null, request?: Request): Promise<void> {
    if (!accessToken) {
      return;
    }

    try {
      const decoded = this.jwtService.decode(accessToken) as { sub?: number; exp?: number };
      if (!decoded) {
        return;
      }

      const expiresAt = decoded.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + tokenTtlMs);

      if (decoded.sub) {
        await this.tokenRevocationService.revokeToken(accessToken, decoded.sub, 'logout', expiresAt);

        const user = await this.userService.findOne(decoded.sub);
        await this.auditLogService.logEvent({
          userId: user.id,
          email: user.email,
          eventType: AuthEventType.LOGOUT,
          success: true,
          request,
        });
      }
    } catch (error) {
      // Ignore errors during logout
    }
  }
}
