import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany } from "typeorm";
import { FoodEntry } from "src/foodentry/entities/foodentry.entity";
import { User } from "src/users/entities/user.entity";


@Entity()
export class Meal {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.meals, { nullable: false })
  user: User;

  @Column()
  name: string;

  @OneToMany(() => FoodEntry, (entry) => entry.meal)
  foodEntries: FoodEntry[];
}
