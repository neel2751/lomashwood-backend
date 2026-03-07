import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Colour } from './entities/colour.entity';
import { CreateColourDto } from './dto/create-colour.dto';
import { UpdateColourDto } from './dto/update-colour.dto';

@Injectable()
export class ColoursService {
  constructor(
    @InjectRepository(Colour)
    private coloursRepository: Repository<Colour>,
  ) {}

  async findAll(): Promise<Colour[]> {
    return this.coloursRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Colour | null> {
    return this.coloursRepository.findOne({
      where: { id },
      relations: ['products'],
    });
  }

  async findBySlug(slug: string): Promise<Colour | null> {
    return this.coloursRepository.findOne({
      where: { slug },
      relations: ['products'],
    });
  }

  async create(createColourDto: CreateColourDto): Promise<Colour> {
    const colour = this.coloursRepository.create(createColourDto);
    return this.coloursRepository.save(colour);
  }

  async update(id: string, updateColourDto: UpdateColourDto): Promise<Colour | null> {
    await this.coloursRepository.update(id, updateColourDto);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.coloursRepository.delete(id);
  }

  async findActive(): Promise<Colour[]> {
    return this.coloursRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async updateOrder(colourId: string, newOrder: number): Promise<Colour | null> {
    await this.coloursRepository.update(colourId, { sortOrder: newOrder });
    return this.findById(colourId);
  }

  async toggleActive(colourId: string): Promise<Colour | null> {
    const colour = await this.findById(colourId);
    if (!colour) return null;

    await this.coloursRepository.update(colourId, { isActive: !colour.isActive });
    return this.findById(colourId);
  }

  async findByName(name: string): Promise<Colour | null> {
    return this.coloursRepository.findOne({
      where: { name },
      relations: ['products'],
    });
  }
}
