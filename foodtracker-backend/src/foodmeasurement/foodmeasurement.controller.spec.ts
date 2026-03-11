import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FoodmeasurementController } from './foodmeasurement.controller';
import { FoodmeasurementService } from './foodmeasurement.service';
import { FoodMeasurement } from './entities/foodmeasurement.entity';

describe('FoodmeasurementController', () => {
  let controller: FoodmeasurementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodmeasurementController],
      providers: [
        FoodmeasurementService,
        {
          provide: getRepositoryToken(FoodMeasurement),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FoodmeasurementController>(FoodmeasurementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
