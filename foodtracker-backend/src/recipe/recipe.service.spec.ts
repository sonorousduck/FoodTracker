import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Food } from '../food/entities/food.entity';
import { RecipeFood } from '../recipefood/entities/recipefood.entity';
import type { CreateRecipeDto } from './dto/createrecipe.dto';
import type { UpdateRecipeDto } from './dto/updaterecipe.dto';
import { Recipe } from './entities/recipe.entity';
import { RecipeService } from './recipe.service';

describe('RecipeService', () => {
  let service: RecipeService;
  let recipeRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
    remove: jest.Mock;
  };
  let recipeFoodRepository: {
    delete: jest.Mock;
    create: jest.Mock;
  };
  let foodRepository: {
    findBy: jest.Mock;
    find: jest.Mock;
  };
  let queryBuilder: {
    leftJoin: jest.Mock;
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    take: jest.Mock;
    skip: jest.Mock;
    andWhere: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    recipeRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      remove: jest.fn(),
    };

    recipeFoodRepository = {
      delete: jest.fn(),
      create: jest.fn(),
    };

    foodRepository = {
      findBy: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeService,
        {
          provide: getRepositoryToken(Recipe),
          useValue: recipeRepository as unknown as Repository<Recipe>,
        },
        {
          provide: getRepositoryToken(RecipeFood),
          useValue: recipeFoodRepository as unknown as Repository<RecipeFood>,
        },
        {
          provide: getRepositoryToken(Food),
          useValue: foodRepository as unknown as Repository<Food>,
        },
      ],
    }).compile();

    service = module.get<RecipeService>(RecipeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a recipe with ingredients', async () => {
    const dto: CreateRecipeDto = {
      title: 'Pasta',
      servings: 2,
      calories: 120,
      ingredients: [
        { foodId: 1, servings: 1.5, measurementId: 10 },
        { foodId: 2, servings: 2, measurementId: null },
      ],
    };
    const foods = [
      {
        id: 1,
        calories: 100,
        measurements: [
          { id: 10, weightInGrams: 200, isDefault: true },
        ],
      },
      {
        id: 2,
        calories: 200,
        measurements: [{ id: 20, weightInGrams: 50, isDefault: true }],
      },
    ];
    const savedRecipe = {
      id: 5,
      title: dto.title,
      servings: dto.servings,
      calories: 500,
      ingredients: [],
    } as unknown as Recipe;

    foodRepository.findBy.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    foodRepository.find.mockResolvedValue(foods);
    recipeRepository.create.mockImplementation((input: Recipe) => input);
    recipeRepository.save.mockResolvedValue({ id: 5 });
    recipeRepository.findOne.mockResolvedValue(savedRecipe);

    await expect(service.create(dto, 11)).resolves.toBe(savedRecipe);

    expect(recipeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: dto.title,
        servings: dto.servings,
        calories: 500,
        user: { id: 11 },
        ingredients: [
          expect.objectContaining({
            food: { id: 1 },
            servings: 1.5,
            measurementId: 10,
          }),
          expect.objectContaining({
            food: { id: 2 },
            servings: 2,
            measurementId: null,
          }),
        ],
      }),
    );
    expect(recipeRepository.save).toHaveBeenCalled();
    expect(recipeRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 5, user: { id: 11 } },
      }),
    );
  });

  it('throws when creating with missing foods', async () => {
    const dto: CreateRecipeDto = {
      title: 'Toast',
      servings: 1,
      ingredients: [{ foodId: 99, servings: 1, measurementId: null }],
    };
    foodRepository.findBy.mockResolvedValue([]);

    await expect(service.create(dto, 4)).rejects.toThrow(BadRequestException);
  });

  it('returns a recipe by id', async () => {
    const recipe = { id: 7, title: 'Salad', servings: 1 } as Recipe;
    recipeRepository.findOne.mockResolvedValue(recipe);

    await expect(service.getRecipe(7, 2)).resolves.toBe(recipe);
    expect(recipeRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7, user: { id: 2 } },
      }),
    );
  });

  it('throws when recipe not found', async () => {
    recipeRepository.findOne.mockResolvedValue(null);

    await expect(service.getRecipe(123, 2)).rejects.toThrow(NotFoundException);
  });

  it('lists recipes with optional search', async () => {
    const recipes: Recipe[] = [{ id: 1 } as Recipe];
    queryBuilder.getMany.mockResolvedValue(recipes);

    await expect(
      service.getRecipes({ userId: 3, search: 'pasta', limit: 20, page: 1 }),
    ).resolves.toBe(recipes);

    expect(recipeRepository.createQueryBuilder).toHaveBeenCalledWith('recipe');
    expect(queryBuilder.where).toHaveBeenCalledWith('user.id = :userId', {
      userId: 3,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'LOWER(recipe.title) LIKE :search',
      { search: '%pasta%' },
    );
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
  });

  it('updates a recipe and replaces ingredients', async () => {
    const existing = {
      id: 9,
      title: 'Old',
      servings: 1,
      ingredients: [{ food: { id: 1 }, servings: 1, measurementId: null }],
    } as Recipe;
    const updated = { ...existing, title: 'New' } as Recipe;
    const dto: UpdateRecipeDto = {
      title: 'New',
      servings: 2,
      ingredients: [{ foodId: 1, servings: 1, measurementId: null }],
    };
    const foods = [
      {
        id: 1,
        calories: 100,
        measurements: [{ id: 10, weightInGrams: 100, isDefault: true }],
      },
    ];

    recipeRepository.findOne
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(updated);
    foodRepository.findBy.mockResolvedValue([{ id: 1 }]);
    foodRepository.find.mockResolvedValue(foods);
    recipeFoodRepository.create.mockReturnValue(dto.ingredients);
    recipeRepository.save.mockResolvedValue(existing);

    await expect(service.update(9, dto, 5)).resolves.toBe(updated);

    expect(recipeFoodRepository.delete).toHaveBeenCalledWith({
      recipe: { id: 9 },
    });
    expect(recipeFoodRepository.create).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          recipe: existing,
          food: { id: 1 },
          servings: 1,
          measurementId: null,
        }),
      ]),
    );
  });

  it('throws when updating a missing recipe', async () => {
    recipeRepository.findOne.mockResolvedValue(null);

    await expect(service.update(22, {}, 5)).rejects.toThrow(NotFoundException);
  });

  it('deletes a recipe', async () => {
    const existing = { id: 2 } as Recipe;
    recipeRepository.findOne.mockResolvedValue(existing);

    await expect(service.delete(2, 5)).resolves.toBe(true);
    expect(recipeFoodRepository.delete).toHaveBeenCalledWith({
      recipe: { id: 2 },
    });
    expect(recipeRepository.remove).toHaveBeenCalledWith(existing);
  });

  it('throws when deleting a missing recipe', async () => {
    recipeRepository.findOne.mockResolvedValue(null);

    await expect(service.delete(2, 5)).rejects.toThrow(NotFoundException);
  });
});
