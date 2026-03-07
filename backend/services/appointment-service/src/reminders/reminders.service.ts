import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reminder } from './entities/reminder.entity';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder)
    private remindersRepository: Repository<Reminder>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    type?: string;
    status?: string;
    userId?: string;
    user?: any;
  }): Promise<{ reminders: Reminder[]; total: number; page: number; limit: number }> {
    const { page, limit, type, status, userId, user } = params;
    const skip = (page - 1) * limit;

    const query = this.remindersRepository.createQueryBuilder('reminder')
      .leftJoinAndSelect('reminder.user', 'user')
      .leftJoinAndSelect('reminder.appointment', 'appointment');

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('reminder.userId = :userId', { userId: user?.id });
    } else if (userId) {
      query.andWhere('reminder.userId = :userId', { userId });
    }

    if (type) {
      query.andWhere('reminder.type = :type', { type });
    }

    if (status) {
      query.andWhere('reminder.status = :status', { status });
    }

    const [reminders, total] = await query
      .orderBy('reminder.scheduledAt', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      reminders,
      total,
      page,
      limit,
    };
  }

  async findById(id: string, user?: any): Promise<Reminder | null> {
    const query = this.remindersRepository.createQueryBuilder('reminder')
      .leftJoinAndSelect('reminder.user', 'user')
      .leftJoinAndSelect('reminder.appointment', 'appointment')
      .where('reminder.id = :id', { id });

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('reminder.userId = :userId', { userId: user?.id });
    }

    return query.getOne();
  }

  async create(createReminderDto: CreateReminderDto, user?: any): Promise<Reminder> {
    const reminder = this.remindersRepository.create({
      ...createReminderDto,
      userId: user?.id || createReminderDto.userId,
      status: 'PENDING',
    });

    return this.remindersRepository.save(reminder);
  }

  async update(id: string, updateData: any, user?: any): Promise<Reminder | null> {
    const reminder = await this.findById(id, user);
    if (!reminder) {
      return null;
    }

    await this.remindersRepository.update(id, {
      ...updateData,
      updatedAt: new Date(),
    });

    return this.findById(id, user);
  }

  async send(id: string, user?: any): Promise<Reminder | null> {
    const reminder = await this.findById(id, user);
    if (!reminder) {
      return null;
    }

    if (reminder.status !== 'PENDING') {
      return null;
    }

    // Here you would integrate with an email/SMS service
    // For now, just update the status
    await this.remindersRepository.update(id, {
      status: 'SENT',
      sentAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findById(id, user);
  }

  async complete(id: string, user?: any): Promise<Reminder | null> {
    const reminder = await this.findById(id, user);
    if (!reminder) {
      return null;
    }

    await this.remindersRepository.update(id, {
      status: 'COMPLETED',
      completedAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findById(id, user);
  }

  async cancel(id: string, user?: any): Promise<Reminder | null> {
    const reminder = await this.findById(id, user);
    if (!reminder) {
      return null;
    }

    await this.remindersRepository.update(id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findById(id, user);
  }

  async findByAppointment(appointmentId: string, user?: any): Promise<Reminder[]> {
    const query = this.remindersRepository.createQueryBuilder('reminder')
      .leftJoinAndSelect('reminder.user', 'user')
      .leftJoinAndSelect('reminder.appointment', 'appointment')
      .where('reminder.appointmentId = :appointmentId', { appointmentId });

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('reminder.userId = :userId', { userId: user?.id });
    }

    return query
      .orderBy('reminder.scheduledAt', 'ASC')
      .getMany();
  }

  async findByUser(
    userId: string,
    pagination: { page: number; limit: number; type?: string; status?: string },
    user?: any
  ): Promise<{ reminders: Reminder[]; total: number; page: number; limit: number }> {
    const { page, limit, type, status } = pagination;
    const skip = (page - 1) * limit;

    // Apply user access control
    const targetUserId = (user?.role !== 'ADMIN' && user?.role !== 'STAFF') ? user?.id : userId;

    const query = this.remindersRepository.createQueryBuilder('reminder')
      .leftJoinAndSelect('reminder.appointment', 'appointment')
      .where('reminder.userId = :userId', { userId: targetUserId });

    if (type) {
      query.andWhere('reminder.type = :type', { type });
    }

    if (status) {
      query.andWhere('reminder.status = :status', { status });
    }

    const [reminders, total] = await query
      .orderBy('reminder.scheduledAt', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      reminders,
      total,
      page,
      limit,
    };
  }

  async getUpcoming(hours: number = 24, userId?: string, user?: any): Promise<Reminder[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const query = this.remindersRepository.createQueryBuilder('reminder')
      .leftJoinAndSelect('reminder.user', 'user')
      .leftJoinAndSelect('reminder.appointment', 'appointment')
      .where('reminder.scheduledAt >= :now', { now })
      .andWhere('reminder.scheduledAt <= :futureTime', { futureTime })
      .andWhere('reminder.status IN (:...statuses)', { statuses: ['PENDING', 'SENT'] });

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('reminder.userId = :userId', { userId: user?.id });
    } else if (userId) {
      query.andWhere('reminder.userId = :userId', { userId });
    }

    return query
      .orderBy('reminder.scheduledAt', 'ASC')
      .getMany();
  }

  async getStats(
    startDate?: Date,
    endDate?: Date,
    userId?: string
  ): Promise<{
    totalReminders: number;
    sentReminders: number;
    completedReminders: number;
    cancelledReminders: number;
    typeBreakdown: Record<string, number>;
  }> {
    const query = this.remindersRepository.createQueryBuilder('reminder');

    if (startDate) {
      query.andWhere('reminder.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('reminder.createdAt <= :endDate', { endDate });
    }

    if (userId) {
      query.andWhere('reminder.userId = :userId', { userId });
    }

    const reminders = await query.getMany();

    const totalReminders = reminders.length;
    const sentReminders = reminders.filter(r => r.status === 'SENT').length;
    const completedReminders = reminders.filter(r => r.status === 'COMPLETED').length;
    const cancelledReminders = reminders.filter(r => r.status === 'CANCELLED').length;

    const typeBreakdown = reminders.reduce((acc, reminder) => {
      acc[reminder.type] = (acc[reminder.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalReminders,
      sentReminders,
      completedReminders,
      cancelledReminders,
      typeBreakdown,
    };
  }

  async processScheduledReminders(): Promise<void> {
    const now = new Date();
    const pendingReminders = await this.remindersRepository.find({
      where: {
        status: 'PENDING',
        scheduledAt: { $lte: now },
      },
      order: { scheduledAt: 'ASC' },
    });

    for (const reminder of pendingReminders) {
      await this.send(reminder.id);
    }
  }
}
