import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { DashboardWidget } from './dashboard-widget.entity';

@Entity('analytics_dashboards')
export class AnalyticsDashboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPublic: boolean;

  @Column('json', { nullable: true })
  layout: any;

  @Column('json', { nullable: true })
  theme: any;

  @Column('json', { nullable: true })
  filters: any;

  @Column('json', { nullable: true })
  sharedWith: string[];

  @Column('json', { nullable: true })
  permissions: string[];

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => DashboardWidget, widget => widget.dashboard, { cascade: true })
  widgets: DashboardWidget[];
}
