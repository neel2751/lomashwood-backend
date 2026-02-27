import { AvailabilityRepository } from './availability.repository';
import { AvailabilityMapper } from './availability.mapper';
import { redisClient } from '../../infrastructure/cache/redis.client';
import { AVAILABILITY_REDIS_KEYS, AVAILABILITY_CACHE_TTL } from './availability.constants';
import {
  AvailabilityNotFoundError,
  SlotNotFoundError,
  SlotAlreadyBookedError,
  AvailabilityConflictError,
} from '../../shared/errors';
import {
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  AvailabilityQueryDto,
  AvailabilityResponse,
  PaginatedAvailabilityResponse,
  CreateSlotDto,
  UpdateSlotDto,
  SlotResponse,
} from './availability.types';
import { PaginationMeta } from '../../shared/pagination';

export class AvailabilityService {
  constructor(
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly redis: typeof redisClient,
    private readonly availabilityMapper: AvailabilityMapper,
  ) {}

  async createAvailability(dto: CreateAvailabilityDto): Promise<AvailabilityResponse> {
    const conflict = await this.availabilityRepository.findConflict(
      dto.consultantId,
      dto.date,
      dto.startTime,
      dto.endTime,
    );

    if (conflict) {
      throw new AvailabilityConflictError(dto.consultantId, dto.date);
    }

    const availability = await this.availabilityRepository.create(dto);

    await this.invalidateAvailabilityCache(dto.consultantId);

    return this.availabilityMapper.toResponse(availability);
  }

  async getAvailabilityById(id: string): Promise<AvailabilityResponse> {
    const cached = await this.redis.get(AVAILABILITY_REDIS_KEYS.availabilityById(id));
    if (cached) {
      return JSON.parse(cached) as AvailabilityResponse;
    }

    const availability = await this.availabilityRepository.findById(id);
    if (!availability) {
      throw new AvailabilityNotFoundError(id);
    }

    const response = this.availabilityMapper.toResponse(availability);
    await this.redis.setEx(
      AVAILABILITY_REDIS_KEYS.availabilityById(id),
      AVAILABILITY_CACHE_TTL,
      JSON.stringify(response),
    );

    return response;
  }

  async getAllAvailabilities(query: AvailabilityQueryDto): Promise<PaginatedAvailabilityResponse> {
    const { data, total } = await this.availabilityRepository.findAll(query);
    const meta: PaginationMeta = {
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      totalPages: Math.ceil(total / (query.limit ?? 10)),
    };

    return {
      data: data.map((a) => this.availabilityMapper.toResponse(a)),
      meta,
    };
  }

  async getAvailabilityByConsultant(
    consultantId: string,
    query: AvailabilityQueryDto,
  ): Promise<PaginatedAvailabilityResponse> {
    const cacheKey = AVAILABILITY_REDIS_KEYS.availabilityByConsultant(consultantId);
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as PaginatedAvailabilityResponse;
    }

    const { data, total } = await this.availabilityRepository.findByConsultantId(consultantId, query);
    const meta: PaginationMeta = {
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      totalPages: Math.ceil(total / (query.limit ?? 10)),
    };

    const response = {
      data: data.map((a) => this.availabilityMapper.toResponse(a)),
      meta,
    };

    await this.redis.setEx(cacheKey, AVAILABILITY_CACHE_TTL, JSON.stringify(response));

