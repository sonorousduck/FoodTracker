import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { User } from "src/users/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { UserRequest } from "src/common/user";
import { In, Repository } from "typeorm";

import { CreateBasicFoodDto } from "./dto/createbasicfood.dto";
import { CreateFoodDto } from "./dto/createfood.dto";
import { AllFoodsDto } from "./dto/allfoods.dto";
import { Food } from "./entities/food.entity";
import { FoodSearchService } from "./food-search.service";


@Injectable()
export class FoodService {
  private readonly logger = new Logger(FoodService.name);
  private readonly reindexBatchSize: number;

  constructor(
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
    private readonly foodSearchService: FoodSearchService
  ) {
    const parsedBatchSize = Number.parseInt(
      process.env.ES_REINDEX_BATCH_SIZE ?? process.env.ES_BULK_BATCH_SIZE ?? "",
      10
    );
    this.reindexBatchSize =
      Number.isFinite(parsedBatchSize) && parsedBatchSize > 0 ? parsedBatchSize : 500;
  }
  async createBasicFood(createBasicFoodDto: CreateBasicFoodDto, userRequest: UserRequest) {
    const food = await this.foodRepository.save({ ...createBasicFoodDto, createdBy: { id: userRequest.userId } });

    await this.indexFoodSafe(food);

    return food;
  }

  async createFood(createFood: CreateFoodDto) {
    // Get the actual food entity
    const alreadyExistsFood = await this.foodRepository.findOneBy({
      sourceId: createFood.sourceId,
    });

    let food: Food;

    if (alreadyExistsFood) {
      food = await this.foodRepository.save({ ...alreadyExistsFood, ...createFood, isCsvFood: true });
    } else {
      food = await this.foodRepository.save({ ...createFood, isCsvFood: true });
    }

    await this.indexFoodSafe(food);

    return food;
  }

  async getFood(foodId: number) {
    const food = await this.foodRepository.findOneBy({ id: foodId });

    if (!food) {
      throw new NotFoundException();
    }

    return [food];
  }

  async getAllFoods(limit: number = 100, page?: number): Promise<AllFoodsDto> {
    const foods = await this.foodRepository
      .createQueryBuilder("food")
      .leftJoinAndSelect("food.measurements", "measurements")
      .orderBy("food.name", "ASC")
      .take(limit)
      .skip(page ? page * limit : 0)
      .getManyAndCount();

    return {
      foods: foods[0],
      totalCount: foods[1],
      pageNumber: page ?? 0,
      limit,
    };
  }

  async getFoodsByName(foodName: string, limit: number = 20) {
    const ids = await this.foodSearchService.searchFoodsByName(foodName, limit);
    if (ids.length === 0) {
      return [];
    }

    const foods = await this.foodRepository.find({
      where: { id: In(ids) },
      relations: ["measurements"],
    });
    const foodsById = new Map(foods.map((food) => [food.id, food]));

    return ids.map((id) => foodsById.get(id)).filter((food): food is Food => Boolean(food));
  }

  async reindexFoods(): Promise<{ indexedCount: number }> {
    let indexedCount = 0;
    let offset = 0;

    while (true) {
      const foods = await this.foodRepository.find({
        select: ["id", "name", "brand", "isCsvFood"],
        take: this.reindexBatchSize,
        skip: offset,
        order: { id: "ASC" },
      });

      if (foods.length === 0) {
        break;
      }

      await this.foodSearchService.bulkIndexFoods(
        foods.map((food) => ({
          ...food,
          isCsvFood: Boolean(food.isCsvFood),
        }))
      );

      indexedCount += foods.length;
      offset += foods.length;

      if (foods.length < this.reindexBatchSize) {
        break;
      }
    }

    return { indexedCount };
  }

  async recreateFoodIndex(): Promise<{ indexedCount: number }> {
    await this.foodSearchService.recreateIndex();
    return this.reindexFoods();
  }

  private async indexFoodSafe(food: Food): Promise<void> {
    try {
      await this.foodSearchService.indexFood({
        ...food,
        isCsvFood: Boolean(food.isCsvFood),
      });
    } catch (error) {
      this.logger.warn("Failed to index food in Elasticsearch.", error as Error);
    }
  }
}
