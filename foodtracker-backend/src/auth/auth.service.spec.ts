import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { TokenRevocationService } from './token-revocation.service';
import { CSRFService } from './csrf.service';
import { AuditLogService } from './audit-log.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findOne: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock; decode: jest.Mock };
  let passwordService: { comparePassword: jest.Mock; hashPassword: jest.Mock };
  let tokenRevocationService: { revokeToken: jest.Mock; isTokenRevoked: jest.Mock };
  let csrfService: { generateToken: jest.Mock };
  let auditLogService: { logEvent: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findOne: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
      decode: jest.fn(),
    };
    passwordService = {
      comparePassword: jest.fn(),
      hashPassword: jest.fn(),
    };
    tokenRevocationService = {
      revokeToken: jest.fn(),
      isTokenRevoked: jest.fn(),
    };
    csrfService = {
      generateToken: jest.fn().mockReturnValue('csrf-token'),
    };
    auditLogService = {
      logEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: PasswordService, useValue: passwordService },
        { provide: TokenRevocationService, useValue: tokenRevocationService },
        { provide: CSRFService, useValue: csrfService },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('signIn returns access token without refresh token', async () => {
    jwtService.signAsync.mockResolvedValue('access-token');

    const result = await service.signIn({ userId: 10, email: 'test@example.com' });

    expect(result).toEqual({
      accessToken: 'access-token',
      userId: 10,
      username: 'test@example.com',
      csrfToken: 'csrf-token',
    });
    expect(result).not.toHaveProperty('refreshToken');
  });

  it('revokes access token on logout', async () => {
    const expAt = Math.floor(Date.now() / 1000) + 60;
    jwtService.decode.mockReturnValue({ sub: 8, exp: expAt });
    usersService.findOne.mockResolvedValue({ id: 8, email: 'test@example.com' });

    await service.logout('access-token');

    expect(tokenRevocationService.revokeToken).toHaveBeenCalledWith(
      'access-token',
      8,
      'logout',
      expect.any(Date),
    );
    expect(auditLogService.logEvent).toHaveBeenCalled();
  });

  it('does nothing on logout when access token is null', async () => {
    await service.logout(null);
    expect(tokenRevocationService.revokeToken).not.toHaveBeenCalled();
  });
});
