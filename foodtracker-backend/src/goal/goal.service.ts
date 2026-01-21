import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateGoalDto } from './dto/creategoal.dto';
import { GoalType } from './dto/goaltype';
import { SetNutritionGoalsDto } from './dto/setnutritiongoals.dto';
import { Goal } from './entities/goal.entity';


@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>
  ) {}

  async getGoalEntries({ userId, goalType, limit }: { userId: number; goalType: GoalType; limit?: number }) {
    const queryBuilder = this.goalRepository.createQueryBuilder("goal");
    queryBuilder.where("goal.user.id = :userId", { userId });
    queryBuilder.andWhere("goal.goalType = :goalType", { goalType });

    if (limit) {
      queryBuilder.limit(limit);
    }

    const goalEntries = await queryBuilder.getMany();
    return goalEntries;
  }

  async createGoalEntry({ userId, createGoalDto }: { userId: number; createGoalDto: CreateGoalDto }) {
    const newGoalEntry = await this.goalRepository.save({ ...createGoalDto, user: { id: userId } });

    if (!newGoalEntry) {
      throw new BadRequestException();
    }

    return newGoalEntry;
  }

  async getCurrentGoals(userId: number): Promise<Partial<Record<GoalType, Goal>>> {
    const goals = await this.goalRepository.find({
      where: { user: { id: userId } },
      order: { createdDate: 'DESC', id: 'DESC' },
    });

    const latestGoals: Partial<Record<GoalType, Goal>> = {};
    goals.forEach((goal) => {
      if (!latestGoals[goal.goalType]) {
        latestGoals[goal.goalType] = goal;
      }
    });

    return latestGoals;
  }

  async setNutritionGoals({
    userId,
    setNutritionGoalsDto,
  }: {
    userId: number;
    setNutritionGoalsDto: SetNutritionGoalsDto;
  }) {
    const {
      calorieGoal,
      proteinGoal,
      carbsGoal,
      fatGoal,
      proteinPercent,
      carbsPercent,
      fatPercent,
    } = setNutritionGoalsDto;

    const hasPercentInputs =
      proteinPercent !== undefined ||
      carbsPercent !== undefined ||
      fatPercent !== undefined;
    const hasGramInputs =
      proteinGoal !== undefined || carbsGoal !== undefined || fatGoal !== undefined;

    if (hasPercentInputs && hasGramInputs) {
      throw new BadRequestException(
        'Provide either macro percentages or macro grams, not both.',
      );
    }

    if (hasPercentInputs) {
      if (
        proteinPercent === undefined ||
        carbsPercent === undefined ||
        fatPercent === undefined
      ) {
        throw new BadRequestException(
          'Protein, carbs, and fat percentages are required.',
        );
      }
      const totalPercent = proteinPercent + carbsPercent + fatPercent;
      if (Math.abs(totalPercent - 100) > 0.01) {
        throw new BadRequestException(
          'Macro percentages must add up to 100.',
        );
      }
    } else if (!hasGramInputs && calorieGoal === undefined) {
      throw new BadRequestException(
        'Provide a calorie goal or macro goals in grams or percentages.',
      );
    }

    const goalEntries: CreateGoalDto[] = [];

    if (calorieGoal !== undefined) {
      goalEntries.push({
        name: 'Calorie goal',
        value: calorieGoal,
        goalType: GoalType.Calorie,
      });
    }

    if (hasPercentInputs) {
      goalEntries.push(
        {
          name: 'Protein goal (%)',
          value: proteinPercent!,
          goalType: GoalType.ProteinPercent,
        },
        {
          name: 'Carbs goal (%)',
          value: carbsPercent!,
          goalType: GoalType.CarbohydratesPercent,
        },
        {
          name: 'Fat goal (%)',
          value: fatPercent!,
          goalType: GoalType.FatPercent,
        }
      );
    }

    if (hasGramInputs) {
      if (proteinGoal !== undefined) {
        goalEntries.push({
          name: 'Protein goal (g)',
          value: proteinGoal,
          goalType: GoalType.Protein,
        });
      }
      if (carbsGoal !== undefined) {
        goalEntries.push({
          name: 'Carbs goal (g)',
          value: carbsGoal,
          goalType: GoalType.Carbohydrates,
        });
      }
      if (fatGoal !== undefined) {
        goalEntries.push({
          name: 'Fat goal (g)',
          value: fatGoal,
          goalType: GoalType.Fat,
        });
      }
    }

    const newGoalEntries = await this.goalRepository.save(
      goalEntries.map((goal) => ({ ...goal, user: { id: userId } }))
    );

    if (!newGoalEntries || newGoalEntries.length === 0) {
      throw new BadRequestException();
    }

    return newGoalEntries;
  }

  async delete(goalId: number): Promise<boolean> {
    const goalEntry = await this.goalRepository.findOneBy({ id: goalId });

    if (!goalEntry) {
      throw new NotFoundException("Goal entry was not found with id: " + goalId);
    }

    await this.goalRepository.remove(goalEntry);
    return true;
  }
}
