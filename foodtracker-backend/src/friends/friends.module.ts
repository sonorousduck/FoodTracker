import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodentryModule } from 'src/foodentry/foodentry.module';
import { RecipeModule } from 'src/recipe/recipe.module';
import { User } from 'src/users/entities/user.entity';
import { Recipe } from 'src/recipe/entities/recipe.entity';

import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { Friendship } from './entities/friendship.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friendship, User, Recipe]),
    FoodentryModule,
    RecipeModule,
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
