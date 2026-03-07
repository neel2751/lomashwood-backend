import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { Colour } from '../colours/colour.entity';
import { Size } from '../sizes/size.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, product => product.inventory)
  product: Product;

  @Column()
  productId: string;

  @ManyToOne(() => Colour, colour => colour.products)
  colour: Colour;

  @Column({ nullable: true })
  colourId: string;

  @ManyToOne(() => Size, size => size.products)
  size: Size;

  @Column({ nullable: true })
  sizeId: string;

  @Column({ default: 0 })
  quantity: number;

  @Column({ default: 0 })
  reservedQuantity: number;

  @Column({ default: 0 })
  reorderLevel: number;

  @Column({ default: 0 })
  reorderQuantity: number;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  warehouse: string;

  @Column({ nullable: true })
  lastAdjustmentReason: string;

  @Column({ nullable: true })
  lastAdjustmentDate: Date;

  @Column({ default: true })
  trackInventory: boolean;

  @Column({ default: false })
  allowBackorder: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
