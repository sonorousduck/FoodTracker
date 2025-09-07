import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FoodModule } from './food/food.module';
import { FoodentryModule } from './foodentry/foodentry.module';
import { FoodmeasurementModule } from './foodmeasurement/foodmeasurement.module';
import { MealModule } from './meal/meal.module';
import { RecipeModule } from './recipe/recipe.module';
import { RecipefoodModule } from './recipefood/recipefood.module';
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? "3306"),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, // TODO: Remove! This isn't safe for production code
    }),
    FoodModule,
    FoodentryModule,
    MealModule,
    RecipeModule,
    RecipefoodModule,
    FoodmeasurementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
