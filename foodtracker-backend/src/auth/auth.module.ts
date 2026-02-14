import { UsersService } from "src/users/users.service";
import { User } from "src/users/entities/user.entity";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { LocalStrategy } from "./strategies/local.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { getJwtSecret } from "./jwt-secret";
import { PasswordService } from "./password.service";
import { RevokedToken } from "./entities/revoked-token.entity";
import { TokenRevocationService } from "./token-revocation.service";
import { CSRFService } from "./csrf.service";
import { AuthLog } from "./entities/auth-log.entity";
import { AuditLogService } from "./audit-log.service";


@Module({
  imports: [
    TypeOrmModule.forFeature([User, RevokedToken, AuthLog]),
    JwtModule.register({
      global: true,
      secret: getJwtSecret(),
      signOptions: { expiresIn: "100d" },
    }),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    LocalStrategy,
    JwtStrategy,
    PasswordService,
    TokenRevocationService,
    CSRFService,
    AuditLogService,
  ],
  exports: [CSRFService],
})
export class AuthModule {}