    return response;
  }

  async updateAvailability(id: string, dto: UpdateAvailabilityDto): Promise<AvailabilityResponse> {
    const availability = await this.availabilityRepository.findById(id);
    if (!availability) {
      throw new AvailabilityNotFoundError(id);
    }

    const updated = await this.availabilityRepository.update(id, dto);

    await this.invalidateAvailabilityCache(availability.consultantId);
    await this.redis.del(AVAILABILITY_REDIS_KEYS.availabilityById(id));

    return this.availabilityMapper.toResponse(updated);
  }

  async deleteAvailability(id: string): Promise<void> {
    const availability = await this.availabilityRepository.findById(id);
    if (!availability) {
      throw new AvailabilityNotFoundError(id);
    }

    await this.availabilityRepository.softDelete(id);

    await this.invalidateAvailabilityCache(availability.consultantId);
    await this.redis.del(AVAILABILITY_REDIS_KEYS.availabilityById(id));
  }

  async createSlot(dto: CreateSlotDto): Promise<SlotResponse> {
    const availability = await this.availabilityRepository.findById(dto.availabilityId);
    if (!availability) {
      throw new AvailabilityNotFoundError(dto.availabilityId);
    }

    const slot = await this.availabilityRepository.createSlot(dto);

    await this.invalidateSlotCache(availability.consultantId);

    return this.availabilityMapper.toSlotResponse(slot);
  }

  async getSlotById(id: string): Promise<SlotResponse> {
    const cached = await this.redis.get(AVAILABILITY_REDIS_KEYS.slotById(id));
    if (cached) {
      return JSON.parse(cached) as SlotResponse;
    }

    const slot = await this.availabilityRepository.findSlotById(id);
    if (!slot) {
      throw new SlotNotFoundError(id);
    }

    const response = this.availabilityMapper.toSlotResponse(slot);
    await this.redis.setEx(
      AVAILABILITY_REDIS_KEYS.slotById(id),
      AVAILABILITY_CACHE_TTL,
      JSON.stringify(response),
    );

    return response;
  }

  async getAvailableSlots(query: AvailabilityQueryDto): Promise<SlotResponse[]> {
    const slots = await this.availabilityRepository.findAvailableSlots(query);
    return slots.map((s) => this.availabilityMapper.toSlotResponse(s));
  }

  async getSlotsByConsultant(consultantId: string, query: AvailabilityQueryDto): Promise<SlotResponse[]> {
    const cacheKey = AVAILABILITY_REDIS_KEYS.slotsByConsultant(consultantId);
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as SlotResponse[];
    }

    const slots = await this.availabilityRepository.findSlotsByConsultantId(consultantId, query);
    const response = slots.map((s) => this.availabilityMapper.toSlotResponse(s));

    await this.redis.setEx(cacheKey, AVAILABILITY_CACHE_TTL, JSON.stringify(response));

    return response;
  }

  async updateSlot(id: string, dto: UpdateSlotDto): Promise<SlotResponse> {
    const slot = await this.availabilityRepository.findSlotById(id);
    if (!slot) {
      throw new SlotNotFoundError(id);
    }

    const updated = await this.availabilityRepository.updateSlot(id, dto);

    await this.redis.del(AVAILABILITY_REDIS_KEYS.slotById(id));
    await this.invalidateSlotCache(slot.consultantId);

    return this.availabilityMapper.toSlotResponse(updated);
  }

  async deleteSlot(id: string): Promise<void> {
    const slot = await this.availabilityRepository.findSlotById(id);
    if (!slot) {
      throw new SlotNotFoundError(id);
    }

    await this.availabilityRepository.softDeleteSlot(id);

    await this.redis.del(AVAILABILITY_REDIS_KEYS.slotById(id));
    await this.invalidateSlotCache(slot.consultantId);
  }

  async markSlotAsBooked(id: string): Promise<SlotResponse> {
    const slot = await this.availabilityRepository.findSlotById(id);
    if (!slot) {
      throw new SlotNotFoundError(id);
    }

    if (!slot.isAvailable) {
      throw new SlotAlreadyBookedError(id);
    }

    const updated = await this.availabilityRepository.updateSlot(id, { isAvailable: false });

    await this.redis.del(AVAILABILITY_REDIS_KEYS.slotById(id));
    await this.invalidateSlotCache(slot.consultantId);

    return this.availabilityMapper.toSlotResponse(updated);
  }

  async markSlotAsAvailable(id: string): Promise<SlotResponse> {
    const slot = await this.availabilityRepository.findSlotById(id);
    if (!slot) {
      throw new SlotNotFoundError(id);
    }

    const updated = await this.availabilityRepository.updateSlot(id, { isAvailable: true });

    await this.redis.del(AVAILABILITY_REDIS_KEYS.slotById(id));
    await this.invalidateSlotCache(slot.consultantId);

    return this.availabilityMapper.toSlotResponse(updated);
  }

  private async invalidateAvailabilityCache(consultantId: string): Promise<void> {
    await this.redis.del(AVAILABILITY_REDIS_KEYS.availabilityByConsultant(consultantId));
  }

  private async invalidateSlotCache(consultantId: string): Promise<void> {
    await this.redis.del(AVAILABILITY_REDIS_KEYS.slotsByConsultant(consultantId));
    await this.redis.del(AVAILABILITY_REDIS_KEYS.availableSlots);
  }
}