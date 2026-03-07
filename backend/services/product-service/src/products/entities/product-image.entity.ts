import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  alt: string;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Product, product => product.images)
  product: Product;

  @Column()
  productId: string;

  @Column({ nullable: true })
  caption: string;

  @Column({ nullable: true })
  title: string;
}
