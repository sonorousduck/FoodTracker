import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Recipe } from "src/recipe/entities/recipe.entity";
import { Food } from "src/food/entities/food.entity";


@Entity()
export class RecipeFood {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, { nullable: false })
  recipe: Recipe;

  @ManyToOne(() => Food, (food) => food.recipeFoods, { nullable: false })
  food: Food;

  @Column("decimal", { precision: 10, scale: 2 })
  amount: number; // how many servings of the food are used
}
