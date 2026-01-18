import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Food } from 'src/food/entities/food.entity';
import { FoodMeasurement } from 'src/foodmeasurement/entities/foodmeasurement.entity';
import { Meal } from 'src/meal/entities/meal.entity';
import { Recipe } from 'src/recipe/entities/recipe.entity';
import { CreateFoodEntryDto, MealType } from './dto/createfoodentry.dto';
import { UpdateFoodEntryDto } from './dto/updatefoodentry.dto';
import { FoodEntry } from './entities/foodentry.entity';

@Injectable()
export class FoodentryService {
  constructor(
    @InjectRepository(FoodEntry)
    private readonly foodEntryRepository: Repository<FoodEntry>,
    @InjectRepository(Meal)
    private readonly mealRepository: Repository<Meal>,
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(FoodMeasurement)
    private readonly measurementRepository: Repository<FoodMeasurement>,
  ) {}

  async getHistory({ userId, limit }: { userId: number; limit?: number }) {
    const queryBuilder =
      this.foodEntryRepository.createQueryBuilder('entry');
    queryBuilder.where('entry.user.id = :userId', { userId });
    queryBuilder
      .leftJoinAndSelect('entry.food', 'food')
      .leftJoinAndSelect('entry.recipe', 'recipe')
      .leftJoinAndSelect('entry.measurement', 'measurement')
      .leftJoinAndSelect('entry.meal', 'meal')
      .orderBy('entry.loggedAt', 'DESC');

    if (limit) {
      queryBuilder.limit(limit);
    }

    return queryBuilder.getMany();
  }

  async getDiaryEntries({
    userId,
    start,
    end,
  }: {
    userId: number;
    start: Date;
    end: Date;
  }) {
    const queryBuilder =
      this.foodEntryRepository.createQueryBuilder('entry');
    queryBuilder.where('entry.user.id = :userId', { userId });
    queryBuilder.andWhere('entry.loggedAt >= :start', { start });
    queryBuilder.andWhere('entry.loggedAt < :end', { end });
    queryBuilder
      .leftJoinAndSelect('entry.food', 'food')
      .leftJoinAndSelect('entry.recipe', 'recipe')
      .leftJoinAndSelect('entry.measurement', 'measurement')
      .leftJoinAndSelect('entry.meal', 'meal')
      .orderBy('entry.loggedAt', 'DESC');

    return queryBuilder.getMany();
  }

  async create(createFoodEntryDto: CreateFoodEntryDto, userId: number) {
    const { foodId, recipeId, measurementId, servings, mealType, loggedAt } =
      createFoodEntryDto;
    const hasFood = foodId != null;
    const hasRecipe = recipeId != null;

    if (hasFood === hasRecipe) {
      throw new BadRequestException(
        'Provide exactly one of foodId or recipeId.',
      );
    }

    if (measurementId != null && !hasFood) {
      throw new BadRequestException(
        'measurementId is only valid for food entries.',
      );
    }

    const mealName = this.getMealName(mealType);
    const meal = await this.findOrCreateMeal(userId, mealName);
    let food: Food | undefined;
    let recipe: Recipe | undefined;
    let measurement: FoodMeasurement | undefined;

    if (hasFood) {
      food =
        (await this.foodRepository.findOne({
          where: { id: foodId },
        })) ?? undefined;
      if (!food) {
        throw new NotFoundException(`Food was not found with id: ${foodId}`);
      }
      if (measurementId != null) {
        measurement =
          (await this.measurementRepository.findOne({
            where: { id: measurementId, food: { id: foodId } },
          })) ?? undefined;
        if (!measurement) {
          throw new NotFoundException(
            `Measurement was not found with id: ${measurementId}`,
          );
        }
      }
    }

    if (hasRecipe) {
      recipe =
        (await this.recipeRepository.findOne({
          where: { id: recipeId, user: { id: userId } },
        })) ?? undefined;
      if (!recipe) {
        throw new NotFoundException(
          `Recipe was not found with id: ${recipeId}`,
        );
      }
    }

    const newEntry = this.foodEntryRepository.create({
      user: { id: userId },
      food,
      recipe,
      measurement,
      servings,
      meal,
      loggedAt: loggedAt ?? undefined,
    });
    const savedEntry = await this.foodEntryRepository.save(newEntry);

    if (!savedEntry) {
      throw new BadRequestException();
    }

    return savedEntry;
  }

  async update(
    entryId: number,
    updateFoodEntryDto: UpdateFoodEntryDto,
    userId: number,
  ) {
    const entry = await this.foodEntryRepository.findOne({
      where: { id: entryId, user: { id: userId } },
      relations: ['food', 'measurement'],
    });

    if (!entry) {
      throw new NotFoundException(`Food entry was not found with id: ${entryId}`);
    }

    if (updateFoodEntryDto.mealType !== undefined) {
      const mealName = this.getMealName(updateFoodEntryDto.mealType);
      entry.meal = await this.findOrCreateMeal(userId, mealName);
    }

    if (updateFoodEntryDto.measurementId !== undefined) {
      if (!entry.food) {
        throw new BadRequestException(
          'measurementId is only valid for food entries.',
        );
      }
      const measurement =
        (await this.measurementRepository.findOne({
          where: {
            id: updateFoodEntryDto.measurementId,
            food: { id: entry.food.id },
          },
        })) ?? undefined;
      if (!measurement) {
        throw new NotFoundException(
          `Measurement was not found with id: ${updateFoodEntryDto.measurementId}`,
        );
      }
      entry.measurement = measurement;
    }

    if (updateFoodEntryDto.servings !== undefined) {
      entry.servings = updateFoodEntryDto.servings;
    }

    return this.foodEntryRepository.save(entry);
  }

  async delete(entryId: number, userId: number): Promise<boolean> {
    const entry = await this.foodEntryRepository.findOne({
      where: { id: entryId, user: { id: userId } },
    });

    if (!entry) {
      throw new NotFoundException(`Food entry was not found with id: ${entryId}`);
    }

    await this.foodEntryRepository.remove(entry);
    return true;
  }

  private getMealName(mealType: MealType) {
    const mealNames = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    return mealNames[mealType] ?? mealNames[0];
  }

  private async findOrCreateMeal(userId: number, mealName: string) {
    const normalizedName = mealName.trim();
    const existingMeal = await this.mealRepository.findOne({
      where: { user: { id: userId }, name: normalizedName },
    });
    if (existingMeal) {
      return existingMeal;
    }
    const createdMeal = this.mealRepository.create({
      name: normalizedName,
      user: { id: userId },
    });
    return this.mealRepository.save(createdMeal);
  }
}
