import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pricing } from './entities/pricing.entity';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Pricing)
    private pricingRepository: Repository<Pricing>,
  ) {}

  async findAll(productId?: string): Promise<Pricing[]> {
    const query = this.pricingRepository.createQueryBuilder('pricing')
      .leftJoinAndSelect('pricing.product', 'product')
      .leftJoinAndSelect('pricing.colour', 'colour')
      .leftJoinAndSelect('pricing.size', 'size');

    if (productId) {
      query.andWhere('pricing.productId = :productId', { productId });
    }

    return query.orderBy('pricing.startDate', 'DESC').getMany();
  }

  async findById(id: string): Promise<Pricing | null> {
    return this.pricingRepository.findOne({
      where: { id },
      relations: ['product', 'colour', 'size'],
    });
  }

  async findByProduct(productId: string): Promise<Pricing[]> {
    return this.pricingRepository.find({
      where: { productId },
      relations: ['product', 'colour', 'size'],
      order: { startDate: 'DESC' },
    });
  }

  async getCurrentPricing(productId: string): Promise<Pricing | null> {
    const now = new Date();
    return this.pricingRepository.createQueryBuilder('pricing')
      .leftJoinAndSelect('pricing.product', 'product')
      .leftJoinAndSelect('pricing.colour', 'colour')
      .leftJoinAndSelect('pricing.size', 'size')
      .where('pricing.productId = :productId', { productId })
      .andWhere('pricing.startDate <= :now', { now })
      .andWhere('(pricing.endDate IS NULL OR pricing.endDate >= :now)', { now })
      .andWhere('pricing.isActive = :isActive', { isActive: true })
      .orderBy('pricing.startDate', 'DESC')
      .getOne();
  }

  async create(createPricingDto: CreatePricingDto): Promise<Pricing> {
    const pricing = this.pricingRepository.create(createPricingDto);
    return this.pricingRepository.save(pricing);
  }

  async update(id: string, updatePricingDto: UpdatePricingDto): Promise<Pricing | null> {
    await this.pricingRepository.update(id, updatePricingDto);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.pricingRepository.delete(id);
  }

  async bulkUpdate(productId: string, price: number, salePrice?: number, reason?: string): Promise<Pricing[]> {
    // Deactivate current pricing
    await this.pricingRepository.update(
      { productId, isActive: true },
      { isActive: false, endDate: new Date() }
    );

    // Create new pricing records for all variants
    const variants = await this.pricingRepository.find({
      where: { productId },
      relations: ['colour', 'size'],
    });

    const newPricingRecords = variants.map(variant => 
      this.pricingRepository.create({
        productId,
        colourId: variant.colourId,
        sizeId: variant.sizeId,
        price,
        salePrice,
        startDate: new Date(),
        isActive: true,
        updateReason: reason,
      })
    );

    return this.pricingRepository.save(newPricingRecords);
  }

  async getPriceHistory(productId: string, limit: number = 10): Promise<Pricing[]> {
    return this.pricingRepository.find({
      where: { productId },
      relations: ['product', 'colour', 'size'],
      order: { startDate: 'DESC' },
      take: limit,
    });
  }

  async getActivePricing(): Promise<Pricing[]> {
    const now = new Date();
    return this.pricingRepository.createQueryBuilder('pricing')
      .leftJoinAndSelect('pricing.product', 'product')
      .leftJoinAndSelect('pricing.colour', 'colour')
      .leftJoinAndSelect('pricing.size', 'size')
      .where('pricing.startDate <= :now', { now })
      .andWhere('(pricing.endDate IS NULL OR pricing.endDate >= :now)', { now })
      .andWhere('pricing.isActive = :isActive', { isActive: true })
      .orderBy('pricing.startDate', 'DESC')
      .getMany();
  }

  async getUpcomingPriceChanges(): Promise<Pricing[]> {
    const now = new Date();
    return this.pricingRepository.createQueryBuilder('pricing')
      .leftJoinAndSelect('pricing.product', 'product')
      .leftJoinAndSelect('pricing.colour', 'colour')
      .leftJoinAndSelect('pricing.size', 'size')
      .where('pricing.startDate > :now', { now })
      .andWhere('pricing.isActive = :isActive', { isActive: true })
      .orderBy('pricing.startDate', 'ASC')
      .getMany();
  }

  async calculateDiscount(productId: string): Promise<number> {
    const currentPricing = await this.getCurrentPricing(productId);
    if (!currentPricing || !currentPricing.salePrice) {
      return 0;
    }

    const discount = ((currentPricing.price - currentPricing.salePrice) / currentPricing.price) * 100;
    return Math.round(discount * 100) / 100; // Round to 2 decimal places
  }
}
