import { Strategy, ExtractJwt } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

import { getJwtSecret } from "../jwt-secret";
import { UsersService } from "src/users/users.service";
import { TokenRevocationService } from "../token-revocation.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private tokenRevocationService: TokenRevocationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.accessToken ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: { sub: string }) {
    // Extract the raw token from the request
    const token =
      request?.cookies?.accessToken ||
      request?.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    // Check if token has been revoked
    const isRevoked = await this.tokenRevocationService.isTokenRevoked(token);
    if (isRevoked) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const userId = parseInt(payload.sub, 10);

    // Verify user exists and is active in database
    let user;
    try {
      user = await this.usersService.findOne(userId);
    } catch (error) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return { userId: user.id, username: user.email };
  }
}
