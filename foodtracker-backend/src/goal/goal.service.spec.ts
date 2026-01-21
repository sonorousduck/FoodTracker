import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GoalService } from './goal.service';
import { Goal } from './entities/goal.entity';
import { BadRequestException } from '@nestjs/common';
import { GoalType } from './dto/goaltype';

describe('GoalService', () => {
  let service: GoalService;
  let goalRepository: { save: jest.Mock; find: jest.Mock };

  beforeEach(async () => {
    goalRepository = {
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalService,
        { provide: getRepositoryToken(Goal), useValue: goalRepository },
      ],
    }).compile();

    service = module.get<GoalService>(GoalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects macro percentages that do not sum to 100', async () => {
    await expect(
      service.setNutritionGoals({
        userId: 1,
        setNutritionGoalsDto: {
          proteinPercent: 40,
          carbsPercent: 40,
          fatPercent: 10,
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates percent-based goals with a calorie goal', async () => {
    goalRepository.save.mockResolvedValueOnce([
      { goalType: GoalType.Calorie, value: 2000 },
    ]);

    const result = await service.setNutritionGoals({
      userId: 1,
      setNutritionGoalsDto: {
        calorieGoal: 2000,
        proteinPercent: 30,
        carbsPercent: 40,
        fatPercent: 30,
      },
    });

    expect(goalRepository.save).toHaveBeenCalled();
    expect(result).toEqual([{ goalType: GoalType.Calorie, value: 2000 }]);
  });

  it('allows calorie-only goals', async () => {
    goalRepository.save.mockResolvedValueOnce([
      { goalType: GoalType.Calorie, value: 2000 },
    ]);

    const result = await service.setNutritionGoals({
      userId: 1,
      setNutritionGoalsDto: {
        calorieGoal: 2000,
      },
    });

    expect(goalRepository.save).toHaveBeenCalled();
    expect(result).toEqual([{ goalType: GoalType.Calorie, value: 2000 }]);
  });
});
