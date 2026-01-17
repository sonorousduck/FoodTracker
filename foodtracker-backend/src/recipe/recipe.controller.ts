import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PassportJwtAuthGuard } from 'src/auth/guards/passportjwt.guard';
import { User } from 'src/common/user.decorator';

import { CreateRecipeDto } from './dto/createrecipe.dto';
import { UpdateRecipeDto } from './dto/updaterecipe.dto';
import { RecipeService } from './recipe.service';

import type { UserRequest } from '../common/user';

@Controller('recipe')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PassportJwtAuthGuard)
  create(@Body() createRecipeDto: CreateRecipeDto, @User() user: UserRequest) {
    return this.recipeService.create(createRecipeDto, user.userId);
  }

  @Get()
  @UseGuards(PassportJwtAuthGuard)
  get(
    @User() user: UserRequest,
    @Query('id', new ParseIntPipe({ optional: true })) id?: number,
    @Query('search') search?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    if (id !== undefined) {
      return this.recipeService.getRecipe(id, user.userId);
    }

    return this.recipeService.getRecipes({ userId: user.userId, search, limit, page });
  }

  @Put(':id')
  @UseGuards(PassportJwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecipeDto: UpdateRecipeDto,
    @User() user: UserRequest,
  ) {
    return this.recipeService.update(id, updateRecipeDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(PassportJwtAuthGuard)
  delete(@Param('id', ParseIntPipe) id: number, @User() user: UserRequest) {
    return this.recipeService.delete(id, user.userId);
  }
}
