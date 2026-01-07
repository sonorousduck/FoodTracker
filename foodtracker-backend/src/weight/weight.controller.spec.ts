import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportJwtAuthGuard } from '../auth/guards/passportjwt.guard';
import { WeightController } from './weight.controller';
import { WeightService } from './weight.service';
import { CreateWeightDto } from './dto/createweight.dto';
import type { UserRequest } from '../common/user';

describe('WeightController', () => {
  let controller: WeightController;
  let weightService: {
    getWeightEntries: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    weightService = {
      getWeightEntries: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeightController],
      providers: [{ provide: WeightService, useValue: weightService }],
    }).compile();

    controller = module.get<WeightController>(WeightController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('get is protected by PassportJwtAuthGuard', () => {
    const guards =
      Reflect.getMetadata(GUARDS_METADATA, controller.get) ?? [];

    expect(guards).toContain(PassportJwtAuthGuard);
  });

  it('create is protected by PassportJwtAuthGuard', () => {
    const guards =
      Reflect.getMetadata(GUARDS_METADATA, controller.create) ?? [];

    expect(guards).toContain(PassportJwtAuthGuard);
  });

  it('delete is protected by PassportJwtAuthGuard', () => {
    const guards =
      Reflect.getMetadata(GUARDS_METADATA, controller.delete) ?? [];

    expect(guards).toContain(PassportJwtAuthGuard);
  });

  it('get returns weight entries for the user with optional filters', async () => {
    const user: UserRequest = { userId: 7, email: 'test@example.com' };
    const limit = 5;
    const since = new Date('2025-01-01T00:00:00.000Z');
    const entries = [{ id: 1 }];

    weightService.getWeightEntries.mockResolvedValue(entries);

    await expect(controller.get(user, limit, since)).resolves.toBe(entries);
    expect(weightService.getWeightEntries).toHaveBeenCalledWith({
      userId: user.userId,
      limit,
      since,
    });
  });

  it('create passes the dto and user id to the service', async () => {
    const user: UserRequest = { userId: 3, email: 'creator@example.com' };
    const dto: CreateWeightDto = {
      weightEntry: 175.5,
      date: new Date('2025-02-01T00:00:00.000Z'),
    };
    const created = { id: 10 };

    weightService.create.mockResolvedValue(created);

    await expect(controller.create(dto, user)).resolves.toBe(created);
    expect(weightService.create).toHaveBeenCalledWith(dto, user.userId);
  });

  it('delete forwards the id to the service', async () => {
    const user: UserRequest = { userId: 22, email: 'owner@example.com' };
    weightService.delete.mockResolvedValue(true);

    await expect(controller.delete(42, user)).resolves.toBe(true);
    expect(weightService.delete).toHaveBeenCalledWith(42, user.userId);
  });
});
