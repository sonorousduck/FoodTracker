import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WeightService } from './weight.service';
import { Weight } from './entities/weight.entity';

describe('WeightService', () => {
  let service: WeightService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeightService,
        { provide: getRepositoryToken(Weight), useValue: {} },
      ],
    }).compile();

    service = module.get<WeightService>(WeightService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
