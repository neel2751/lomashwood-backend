import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Consultant } from '../../consultants/entities/consultant.entity';
import { Showroom } from './showroom.entity';
import { TimeSlot } from './time-slot.entity';

export enum RecurringPattern {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

@Entity('availability')
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Consultant, consultant => consultant.availability)
  consultant: Consultant;

  @Column()
  consultantId: string;

  @ManyToOne(() => Showroom, showroom => showroom.availability)
  showroom: Showroom;

  @Column({ nullable: true })
  showroomId: string;

  @Column()
  date: Date;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({
    type: 'enum',
    enum: RecurringPattern,
    nullable: true,
  })
  recurringPattern: RecurringPattern;

  @Column({ nullable: true })
  recurringEndDate: Date;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  timeZone: string;

  @Column({ nullable: true })
  maxBookings: number;

  @Column({ default: 0 })
  currentBookings: number;

  @OneToMany(() => TimeSlot, timeSlot => timeSlot.availability)
  timeSlots: TimeSlot[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
