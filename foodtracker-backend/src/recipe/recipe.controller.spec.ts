import { Test, TestingModule } from '@nestjs/testing';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';
import type { CreateRecipeDto } from './dto/createrecipe.dto';
import type { UpdateRecipeDto } from './dto/updaterecipe.dto';

describe('RecipeController', () => {
  let controller: RecipeController;
  let recipeService: {
    create: jest.Mock;
    getRecipe: jest.Mock;
    getRecipes: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    recipeService = {
      create: jest.fn(),
      getRecipe: jest.fn(),
      getRecipes: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipeController],
      providers: [{ provide: RecipeService, useValue: recipeService }],
    }).compile();

    controller = module.get<RecipeController>(RecipeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates a recipe for the user', async () => {
    const dto: CreateRecipeDto = {
      title: 'Soup',
      servings: 2,
      ingredients: [{ foodId: 1, servings: 1, measurementId: null }],
    };
    const user = { userId: 7, email: 'test@example.com' };
    recipeService.create.mockResolvedValue({ id: 1 });

    await controller.create(dto, user);

    expect(recipeService.create).toHaveBeenCalledWith(dto, 7);
  });

  it('returns a recipe by id when provided', async () => {
    const user = { userId: 7, email: 'test@example.com' };
    recipeService.getRecipe.mockResolvedValue({ id: 2 });

    await controller.get(user, 2, undefined, undefined, undefined);

    expect(recipeService.getRecipe).toHaveBeenCalledWith(2, 7);
  });

  it('returns a list when no id is provided', async () => {
    const user = { userId: 7, email: 'test@example.com' };
    recipeService.getRecipes.mockResolvedValue([]);

    await controller.get(user, undefined, 'soup', 10, 0);

    expect(recipeService.getRecipes).toHaveBeenCalledWith({
      userId: 7,
      search: 'soup',
      limit: 10,
      page: 0,
    });
  });

  it('updates a recipe', async () => {
    const dto: UpdateRecipeDto = { title: 'Updated' };
    const user = { userId: 7, email: 'test@example.com' };
    recipeService.update.mockResolvedValue({ id: 3 });

    await controller.update(3, dto, user);

    expect(recipeService.update).toHaveBeenCalledWith(3, dto, 7);
  });

  it('deletes a recipe', async () => {
    const user = { userId: 7, email: 'test@example.com' };
    recipeService.delete.mockResolvedValue(true);

    await controller.delete(5, user);

    expect(recipeService.delete).toHaveBeenCalledWith(5, 7);
  });
});
