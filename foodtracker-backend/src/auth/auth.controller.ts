import { Controller, Get, Post, HttpCode, HttpStatus, UseGuards, Request, Body } from "@nestjs/common";
import { CreateUserDto } from "src/users/dto/create-user.dto";

import { PassportJwtAuthGuard } from "./guards/passportjwt.guard";
import { PassportLocalGuard } from "./guards/passportauth.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post("login")
  login(@Body() loginDto: LoginDto) {
    return this.authService.authenticate(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post("create-account")
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @Get("user")
  @UseGuards(PassportJwtAuthGuard)
  getUserInfo(@Request() request) {
    return request.user;
  }
}
