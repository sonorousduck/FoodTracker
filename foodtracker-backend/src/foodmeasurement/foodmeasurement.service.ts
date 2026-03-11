import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoodMeasurement } from './entities/foodmeasurement.entity';

@Injectable()
export class FoodmeasurementService {
  constructor(
    @InjectRepository(FoodMeasurement)
    private readonly foodMeasurementRepository: Repository<FoodMeasurement>,
  ) {}

  async getMeasurementsByFoodId(foodId: number): Promise<FoodMeasurement[]> {
    return this.foodMeasurementRepository.find({
      where: { food: { id: foodId } },
      order: { isDefault: 'DESC', id: 'ASC' },
    });
  }
}
