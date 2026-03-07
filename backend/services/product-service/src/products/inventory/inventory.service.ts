import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
  ) {}

  async findAll(productId?: string): Promise<Inventory[]> {
    const query = this.inventoryRepository.createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .leftJoinAndSelect('inventory.colour', 'colour')
      .leftJoinAndSelect('inventory.size', 'size');

    if (productId) {
      query.andWhere('inventory.productId = :productId', { productId });
    }

    return query.orderBy('product.name', 'ASC').addOrderBy('colour.name', 'ASC').addOrderBy('size.name', 'ASC').getMany();
  }

  async findById(id: string): Promise<Inventory | null> {
    return this.inventoryRepository.findOne({
      where: { id },
      relations: ['product', 'colour', 'size'],
    });
  }

  async findByProduct(productId: string): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      where: { productId },
      relations: ['product', 'colour', 'size'],
      order: { quantity: 'DESC' },
    });
  }

  async findByProductVariant(productId: string, colourId?: string, sizeId?: string): Promise<Inventory | null> {
    return this.inventoryRepository.findOne({
      where: { productId, colourId, sizeId },
      relations: ['product', 'colour', 'size'],
    });
  }

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const inventory = this.inventoryRepository.create(createInventoryDto);
    return this.inventoryRepository.save(inventory);
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto): Promise<Inventory | null> {
    await this.inventoryRepository.update(id, updateInventoryDto);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.inventoryRepository.delete(id);
  }

  async adjustQuantity(id: string, quantity: number, reason: string): Promise<Inventory | null> {
    const inventory = await this.findById(id);
    if (!inventory) return null;

    const newQuantity = inventory.quantity + quantity;
    
    if (newQuantity < 0) {
      throw new Error('Insufficient inventory');
    }

    await this.inventoryRepository.update(id, { 
      quantity: newQuantity,
      lastAdjustmentReason: reason,
      lastAdjustmentDate: new Date(),
    });

    return this.findById(id);
  }

  async reserveStock(id: string, quantity: number): Promise<Inventory | null> {
    const inventory = await this.findById(id);
    if (!inventory) return null;

    if (inventory.quantity < quantity) {
      throw new Error('Insufficient stock for reservation');
    }

    await this.inventoryRepository.update(id, {
      quantity: inventory.quantity - quantity,
      reservedQuantity: inventory.reservedQuantity + quantity,
    });

    return this.findById(id);
  }

  async releaseReservedStock(id: string, quantity: number): Promise<Inventory | null> {
    const inventory = await this.findById(id);
    if (!inventory) return null;

    if (inventory.reservedQuantity < quantity) {
      throw new Error('Insufficient reserved stock');
    }

    await this.inventoryRepository.update(id, {
      reservedQuantity: inventory.reservedQuantity - quantity,
    });

    return this.findById(id);
  }

  async confirmReservedStock(id: string, quantity: number): Promise<Inventory | null> {
    const inventory = await this.findById(id);
    if (!inventory) return null;

    if (inventory.reservedQuantity < quantity) {
      throw new Error('Insufficient reserved stock');
    }

    await this.inventoryRepository.update(id, {
      reservedQuantity: inventory.reservedQuantity - quantity,
    });

    return this.findById(id);
  }

  async getLowStockAlerts(threshold: number = 10): Promise<Inventory[]> {
    return this.inventoryRepository.createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .leftJoinAndSelect('inventory.colour', 'colour')
      .leftJoinAndSelect('inventory.size', 'size')
      .where('inventory.quantity <= :threshold', { threshold })
      .andWhere('inventory.quantity > 0')
      .orderBy('inventory.quantity', 'ASC')
      .getMany();
  }

  async getOutOfStockItems(): Promise<Inventory[]> {
    return this.inventoryRepository.createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .leftJoinAndSelect('inventory.colour', 'colour')
      .leftJoinAndSelect('inventory.size', 'size')
      .where('inventory.quantity = 0')
      .orderBy('product.name', 'ASC')
      .getMany();
  }
}
