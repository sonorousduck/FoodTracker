import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";

import { FoodmeasurementController } from "./foodmeasurement.controller";
import { FoodMeasurement } from "./entities/foodmeasurement.entity";
import { FoodmeasurementService } from "./foodmeasurement.service";


@Module({
  imports: [TypeOrmModule.forFeature([FoodMeasurement])],
  providers: [FoodmeasurementService],
  controllers: [FoodmeasurementController],
})
export class FoodmeasurementModule {}
