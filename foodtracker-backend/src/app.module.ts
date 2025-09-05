import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";

import { FoodmeasurementModule } from "./foodmeasurement/foodmeasurement.module";
import { RecipefoodController } from "./recipefood/recipefood.controller";
import { RecipefoodService } from "./recipefood/recipefood.service";
import { RecipefoodModule } from "./recipefood/recipefood.module";
import { FoodentryModule } from "./foodentry/foodentry.module";
import { MealController } from "./meal/meal.controller";
import { RecipeModule } from "./recipe/recipe.module";
import { UsersModule } from "./users/users.module";
import { MealService } from "./meal/meal.service";
import { AppController } from "./app.controller";
import { MealModule } from "./meal/meal.module";
import { FoodModule } from "./food/food.module";
import { AuthModule } from "./auth/auth.module";
import { AppService } from "./app.service";


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
  controllers: [AppController, MealController, RecipefoodController],
  providers: [AppService, MealService, RecipefoodService],
})
export class AppModule {}
