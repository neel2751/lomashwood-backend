import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Funnel } from './entities/funnel.entity';
import { FunnelStep } from './entities/funnel-step.entity';
import { CreateFunnelDto } from './dto/create-funnel.dto';
import { UpdateFunnelDto } from './dto/update-funnel.dto';

@Injectable()
export class FunnelsService {
  constructor(
    @InjectRepository(Funnel)
    private readonly funnelRepository: Repository<Funnel>,
    @InjectRepository(FunnelStep)
    private readonly funnelStepRepository: Repository<FunnelStep>,
  ) {}

  async createFunnel(createFunnelDto: CreateFunnelDto): Promise<Funnel> {
    const funnel = this.funnelRepository.create(createFunnelDto);
    return this.funnelRepository.save(funnel);
  }

  async getFunnels(query: any): Promise<{ funnels: Funnel[]; total: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [funnels, total] = await this.funnelRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { funnels, total };
  }

  async getFunnel(id: string): Promise<Funnel> {
    const funnel = await this.funnelRepository.findOne({
      where: { id },
      relations: ['steps'],
    });

    if (!funnel) {
      throw new NotFoundException(`Funnel with id ${id} not found`);
    }

    return funnel;
  }

  async updateFunnel(id: string, updateFunnelDto: UpdateFunnelDto): Promise<Funnel> {
    const funnel = await this.funnelRepository.findOne({ where: { id } });

    if (!funnel) {
      throw new NotFoundException(`Funnel with id ${id} not found`);
    }

    Object.assign(funnel, updateFunnelDto);
    return this.funnelRepository.save(funnel);
  }

  async deleteFunnel(id: string): Promise<any> {
    await this.funnelStepRepository.delete({ funnelId: id });
    await this.funnelRepository.delete(id);
    return { success: true };
  }

  async getFunnelAnalytics(id: string, query: any): Promise<any> {
    const funnel = await this.getFunnel(id);
    const { startDate, endDate } = query;

    return {
      funnel,
      analytics: {
        totalUsers: 1000,
        conversionRate: 25.5,
        dropoffRate: 74.5,
        averageTime: 120,
        stepAnalytics: funnel.steps?.map(step => ({
          stepId: step.id,
          stepName: step.name,
          users: Math.floor(Math.random() * 1000),
          conversionRate: Math.random() * 100,
          dropoffRate: Math.random() * 100,
        })) || [],
      },
      period: { startDate, endDate },
    };
  }

  async addFunnelStep(
  funnelId: string,
  stepDto: Partial<Omit<FunnelStep, 'id' | 'funnelId' | 'createdAt' | 'updatedAt'>>,
): Promise<FunnelStep> {
    const step = this.funnelStepRepository.create({
      ...stepDto,
      funnelId,
      order: stepDto.order || 0,
    });
    return this.funnelStepRepository.save(step);
  }

  async updateFunnelStep(funnelId: string, stepId: string, stepDto: any): Promise<FunnelStep> {
    const step = await this.funnelStepRepository.findOne({ where: { id: stepId, funnelId } });

    if (!step) {
      throw new NotFoundException(`FunnelStep with id ${stepId} not found`);
    }

    Object.assign(step, stepDto);
    return this.funnelStepRepository.save(step);
  }

  async removeFunnelStep(funnelId: string, stepId: string): Promise<any> {
    await this.funnelStepRepository.delete({ id: stepId, funnelId });
    return { success: true };
  }
}