import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

// Define the JWT payload interface
export interface JwtPayload {
  sub: string; // subject (user ID)
  email?: string;
  username?: string;
  iat?: number; // issued at
  exp?: number; // expires at
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
