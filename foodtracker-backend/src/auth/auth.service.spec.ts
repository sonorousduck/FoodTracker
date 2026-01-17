import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('refresh-token')),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'hashed-refresh-token'),
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    updateRefreshToken: jest.Mock;
    clearRefreshToken: jest.Mock;
    findByRefreshTokenHash: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    usersService = {
      updateRefreshToken: jest.fn(),
      clearRefreshToken: jest.fn(),
      findByRefreshTokenHash: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('signIn returns tokens and stores refresh hash', async () => {
    jwtService.signAsync.mockResolvedValue('access-token');

    const result = await service.signIn({ userId: 10, email: 'test@example.com' });

    expect(result).toEqual(
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: expect.any(String),
        userId: 10,
        username: 'test@example.com',
      }),
    );
    expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
      10,
      'hashed-refresh-token',
      expect.any(Date),
    );
  });

  it('refreshes access token when refresh token is valid', async () => {
    usersService.findByRefreshTokenHash.mockResolvedValue({
      id: 4,
      email: 'test@example.com',
      refreshTokenHash: 'hashed-refresh-token',
      refreshTokenExpiresAt: new Date(Date.now() + 1000 * 60),
    });
    jwtService.signAsync.mockResolvedValue('new-access-token');

    await expect(service.refresh('refresh-token')).resolves.toEqual(
      expect.objectContaining({
        accessToken: 'new-access-token',
        refreshToken: expect.any(String),
      }),
    );
  });

  it('throws when refresh token is expired', async () => {
    usersService.findByRefreshTokenHash.mockResolvedValue({
      id: 4,
      email: 'test@example.com',
      refreshTokenHash: 'hashed-refresh-token',
      refreshTokenExpiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.refresh('refresh-token')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws when refresh token does not match', async () => {
    usersService.findByRefreshTokenHash.mockResolvedValue(null);

    await expect(service.refresh('wrong-token')).rejects.toThrow(ForbiddenException);
  });

  it('clears refresh token on logout', async () => {
    usersService.findByRefreshTokenHash.mockResolvedValue({ id: 8 });

    await service.logout('refresh-token');
    expect(usersService.clearRefreshToken).toHaveBeenCalledWith(8);
  });
});
