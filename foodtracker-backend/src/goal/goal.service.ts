import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateGoalDto } from './dto/creategoal.dto';
import { GoalType } from './dto/goaltype';
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

  async delete(goalId: number): Promise<boolean> {
    const goalEntry = await this.goalRepository.findOneBy({ id: goalId });

    if (!goalEntry) {
      throw new NotFoundException("Goal entry was not found with id: " + goalId);
    }

    await this.goalRepository.remove(goalEntry);
    return true;
  }
}
