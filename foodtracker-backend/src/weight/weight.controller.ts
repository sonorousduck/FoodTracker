import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseDatePipe,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PassportJwtAuthGuard } from 'src/auth/guards/passportjwt.guard';
import { User } from 'src/common/user.decorator';

import { CreateWeightDto } from './dto/createweight.dto';
import { WeightService } from './weight.service';

import type { UserRequest } from "../common/user";

@Controller("weight")
export class WeightController {
  constructor(private readonly weightService: WeightService) {}
  @Get()
  @UseGuards(PassportJwtAuthGuard)
  get(
    @User() user: UserRequest,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
    @Query("since", new ParseDatePipe({ optional: true })) since?: Date
  ) {
    return this.weightService.getWeightEntries({ userId: user.userId, limit, since });
  }

  @Post("create")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PassportJwtAuthGuard)
  create(@Body() createWeightDto: CreateWeightDto, @User() user: UserRequest) {
    return this.weightService.create(createWeightDto, user.userId);
  }

  @Delete("delete")
  @UseGuards(PassportJwtAuthGuard)
  delete(@Param("id", new ParseIntPipe()) id: number) {
    return this.weightService.delete(id);
  }
}
