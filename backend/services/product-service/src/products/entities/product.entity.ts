import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinTable, ManyToMany } from 'typeorm';
import { Category } from '../categories/category.entity';
import { Colour } from '../colours/colour.entity';
import { Size } from '../sizes/size.entity';
import { Inventory } from '../inventory/inventory.entity';
import { Pricing } from '../pricing/pricing.entity';
import { ProductImage } from './product-image.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  shortDescription: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  sku: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  basePrice: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  salePrice: number;

  @Column({ nullable: true })
  material: string;

  @Column({ nullable: true })
  dimensions: string;

  @Column({ nullable: true })
  weight: string;

  @Column({ nullable: true })
  careInstructions: string;

  @Column({ nullable: true })
  tags: string;

  @ManyToOne(() => Category, category => category.products)
  category: Category;

  @Column()
  categoryId: string;

  @ManyToMany(() => Colour, colour => colour.products)
  @JoinTable({
    name: 'product_colours',
    joinColumn: { name: 'productId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'colourId', referencedColumnName: 'id' },
  })
  colours: Colour[];

  @ManyToMany(() => Size, size => size.products)
  @JoinTable({
    name: 'product_sizes',
    joinColumn: { name: 'productId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'sizeId', referencedColumnName: 'id' },
  })
  sizes: Size[];

  @OneToMany(() => ProductImage, image => image.product)
  images: ProductImage[];

  @OneToMany(() => Inventory, inventory => inventory.product)
  inventory: Inventory[];

  @OneToMany(() => Pricing, pricing => pricing.product)
  pricing: Pricing[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
