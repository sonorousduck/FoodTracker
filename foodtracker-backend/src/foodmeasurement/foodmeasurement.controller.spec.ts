import { Test, TestingModule } from '@nestjs/testing';
import { FoodmeasurementController } from './foodmeasurement.controller';

describe('FoodmeasurementController', () => {
  let controller: FoodmeasurementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodmeasurementController],
    }).compile();

    controller = module.get<FoodmeasurementController>(FoodmeasurementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
