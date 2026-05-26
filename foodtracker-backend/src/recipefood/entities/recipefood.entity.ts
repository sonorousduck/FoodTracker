import { Food } from "src/food/entities/food.entity";
import { Recipe } from "src/recipe/entities/recipe.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class RecipeFood {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, { nullable: false })
  recipe!: Recipe;

  @ManyToOne(() => Food, (food) => food.recipeFoods, { nullable: false })
  food!: Food;

  @Column("decimal", { precision: 10, scale: 2 })
  servings!: number; // how many servings of the food are used

  @Column("int", { nullable: true })
  measurementId?: number | null;
}
