import {
  CreateConsultantDto,
  UpdateConsultantDto,
  ConsultantQueryDto,
  ConsultantStatsResponse,
} from './consultant.types';
import { BOOKING_STATUS } from '../bookings/booking.constants';


interface Consultant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  avatar: string | null;
  specializations: unknown;
  showroomId: string | null;
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ConsultantWhereInput {
  [key: string]: unknown;
  deletedAt?: null | Date;
  isActive?: boolean;
  showroomId?: string;
  specializations?: { has: string };
  OR?: Array<{
    name?: { contains: string; mode: string };
    email?: { contains: string; mode: string };
    bio?: { contains: string; mode: string };
  }>;
}

interface BookingWhereInput {
  consultantId?: string;
  deletedAt?: null;
  status?: string;
  scheduledAt?: { gte?: Date; lte?: Date };
}

interface PrismaClient {
  consultant: {
    create: (args: { data: Record<string, unknown>; include?: Record<string, boolean> }) => Promise<Consultant>;
    findFirst: (args: { where: Record<string, unknown>; include?: Record<string, boolean> }) => Promise<Consultant | null>;
    findMany: (args: { where: Record<string, unknown>; skip?: number; take?: number; orderBy?: Record<string, string>; include?: Record<string, boolean> }) => Promise<Consultant[]>;
    update: (args: { where: { id: string }; data: Record<string, unknown>; include?: Record<string, boolean> }) => Promise<Consultant>;
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
  };
  availability: {
    findMany: (args: { where: Record<string, unknown>; include?: Record<string, unknown>; orderBy?: Record<string, string> }) => Promise<unknown[]>;
  };
  booking: {
    findMany: (args: { where: Record<string, unknown>; skip?: number; take?: number; orderBy?: Record<string, string>; include?: Record<string, boolean> }) => Promise<unknown[]>;
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
  };
  slot: {
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
  };
  $transaction: (queries: Promise<unknown>[]) => Promise<unknown[]>;
}



export class ConsultantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateConsultantDto): Promise<Consultant> {
    return this.prisma.consultant.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        avatar: data.avatar,
        specializations: data.specializations ?? [],
        showroomId: data.showroomId,
        isActive: true,
      },
      include: {
        showroom: true,
      },
    });
  }

  async findById(id: string): Promise<Consultant | null> {
    return this.prisma.consultant.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        showroom: true,
      },
    });
  }

  async findByEmail(email: string): Promise<Consultant | null> {
    return this.prisma.consultant.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  async findAll(query: ConsultantQueryDto): Promise<{ data: Consultant[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: ConsultantWhereInput = {
      deletedAt: null,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.showroomId && { showroomId: query.showroomId }),
      ...(query.specialization && {
        specializations: {
          has: query.specialization,
        },
      }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { bio: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.consultant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          showroom: true,
        },
      }),
      this.prisma.consultant.count({ where }),
    ]);

    return { data, total: total as unknown as number };
  }

  async update(id: string, data: UpdateConsultantDto & { isActive?: boolean }): Promise<Consultant> {
    return this.prisma.consultant.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.specializations && { specializations: data.specializations }),
        ...(data.showroomId !== undefined && { showroomId: data.showroomId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
      include: {
        showroom: true,
      },
    });
  }

  async softDelete(id: string): Promise<Consultant> {
    return this.prisma.consultant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findAvailabilityByConsultantId(
    consultantId: string,
    query: ConsultantQueryDto,
  ): Promise<unknown> {
    return this.prisma.availability.findMany({
      where: {
        consultantId,
        deletedAt: null,
        ...(query.from && { date: { gte: new Date(query.from) } }),
        ...(query.to && { date: { lte: new Date(query.to) } }),
      },
      include: {
        slots: {
          where: {
            deletedAt: null,
            isAvailable: true,
          },
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findBookingsByConsultantId(
    consultantId: string,
    query: ConsultantQueryDto,
  ): Promise<{ data: Consultant[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: BookingWhereInput = {
      consultantId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.from && { scheduledAt: { gte: new Date(query.from) } }),
      ...(query.to && { scheduledAt: { lte: new Date(query.to) } }),
    };

    const [data, total] = await this.prisma.$transaction([
  this.prisma.booking.findMany({
    where,
    skip,
    take: limit,
    orderBy: { scheduledAt: 'asc' },
    include: {
      slot: true,
    },
  }),
  this.prisma.booking.count({ where }),
]) as [unknown[], number];  

    return { data: data as unknown as Consultant[], total: total as unknown as number };
  }

  async getStats(consultantId: string): Promise<ConsultantStatsResponse> {
    const [
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      pendingBookings,
      totalSlots,
      availableSlots,
    ] = await this.prisma.$transaction([
      this.prisma.booking.count({
        where: { consultantId, deletedAt: null },
      }),
      this.prisma.booking.count({
        where: { consultantId, status: BOOKING_STATUS.CONFIRMED, deletedAt: null },
      }),
      this.prisma.booking.count({
        where: { consultantId, status: BOOKING_STATUS.CANCELLED, deletedAt: null },
      }),
      this.prisma.booking.count({
        where: { consultantId, status: BOOKING_STATUS.COMPLETED, deletedAt: null },
      }),
      this.prisma.booking.count({
        where: { consultantId, status: BOOKING_STATUS.PENDING, deletedAt: null },
      }),
      this.prisma.slot.count({
        where: { consultantId, deletedAt: null },
      }),
      this.prisma.slot.count({
        where: { consultantId, isAvailable: true, deletedAt: null },
      }),
    ]);

    const total = totalSlots as unknown as number;
    const available = availableSlots as unknown as number;

    return {
      consultantId,
      totalBookings: totalBookings as unknown as number,
      confirmedBookings: confirmedBookings as unknown as number,
      cancelledBookings: cancelledBookings as unknown as number,
      completedBookings: completedBookings as unknown as number,
      pendingBookings: pendingBookings as unknown as number,
      totalSlots: total,
      availableSlots: available,
      bookedSlots: total - available,
      bookingRate: total > 0 ? ((total - available) / total) * 100 : 0,
    };
  }

  async findActiveConsultants(): Promise<Consultant[]> {
    return this.prisma.consultant.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        showroom: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findByShowroomId(showroomId: string): Promise<Consultant[]> {
    return this.prisma.consultant.findMany({
      where: {
        showroomId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });
  }
}