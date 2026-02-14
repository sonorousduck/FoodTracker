import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum AuthEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  REGISTER = 'REGISTER',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_REFRESH_FAILURE = 'TOKEN_REFRESH_FAILURE',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
}

@Entity()
@Index(['userId', 'createdAt'])
@Index(['eventType', 'createdAt'])
@Index(['email', 'createdAt'])
export class AuthLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  userId?: number;

  @Column({ type: 'enum', enum: AuthEventType })
  eventType: AuthEventType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
