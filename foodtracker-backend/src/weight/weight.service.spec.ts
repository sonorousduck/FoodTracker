import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { WeightService } from './weight.service';
import { Weight } from './entities/weight.entity';
import type { User } from '../users/entities/user.entity';

describe('WeightService', () => {
  let service: WeightService;
  let queryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    limit: jest.Mock;
    getMany: jest.Mock;
  };
  let weightRepository: {
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    weightRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeightService,
        {
          provide: getRepositoryToken(Weight),
          useValue: weightRepository as unknown as Repository<Weight>,
        },
      ],
    }).compile();

    service = module.get<WeightService>(WeightService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getWeightEntries applies user filter, optional since, and limit', async () => {
    const userId = 4;
    const since = new Date('2025-03-01T00:00:00.000Z');
    const limit = 10;
    const entries: ReadonlyArray<Weight> = [];

    queryBuilder.getMany.mockResolvedValue(entries);

    await expect(
      service.getWeightEntries({ userId, since, limit })
    ).resolves.toBe(entries);

    expect(weightRepository.createQueryBuilder).toHaveBeenCalledWith('weight');
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'weight.user.id = :userId',
      { userId }
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'weight.date >= :since',
      { since }
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('weight.date', 'DESC');
    expect(queryBuilder.limit).toHaveBeenCalledWith(limit);
  });

  it('getWeightEntries skips optional filters when not provided', async () => {
    const userId = 9;
    const entries: ReadonlyArray<Weight> = [];

    queryBuilder.getMany.mockResolvedValue(entries);

    await expect(service.getWeightEntries({ userId })).resolves.toBe(entries);

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'weight.user.id = :userId',
      { userId }
    );
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(queryBuilder.limit).not.toHaveBeenCalled();
  });

  it('create returns the saved weight entry', async () => {
    const savedWeight = {
      id: 1,
      weightEntry: 180,
      date: new Date('2025-04-01T00:00:00.000Z'),
      user: { id: 2 } as User,
      createdDate: new Date('2025-04-01T00:00:00.000Z'),
    } as Weight;

    weightRepository.save.mockResolvedValue(savedWeight);

    await expect(
      service.create(
        { weightEntry: 180, date: savedWeight.date },
        savedWeight.user.id
      )
    ).resolves.toBe(savedWeight);
  });

  it('create throws when save fails', async () => {
    weightRepository.save.mockResolvedValue(undefined);

    await expect(
      service.create(
        { weightEntry: 175, date: new Date('2025-04-02T00:00:00.000Z') },
        1
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('delete throws when the entry is missing', async () => {
    const userId = 11;
    weightRepository.findOne.mockResolvedValue(null);

    await expect(service.delete(123, userId)).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect(weightRepository.findOne).toHaveBeenCalledWith({
      where: { id: 123, user: { id: userId } },
    });
  });

  it('delete removes the entry and returns true', async () => {
    const userId = 3;
    const weight = {
      id: 5,
      weightEntry: 160,
      date: new Date('2025-04-05T00:00:00.000Z'),
      user: { id: userId } as User,
      createdDate: new Date('2025-04-05T00:00:00.000Z'),
    } as Weight;

    weightRepository.findOne.mockResolvedValue(weight);
    weightRepository.remove.mockResolvedValue(weight);

    await expect(service.delete(weight.id, userId)).resolves.toBe(true);
    expect(weightRepository.findOne).toHaveBeenCalledWith({
      where: { id: weight.id, user: { id: userId } },
    });
    expect(weightRepository.remove).toHaveBeenCalledWith(weight);
  });
});
