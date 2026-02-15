import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FoodentryService } from 'src/foodentry/foodentry.service';
import { Recipe } from 'src/recipe/entities/recipe.entity';
import { RecipeService } from 'src/recipe/recipe.service';
import { User } from 'src/users/entities/user.entity';

import { Friendship, FriendshipStatus } from './entities/friendship.entity';
import { FriendsService } from './friends.service';

describe('FriendsService', () => {
  let service: FriendsService;
  const friendshipRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
  const userRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const recipeRepository = {};
  const recipeService = {
    cloneRecipeFromUser: jest.fn(),
  };
  const foodentryService = {
    getDiaryEntries: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: getRepositoryToken(Friendship), useValue: friendshipRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Recipe), useValue: recipeRepository },
        { provide: RecipeService, useValue: recipeService },
        { provide: FoodentryService, useValue: foodentryService },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('requires at least one search field', async () => {
    await expect(
      service.searchUsers({ userId: 1 }),
    ).rejects.toThrow('First or last name is required.');
  });

  it('returns search results', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValueOnce([
        { id: 2, firstName: 'Pat', lastName: 'Doe', email: 'pat@example.com' },
      ]),
    };
    friendshipRepository.find.mockResolvedValueOnce([]);
    userRepository.createQueryBuilder.mockReturnValueOnce(queryBuilder);

    const results = await service.searchUsers({
      userId: 1,
      firstName: 'pa',
    });

    expect(results).toHaveLength(1);
    expect(results[0].email).toBe('pat@example.com');
  });

  it('blocks duplicate pending requests', async () => {
    userRepository.findOne.mockResolvedValueOnce({ id: 2 });
    friendshipRepository.findOne.mockResolvedValueOnce({
      status: FriendshipStatus.Pending,
    });

    await expect(service.requestFriend(1, 2)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects missing users on request', async () => {
    userRepository.findOne.mockResolvedValueOnce(null);

    await expect(service.requestFriend(1, 42)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('formats pending requests with requester info', async () => {
    friendshipRepository.find.mockResolvedValueOnce([
      {
        id: 10,
        requester: {
          id: 2,
          firstName: 'Rae',
          lastName: 'Doe',
          email: 'rae@example.com',
        },
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    ]);

    const results = await service.listPendingRequests(1);

    expect(results).toHaveLength(1);
    expect(results[0].requester.email).toBe('rae@example.com');
  });
});
