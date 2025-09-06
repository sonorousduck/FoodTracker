import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "src/users/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { UserRequest } from "src/common/user";
import { Repository } from "typeorm";

import { CreateBasicFoodDto } from "./dto/createbasicfood.dto";
import { CreateFoodDto } from "./dto/createfood.dto";
import { AllFoodsDto } from "./dto/allfoods.dto";
import { Food } from "./entities/food.entity";


@Injectable()
export class FoodService {
  constructor(
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>
  ) {}
  async createBasicFood(createBasicFoodDto: CreateBasicFoodDto, userRequest: UserRequest) {
    const food = await this.foodRepository.save({ ...createBasicFoodDto, createdBy: { id: userRequest.userId } });

    return food;
  }

  async createFood(createFood: CreateFoodDto) {
    const food = await this.foodRepository.save(createFood);
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
      .createQueryBuilder()
      .orderBy("name", "DESC")
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

  async getFoodsByName(foodName: string) {
    const foods = await this.foodRepository.findBy({ name: foodName });

    return foods;
  }
}
