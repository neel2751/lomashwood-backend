import { PrismaClient, Reminder, Prisma } from '@prisma/client';
import { CreateReminderDto, UpdateReminderDto, ReminderQueryDto } from './reminder.types';
import { REMINDER_STATUS } from './reminder.constants';

export class ReminderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: CreateReminderDto & { status: string },
  ): Promise<Reminder> {
    return this.prisma.reminder.create({
      data: {
        bookingId: data.bookingId,
        type: data.type,
        scheduledAt: new Date(data.scheduledAt),
        status: data.status,
        channel: data.channel,
        message: data.message,
      },
      include: {
        booking: true,
      },
    });
  }

  async findById(id: string): Promise<Reminder | null> {
    return this.prisma.reminder.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        booking: true,
      },
    });
  }

  async findByBookingId(bookingId: string): Promise<Reminder[]> {
    return this.prisma.reminder.findMany({
      where: {
        bookingId,
        deletedAt: null,
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        booking: true,
      },
    });
  }

  async findAll(query: ReminderQueryDto): Promise<{ data: Reminder[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ReminderWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
      ...(query.bookingId && { bookingId: query.bookingId }),
      ...(query.from && { scheduledAt: { gte: new Date(query.from) } }),
      ...(query.to && { scheduledAt: { lte: new Date(query.to) } }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.reminder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          booking: true,
        },
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return { data, total };
  }

  async findPending(): Promise<Reminder[]> {
    return this.prisma.reminder.findMany({
      where: {
        status: REMINDER_STATUS.PENDING,
        deletedAt: null,
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        booking: true,
      },
    });
  }

  async findDue(before: Date): Promise<Reminder[]> {
    return this.prisma.reminder.findMany({
      where: {
        status: REMINDER_STATUS.PENDING,
        scheduledAt: { lte: before },
        deletedAt: null,
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        booking: true,
      },
    });
  }

  async update(
    id: string,
    data: UpdateReminderDto & {
      status?: string;
      sentAt?: Date;
      failureReason?: string;
      scheduledAt?: Date;
    },
  ): Promise<Reminder> {
    return this.prisma.reminder.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
        ...(data.status && { status: data.status }),
        ...(data.channel && { channel: data.channel }),
        ...(data.message !== undefined && { message: data.message }),
        ...(data.sentAt && { sentAt: data.sentAt }),
        ...(data.failureReason !== undefined && { failureReason: data.failureReason }),
        updatedAt: new Date(),
      },
      include: {
        booking: true,
      },
    });
  }

  async softDelete(id: string): Promise<Reminder> {
    return this.prisma.reminder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByStatusAndDateRange(
    status: string,
    from: Date,
    to: Date,
  ): Promise<Reminder[]> {
    return this.prisma.reminder.findMany({
      where: {
        status,
        scheduledAt: {
          gte: from,
          lte: to,
        },
        deletedAt: null,
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        booking: true,
      },
    });
  }

  async countByStatus(bookingId: string, status: string): Promise<number> {
    return this.prisma.reminder.count({
      where: {
        bookingId,
        status,
        deletedAt: null,
      },
    });
  }

  async deleteByBookingId(bookingId: string): Promise<void> {
    await this.prisma.reminder.updateMany({
      where: {
        bookingId,
        status: REMINDER_STATUS.PENDING,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
  }

  async findFailedReminders(limit: number = 50): Promise<Reminder[]> {
    return this.prisma.reminder.findMany({
      where: {
        status: REMINDER_STATUS.FAILED,
        deletedAt: null,
      },
      orderBy: { updatedAt: 'asc' },
      take: limit,
      include: {
        booking: true,
      },
    });
  }
}