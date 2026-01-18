import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Food } from 'src/food/entities/food.entity';
import { FoodMeasurement } from 'src/foodmeasurement/entities/foodmeasurement.entity';
import { Meal } from 'src/meal/entities/meal.entity';
import { Recipe } from 'src/recipe/entities/recipe.entity';
import { FoodentryService } from './foodentry.service';
import { FoodEntry } from './entities/foodentry.entity';
import type { User } from '../users/entities/user.entity';

describe('FoodentryService', () => {
  let service: FoodentryService;
  let queryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    leftJoinAndSelect: jest.Mock;
    orderBy: jest.Mock;
    limit: jest.Mock;
    getMany: jest.Mock;
  };
  let foodEntryRepository: {
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let mealRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let foodRepository: {
    findOne: jest.Mock;
  };
  let recipeRepository: {
    findOne: jest.Mock;
  };
  let measurementRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    foodEntryRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    mealRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    foodRepository = {
      findOne: jest.fn(),
    };
    recipeRepository = {
      findOne: jest.fn(),
    };
    measurementRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodentryService,
        {
          provide: getRepositoryToken(FoodEntry),
          useValue: foodEntryRepository as unknown as Repository<FoodEntry>,
        },
        {
          provide: getRepositoryToken(Meal),
          useValue: mealRepository as unknown as Repository<Meal>,
        },
        {
          provide: getRepositoryToken(Food),
          useValue: foodRepository as unknown as Repository<Food>,
        },
        {
          provide: getRepositoryToken(Recipe),
          useValue: recipeRepository as unknown as Repository<Recipe>,
        },
        {
          provide: getRepositoryToken(FoodMeasurement),
          useValue:
            measurementRepository as unknown as Repository<FoodMeasurement>,
        },
      ],
    }).compile();

    service = module.get<FoodentryService>(FoodentryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getHistory applies user filter and optional limit', async () => {
    const userId = 4;
    const entries: ReadonlyArray<FoodEntry> = [];

    queryBuilder.getMany.mockResolvedValue(entries);

    await expect(service.getHistory({ userId, limit: 5 })).resolves.toBe(
      entries,
    );

    expect(foodEntryRepository.createQueryBuilder).toHaveBeenCalledWith(
      'entry',
    );
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'entry.user.id = :userId',
      { userId },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'entry.loggedAt',
      'DESC',
    );
    expect(queryBuilder.limit).toHaveBeenCalledWith(5);
  });

  it('getDiaryEntries applies date range filters', async () => {
    const userId = 2;
    const start = new Date('2025-03-01T00:00:00.000Z');
    const end = new Date('2025-03-02T00:00:00.000Z');
    const entries: ReadonlyArray<FoodEntry> = [];

    queryBuilder.getMany.mockResolvedValue(entries);

    await expect(
      service.getDiaryEntries({ userId, start, end }),
    ).resolves.toBe(entries);

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'entry.user.id = :userId',
      { userId },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'entry.loggedAt >= :start',
      { start },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'entry.loggedAt < :end',
      { end },
    );
  });

  it('create rejects missing foodId and recipeId', async () => {
    await expect(
      service.create(
        { servings: 1, mealType: 0 },
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create rejects both foodId and recipeId', async () => {
    await expect(
      service.create(
        { servings: 1, mealType: 0, foodId: 1, recipeId: 2 },
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create rejects measurement on recipe entries', async () => {
    await expect(
      service.create(
        { servings: 1, mealType: 0, recipeId: 2, measurementId: 3 },
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create saves a food entry with measurement and meal', async () => {
    const userId = 5;
    const meal = { id: 'meal-1', name: 'Breakfast' } as Meal;
    const food = { id: 11 } as Food;
    const measurement = { id: 22 } as FoodMeasurement;
    const entry = {
      id: 9,
      user: { id: userId } as User,
      food,
      measurement,
      servings: 1,
      meal,
    } as FoodEntry;

    mealRepository.findOne.mockResolvedValue(null);
    mealRepository.create.mockReturnValue(meal);
    mealRepository.save.mockResolvedValue(meal);
    foodRepository.findOne.mockResolvedValue(food);
    measurementRepository.findOne.mockResolvedValue(measurement);
    foodEntryRepository.create.mockReturnValue(entry);
    foodEntryRepository.save.mockResolvedValue(entry);

    await expect(
      service.create(
        {
          foodId: food.id,
          measurementId: measurement.id,
          servings: 1,
          mealType: 0,
          loggedAt: new Date('2025-01-01T00:00:00.000Z'),
        },
        userId,
      ),
    ).resolves.toBe(entry);

    expect(foodEntryRepository.create).toHaveBeenCalledWith({
      user: { id: userId },
      food,
      recipe: undefined,
      measurement,
      servings: 1,
      meal,
    });
  });

  it('create throws when food is missing', async () => {
    foodRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({ foodId: 99, servings: 1, mealType: 1 }, 1),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create throws when recipe is missing', async () => {
    mealRepository.findOne.mockResolvedValue({ id: 'meal-2' } as Meal);
    recipeRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({ recipeId: 12, servings: 1, mealType: 2 }, 1),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update changes servings and meal', async () => {
    const userId = 4;
    const meal = { id: 'meal-1', name: 'Breakfast' } as Meal;
    const entry = {
      id: 12,
      servings: 1,
      meal,
      food: { id: 3 } as Food,
    } as FoodEntry;

    foodEntryRepository.findOne.mockResolvedValue(entry);
    mealRepository.findOne.mockResolvedValue(meal);
    foodEntryRepository.save.mockResolvedValue({ ...entry, servings: 2 });

    await expect(
      service.update(12, { servings: 2, mealType: 1 }, userId),
    ).resolves.toEqual({ ...entry, servings: 2 });

    expect(foodEntryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ servings: 2 }),
    );
  });

  it('update throws when entry is missing', async () => {
    foodEntryRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(55, { servings: 2 }, 1),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('delete removes the entry', async () => {
    const entry = { id: 9 } as FoodEntry;
    foodEntryRepository.findOne.mockResolvedValue(entry);
    foodEntryRepository.remove.mockResolvedValue(entry);

    await expect(service.delete(9, 2)).resolves.toBe(true);
    expect(foodEntryRepository.findOne).toHaveBeenCalledWith({
      where: { id: 9, user: { id: 2 } },
    });
    expect(foodEntryRepository.remove).toHaveBeenCalledWith(entry);
  });

  it('delete throws when entry is missing', async () => {
    foodEntryRepository.findOne.mockResolvedValue(null);

    await expect(service.delete(9, 2)).rejects.toBeInstanceOf(NotFoundException);
  });
});
