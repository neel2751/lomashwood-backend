import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { AnalyticsDashboard } from './analytics-dashboard.entity';

@Entity('dashboard_widgets')
export class DashboardWidget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  type: string;

  @Column('json', { nullable: true })
  query: any;

  @Column('json', { nullable: true })
  config: any;

  @Column('json', { nullable: true })
  position: any;

  @Column({ nullable: true })
  refreshInterval: number;

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

  @ManyToOne(() => AnalyticsDashboard, dashboard => dashboard.widgets)
  dashboard: AnalyticsDashboard;

  @Column()
  dashboardId: string;
}
