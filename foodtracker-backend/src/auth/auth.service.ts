import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/createuser.dto';
import { UsersService } from 'src/users/users.service';
import { randomBytes, createHash } from 'crypto';

import { AuthResult } from './dto/authResult.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshResultDto } from './dto/refreshresult.dto';


type SignInData = { userId: number; email: string };
const accessTokenExpiresIn = '15m';
const refreshTokenTtlMs = 1000 * 60 * 60 * 24 * 30;

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService
  ) {}

  async authenticate(input: LoginDto): Promise<AuthResult> {
    const user = await this.validateUser(input);

    if (!user) {
      throw new ForbiddenException();
    }

    return this.signIn(user);
  }

  async validateUser(input: LoginDto): Promise<SignInData | null> {
    const user = await this.userService.findOneByEmail(input.email);

    if (!user) {
      return null;
    }

    if (user && user.password === input.password) {
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
      username: user.email,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload, {
      expiresIn: accessTokenExpiresIn,
    });
    const refreshToken = this.generateRefreshToken();
    const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenTtlMs);

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
    };
  }

  async createUser(newUser: CreateUserDto) {
    const user = await this.userService.create(newUser);

    return this.signIn({ userId: user.id, email: user.email });
  }

  async refresh(refreshToken: string): Promise<RefreshResultDto> {
    const refreshTokenHash = this.hashToken(refreshToken);
    const user = await this.userService.findByRefreshTokenHash(refreshTokenHash);
    if (
      !user ||
      !user.refreshTokenHash ||
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new ForbiddenException();
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, username: user.email },
      { expiresIn: accessTokenExpiresIn },
    );
    const nextRefreshToken = this.generateRefreshToken();
    const nextRefreshTokenExpiresAt = new Date(Date.now() + refreshTokenTtlMs);
    await this.userService.updateRefreshToken(
      user.id,
      this.hashToken(nextRefreshToken),
      nextRefreshTokenExpiresAt,
    );

    return { accessToken, refreshToken: nextRefreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    const refreshTokenHash = this.hashToken(refreshToken);
    const user = await this.userService.findByRefreshTokenHash(refreshTokenHash);
    if (!user) {
      return;
    }
    await this.userService.clearRefreshToken(user.id);
  }

  private generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
