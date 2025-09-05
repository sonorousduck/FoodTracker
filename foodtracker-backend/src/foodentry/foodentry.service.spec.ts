import { Test, TestingModule } from '@nestjs/testing';
import { FoodentryService } from './foodentry.service';

describe('FoodentryService', () => {
  let service: FoodentryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoodentryService],
    }).compile();

    service = module.get<FoodentryService>(FoodentryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
