import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Food } from "src/food/entities/food.entity";

@Entity()
export class FoodBarcode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  barcode: string;

  @ManyToOne(() => Food, { onDelete: "CASCADE" })
  food: Food;

  @CreateDateColumn()
  createdAt: Date;
}
