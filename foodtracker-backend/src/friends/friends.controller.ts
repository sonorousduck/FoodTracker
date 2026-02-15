import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PassportJwtAuthGuard } from 'src/auth/guards/passportjwt.guard';
import { User } from 'src/common/user.decorator';
import type { UserRequest } from 'src/common/user';

import { RequestFriendDto } from './dto/requestfriend.dto';
import { RespondFriendRequestDto } from './dto/respondfriendrequest.dto';
import { FriendsService } from './friends.service';

@Controller('friends')
@UseGuards(PassportJwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get('search')
  search(
    @User() user: UserRequest,
    @Query('firstName') firstName?: string,
    @Query('lastName') lastName?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.friendsService.searchUsers({
      userId: user.userId,
      firstName,
      lastName,
      limit,
    });
  }

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  requestFriend(@User() user: UserRequest, @Body() dto: RequestFriendDto) {
    return this.friendsService.requestFriend(user.userId, dto.userId);
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  acceptRequest(
    @User() user: UserRequest,
    @Body() dto: RespondFriendRequestDto,
  ) {
    return this.friendsService.acceptFriendRequest(user.userId, dto.friendshipId);
  }

  @Post('reject')
  @HttpCode(HttpStatus.OK)
  rejectRequest(
    @User() user: UserRequest,
    @Body() dto: RespondFriendRequestDto,
  ) {
    return this.friendsService.rejectFriendRequest(user.userId, dto.friendshipId);
  }

  @Get()
  listFriends(@User() user: UserRequest) {
    return this.friendsService.listFriends(user.userId);
  }

  @Get('requests')
  listPendingRequests(@User() user: UserRequest) {
    return this.friendsService.listPendingRequests(user.userId);
  }

  @Get(':friendId')
  getFriendProfile(
    @User() user: UserRequest,
    @Param('friendId', ParseIntPipe) friendId: number,
  ) {
    return this.friendsService.getFriendProfile(user.userId, friendId);
  }

  @Get(':friendId/diary')
  getFriendDiary(
    @User() user: UserRequest,
    @Param('friendId', ParseIntPipe) friendId: number,
    @Query('date') date?: string,
  ) {
    const start = date ? new Date(date) : new Date();
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid date.');
    }
    if (!date) {
      start.setHours(0, 0, 0, 0);
    }
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return this.friendsService.getFriendDiaryEntries({
      userId: user.userId,
      friendId,
      start,
      end,
    });
  }

  @Get(':friendId/recipes')
  getFriendRecipes(
    @User() user: UserRequest,
    @Param('friendId', ParseIntPipe) friendId: number,
    @Query('search') search?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.friendsService.getFriendRecipes({
      userId: user.userId,
      friendId,
      search,
      limit,
      page,
    });
  }

  @Post(':friendId/recipes/:recipeId/import')
  @HttpCode(HttpStatus.CREATED)
  importFriendRecipe(
    @User() user: UserRequest,
    @Param('friendId', ParseIntPipe) friendId: number,
    @Param('recipeId', ParseIntPipe) recipeId: number,
  ) {
    return this.friendsService.importFriendRecipe({
      userId: user.userId,
      friendId,
      recipeId,
    });
  }
}
