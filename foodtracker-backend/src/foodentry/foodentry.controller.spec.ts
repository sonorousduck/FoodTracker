import { Test, TestingModule } from '@nestjs/testing';
import { FoodentryController } from './foodentry.controller';

describe('FoodentryController', () => {
  let controller: FoodentryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodentryController],
    }).compile();

    controller = module.get<FoodentryController>(FoodentryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
