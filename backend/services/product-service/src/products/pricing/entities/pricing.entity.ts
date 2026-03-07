import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { Colour } from '../colours/colour.entity';
import { Size } from '../sizes/size.entity';

@Entity('pricing')
export class Pricing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, product => product.pricing)
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

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  salePrice: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  updateReason: string;

  @Column({ nullable: true })
  updatedBy: string;

  @Column({ nullable: true })
  costPrice: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  taxRate: number;

  @Column({ nullable: true })
  taxCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
