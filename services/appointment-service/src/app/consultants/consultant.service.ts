import { ConsultantRepository } from './consultant.repository';
import { ConsultantMapper } from './consultant.mapper';
import { redisClient } from '../../infrastructure/cache/redis.client';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { CONSULTANT_REDIS_KEYS, CONSULTANT_CACHE_TTL, CONSULTANT_EVENTS } from './consultant.constants';
import {
  ConsultantNotFoundError,
  ConsultantAlreadyExistsError,
  ConsultantInactiveError,
} from '../../shared/errors';
import {
  CreateConsultantDto,
  UpdateConsultantDto,
  ConsultantQueryDto,
  ConsultantResponse,
  PaginatedConsultantResponse,
  ConsultantStatsResponse,
} from './consultant.types';
import { PaginationMeta } from '../../shared/pagination';

export class ConsultantService {
  constructor(
    private readonly consultantRepository: ConsultantRepository,
    private readonly redis: typeof redisClient,
    private readonly eventProducer: EventProducer,
    private readonly consultantMapper: ConsultantMapper,
  ) {}

  async createConsultant(dto: CreateConsultantDto): Promise<ConsultantResponse> {
    const existing = await this.consultantRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConsultantAlreadyExistsError(dto.email);
    }

    const consultant = await this.consultantRepository.create(dto);

    await this.invalidateConsultantListCache();

    await this.eventProducer.publish(CONSULTANT_EVENTS.CREATED, {
      consultantId: consultant.id,
      name: consultant.name,
      email: consultant.email,
    });

    return this.consultantMapper.toResponse(consultant);
  }

  async getConsultantById(id: string): Promise<ConsultantResponse> {
    const cached = await this.redis.get(CONSULTANT_REDIS_KEYS.consultantById(id));
    if (cached) {
      return JSON.parse(cached) as ConsultantResponse;
    }

    const consultant = await this.consultantRepository.findById(id);
    if (!consultant) {
      throw new ConsultantNotFoundError(id);
    }

    const response = this.consultantMapper.toResponse(consultant);
    await this.redis.setEx(
      CONSULTANT_REDIS_KEYS.consultantById(id),
      CONSULTANT_CACHE_TTL,
      JSON.stringify(response),
    );

    return response;
  }

  async getAllConsultants(query: ConsultantQueryDto): Promise<PaginatedConsultantResponse> {
    const { data, total } = await this.consultantRepository.findAll(query);
    const meta: PaginationMeta = {
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      totalPages: Math.ceil(total / (query.limit ?? 10)),
    };

    return {
      data: data.map((c) => this.consultantMapper.toResponse(c)),
      meta,
    };
  }

  async updateConsultant(id: string, dto: UpdateConsultantDto): Promise<ConsultantResponse> {
    const consultant = await this.consultantRepository.findById(id);
    if (!consultant) {
      throw new ConsultantNotFoundError(id);
    }

    if (dto.email && dto.email !== consultant.email) {
      const existing = await this.consultantRepository.findByEmail(dto.email);
      if (existing) {
        throw new ConsultantAlreadyExistsError(dto.email);
      }
    }

    const updated = await this.consultantRepository.update(id, dto);

    await this.redis.del(CONSULTANT_REDIS_KEYS.consultantById(id));
    await this.invalidateConsultantListCache();

    await this.eventProducer.publish(CONSULTANT_EVENTS.UPDATED, {
      consultantId: id,
      changes: dto,
    });

    return this.consultantMapper.toResponse(updated);
  }

  async deleteConsultant(id: string): Promise<void> {
    const consultant = await this.consultantRepository.findById(id);
    if (!consultant) {
      throw new ConsultantNotFoundError(id);
    }

    await this.consultantRepository.softDelete(id);

    await this.redis.del(CONSULTANT_REDIS_KEYS.consultantById(id));
    await this.invalidateConsultantListCache();

    await this.eventProducer.publish(CONSULTANT_EVENTS.DELETED, {
      consultantId: id,
    });
  }

  async activateConsultant(id: string): Promise<ConsultantResponse> {
    const consultant = await this.consultantRepository.findById(id);
    if (!consultant) {
      throw new ConsultantNotFoundError(id);
    }

    const updated = await this.consultantRepository.update(id, { isActive: true });

    await this.redis.del(CONSULTANT_REDIS_KEYS.consultantById(id));
    await this.invalidateConsultantListCache();

    await this.eventProducer.publish(CONSULTANT_EVENTS.UPDATED, {
      consultantId: id,
      changes: { isActive: true },
    });

    return this.consultantMapper.toResponse(updated);
  }

  async deactivateConsultant(id: string): Promise<ConsultantResponse> {
    const consultant = await this.consultantRepository.findById(id);
    if (!consultant) {
      throw new ConsultantNotFoundError(id);
    }

    const updated = await this.consultantRepository.update(id, { isActive: false });

    await this.redis.del(CONSULTANT_REDIS_KEYS.consultantById(id));
    await this.invalidateConsultantListCache();

    await this.eventProducer.publish(CONSULTANT_EVENTS.UPDATED, {
      consultantId: id,
      changes: { isActive: false },
    });

    return this.consultantMapper.toResponse(updated);
  }

  async getConsultantAvailability(
    id: string,
    query: ConsultantQueryDto,
  ): Promise<ConsultantResponse['availability']> {
    const consultant = await this.consultantRepository.findById(id);
    if (!consultant) {
      throw new ConsultantNotFoundError(id);
    }

    if (!consultant.isActive) {
      throw new ConsultantInactiveError(id);
    }

    const availability = await this.consultantRepository.findAvailabilityByConsultantId(id, query);
    return availability;
  }

  async getConsultantBookings(
    id: string,
    query: ConsultantQueryDto,
  ): Promise<PaginatedConsultantResponse> {
    const consultant = await this.consultantRepository.findById(id);
    if (!consultant) {
      throw new ConsultantNotFoundError(id);
    }

    const { data, total } = await this.consultantRepository.findBookingsByConsultantId(id, query);
    const meta: PaginationMeta = {
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      totalPages: Math.ceil(total / (query.limit ?? 10)),
    };

    return {
      data: data.map((c) => this.consultantMapper.toResponse(c)),
      meta,
    };
  }

  async getConsultantStats(id: string): Promise<ConsultantStatsResponse> {
    const consultant = await this.consultantRepository.findById(id);
    if (!consultant) {
      throw new ConsultantNotFoundError(id);
    }

    const cached = await this.redis.get(CONSULTANT_REDIS_KEYS.consultantStats(id));
    if (cached) {
      return JSON.parse(cached) as ConsultantStatsResponse;
    }

    const stats = await this.consultantRepository.getStats(id);

    await this.redis.setEx(
      CONSULTANT_REDIS_KEYS.consultantStats(id),
      CONSULTANT_CACHE_TTL,
      JSON.stringify(stats),
    );

    return stats;
  }

  private async invalidateConsultantListCache(): Promise<void> {
    await this.redis.del(CONSULTANT_REDIS_KEYS.allConsultants);
    await this.redis.del(CONSULTANT_REDIS_KEYS.activeConsultants);
  }
}