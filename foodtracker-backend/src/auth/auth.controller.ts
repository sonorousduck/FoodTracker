import { Body, Controller, Get, HttpCode, HttpStatus, InternalServerErrorException, Post, Req, Res, UseGuards } from "@nestjs/common";
import { CreateUserDto } from "src/users/dto/createuser.dto";
import type { CookieOptions, Request, Response } from "express";
import { Throttle, SkipThrottle } from "@nestjs/throttler";
import { SkipCsrf } from "src/common/guards/csrf.guard";

import { PassportJwtAuthGuard } from "./guards/passportjwt.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { LogoutDto } from "./dto/logout.dto";

const accessTokenCookieName = "accessToken";
const refreshTokenCookieName = "refreshToken";
const accessTokenMaxAgeMs = 1000 * 60 * 15;
const refreshTokenMaxAgeMs = 1000 * 60 * 60 * 24 * 30;

const getCookieOptions = (request: Request): CookieOptions => {
  const isSecure = isSecureRequest(request);
  const sameSite: CookieOptions["sameSite"] = isSecure ? "none" : "lax";
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    path: "/",
  };
};

type RequestWithCookies = Request & { cookies?: Record<string, string | undefined> };

const setAuthCookies = (
  response: Response,
  tokens: { accessToken: string; refreshToken: string },
  request: Request
) => {
  const cookieOptions = getCookieOptions(request);
  response.cookie(accessTokenCookieName, tokens.accessToken, {
    ...cookieOptions,
    maxAge: accessTokenMaxAgeMs,
  });
  response.cookie(refreshTokenCookieName, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: refreshTokenMaxAgeMs,
  });
};

const clearAuthCookies = (response: Response, request: Request) => {
  const cookieOptions = getCookieOptions(request);
  response.clearCookie(accessTokenCookieName, cookieOptions);
  response.clearCookie(refreshTokenCookieName, cookieOptions);
};

const isSecureRequest = (request: Request) => {
  if (request.secure) {
    return true;
  }
  const forwardedProto = request.headers["x-forwarded-proto"];
  if (typeof forwardedProto === "string") {
    return forwardedProto.split(",")[0].trim() === "https";
  }
  return false;
};

const shouldExposeRefreshToken = (request: Request) => !request.headers.origin;

const buildAuthResponse = <T extends { refreshToken?: string }>(payload: T, request: Request) => {
  if (shouldExposeRefreshToken(request)) {
    return payload;
  }
  const { refreshToken: _refreshToken, ...rest } = payload;
  return rest;
};

const requireRefreshToken = (authResult: { refreshToken?: string }) => {
  if (!authResult.refreshToken) {
    throw new InternalServerErrorException("Refresh token missing.");
  }
  return authResult.refreshToken;
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(@Body() loginDto: LoginDto, @Req() request: Request, @Res() response: Response) {
    const authResult = await this.authService.authenticate(loginDto, request);
    setAuthCookies(
      response,
      { accessToken: authResult.accessToken, refreshToken: requireRefreshToken(authResult) },
      request
    );

    // Set CSRF token cookie (non-httpOnly so frontend can read it).
    // Lifetime matches the refresh token so it remains valid across access token renewals.
    if (authResult.csrfToken) {
      const cookieOptions = getCookieOptions(request);
      response.cookie('csrfToken', authResult.csrfToken, {
        ...cookieOptions,
        httpOnly: false,
        maxAge: refreshTokenMaxAgeMs,
      });
    }

    return response.status(HttpStatus.OK).json(buildAuthResponse(authResult, request));
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 attempts per hour
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  @Post("create")
  async create(@Body() createUserDto: CreateUserDto, @Req() request: Request, @Res() response: Response) {
    const authResult = await this.authService.createUser(createUserDto, request);
    setAuthCookies(
      response,
      { accessToken: authResult.accessToken, refreshToken: requireRefreshToken(authResult) },
      request
    );

    // Set CSRF token cookie (non-httpOnly so frontend can read it).
    // Lifetime matches the refresh token so it remains valid across access token renewals.
    if (authResult.csrfToken) {
      const cookieOptions = getCookieOptions(request);
      response.cookie('csrfToken', authResult.csrfToken, {
        ...cookieOptions,
        httpOnly: false,
        maxAge: refreshTokenMaxAgeMs,
      });
    }

    return response.status(HttpStatus.OK).json(buildAuthResponse(authResult, request));
  }

  @SkipThrottle()
  @Get("user")
  @UseGuards(PassportJwtAuthGuard)
  getUserInfo(@Req() request: Request & { user?: unknown }) {
    return request.user;
  }

  @Throttle({ default: { limit: 10, ttl: 300000 } }) // 10 attempts per 5 minutes
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: RefreshDto,
    @Req() request: RequestWithCookies,
    @Res() response: Response
  ) {
    const refreshToken = request.cookies?.[refreshTokenCookieName] ?? body?.refreshToken ?? null;

    if (!refreshToken) {
      return response.status(HttpStatus.UNAUTHORIZED).json({ message: "Missing refresh token." });
    }

    const refreshed = await this.authService.refresh(refreshToken, request);
    const cookieOptions = getCookieOptions(request);
    response.cookie(accessTokenCookieName, refreshed.accessToken, {
      ...cookieOptions,
      maxAge: accessTokenMaxAgeMs,
    });
    if (refreshed.refreshToken) {
      response.cookie(refreshTokenCookieName, refreshed.refreshToken, {
        ...cookieOptions,
        maxAge: refreshTokenMaxAgeMs,
      });
    }
    return response.status(HttpStatus.OK).json(buildAuthResponse(refreshed, request));
  }

  @SkipThrottle()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: LogoutDto, @Req() request: RequestWithCookies, @Res() response: Response) {
    const refreshToken = request.cookies?.[refreshTokenCookieName] ?? body?.refreshToken ?? null;
    const accessToken =
      request.cookies?.[accessTokenCookieName] ??
      request.headers?.authorization?.replace('Bearer ', '') ??
      null;

    if (refreshToken) {
      await this.authService.logout(refreshToken, accessToken, request);
    }
    clearAuthCookies(response, request);
    return response.status(HttpStatus.OK).json({ success: true });
  }
}
