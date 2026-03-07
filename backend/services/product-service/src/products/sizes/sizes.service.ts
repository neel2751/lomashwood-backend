import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Size } from './entities/size.entity';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';

@Injectable()
export class SizesService {
  constructor(
    @InjectRepository(Size)
    private sizesRepository: Repository<Size>,
  ) {}

  async findAll(): Promise<Size[]> {
    return this.sizesRepository.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Size | null> {
    return this.sizesRepository.findOne({
      where: { id },
      relations: ['products'],
    });
  }

  async findBySlug(slug: string): Promise<Size | null> {
    return this.sizesRepository.findOne({
      where: { slug },
      relations: ['products'],
    });
  }

  async create(createSizeDto: CreateSizeDto): Promise<Size> {
    const size = this.sizesRepository.create(createSizeDto);
    return this.sizesRepository.save(size);
  }

  async update(id: string, updateSizeDto: UpdateSizeDto): Promise<Size | null> {
    await this.sizesRepository.update(id, updateSizeDto);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.sizesRepository.delete(id);
  }

  async findActive(): Promise<Size[]> {
    return this.sizesRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findByCategory(categoryId: string): Promise<Size[]> {
    return this.sizesRepository.createQueryBuilder('size')
      .leftJoin('size.products', 'product')
      .leftJoin('product.category', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('size.isActive = :isActive', { isActive: true })
      .orderBy('size.sortOrder', 'ASC')
      .addOrderBy('size.name', 'ASC')
      .getMany();
  }

  async updateOrder(sizeId: string, newOrder: number): Promise<Size | null> {
    await this.sizesRepository.update(sizeId, { sortOrder: newOrder });
    return this.findById(sizeId);
  }

  async toggleActive(sizeId: string): Promise<Size | null> {
    const size = await this.findById(sizeId);
    if (!size) return null;

    await this.sizesRepository.update(sizeId, { isActive: !size.isActive });
    return this.findById(sizeId);
  }

  async findByName(name: string): Promise<Size | null> {
    return this.sizesRepository.findOne({
      where: { name },
      relations: ['products'],
    });
  }
}
