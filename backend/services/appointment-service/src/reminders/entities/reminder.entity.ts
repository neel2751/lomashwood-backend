import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';

export enum ReminderType {
  APPOINTMENT = 'APPOINTMENT',
  FOLLOW_UP = 'FOLLOW_UP',
  PAYMENT = 'PAYMENT',
  FEEDBACK = 'FEEDBACK',
  CUSTOM = 'CUSTOM',
}

export enum ReminderStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum ReminderMethod {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  PHONE = 'PHONE',
}

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => 'User')
  user: any;

  @Column()
  userId: string;

  @ManyToOne(() => Appointment, appointment => appointment.reminders)
  appointment: Appointment;

  @Column({ nullable: true })
  appointmentId: string;

  @Column({
    type: 'enum',
    enum: ReminderType,
  })
  type: ReminderType;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING,
  })
  status: ReminderStatus;

  @Column({
    type: 'enum',
    enum: ReminderMethod,
    default: ReminderMethod.EMAIL,
  })
  method: ReminderMethod;

  @Column()
  title: string;

  @Column({ nullable: true })
  message: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  scheduledAt: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  failedAt: Date;

  @Column({ nullable: true })
  failureReason: string;

  @Column({ nullable: true })
  retryCount: number;

  @Column({ nullable: true })
  maxRetries: number;

  @Column({ nullable: true })
  nextRetryAt: Date;

  @Column({ nullable: true })
  template: string;

  @Column({ nullable: true })
  templateData: string; // JSON string

  @Column({ nullable: true })
  recipientEmail: string;

  @Column({ nullable: true })
  recipientPhone: string;

  @Column({ nullable: true })
  priority: number;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurringPattern: string;

  @Column({ nullable: true })
  recurringEndDate: Date;

  @Column({ nullable: true })
  timeZone: string;

  @Column({ nullable: true })
  metadata: string; // JSON string for additional data

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
