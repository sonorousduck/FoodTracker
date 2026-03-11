import { Controller, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { PassportJwtAuthGuard } from 'src/auth/guards/passportjwt.guard';
import { FoodmeasurementService } from './foodmeasurement.service';

@Controller('foodmeasurement')
export class FoodmeasurementController {
  constructor(private readonly foodmeasurementService: FoodmeasurementService) {}

  @Get()
  @UseGuards(PassportJwtAuthGuard)
  getByFoodId(
    @Query('foodId', new ParseIntPipe()) foodId: number,
  ) {
    return this.foodmeasurementService.getMeasurementsByFoodId(foodId);
  }
}
