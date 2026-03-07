import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async create(productData: Partial<Product>): Promise<Product> {
    const product = this.productsRepository.create(productData);
    return this.productsRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find({
      relations: ['category', 'colours', 'sizes', 'images', 'inventory', 'pricing'],
    });
  }

  async findById(id: string): Promise<Product | null> {
    return this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'colours', 'sizes', 'images', 'inventory', 'pricing'],
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.productsRepository.findOne({
      where: { slug },
      relations: ['category', 'colours', 'sizes', 'images', 'inventory', 'pricing'],
    });
  }

  async update(id: string, updateData: Partial<Product>): Promise<Product | null> {
    await this.productsRepository.update(id, updateData);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.productsRepository.delete(id);
  }

  async findActive(): Promise<Product[]> {
    return this.productsRepository.find({
      where: { isActive: true },
      relations: ['category', 'colours', 'sizes', 'images', 'inventory', 'pricing'],
    });
  }

  async findFeatured(): Promise<Product[]> {
    return this.productsRepository.find({
      where: { isFeatured: true, isActive: true },
      relations: ['category', 'colours', 'sizes', 'images', 'inventory', 'pricing'],
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    return this.productsRepository.find({
      where: { categoryId, isActive: true },
      relations: ['category', 'colours', 'sizes', 'images', 'inventory', 'pricing'],
    });
  }

  async search(query: string): Promise<Product[]> {
    return this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.colours', 'colours')
      .leftJoinAndSelect('product.sizes', 'sizes')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.inventory', 'inventory')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .where('product.name ILIKE :query OR product.description ILIKE :query', { query: `%${query}%` })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .orderBy('product.name', 'ASC')
      .limit(20)
      .getMany();
  }
}
