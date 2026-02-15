import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from "@nestjs/common";
import { CreateUserDto } from "src/users/dto/createuser.dto";
import type { CookieOptions, Request, Response } from "express";
import { Throttle, SkipThrottle } from "@nestjs/throttler";
import { SkipCsrf } from "src/common/guards/csrf.guard";

import { PassportJwtAuthGuard } from "./guards/passportjwt.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

const accessTokenCookieName = "accessToken";
const tokenMaxAgeMs = 1000 * 60 * 60 * 24 * 30;

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

const setAuthCookies = (response: Response, accessToken: string, request: Request) => {
  const cookieOptions = getCookieOptions(request);
  response.cookie(accessTokenCookieName, accessToken, {
    ...cookieOptions,
    maxAge: tokenMaxAgeMs,
  });
};

const clearAuthCookies = (response: Response, request: Request) => {
  const cookieOptions = getCookieOptions(request);
  response.clearCookie(accessTokenCookieName, cookieOptions);
  response.clearCookie("csrfToken", { ...cookieOptions, httpOnly: false });
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

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(@Body() loginDto: LoginDto, @Req() request: Request, @Res() response: Response) {
    const authResult = await this.authService.authenticate(loginDto, request);
    setAuthCookies(response, authResult.accessToken, request);

    if (authResult.csrfToken) {
      const cookieOptions = getCookieOptions(request);
      response.cookie('csrfToken', authResult.csrfToken, {
        ...cookieOptions,
        httpOnly: false,
        maxAge: tokenMaxAgeMs,
      });
    }

    return response.status(HttpStatus.OK).json(authResult);
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 attempts per hour
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  @Post("create")
  async create(@Body() createUserDto: CreateUserDto, @Req() request: Request, @Res() response: Response) {
    const authResult = await this.authService.createUser(createUserDto, request);
    setAuthCookies(response, authResult.accessToken, request);

    if (authResult.csrfToken) {
      const cookieOptions = getCookieOptions(request);
      response.cookie('csrfToken', authResult.csrfToken, {
        ...cookieOptions,
        httpOnly: false,
        maxAge: tokenMaxAgeMs,
      });
    }

    return response.status(HttpStatus.OK).json(authResult);
  }

  @SkipThrottle()
  @Get("user")
  @UseGuards(PassportJwtAuthGuard)
  getUserInfo(@Req() request: Request & { user?: unknown }) {
    return request.user;
  }

  @SkipThrottle()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: RequestWithCookies, @Res() response: Response) {
    const accessToken =
      request.cookies?.[accessTokenCookieName] ??
      request.headers?.authorization?.replace('Bearer ', '') ??
      null;

    await this.authService.logout(accessToken, request);
    clearAuthCookies(response, request);
    return response.status(HttpStatus.OK).json({ success: true });
  }
}
