import { Test, TestingModule } from '@nestjs/testing';
import { RecipefoodService } from './recipefood.service';

describe('RecipefoodService', () => {
  let service: RecipefoodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecipefoodService],
    }).compile();

    service = module.get<RecipefoodService>(RecipefoodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
