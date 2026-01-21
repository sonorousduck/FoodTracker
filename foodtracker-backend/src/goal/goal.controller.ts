import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PassportJwtAuthGuard } from 'src/auth/guards/passportjwt.guard';
import { User } from 'src/common/user.decorator';

import { CreateGoalDto } from './dto/creategoal.dto';
import { GoalType } from './dto/goaltype';
import { SetNutritionGoalsDto } from './dto/setnutritiongoals.dto';
import { GoalService } from './goal.service';

import type { UserRequest } from "src/common/user";

@Controller("goal")
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Get()
  @UseGuards(PassportJwtAuthGuard)
  get(
    @User() user: UserRequest,
    @Query("goalType", new ParseEnumPipe(GoalType)) goalType: GoalType,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number
  ) {
    return this.goalService.getGoalEntries({ userId: user.userId, goalType, limit });
  }

  @Get("current")
  @UseGuards(PassportJwtAuthGuard)
  getCurrent(@User() user: UserRequest) {
    return this.goalService.getCurrentGoals(user.userId);
  }

  @Post("create")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PassportJwtAuthGuard)
  create(@Body() createGoalDto: CreateGoalDto, @User() user: UserRequest) {
    return this.goalService.createGoalEntry({ userId: user.userId, createGoalDto });
  }

  @Post("nutrition")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PassportJwtAuthGuard)
  setNutritionGoals(
    @Body() setNutritionGoalsDto: SetNutritionGoalsDto,
    @User() user: UserRequest
  ) {
    return this.goalService.setNutritionGoals({
      userId: user.userId,
      setNutritionGoalsDto,
    });
  }

  @Delete("delete")
  @UseGuards(PassportJwtAuthGuard)
  delete(@Param("id", new ParseIntPipe()) id: number) {
    return this.goalService.delete(id);
  }
}
