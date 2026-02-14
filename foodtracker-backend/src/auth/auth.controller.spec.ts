import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { AuthResult } from './dto/authResult.dto';
import type { RefreshResultDto } from './dto/refreshresult.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    authenticate: jest.Mock;
    createUser: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      authenticate: jest.fn(),
      createUser: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('skips csrf for login route', () => {
    const reflector = new Reflector();
    const skipCsrf = reflector.get<boolean>(
      'skipCsrf',
      AuthController.prototype.login,
    );
    expect(skipCsrf).toBe(true);
  });

  it('skips csrf for create route', () => {
    const reflector = new Reflector();
    const skipCsrf = reflector.get<boolean>(
      'skipCsrf',
      AuthController.prototype.create,
    );
    expect(skipCsrf).toBe(true);
  });

  it('sets cookies on login', async () => {
    const authResult: AuthResult = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      userId: 5,
      username: 'test@example.com',
    };
    authService.authenticate.mockResolvedValue(authResult);
    const request = { secure: false, headers: {} } as Request;
    const response = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await controller.login(
      { email: 'test@example.com', password: 'pw' },
      request,
      response,
    );

    expect(response.cookie).toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(authResult);
  });

  it('sets csrf cookie when csrfToken present on login', async () => {
    const authResult: AuthResult = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      userId: 5,
      username: 'test@example.com',
      csrfToken: 'csrf-token-value',
    };
    authService.authenticate.mockResolvedValue(authResult);
    const request = { secure: false, headers: {} } as Request;
    const response = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await controller.login(
      { email: 'test@example.com', password: 'pw' },
      request,
      response,
    );

    const csrfCall = (response.cookie as jest.Mock).mock.calls.find(
      (call: unknown[]) => call[0] === 'csrfToken',
    );
    expect(csrfCall).toBeDefined();
    expect(csrfCall[1]).toBe('csrf-token-value');
    expect(csrfCall[2]).toMatchObject({ httpOnly: false });
  });

  it('sets csrf cookie when csrfToken present on create', async () => {
    const authResult: AuthResult = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      userId: 7,
      username: 'new@example.com',
      csrfToken: 'csrf-token-value',
    };
    authService.createUser.mockResolvedValue(authResult);
    const request = { secure: false, headers: {} } as Request;
    const response = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await controller.create(
      { email: 'new@example.com', password: 'pw', firstName: 'Test', lastName: 'User' },
      request,
      response,
    );

    const csrfCall = (response.cookie as jest.Mock).mock.calls.find(
      (call: unknown[]) => call[0] === 'csrfToken',
    );
    expect(csrfCall).toBeDefined();
    expect(csrfCall[1]).toBe('csrf-token-value');
    expect(csrfCall[2]).toMatchObject({ httpOnly: false });
  });

  it('omits refresh token in browser responses', async () => {
    const authResult: AuthResult = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      userId: 6,
      username: 'test@example.com',
    };
    authService.authenticate.mockResolvedValue(authResult);
    const request = {
      secure: false,
      headers: { origin: 'http://localhost:8081' },
    } as Request;
    const response = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await controller.login(
      { email: 'test@example.com', password: 'pw' },
      request,
      response,
    );

    const payload = (response.json as jest.Mock).mock.calls[0][0];
    expect(payload.refreshToken).toBeUndefined();
  });


  it('refreshes access token from body for native clients', async () => {
    const refreshed: RefreshResultDto = {
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    };
    authService.refresh.mockResolvedValue(refreshed);
    const request = { secure: false, headers: {}, cookies: {} } as Request;
    const response = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await controller.refresh({ refreshToken: 'refresh' }, request, response);

    expect(authService.refresh).toHaveBeenCalledWith('refresh', request);
    expect(response.cookie).toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(refreshed);
  });

  it('clears cookies on logout', async () => {
    const request = {
      secure: false,
      headers: {},
      cookies: { refreshToken: 'refresh' },
    } as Request;
    const response = {
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await controller.logout({ refreshToken: 'refresh' }, request, response);

    expect(authService.logout).toHaveBeenCalledWith('refresh', null, request);
    expect(response.clearCookie).toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ success: true });
  });
});
