import { UsersService } from "src/users/users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";

import { FoodController } from "./food.controller";
import { Food } from "./entities/food.entity";
import { FoodSearchService } from "./food-search.service";
import { FoodService } from "./food.service";


@Module({
  imports: [TypeOrmModule.forFeature([Food])],
  providers: [FoodSearchService, FoodService],
  controllers: [FoodController],
})
export class FoodModule {}
