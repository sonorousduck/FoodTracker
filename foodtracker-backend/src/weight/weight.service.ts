import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateWeightDto } from './dto/createweight.dto';
import { Weight } from './entities/weight.entity';


@Injectable()
export class WeightService {
  constructor(
    @InjectRepository(Weight)
    private readonly weightRepository: Repository<Weight>
  ) {}

  async getWeightEntries({ userId, limit, since }: { userId: number; limit?: number; since?: Date }) {
    const queryBuilder = this.weightRepository.createQueryBuilder("weight");

    queryBuilder.where("weight.user.id = :userId", { userId });

    if (since) {
      queryBuilder.andWhere("weight.date >= :since", { since });
    }

    queryBuilder.orderBy("weight.date", "DESC");

    if (limit) {
      queryBuilder.limit(limit);
    }

    const weightEntries = await queryBuilder.getMany();
    return weightEntries;
  }

  async create(createWeightDto: CreateWeightDto, userId: number) {
    console.log(userId);
    const newWeightEntry = await this.weightRepository.save({ ...createWeightDto, user: { id: userId } });

    if (!newWeightEntry) {
      throw new BadRequestException();
    }

    return newWeightEntry;
  }

  async delete(weightId: number): Promise<boolean> {
    const weightEntry = await this.weightRepository.findOne({ where: { id: weightId } });

    if (!weightEntry) {
      throw new NotFoundException(`Weight entry with was not would with id: ${weightId}`);
    }

    await this.weightRepository.remove(weightEntry);
    return true;
  }
}
