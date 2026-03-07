import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private productImagesRepository: Repository<ProductImage>,
  ) {}

  async findAll(filterDto: FilterProductDto): Promise<Product[]> {
    const query = this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.colours', 'colours')
      .leftJoinAndSelect('product.sizes', 'sizes')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.inventory', 'inventory')
      .leftJoinAndSelect('product.pricing', 'pricing');

    if (filterDto.categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId: filterDto.categoryId });
    }

    if (filterDto.colourId) {
      query.andWhere('product.colours.id = :colourId', { colourId: filterDto.colourId });
    }

    if (filterDto.sizeId) {
      query.andWhere('product.sizes.id = :sizeId', { sizeId: filterDto.sizeId });
    }

    if (filterDto.minPrice) {
      query.andWhere('pricing.price >= :minPrice', { minPrice: filterDto.minPrice });
    }

    if (filterDto.maxPrice) {
      query.andWhere('pricing.price <= :maxPrice', { maxPrice: filterDto.maxPrice });
    }

    if (filterDto.isActive !== undefined) {
      query.andWhere('product.isActive = :isActive', { isActive: filterDto.isActive });
    }

    if (filterDto.isFeatured !== undefined) {
      query.andWhere('product.isFeatured = :isFeatured', { isFeatured: filterDto.isFeatured });
    }

    query.orderBy('product.createdAt', 'DESC');

    if (filterDto.limit) {
      query.limit(filterDto.limit);
    }

    if (filterDto.offset) {
      query.offset(filterDto.offset);
    }

    return query.getMany();
  }

  async findById(id: string): Promise<Product | null> {
    return this.productsRepository.findOne({
      where: { id },
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

  async getFeatured(): Promise<Product[]> {
    return this.productsRepository.find({
      where: { isFeatured: true, isActive: true },
      relations: ['category', 'colours', 'sizes', 'images', 'inventory', 'pricing'],
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product | null> {
    await this.productsRepository.update(id, updateProductDto);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.productsRepository.delete(id);
  }

  async toggleFeatured(id: string): Promise<Product | null> {
    const product = await this.findById(id);
    if (!product) return null;

    await this.productsRepository.update(id, { isFeatured: !product.isFeatured });
    return this.findById(id);
  }

  async toggleStatus(id: string): Promise<Product | null> {
    const product = await this.findById(id);
    if (!product) return null;

    await this.productsRepository.update(id, { isActive: !product.isActive });
    return this.findById(id);
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.productsRepository.findOne({
      where: { slug },
      relations: ['category', 'colours', 'sizes', 'images', 'inventory', 'pricing'],
    });
  }

  async getRelatedProducts(productId: string, limit: number = 5): Promise<Product[]> {
    const product = await this.findById(productId);
    if (!product) return [];

    return this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.colours', 'colours')
      .leftJoinAndSelect('product.sizes', 'sizes')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.inventory', 'inventory')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .where('product.categoryId = :categoryId', { categoryId: product.categoryId })
      .andWhere('product.id != :productId', { productId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .orderBy('RANDOM()')
      .limit(limit)
      .getMany();
  }
}
