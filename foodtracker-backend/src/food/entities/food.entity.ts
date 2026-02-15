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

  @Column({ default: false })
  isCsvFood: boolean;

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

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  saturatedFat: number; // Saturated Fats per 100g

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  transFat: number; // Trans Fatty Acids per 100g

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  cholesterol: number; // Cholesterol per 100g (in mg)

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  addedSugar: number; // Added Sugar per 100g

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  netCarbs: number; // Net carbs per 100g

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  solubleFiber: number; // Soluble fiber per 100g

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  insolubleFiber: number; // Insoluble fiber per 100g

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  water: number; // Water per 100g

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  pralScore: number; // PRAL score per 100g

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  omega3: number; // Omega 3s per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  omega6: number; // Omega 6s per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  calcium: number; // Calcium per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  iron: number; // Iron per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  potassium: number; // Potassium per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  magnesium: number; // Magnesium per 100g (mg)

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  vitaminAiu: number; // Vitamin A IU per 100g

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  vitaminArae: number; // Vitamin A RAE per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  vitaminC: number; // Vitamin C per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  vitaminB12: number; // Vitamin B-12 per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  vitaminD: number; // Vitamin D per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  vitaminE: number; // Vitamin E per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  phosphorus: number; // Phosphorus per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  zinc: number; // Zinc per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  copper: number; // Copper per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  manganese: number; // Manganese per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  selenium: number; // Selenium per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  fluoride: number; // Fluoride per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  molybdenum: number; // Molybdenum per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  chlorine: number; // Chlorine per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  vitaminB1: number; // Thiamin (B1) per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  vitaminB2: number; // Riboflavin (B2) per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  vitaminB3: number; // Niacin (B3) per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  vitaminB5: number; // Pantothenic acid (B5) per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  vitaminB6: number; // Vitamin B6 per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  biotin: number; // Biotin (B7) per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  folate: number; // Folate (B9) per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  folicAcid: number; // Folic acid per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  foodFolate: number; // Food folate per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  folateDfe: number; // Folate DFE per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  choline: number; // Choline per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  betaine: number; // Betaine per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  retinol: number; // Retinol per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  caroteneBeta: number; // Carotene, beta per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  caroteneAlpha: number; // Carotene, alpha per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  lycopene: number; // Lycopene per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  luteinZeaxanthin: number; // Lutein + Zeaxanthin per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  vitaminD2: number; // Vitamin D2 per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  vitaminD3: number; // Vitamin D3 per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  vitaminDiu: number; // Vitamin D per 100g (IU)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  vitaminK: number; // Vitamin K per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  dihydrophylloquinone: number; // Dihydrophylloquinone per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  menaquinone4: number; // Menaquinone-4 per 100g (mcg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  monoFat: number; // Monounsaturated fat per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  polyFat: number; // Polyunsaturated fat per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  ala: number; // ALA per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  epa: number; // EPA per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  dpa: number; // DPA per 100g (mg)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  dha: number; // DHA per 100g (mg)

  @ManyToOne(() => User, (user) => user.foods, { nullable: true })
  createdBy?: User;

  @OneToMany(() => RecipeFood, (recipeFood) => recipeFood.food)
  recipeFoods: ReadonlyArray<RecipeFood>;

  @OneToMany(() => FoodMeasurement, (measurement) => measurement.food, { cascade: true })
  measurements: ReadonlyArray<FoodMeasurement>;

  @CreateDateColumn()
  createdAt: Date;
}
