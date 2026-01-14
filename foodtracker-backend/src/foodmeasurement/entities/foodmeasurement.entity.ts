import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { Food } from "src/food/entities/food.entity";


@Entity()
export class FoodMeasurement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Food, (food) => food.measurements, { onDelete: "CASCADE" })
  food: Food;

  @Column()
  unit: string;

  @Column()
  name: string; // "1 cup", "1 tablespoon", "100g", etc.

  @Column()
  abbreviation: string; // "cup", "tbsp", "100g", etc.

  @Column("decimal", { precision: 10, scale: 2 })
  weightInGrams: number; // How many grams this measurement represents

  @Column({ default: false })
  isDefault: boolean; // Mark the primary serving size

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFromSource: boolean; // Indicates this came from the original CSV data
}
