import { Meal } from "src/meal/entities/meal.entity";
import { Food } from "src/food/entities/food.entity";
import { Recipe } from "src/recipe/entities/recipe.entity";
import { FoodMeasurement } from "src/foodmeasurement/entities/foodmeasurement.entity";
import { Friendship } from "src/friends/entities/friendship.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";

import { FoodentryController } from "./foodentry.controller";
import { FoodEntry } from "./entities/foodentry.entity";
import { FoodentryService } from "./foodentry.service";


@Module({
  imports: [TypeOrmModule.forFeature([FoodEntry, Meal, Food, Recipe, FoodMeasurement, Friendship])],
  providers: [FoodentryService],
  controllers: [FoodentryController],
  exports: [FoodentryService],
})
export class FoodentryModule {}
