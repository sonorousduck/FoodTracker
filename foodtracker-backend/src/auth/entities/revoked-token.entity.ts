import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index(['expiresAt'])
@Index(['tokenHash'])
export class RevokedToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  tokenHash: string;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reason?: string;

  @CreateDateColumn()
  revokedAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;
}
