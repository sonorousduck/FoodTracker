import { User } from 'src/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';


@Entity()
export class Weight {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  weightEntry: number;

  @Index()
  @Column()
  date: Date;

  @ManyToOne(() => User, (user) => user.weightEntries, { cascade: true })
  user: User;

  @CreateDateColumn()
  createdDate: Date;
}
