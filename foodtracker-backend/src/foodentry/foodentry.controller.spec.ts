import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportJwtAuthGuard } from '../auth/guards/passportjwt.guard';
import { FoodentryController } from './foodentry.controller';
import { FoodentryService } from './foodentry.service';
import { CreateFoodEntryDto } from './dto/createfoodentry.dto';
import type { UserRequest } from '../common/user';

describe('FoodentryController', () => {
  let controller: FoodentryController;
  let foodentryService: {
    getHistory: jest.Mock;
    getDiaryEntries: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    foodentryService = {
      getHistory: jest.fn(),
      getDiaryEntries: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodentryController],
      providers: [{ provide: FoodentryService, useValue: foodentryService }],
    }).compile();

    controller = module.get<FoodentryController>(FoodentryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('history is protected by PassportJwtAuthGuard', () => {
    const guards =
      Reflect.getMetadata(GUARDS_METADATA, controller.getHistory) ?? [];

    expect(guards).toContain(PassportJwtAuthGuard);
  });

  it('diary is protected by PassportJwtAuthGuard', () => {
    const guards =
      Reflect.getMetadata(GUARDS_METADATA, controller.getDiary) ?? [];

    expect(guards).toContain(PassportJwtAuthGuard);
  });

  it('create is protected by PassportJwtAuthGuard', () => {
    const guards =
      Reflect.getMetadata(GUARDS_METADATA, controller.create) ?? [];

    expect(guards).toContain(PassportJwtAuthGuard);
  });

  it('update is protected by PassportJwtAuthGuard', () => {
    const guards =
      Reflect.getMetadata(GUARDS_METADATA, controller.update) ?? [];

    expect(guards).toContain(PassportJwtAuthGuard);
  });

  it('delete is protected by PassportJwtAuthGuard', () => {
    const guards =
      Reflect.getMetadata(GUARDS_METADATA, controller.delete) ?? [];

    expect(guards).toContain(PassportJwtAuthGuard);
  });

  it('getHistory returns entries for the user', async () => {
    const user: UserRequest = { userId: 7, email: 'test@example.com' };
    const entries = [{ id: 1 }];
    foodentryService.getHistory.mockResolvedValue(entries);

    await expect(controller.getHistory(user, 12)).resolves.toBe(entries);
    expect(foodentryService.getHistory).toHaveBeenCalledWith({
      userId: user.userId,
      limit: 12,
    });
  });

  it('getDiary returns entries for the user date', async () => {
    const user: UserRequest = { userId: 2, email: 'test@example.com' };
    const entries = [{ id: 2 }];
    foodentryService.getDiaryEntries.mockResolvedValue(entries);

    await expect(
      controller.getDiary(user, '2025-02-01T00:00:00.000Z')
    ).resolves.toBe(entries);

    expect(foodentryService.getDiaryEntries).toHaveBeenCalledWith({
      userId: user.userId,
      start: new Date('2025-02-01T00:00:00.000Z'),
      end: new Date('2025-02-02T00:00:00.000Z'),
    });
  });

  it('create passes the dto and user id to the service', async () => {
    const user: UserRequest = { userId: 3, email: 'creator@example.com' };
    const dto: CreateFoodEntryDto = {
      foodId: 11,
      servings: 1,
      mealType: 0,
    };
    const created = { id: 10 };

    foodentryService.create.mockResolvedValue(created);

    await expect(controller.create(dto, user)).resolves.toBe(created);
    expect(foodentryService.create).toHaveBeenCalledWith(dto, user.userId);
  });

  it('update passes the id, dto, and user id to the service', async () => {
    const user: UserRequest = { userId: 9, email: 'editor@example.com' };
    const dto = { servings: 2, mealType: 2 };
    const updated = { id: 5 };

    foodentryService.update.mockResolvedValue(updated);

    await expect(controller.update(5, dto, user)).resolves.toBe(updated);
    expect(foodentryService.update).toHaveBeenCalledWith(5, dto, user.userId);
  });

  it('delete passes the id and user id to the service', async () => {
    const user: UserRequest = { userId: 9, email: 'editor@example.com' };
    foodentryService.delete.mockResolvedValue(true);

    await expect(controller.delete(5, user)).resolves.toBe(true);
    expect(foodentryService.delete).toHaveBeenCalledWith(5, user.userId);
  });
});
