import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FoodmeasurementService } from './foodmeasurement.service';
import { FoodMeasurement } from './entities/foodmeasurement.entity';

describe('FoodmeasurementService', () => {
  let service: FoodmeasurementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<FoodmeasurementService>(FoodmeasurementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
