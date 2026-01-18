import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from "typeorm";
import { Recipe } from "src/recipe/entities/recipe.entity";
import { User } from "src/users/entities/user.entity";
import { Meal } from "src/meal/entities/meal.entity";
import { Food } from "src/food/entities/food.entity";
import { FoodMeasurement } from "src/foodmeasurement/entities/foodmeasurement.entity";


@Entity()
export class FoodEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.foodEntries, { nullable: false })
  user: User;

  @ManyToOne(() => Food, { nullable: true })
  food?: Food;

  @ManyToOne(() => FoodMeasurement, { nullable: true })
  measurement?: FoodMeasurement;

  @ManyToOne(() => Recipe, { nullable: true })
  recipe?: Recipe;

  @Column("decimal", { precision: 10, scale: 4 })
  servings: number;

  @ManyToOne(() => Meal, { nullable: true })
  meal?: Meal;

  @CreateDateColumn()
  loggedAt: Date;
}
