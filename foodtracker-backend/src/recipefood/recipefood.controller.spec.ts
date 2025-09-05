import { Test, TestingModule } from '@nestjs/testing';
import { RecipefoodController } from './recipefood.controller';

describe('RecipefoodController', () => {
  let controller: RecipefoodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipefoodController],
    }).compile();

    controller = module.get<RecipefoodController>(RecipefoodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
