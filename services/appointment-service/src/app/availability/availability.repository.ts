import { PrismaClient, Availability, TimeSlot, Prisma } from '@prisma/client';
import {
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  AvailabilityQueryDto,
  CreateSlotDto,
  UpdateSlotDto,
} from './availability.types';

export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateAvailabilityDto): Promise<Availability> {
    return this.prisma.availability.create({
      data: {
        consultantId: data.consultantId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isRecurring: data.isRecurring ?? true,
        specificDate: data.specificDate ? new Date(data.specificDate) : null,
        isBlocked: data.isBlocked ?? false,
        blockReason: data.blockReason,
      },
      include: {
        consultant: true,
      },
    });
  }

  async findById(id: string): Promise<Availability | null> {
    return this.prisma.availability.findFirst({
      where: { id },
      include: {
        consultant: true,
      },
    });
  }

  async findConflict(
    consultantId: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
  ): Promise<Availability | null> {
    return this.prisma.availability.findFirst({
      where: {
        consultantId,
        dayOfWeek: dayOfWeek as any,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });
  }

  async findAll(query: AvailabilityQueryDto): Promise<{ data: Availability[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AvailabilityWhereInput = {
      ...(query.consultantId && { consultantId: query.consultantId }),
      ...(query.from && { specificDate: { gte: new Date(query.from) } }),
      ...(query.to && { specificDate: { lte: new Date(query.to) } }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.availability.findMany({
        where,
        skip,
        take: limit,
        orderBy: { specificDate: 'asc' },
        include: { consultant: true },
      }),
      this.prisma.availability.count({ where }),
    ]);

    return { data, total };
  }

  async findByConsultantId(
    consultantId: string,
    query: AvailabilityQueryDto,
  ): Promise<{ data: Availability[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AvailabilityWhereInput = {
      consultantId,
      ...(query.from && { specificDate: { gte: new Date(query.from) } }),
      ...(query.to && { specificDate: { lte: new Date(query.to) } }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.availability.findMany({
        where,
        skip,
        take: limit,
        orderBy: { specificDate: 'asc' },
        include: { consultant: true },
      }),
      this.prisma.availability.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, data: UpdateAvailabilityDto): Promise<Availability> {
    return this.prisma.availability.update({
      where: { id },
      data: {
        ...(data.dayOfWeek && { dayOfWeek: data.dayOfWeek as any }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
        ...(data.specificDate && { specificDate: new Date(data.specificDate) }),
        ...(data.isBlocked !== undefined && { isBlocked: data.isBlocked }),
        ...(data.blockReason && { blockReason: data.blockReason }),
        updatedAt: new Date(),
      },
      include: { consultant: true },
    });
  }

  async softDelete(id: string): Promise<Availability> {
    return this.prisma.availability.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }

  async createSlot(data: CreateSlotDto): Promise<TimeSlot> {
    return this.prisma.timeSlot.create({
      data: {
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        consultantId: data.consultantId,
        isAvailable: true,
      },
    });
  }

  async findSlotById(id: string): Promise<TimeSlot | null> {
    return this.prisma.timeSlot.findFirst({
      where: { id },
    });
  }

  async findAvailableSlots(query: AvailabilityQueryDto): Promise<TimeSlot[]> {
    return this.prisma.timeSlot.findMany({
      where: {
        isAvailable: true,
        isBlocked: false,
        ...(query.consultantId && { consultantId: query.consultantId }),
        ...(query.from && { date: { gte: new Date(query.from) } }),
        ...(query.to && { date: { lte: new Date(query.to) } }),
      },
      orderBy: { date: 'asc' },
    });
  }

  async findSlotsByConsultantId(consultantId: string, query: AvailabilityQueryDto): Promise<TimeSlot[]> {
    return this.prisma.timeSlot.findMany({
      where: {
        consultantId,
        ...(query.isAvailable !== undefined && { isAvailable: query.isAvailable }),
        ...(query.from && { date: { gte: new Date(query.from) } }),
        ...(query.to && { date: { lte: new Date(query.to) } }),
      },
      orderBy: { date: 'asc' },
    });
  }

  async updateSlot(id: string, data: UpdateSlotDto & { isAvailable?: boolean }): Promise<TimeSlot> {
    return this.prisma.timeSlot.update({
      where: { id },
      data: {
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
        ...(data.duration && { duration: data.duration }),
        updatedAt: new Date(),
      },
    });
  }

  async softDeleteSlot(id: string): Promise<TimeSlot> {
    return this.prisma.timeSlot.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }

  async findSlotsNeedingGeneration(from: Date, to: Date): Promise<Availability[]> {
    return this.prisma.availability.findMany({
      where: {
        specificDate: {
          gte: from,
          lte: to,
        },
      },
      include: {
        consultant: true,
      },
    });
  }
}