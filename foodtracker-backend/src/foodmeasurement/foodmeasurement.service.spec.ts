import { Test, TestingModule } from '@nestjs/testing';
import { FoodmeasurementService } from './foodmeasurement.service';

describe('FoodmeasurementService', () => {
  let service: FoodmeasurementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoodmeasurementService],
    }).compile();

    service = module.get<FoodmeasurementService>(FoodmeasurementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
