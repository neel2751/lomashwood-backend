import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum RefundStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum RefundType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  ITEM = 'ITEM',
  SHIPPING = 'SHIPPING',
}

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  refundNumber: string;

  @ManyToOne(() => Order, order => order.refunds)
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => Payment, payment => payment.refunds)
  payment: Payment;

  @Column()
  paymentId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: RefundType,
  })
  type: RefundType;

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.PENDING,
  })
  status: RefundStatus;

  @Column({ nullable: true })
  providerRefundId: string;

  @Column({ nullable: true })
  providerResponse: any;

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  processedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  rejectedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  processedBy: string;

  @Column('json', { nullable: true })
  items: Array<{
    productId: string;
    quantity: number;
    reason: string;
    condition: string;
  }>;

  @Column({ nullable: true })
  returnShippingMethod: string;

  @Column({ nullable: true })
  returnTrackingNumber: string;

  @Column({ nullable: true })
  returnAddress: string;

  @Column({ nullable: true })
  restockFee: number;

  @Column({ nullable: true })
  shippingFee: number;

  @Column({ nullable: true })
  taxAmount: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  customerNotes: string;

  @Column({ nullable: true })
  internalNotes: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
