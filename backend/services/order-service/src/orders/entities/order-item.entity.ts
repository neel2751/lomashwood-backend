import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, order => order.items)
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => 'Product')
  product: any;

  @Column()
  productId: string;

  @ManyToOne(() => 'Colour')
  colour: any;

  @Column({ nullable: true })
  colourId: string;

  @ManyToOne(() => 'Size')
  size: any;

  @Column({ nullable: true })
  sizeId: string;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true })
  productSku: string;

  @Column({ nullable: true })
  productImage: string;

  @Column({ nullable: true })
  colourName: string;

  @Column({ nullable: true })
  sizeName: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
