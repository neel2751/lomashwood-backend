import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Funnel } from './funnel.entity';

@Entity('funnel_steps')
export class FunnelStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  order: number;

  @Column()
  eventType: string;

  @Column({ nullable: true })
  eventCondition: string;

  @Column('json', { nullable: true })
  filters: any;

  @Column({ default: 0 })
  conversionRate: number;

  @Column({ default: 0 })
  dropoffRate: number;

  @Column({ nullable: true })
  timeToComplete: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Funnel, funnel => funnel.steps)
  funnel: Funnel;

  @Column()
  funnelId: string;
}
