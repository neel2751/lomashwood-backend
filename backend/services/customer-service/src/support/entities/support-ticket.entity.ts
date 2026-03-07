import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { TicketMessage } from './ticket-message.entity';

export enum TicketStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_CUSTOMER = 'PENDING_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  ticketNumber: string;

  @ManyToOne(() => 'Customer')
  customer: any;

  @Column()
  customerId: string;

  @ManyToOne(() => 'User')
  assignedTo: any;

  @Column({ nullable: true })
  assignedToId: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @Column()
  subject: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  subcategory: string;

  @Column({ nullable: true })
  tags: string[];

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ nullable: true })
  assignedAt: Date;

  @Column({ nullable: true })
  assignmentNotes: string;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  resolution: string;

  @Column({ nullable: true })
  closedAt: Date;

  @Column({ nullable: true })
  closedBy: string;

  @Column({ nullable: true })
  closingNotes: string;

  @Column({ nullable: true })
  reopenedAt: Date;

  @Column({ nullable: true })
  reopenedBy: string;

  @Column({ nullable: true })
  reopenReason: string;

  @Column({ nullable: true })
  customerSatisfaction: number;

  @Column({ nullable: true })
  satisfactionNotes: string;

  @Column({ nullable: true })
  escalationLevel: number;

  @Column({ nullable: true })
  escalatedAt: Date;

  @Column({ nullable: true })
  escalationReason: string;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  lastActivityAt: Date;

  @Column({ nullable: true })
  internalNotes: string;

  @Column({ nullable: true })
  source: string; // WEB, EMAIL, PHONE, CHAT, API

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  metadata: string; // JSON string for additional data

  @OneToMany(() => TicketMessage, message => message.ticket)
  messages: TicketMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
