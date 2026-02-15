import { Food } from "src/food/entities/food.entity";
import { RecipeFood } from "src/recipefood/entities/recipefood.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";

import { RecipeController } from "./recipe.controller";
import { Recipe } from "./entities/recipe.entity";
import { RecipeService } from "./recipe.service";


@Module({
  imports: [TypeOrmModule.forFeature([Recipe, RecipeFood, Food])],
  providers: [RecipeService],
  controllers: [RecipeController],
  exports: [RecipeService],
})
export class RecipeModule {}
