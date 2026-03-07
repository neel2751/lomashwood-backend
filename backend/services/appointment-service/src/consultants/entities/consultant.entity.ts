import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Availability } from '../../availability/entities/availability.entity';

export enum ConsultantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('consultants')
export class Consultant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  specialization: string;

  @Column({ nullable: true })
  experience: number; // years

  @Column({ nullable: true })
  certifications: string[];

  @Column({ nullable: true })
  languages: string[];

  @Column({ nullable: true })
  showroomId: string;

  @Column({ nullable: true })
  timeZone: string;

  @Column('decimal', { precision: 2, scale: 1, nullable: true })
  rating: number;

  @Column({ default: 0 })
  totalRatings: number;

  @Column({
    type: 'enum',
    enum: ConsultantStatus,
    default: ConsultantStatus.ACTIVE,
  })
  status: ConsultantStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  statusChangeReason: string;

  @Column({ nullable: true })
  statusChangedAt: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  workingHours: string; // JSON string with working hours

  @Column({ nullable: true })
  preferredAppointmentDuration: number; // in minutes

  @Column({ nullable: true })
  maxAppointmentsPerDay: number;

  @Column({ nullable: true })
  bufferTime: number; // minutes between appointments

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  socialMedia: string; // JSON string with social media links

  @Column({ nullable: true })
  emergencyContact: string; // JSON string with emergency contact info

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => Appointment, appointment => appointment.consultant)
  appointments: Appointment[];

  @OneToMany(() => Availability, availability => availability.consultant)
  availability: Availability[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
