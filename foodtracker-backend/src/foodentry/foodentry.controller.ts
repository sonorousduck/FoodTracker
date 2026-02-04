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
  Put,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PassportJwtAuthGuard } from 'src/auth/guards/passportjwt.guard';
import { User } from 'src/common/user.decorator';
import { CreateFoodEntryDto } from './dto/createfoodentry.dto';
import { UpdateFoodEntryDto } from './dto/updatefoodentry.dto';
import { FoodentryService } from './foodentry.service';
import type { UserRequest } from '../common/user';

@Controller('foodentry')
export class FoodentryController {
  constructor(private readonly foodentryService: FoodentryService) {}

  @Get('history')
  @UseGuards(PassportJwtAuthGuard)
  getHistory(
    @User() user: UserRequest,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.foodentryService.getHistory({ userId: user.userId, limit });
  }

  @Get('diary')
  @UseGuards(PassportJwtAuthGuard)
  getDiary(
    @User() user: UserRequest,
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

    return this.foodentryService.getDiaryEntries({
      userId: user.userId,
      start,
      end,
    });
  }

  @Get('lastMeal')
  @UseGuards(PassportJwtAuthGuard)
  getLastMeal(
    @User() user: UserRequest,
    @Query('date') date?: string,
    @Query('mealType', new ParseIntPipe()) mealType?: number,
  ) {
    if (mealType === undefined) {
      throw new BadRequestException('mealType is required.');
    }
    return this.foodentryService.getLastMealEntries({
      userId: user.userId,
      date,
      mealType,
    });
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PassportJwtAuthGuard)
  create(@Body() createFoodEntryDto: CreateFoodEntryDto, @User() user: UserRequest) {
    return this.foodentryService.create(createFoodEntryDto, user.userId);
  }

  @Put(':id')
  @UseGuards(PassportJwtAuthGuard)
  update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() updateFoodEntryDto: UpdateFoodEntryDto,
    @User() user: UserRequest,
  ) {
    return this.foodentryService.update(id, updateFoodEntryDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(PassportJwtAuthGuard)
  delete(@Param('id', new ParseIntPipe()) id: number, @User() user: UserRequest) {
    return this.foodentryService.delete(id, user.userId);
  }
}
