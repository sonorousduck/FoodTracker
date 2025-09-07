import { Food } from 'src/food/entities/food.entity';
import { FoodEntry } from 'src/foodentry/entities/foodentry.entity';
import { Meal } from 'src/meal/entities/meal.entity';
import { Recipe } from 'src/recipe/entities/recipe.entity';
import { Weight } from 'src/weight/entities/weight.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';


@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @OneToMany(() => Food, (food) => food.createdBy)
  foods: ReadonlyArray<Food>;

  @OneToMany(() => FoodEntry, (foodEntry) => foodEntry.user)
  foodEntries: ReadonlyArray<FoodEntry>;

  @OneToMany(() => Meal, (meal) => meal.user)
  meals: ReadonlyArray<Meal>;

  @OneToMany(() => Recipe, (recipe) => recipe.user)
  recipes: ReadonlyArray<Recipe>;

  @OneToMany(() => Weight, (weight) => weight.user)
  weightEntries: ReadonlyArray<Weight>;
}
