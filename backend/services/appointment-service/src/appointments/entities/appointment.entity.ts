import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Consultant } from '../../consultants/entities/consultant.entity';
import { Showroom } from '../../availability/entities/showroom.entity';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
}

export enum AppointmentType {
  CONSULTATION = 'CONSULTATION',
  MEASUREMENT = 'MEASUREMENT',
  FITTING = 'FITTING',
  DELIVERY = 'DELIVERY',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Consultant, consultant => consultant.appointments)
  consultant: Consultant;

  @ManyToOne(() => Showroom, showroom => showroom.appointments)
  showroom: Showroom;

  @Column({ nullable: true })
  showroomId: string;

  @Column()
  dateTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({ nullable: true })
  duration: number; // in minutes

  @Column({
    type: 'enum',
    enum: AppointmentType,
    default: AppointmentType.CONSULTATION,
  })
  type: AppointmentType;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({ nullable: true })
  confirmationCode: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  customerNotes: string;

  @Column({ nullable: true })
  internalNotes: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  preferredContactMethod: string;

  @Column({ nullable: true })
  rescheduleReason: string;

  @Column({ nullable: true })
  rescheduledAt: Date;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelledBy: string;

  @Column({ nullable: true })
  confirmedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  noShowAt: Date;

  @Column({ nullable: true })
  followUpRequired: boolean;

  @Column({ nullable: true })
  followUpDate: Date;

  @Column({ nullable: true })
  followUpNotes: string;

  @Column({ nullable: true })
  reminderSent: boolean;

  @Column({ nullable: true })
  lastReminderDate: Date;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
