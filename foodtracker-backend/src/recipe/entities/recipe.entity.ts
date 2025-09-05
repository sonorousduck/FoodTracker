import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany } from "typeorm";
import { RecipeFood } from "src/recipefood/entities/recipefood.entity";
import { User } from "src/users/entities/user.entity";


@Entity()
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.recipes, { nullable: false })
  user: User;

  @Column()
  title: string;

  @Column("int")
  servings: number;

  // Optional pre-calculated totals (can also be computed dynamically)
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  calories?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  fat?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  carbs?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  protein?: number;

  @OneToMany(() => RecipeFood, (recipeFood) => recipeFood.recipe, { cascade: true })
  ingredients: ReadonlyArray<RecipeFood>;
}
