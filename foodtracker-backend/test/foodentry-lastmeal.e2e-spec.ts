import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import request from 'supertest';
import { PassportJwtAuthGuard } from '../src/auth/guards/passportjwt.guard';
import { FoodentryModule } from '../src/foodentry/foodentry.module';
import { FoodEntry } from '../src/foodentry/entities/foodentry.entity';
import { Food } from '../src/food/entities/food.entity';
import { FoodMeasurement } from '../src/foodmeasurement/entities/foodmeasurement.entity';
import { Meal } from '../src/meal/entities/meal.entity';
import { Recipe } from '../src/recipe/entities/recipe.entity';
import { User } from '../src/users/entities/user.entity';
import type { App } from 'supertest/types';

describe('Foodentry lastMeal (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let mealRepository: Repository<Meal>;
  let foodRepository: Repository<Food>;
  let entryRepository: Repository<FoodEntry>;
  let currentUserId = 0;

  const mockGuard = {
    canActivate: (context: { switchToHttp: () => { getRequest: () => any } }) => {
      const request = context.switchToHttp().getRequest();
      request.user = { userId: currentUserId };
      return true;
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          synchronize: true,
          entities: [User, Meal, Food, FoodEntry, Recipe, FoodMeasurement],
        }),
        FoodentryModule,
      ],
    })
      .overrideGuard(PassportJwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    mealRepository = moduleFixture.get(getRepositoryToken(Meal));
    foodRepository = moduleFixture.get(getRepositoryToken(Food));
    entryRepository = moduleFixture.get(getRepositoryToken(FoodEntry));
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns the latest day meal entries', async () => {
    const user = await userRepository.save({
      email: 'test@example.com',
      password: 'password',
      firstName: 'Test',
      lastName: 'User',
    });
    currentUserId = user.id;

    const meal = await mealRepository.save({
      name: 'Breakfast',
      user,
    });

    const food = await foodRepository.save({
      name: 'Oatmeal',
      calories: 100,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      saturatedFat: 0,
      transFat: 0,
      cholesterol: 0,
      addedSugar: 0,
      netCarbs: 0,
      solubleFiber: 0,
      insolubleFiber: 0,
      water: 0,
      pralScore: 0,
      omega3: 0,
      omega6: 0,
      calcium: 0,
      iron: 0,
      potassium: 0,
      magnesium: 0,
      vitaminAiu: 0,
      vitaminArae: 0,
      vitaminC: 0,
      vitaminB12: 0,
      vitaminD: 0,
      vitaminE: 0,
      phosphorus: 0,
      zinc: 0,
      copper: 0,
      manganese: 0,
      selenium: 0,
      fluoride: 0,
      molybdenum: 0,
      chlorine: 0,
      vitaminB1: 0,
      vitaminB2: 0,
      vitaminB3: 0,
      vitaminB5: 0,
      vitaminB6: 0,
      biotin: 0,
      folate: 0,
      folicAcid: 0,
      foodFolate: 0,
      folateDfe: 0,
      choline: 0,
      betaine: 0,
      retinol: 0,
      caroteneBeta: 0,
      caroteneAlpha: 0,
      lycopene: 0,
      luteinZeaxanthin: 0,
      vitaminD2: 0,
      vitaminD3: 0,
      vitaminDiu: 0,
      vitaminK: 0,
      dihydrophylloquinone: 0,
      menaquinone4: 0,
      monoFat: 0,
      polyFat: 0,
      ala: 0,
      epa: 0,
      dpa: 0,
      dha: 0,
    });

    await entryRepository.save([
      {
        user,
        food,
        meal,
        servings: 1,
        loggedAt: new Date('2025-01-10T08:00:00.000Z'),
      },
      {
        user,
        food,
        meal,
        servings: 2,
        loggedAt: new Date('2025-01-15T08:00:00.000Z'),
      },
      {
        user,
        food,
        meal,
        servings: 1.5,
        loggedAt: new Date('2025-01-15T12:00:00.000Z'),
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/foodentry/lastMeal')
      .query({ date: '2025-01-20T00:00:00.000Z', mealType: 0 })
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(
      response.body.every((entry: { loggedAt: string }) =>
        entry.loggedAt.startsWith('2025-01-15'),
      ),
    ).toBe(true);
  });

  it('returns empty array when no previous meal entries', async () => {
    const user = await userRepository.save({
      email: 'empty@example.com',
      password: 'password',
      firstName: 'Empty',
      lastName: 'User',
    });
    currentUserId = user.id;

    await mealRepository.save({
      name: 'Breakfast',
      user,
    });

    const response = await request(app.getHttpServer())
      .get('/foodentry/lastMeal')
      .query({ date: '2025-01-20T00:00:00.000Z', mealType: 0 })
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it('rejects invalid mealType and date', async () => {
    const user = await userRepository.save({
      email: 'invalid@example.com',
      password: 'password',
      firstName: 'Invalid',
      lastName: 'User',
    });
    currentUserId = user.id;

    await request(app.getHttpServer())
      .get('/foodentry/lastMeal')
      .query({ date: 'nope', mealType: 0 })
      .expect(400);

    await request(app.getHttpServer())
      .get('/foodentry/lastMeal')
      .query({ date: '2025-01-20T00:00:00.000Z', mealType: 99 })
      .expect(400);
  });
});
