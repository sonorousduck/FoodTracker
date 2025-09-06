import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, OneToMany, Index, Unique } from "typeorm";
import { FoodMeasurement } from "src/foodmeasurement/entities/foodmeasurement.entity";
import { RecipeFood } from "src/recipefood/entities/recipefood.entity";
import { User } from "src/users/entities/user.entity";


@Entity()
export class Food {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, unique: true })
  sourceId?: string; // Original ID from CSV for reference

  @Index()
  @Column()
  name: string;

  @Column({ nullable: true })
  brand?: string;

  // All nutritional values are per 100g (as in your CSV)
  @Column({ type: "int" })
  calories: number; // Calories per 100g

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  protein: number; // Protein per 100g

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  carbs: number; // Carbohydrate per 100g

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  fat: number; // Fat per 100g

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  fiber: number; // Fiber per 100g

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  sugar: number; // Sugars per 100g

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  sodium: number; // sodium (in mg) per 100g

  @ManyToOne(() => User, (user) => user.foods, { nullable: true })
  createdBy?: User;

  @OneToMany(() => RecipeFood, (recipeFood) => recipeFood.food)
  recipeFoods: ReadonlyArray<RecipeFood>;

  @OneToMany(() => FoodMeasurement, (measurement) => measurement.food, { cascade: true })
  measurements: ReadonlyArray<FoodMeasurement>;

  @CreateDateColumn()
  createdAt: Date;
}
