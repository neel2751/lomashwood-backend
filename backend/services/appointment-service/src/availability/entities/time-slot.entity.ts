import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Availability } from './availability.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('time_slots')
export class TimeSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Availability, availability => availability.timeSlots)
  availability: Availability;

  @Column()
  availabilityId: string;

  @ManyToOne(() => Appointment, appointment => appointment.timeSlot)
  appointment: Appointment;

  @Column({ nullable: true })
  appointmentId: string;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column()
  duration: number; // in minutes

  @Column({ default: false })
  isBooked: boolean;

  @Column({ nullable: true })
  bookedAt: Date;

  @Column({ nullable: true })
  bookedBy: string;

  @Column({ nullable: true })
  bookingType: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: false })
  isBlocked: boolean;

  @Column({ nullable: true })
  blockReason: string;

  @Column({ nullable: true })
  priority: number;

  @Column({ nullable: true })
  bufferTime: number; // minutes before/after slot

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
