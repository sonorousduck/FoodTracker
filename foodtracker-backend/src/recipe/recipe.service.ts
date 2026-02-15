import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Food } from 'src/food/entities/food.entity';
import { In, Repository } from 'typeorm';

import { RecipeFood } from '../recipefood/entities/recipefood.entity';
import { CreateRecipeDto } from './dto/createrecipe.dto';
import { UpdateRecipeDto } from './dto/updaterecipe.dto';
import { Recipe } from './entities/recipe.entity';

@Injectable()
export class RecipeService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeFood)
    private readonly recipeFoodRepository: Repository<RecipeFood>,
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
  ) {}

  async create(createRecipeDto: CreateRecipeDto, userId: number) {
    await this.ensureFoodsExist(createRecipeDto.ingredients);
    const totalCalories = await this.calculateTotalCalories(
      createRecipeDto.ingredients,
    );

    const recipe = this.recipeRepository.create({
      title: createRecipeDto.title,
      servings: createRecipeDto.servings,
      calories: totalCalories,
      user: { id: userId },
      ingredients: createRecipeDto.ingredients.map((ingredient) => ({
        food: { id: ingredient.foodId },
        servings: ingredient.servings,
        measurementId: ingredient.measurementId ?? null,
      })),
    });

    const saved = await this.recipeRepository.save(recipe);
    return this.getRecipe(saved.id, userId);
  }

  async getRecipe(recipeId: number, userId: number) {
    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId, user: { id: userId } },
      relations: [
        'ingredients',
        'ingredients.food',
        'ingredients.food.measurements',
      ],
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe not found with id ${recipeId}`);
    }

    return recipe;
  }

  async getRecipes({
    userId,
    search,
    limit,
    page,
  }: {
    userId: number;
    search?: string;
    limit?: number;
    page?: number;
  }) {
    const resolvedLimit = limit ?? 50;
    const queryBuilder = this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoin('recipe.user', 'user')
      .leftJoinAndSelect('recipe.ingredients', 'ingredients')
      .where('user.id = :userId', { userId })
      .orderBy('recipe.title', 'ASC')
      .take(resolvedLimit)
      .skip(page ? page * resolvedLimit : 0);

    if (search && search.trim() !== '') {
      queryBuilder.andWhere('LOWER(recipe.title) LIKE :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    return queryBuilder.getMany();
  }

  async update(recipeId: number, updateRecipeDto: UpdateRecipeDto, userId: number) {
    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId, user: { id: userId } },
      relations: ['ingredients', 'ingredients.food'],
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe not found with id ${recipeId}`);
    }

    if (updateRecipeDto.title !== undefined) {
      recipe.title = updateRecipeDto.title;
    }

    if (updateRecipeDto.servings !== undefined) {
      recipe.servings = updateRecipeDto.servings;
    }

    if (updateRecipeDto.ingredients !== undefined) {
      await this.ensureFoodsExist(updateRecipeDto.ingredients);
      await this.recipeFoodRepository.delete({ recipe: { id: recipe.id } });
      recipe.ingredients = this.recipeFoodRepository.create(
        updateRecipeDto.ingredients.map((ingredient) => ({
          recipe,
          food: { id: ingredient.foodId },
          servings: ingredient.servings,
          measurementId: ingredient.measurementId ?? null,
        })),
      );
    }

    const ingredientsForCalories =
      updateRecipeDto.ingredients ??
      recipe.ingredients.map((ingredient) => ({
        foodId: ingredient.food.id,
        servings: ingredient.servings,
        measurementId: ingredient.measurementId ?? null,
      }));
    recipe.calories = await this.calculateTotalCalories(ingredientsForCalories);

    await this.recipeRepository.save(recipe);
    return this.getRecipe(recipe.id, userId);
  }

  async delete(recipeId: number, userId: number): Promise<boolean> {
    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId, user: { id: userId } },
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe not found with id ${recipeId}`);
    }

    await this.recipeFoodRepository.delete({ recipe: { id: recipeId } });
    await this.recipeRepository.remove(recipe);
    return true;
  }

  async cloneRecipeFromUser({
    recipeId,
    sourceUserId,
    targetUserId,
  }: {
    recipeId: number;
    sourceUserId: number;
    targetUserId: number;
  }) {
    const sourceRecipe = await this.recipeRepository.findOne({
      where: { id: recipeId, user: { id: sourceUserId } },
      relations: ['ingredients', 'ingredients.food'],
    });

    if (!sourceRecipe) {
      throw new NotFoundException(`Recipe not found with id ${recipeId}`);
    }

    const ingredients = sourceRecipe.ingredients.map((ingredient) => ({
      foodId: ingredient.food.id,
      servings: ingredient.servings,
      measurementId: ingredient.measurementId ?? null,
    }));

    await this.ensureFoodsExist(ingredients);
    const totalCalories = await this.calculateTotalCalories(ingredients);

    const recipe = this.recipeRepository.create({
      title: sourceRecipe.title,
      servings: sourceRecipe.servings,
      calories: totalCalories,
      user: { id: targetUserId },
      ingredients: ingredients.map((ingredient) => ({
        food: { id: ingredient.foodId },
        servings: ingredient.servings,
        measurementId: ingredient.measurementId ?? null,
      })),
    });

    const saved = await this.recipeRepository.save(recipe);
    return this.getRecipe(saved.id, targetUserId);
  }

  private async ensureFoodsExist(
    ingredients: ReadonlyArray<{ foodId: number }>,
  ): Promise<void> {
    const foodIds = Array.from(
      new Set(ingredients.map((ingredient) => ingredient.foodId)),
    );
    if (foodIds.length === 0) {
      return;
    }

    const foods = await this.foodRepository.findBy({ id: In(foodIds) });
    if (foods.length !== foodIds.length) {
      throw new BadRequestException('One or more foods were not found.');
    }
  }

  private async calculateTotalCalories(
    ingredients: ReadonlyArray<{
      foodId: number;
      servings: number;
      measurementId?: number | null;
    }>,
  ): Promise<number> {
    if (ingredients.length === 0) {
      return 0;
    }

    const foodIds = Array.from(
      new Set(ingredients.map((ingredient) => ingredient.foodId)),
    );
    const foods = await this.foodRepository.find({
      where: { id: In(foodIds) },
      relations: ['measurements'],
    });
    const foodMap = new Map(foods.map((food) => [food.id, food]));

    const totalCalories = ingredients.reduce((total, ingredient) => {
      const food = foodMap.get(ingredient.foodId);
      if (!food) {
        return total;
      }
      const caloriesPer100 = Number(food.calories);
      const baseCalories = Number.isFinite(caloriesPer100)
        ? caloriesPer100
        : 0;
      const measurement = ingredient.measurementId
        ? food.measurements.find(
            (entry) => entry.id === ingredient.measurementId,
          )
        : food.measurements.find((entry) => entry.isDefault) ??
          food.measurements[0];
      const weightInGrams = measurement
        ? Number(measurement.weightInGrams)
        : 100;
      const grams = Number.isFinite(weightInGrams)
        ? weightInGrams * ingredient.servings
        : 100 * ingredient.servings;
      return total + (baseCalories * grams) / 100;
    }, 0);

    return Number(totalCalories.toFixed(2));
  }
}
