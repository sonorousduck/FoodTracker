import { UsersService } from "src/users/users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";

import { FoodController } from "./food.controller";
import { Food } from "./entities/food.entity";
import { FoodService } from "./food.service";


@Module({
  imports: [TypeOrmModule.forFeature([Food])],
  providers: [FoodService],
  controllers: [FoodController],
})
export class FoodModule {}
