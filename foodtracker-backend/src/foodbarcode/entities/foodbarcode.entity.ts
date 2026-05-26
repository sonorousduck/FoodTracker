import { Food } from "src/food/entities/food.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class FoodBarcode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  barcode!: string;

  @ManyToOne(() => Food, { onDelete: "CASCADE" })
  food!: Food;

  @CreateDateColumn()
  createdAt!: Date;
}
