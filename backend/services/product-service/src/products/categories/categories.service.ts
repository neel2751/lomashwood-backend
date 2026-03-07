import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.categoriesRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'products'],
    });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.categoriesRepository.findOne({
      where: { slug },
      relations: ['parent', 'children', 'products'],
    });
  }

  async getTree(): Promise<Category[]> {
    const categories = await this.categoriesRepository.find({
      relations: ['parent', 'children'],
      order: { name: 'ASC' },
    });

    return categories.filter(category => !category.parent);
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category | null> {
    await this.categoriesRepository.update(id, updateCategoryDto);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.categoriesRepository.delete(id);
  }

  async findRootCategories(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { parentId: null },
      relations: ['children'],
      order: { name: 'ASC' },
    });
  }

  async findChildCategories(parentId: string): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { parentId },
      relations: ['children'],
      order: { name: 'ASC' },
    });
  }

  async updateOrder(categoryId: string, newOrder: number): Promise<Category | null> {
    await this.categoriesRepository.update(categoryId, { sortOrder: newOrder });
    return this.findById(categoryId);
  }

  async toggleActive(categoryId: string): Promise<Category | null> {
    const category = await this.findById(categoryId);
    if (!category) return null;

    await this.categoriesRepository.update(categoryId, { isActive: !category.isActive });
    return this.findById(categoryId);
  }
}
