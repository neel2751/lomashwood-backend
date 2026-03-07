import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Consultant } from '../../consultants/entities/consultant.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Availability } from './availability.entity';

export enum ShowroomStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity('showrooms')
export class Showroom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  address2: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  images: string[]; // Array of image URLs

  @Column('decimal', { precision: 9, scale: 6, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 9, scale: 6, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  timeZone: string;

  @Column({ nullable: true })
  workingHours: string; // JSON string with working hours

  @Column({ nullable: true })
  capacity: number;

  @Column({ nullable: true })
  facilities: string[]; // Array of available facilities

  @Column({ nullable: true })
  services: string[]; // Array of available services

  @Column({
    type: 'enum',
    enum: ShowroomStatus,
    default: ShowroomStatus.ACTIVE,
  })
  status: ShowroomStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  managerName: string;

  @Column({ nullable: true })
  managerEmail: string;

  @Column({ nullable: true })
  managerPhone: string;

  @Column({ nullable: true })
  openingDate: Date;

  @Column({ nullable: true })
  closingDate: Date;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  specialInstructions: string;

  @Column({ nullable: true })
  bookingPolicy: string;

  @Column({ nullable: true })
  cancellationPolicy: string;

  @Column({ nullable: true })
  paymentMethods: string[]; // Array of accepted payment methods

  @Column({ nullable: true })
  parkingInfo: string;

  @Column({ nullable: true })
  publicTransportInfo: string;

  @Column({ nullable: true })
  accessibilityInfo: string;

  @OneToMany(() => Consultant, consultant => consultant.showroom)
  consultants: Consultant[];

  @OneToMany(() => Appointment, appointment => appointment.showroom)
  appointments: Appointment[];

  @OneToMany(() => Availability, availability => availability.showroom)
  availability: Availability[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
