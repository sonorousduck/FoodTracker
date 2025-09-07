import { User } from 'src/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { GoalType } from '../dto/goaltype';


@Entity()
export class Goal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  value: number;

  @Column({ type: "enum", enum: GoalType })
  goalType: GoalType;

  @ManyToOne(() => User, (user) => user.goals, { cascade: true })
  user: User;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @CreateDateColumn()
  createdDate: Date;
}
