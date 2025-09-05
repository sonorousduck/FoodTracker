import { Module } from '@nestjs/common';
import { FoodmeasurementService } from './foodmeasurement.service';
import { FoodmeasurementController } from './foodmeasurement.controller';

@Module({
  providers: [FoodmeasurementService],
  controllers: [FoodmeasurementController]
})
export class FoodmeasurementModule {}
