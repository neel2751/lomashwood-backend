import { CreateBookingDto, UpdateBookingDto, BookingQueryDto } from './booking.types';
import { BOOKING_STATUS } from './booking.constants';



interface Booking {
  id: string;
  customerId: string;
  slotId: string;
  consultantId: string | null;
  appointmentType: string;
  includesKitchen: boolean;
  includesBedroom: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  postcode: string;
  address: string;
  scheduledAt: Date;
  status: string;
  notes: string | null;
  reminderSentAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface BookingWhereInput {
  id?: string;
  customerId?: string;
  slotId?: string;
  consultantId?: string;
  status?: string | { not?: string; in?: string[] };
  appointmentType?: string;
  scheduledAt?: { gte?: Date; lte?: Date };
  reminderSentAt?: null;
  deletedAt?: null;
  OR?: Array<{
    customerName?: { contains: string; mode: string };
    customerEmail?: { contains: string; mode: string };
    postcode?: { contains: string; mode: string };
  }>;
}

interface PrismaClient {
  booking: {
    create: (args: { data: Record<string, unknown>; include?: Record<string, boolean> }) => Promise<Booking>;
    findFirst: (args: { where: Record<string, unknown>; include?: Record<string, boolean> }) => Promise<Booking | null>;
    findMany: (args: { where: Record<string, unknown>; skip?: number; take?: number; orderBy?: Record<string, string>; include?: Record<string, boolean> }) => Promise<Booking[]>;
    update: (args: { where: { id: string }; data: Record<string, unknown>; include?: Record<string, boolean> }) => Promise<Booking>;
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
  };
  $transaction: <T>(queries: Promise<T>[]) => Promise<T[]>;
}



export class BookingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateBookingDto & { customerId: string; status: string }): Promise<Booking> {
    return this.prisma.booking.create({
      data: {
        customerId: data.customerId,
        slotId: data.slotId,
        consultantId: data.consultantId,
        appointmentType: data.appointmentType,
        includesKitchen: data.includesKitchen,
        includesBedroom: data.includesBedroom,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        postcode: data.postcode,
        address: data.address,
        notes: data.notes,
        status: data.status,
        scheduledAt: data.scheduledAt,
      },
      include: {
        slot: true,
        consultant: true,
      },
    });
  }

  async findById(id: string): Promise<Booking | null> {
    return this.prisma.booking.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        slot: true,
        consultant: true,
      },
    });
  }

  async findBySlotId(slotId: string): Promise<Booking | null> {
    return this.prisma.booking.findFirst({
      where: {
        slotId,
        status: {
          not: BOOKING_STATUS.CANCELLED,
        },
        deletedAt: null,
      },
    });
  }

  async findByCustomerId(
    customerId: string,
    query: BookingQueryDto,
  ): Promise<{ data: Booking[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: BookingWhereInput = {
      customerId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.appointmentType && { appointmentType: query.appointmentType }),
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
          consultant: true,
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data, total: total as unknown as number };
  }

  async findAll(query: BookingQueryDto): Promise<{ data: Booking[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: BookingWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.appointmentType && { appointmentType: query.appointmentType }),
      ...(query.consultantId && { consultantId: query.consultantId }),
      ...(query.from && { scheduledAt: { gte: new Date(query.from) } }),
      ...(query.to && { scheduledAt: { lte: new Date(query.to) } }),
      ...(query.search && {
        OR: [
          { customerName: { contains: query.search, mode: 'insensitive' } },
          { customerEmail: { contains: query.search, mode: 'insensitive' } },
          { postcode: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          slot: true,
          consultant: true,
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data, total: total as unknown as number };
  }

  async update(
    id: string,
    data: UpdateBookingDto & { status?: string; slotId?: string; scheduledAt?: Date },
  ): Promise<Booking> {
    return this.prisma.booking.update({
      where: { id },
      data: {
        ...(data.slotId && { slotId: data.slotId }),
        ...(data.consultantId && { consultantId: data.consultantId }),
        ...(data.appointmentType && { appointmentType: data.appointmentType }),
        ...(data.includesKitchen !== undefined && { includesKitchen: data.includesKitchen }),
        ...(data.includesBedroom !== undefined && { includesBedroom: data.includesBedroom }),
        ...(data.customerName && { customerName: data.customerName }),
        ...(data.customerEmail && { customerEmail: data.customerEmail }),
        ...(data.customerPhone && { customerPhone: data.customerPhone }),
        ...(data.postcode && { postcode: data.postcode }),
        ...(data.address && { address: data.address }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status && { status: data.status }),
        ...(data.scheduledAt && { scheduledAt: data.scheduledAt }),
        updatedAt: new Date(),
      },
      include: {
        slot: true,
        consultant: true,
      },
    });
  }

  async softDelete(id: string): Promise<Booking> {
    return this.prisma.booking.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async findUpcomingByConsultant(consultantId: string, from: Date): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: {
        consultantId,
        scheduledAt: { gte: from },
        status: {
          in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING],
        },
        deletedAt: null,
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        slot: true,
      },
    });
  }

  async findPendingReminders(before: Date): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: {
        scheduledAt: { lte: before },
        status: BOOKING_STATUS.CONFIRMED,
        reminderSentAt: null,
        deletedAt: null,
      },
      include: {
        slot: true,
        consultant: true,
      },
    });
  }

  async markReminderSent(id: string): Promise<void> {
    await this.prisma.booking.update({
      where: { id },
      data: { reminderSentAt: new Date() },
    });
  }
}