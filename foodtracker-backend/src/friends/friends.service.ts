import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FoodentryService } from 'src/foodentry/foodentry.service';
import { Recipe } from 'src/recipe/entities/recipe.entity';
import { RecipeService } from 'src/recipe/recipe.service';
import { User } from 'src/users/entities/user.entity';

import { Friendship, FriendshipStatus } from './entities/friendship.entity';

const normalizeSearchValue = (value?: string) =>
  value?.trim().toLowerCase() ?? '';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    private readonly recipeService: RecipeService,
    private readonly foodentryService: FoodentryService,
  ) {}

  async searchUsers({
    userId,
    firstName,
    lastName,
    limit,
  }: {
    userId: number;
    firstName?: string;
    lastName?: string;
    limit?: number;
  }) {
    const normalizedFirstName = normalizeSearchValue(firstName);
    const normalizedLastName = normalizeSearchValue(lastName);

    if (!normalizedFirstName && !normalizedLastName) {
      throw new BadRequestException('First or last name is required.');
    }

    const existingRelations = await this.friendshipRepository.find({
      where: [
        {
          requester: { id: userId },
          status: In([FriendshipStatus.Pending, FriendshipStatus.Accepted]),
        },
        {
          addressee: { id: userId },
          status: In([FriendshipStatus.Pending, FriendshipStatus.Accepted]),
        },
      ],
      relations: ['requester', 'addressee'],
    });

    const excludedIds = new Set<number>([userId]);
    existingRelations.forEach((friendship) => {
      if (friendship.requester.id === userId) {
        excludedIds.add(friendship.addressee.id);
      } else {
        excludedIds.add(friendship.requester.id);
      }
    });

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.firstName', 'user.lastName', 'user.email'])
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('user.id NOT IN (:...excludedIds)', {
        excludedIds: Array.from(excludedIds),
      })
      .orderBy('user.lastName', 'ASC')
      .addOrderBy('user.firstName', 'ASC')
      .take(limit ?? 20);

    if (normalizedFirstName) {
      queryBuilder.andWhere('LOWER(user.firstName) LIKE :firstName', {
        firstName: `%${normalizedFirstName}%`,
      });
    }

    if (normalizedLastName) {
      queryBuilder.andWhere('LOWER(user.lastName) LIKE :lastName', {
        lastName: `%${normalizedLastName}%`,
      });
    }

    return queryBuilder.getMany();
  }

  async requestFriend(userId: number, addresseeId: number) {
    if (userId === addresseeId) {
      throw new BadRequestException('You cannot friend yourself.');
    }

    const addressee = await this.userRepository.findOne({
      where: { id: addresseeId, isActive: true },
    });
    if (!addressee) {
      throw new NotFoundException('User not found.');
    }

    const existing = await this.friendshipRepository.findOne({
      where: [
        { requester: { id: userId }, addressee: { id: addresseeId } },
        { requester: { id: addresseeId }, addressee: { id: userId } },
      ],
      relations: ['requester', 'addressee'],
    });

    if (existing) {
      if (existing.status === FriendshipStatus.Accepted) {
        throw new ConflictException('You are already friends.');
      }
      if (existing.status === FriendshipStatus.Pending) {
        throw new ConflictException('Friend request already pending.');
      }

      existing.requester = { id: userId } as User;
      existing.addressee = { id: addresseeId } as User;
      existing.status = FriendshipStatus.Pending;
      return this.friendshipRepository.save(existing);
    }

    const friendship = this.friendshipRepository.create({
      requester: { id: userId },
      addressee: { id: addresseeId },
      status: FriendshipStatus.Pending,
    });

    return this.friendshipRepository.save(friendship);
  }

  async acceptFriendRequest(userId: number, friendshipId: number) {
    const friendship = await this.friendshipRepository.findOne({
      where: {
        id: friendshipId,
        addressee: { id: userId },
        status: FriendshipStatus.Pending,
      },
      relations: ['requester', 'addressee'],
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found.');
    }

    friendship.status = FriendshipStatus.Accepted;
    return this.friendshipRepository.save(friendship);
  }

  async rejectFriendRequest(userId: number, friendshipId: number) {
    const friendship = await this.friendshipRepository.findOne({
      where: {
        id: friendshipId,
        addressee: { id: userId },
        status: FriendshipStatus.Pending,
      },
      relations: ['requester', 'addressee'],
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found.');
    }

    friendship.status = FriendshipStatus.Rejected;
    return this.friendshipRepository.save(friendship);
  }

  async listFriends(userId: number) {
    const friendships = await this.friendshipRepository.find({
      where: [
        { requester: { id: userId }, status: FriendshipStatus.Accepted },
        { addressee: { id: userId }, status: FriendshipStatus.Accepted },
      ],
      relations: ['requester', 'addressee'],
    });

    return friendships.map((friendship) => {
      const friend =
        friendship.requester.id === userId
          ? friendship.addressee
          : friendship.requester;
      return {
        id: friend.id,
        firstName: friend.firstName,
        lastName: friend.lastName,
        email: friend.email,
      };
    });
  }

  async listPendingRequests(userId: number) {
    const friendships = await this.friendshipRepository.find({
      where: {
        addressee: { id: userId },
        status: FriendshipStatus.Pending,
      },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });

    return friendships.map((friendship) => ({
      id: friendship.id,
      requester: {
        id: friendship.requester.id,
        firstName: friendship.requester.firstName,
        lastName: friendship.requester.lastName,
        email: friendship.requester.email,
      },
      createdAt: friendship.createdAt,
    }));
  }

  async getFriendProfile(userId: number, friendId: number) {
    await this.ensureAcceptedFriendship(userId, friendId);

    const friend = await this.userRepository.findOne({
      where: { id: friendId, isActive: true },
      select: ['id', 'firstName', 'lastName', 'email'],
    });

    if (!friend) {
      throw new NotFoundException('Friend not found.');
    }

    return friend;
  }

  async getFriendDiaryEntries({
    userId,
    friendId,
    start,
    end,
  }: {
    userId: number;
    friendId: number;
    start: Date;
    end: Date;
  }) {
    await this.ensureAcceptedFriendship(userId, friendId);
    return this.foodentryService.getDiaryEntries({
      userId: friendId,
      start,
      end,
    });
  }

  async getFriendRecipes({
    userId,
    friendId,
    search,
    limit,
    page,
  }: {
    userId: number;
    friendId: number;
    search?: string;
    limit?: number;
    page?: number;
  }) {
    await this.ensureAcceptedFriendship(userId, friendId);

    const resolvedLimit = limit ?? 50;
    const queryBuilder = this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoin('recipe.user', 'user')
      .leftJoinAndSelect('recipe.ingredients', 'ingredients')
      .where('user.id = :userId', { userId: friendId })
      .orderBy('recipe.title', 'ASC')
      .take(resolvedLimit)
      .skip(page ? page * resolvedLimit : 0);

    if (search && search.trim() !== '') {
      queryBuilder.andWhere('LOWER(recipe.title) LIKE :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    return queryBuilder.getMany();
  }

  async importFriendRecipe({
    userId,
    friendId,
    recipeId,
  }: {
    userId: number;
    friendId: number;
    recipeId: number;
  }) {
    await this.ensureAcceptedFriendship(userId, friendId);
    return this.recipeService.cloneRecipeFromUser({
      recipeId,
      sourceUserId: friendId,
      targetUserId: userId,
    });
  }

  private async ensureAcceptedFriendship(userId: number, friendId: number) {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        {
          requester: { id: userId },
          addressee: { id: friendId },
          status: FriendshipStatus.Accepted,
        },
        {
          requester: { id: friendId },
          addressee: { id: userId },
          status: FriendshipStatus.Accepted,
        },
      ],
    });

    if (!friendship) {
      throw new ForbiddenException('Friendship is not accepted.');
    }

    return friendship;
  }
}
