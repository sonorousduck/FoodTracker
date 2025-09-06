import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query, Request, UseGuards, } from "@nestjs/common";
import { PassportJwtAuthGuard } from "src/auth/guards/passportjwt.guard";
import { AuthenticatedRequest } from "src/auth/authenticatedrequest";
import { User } from "src/common/user.decorator";

import { CreateBasicFoodDto } from "./dto/createbasicfood.dto";
import { CreateFoodDto } from "./dto/createfood.dto";
import type { UserRequest } from "../common/user";
import { FoodService } from "./food.service";


@Controller("food")
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Post("create")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PassportJwtAuthGuard)
  create(@Body() createBasicFood: CreateBasicFoodDto, @User() user: UserRequest) {
    return this.foodService.createBasicFood(createBasicFood, user);
  }

  @Post("csv-create")
  @HttpCode(HttpStatus.CREATED)
  createFromCsv(@Body() createFood: CreateFoodDto) {
    return this.foodService.createFood(createFood);
  }

  @Get()
  @UseGuards(PassportJwtAuthGuard)
  get(@Query("id", new ParseIntPipe({ optional: true })) id?: number, @Query("name") foodName?: string) {
    if (id == null && (foodName == null || foodName === "")) {
      throw new BadRequestException("id and foodName cannot both not be null");
    }

    if (id) {
      return this.foodService.getFood(id);
    } else if (foodName) {
      return this.foodService.getFoodsByName(foodName);
    }

    throw new BadRequestException();
  }

  @Get("all")
  @UseGuards(PassportJwtAuthGuard)
  getAll(
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
    @Query("page", new ParseIntPipe({ optional: true })) page?: number
  ) {
    return this.foodService.getAllFoods(limit, page);
  }
}
