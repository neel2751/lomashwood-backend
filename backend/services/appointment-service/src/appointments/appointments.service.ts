import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { FilterAppointmentDto } from './dto/filter-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    consultantId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    user?: any;
  }): Promise<{ appointments: any[]; total: number; page: number; limit: number }> {
    const { page, limit, status, consultantId, userId, startDate, endDate, user } = params;
    const skip = (page - 1) * limit;

    const query = this.appointmentRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.user', 'user')
      .leftJoinAndSelect('appointment.consultant', 'consultant')
      .leftJoinAndSelect('appointment.showroom', 'showroom');

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('appointment.userId = :userId', { userId: user?.id });
    } else if (userId) {
      query.andWhere('appointment.userId = :userId', { userId });
    }

    if (status) {
      query.andWhere('appointment.status = :status', { status });
    }

    if (consultantId) {
      query.andWhere('appointment.consultantId = :consultantId', { consultantId });
    }

    if (startDate) {
      query.andWhere('appointment.dateTime >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('appointment.dateTime <= :endDate', { endDate });
    }

    const [appointments, total] = await query
      .orderBy('appointment.dateTime', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      appointments,
      total,
      page,
      limit,
    };
  }

  async findById(id: string, user?: any): Promise<Appointment | null> {
    const query = this.appointmentRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.user', 'user')
      .leftJoinAndSelect('appointment.consultant', 'consultant')
      .leftJoinAndSelect('appointment.showroom', 'showroom')
      .where('appointment.id = :id', { id });

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('appointment.userId = :userId', { userId: user?.id });
    }

    return query.getOne();
  }

  async create(createAppointmentDto: CreateAppointmentDto, user?: any): Promise<Appointment> {
    const appointment = this.appointmentRepository.create({
      ...createAppointmentDto,
      userId: user?.id || createAppointmentDto.userId,
      status: 'SCHEDULED',
      confirmationCode: this.generateConfirmationCode(),
    });

    return this.appointmentRepository.save(appointment);
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto, user?: any): Promise<Appointment | null> {
    const appointment = await this.findById(id, user);
    if (!appointment) {
      return null;
    }

    await this.appointmentRepository.update(id, {
      ...updateAppointmentDto,
      updatedAt: new Date(),
    });

    return this.findById(id, user);
  }

  async cancel(id: string, reason?: string, user?: any): Promise<Appointment | null> {
    const appointment = await this.findById(id, user);
    if (!appointment) {
      return null;
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      return null;
    }

    await this.appointmentRepository.update(id, {
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findById(id, user);
  }

  async reschedule(id: string, newDateTime: Date, reason?: string, user?: any): Promise<Appointment | null> {
    const appointment = await this.findById(id, user);
    if (!appointment) {
      return null;
    }

    // Check if appointment can be rescheduled
    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      return null;
    }

    await this.appointmentRepository.update(id, {
      dateTime: newDateTime,
      rescheduleReason: reason,
      rescheduledAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findById(id, user);
  }

  async confirm(id: string, user?: any): Promise<Appointment | null> {
    const appointment = await this.findById(id, user);
    if (!appointment) {
      return null;
    }

    if (appointment.status !== 'SCHEDULED') {
      return null;
    }

    await this.appointmentRepository.update(id, {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findById(id, user);
  }

  async findByUser(
    userId: string,
    pagination: { page: number; limit: number; status?: string },
    user?: any
  ): Promise<{ appointments: Appointment[]; total: number; page: number; limit: number }> {
    const { page, limit, status } = pagination;
    const skip = (page - 1) * limit;

    // Apply user access control
    const targetUserId = (user?.role !== 'ADMIN' && user?.role !== 'STAFF') ? user?.id : userId;

    const query = this.appointmentRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.consultant', 'consultant')
      .leftJoinAndSelect('appointment.showroom', 'showroom')
      .where('appointment.userId = :userId', { userId: targetUserId });

    if (status) {
      query.andWhere('appointment.status = :status', { status });
    }

    const [appointments, total] = await query
      .orderBy('appointment.dateTime', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      appointments,
      total,
      page,
      limit,
    };
  }

  async findByConsultant(
    consultantId: string,
    filters: {
      page: number;
      limit: number;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ appointments: Appointment[]; total: number; page: number; limit: number }> {
    const { page, limit, status, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const query = this.appointmentRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.user', 'user')
      .leftJoinAndSelect('appointment.consultant', 'consultant')
      .leftJoinAndSelect('appointment.showroom', 'showroom')
      .where('appointment.consultantId = :consultantId', { consultantId });

    if (status) {
      query.andWhere('appointment.status = :status', { status });
    }

    if (startDate) {
      query.andWhere('appointment.dateTime >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('appointment.dateTime <= :endDate', { endDate });
    }

    const [appointments, total] = await query
      .orderBy('appointment.dateTime', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      appointments,
      total,
      page,
      limit,
    };
  }

  async getHistory(id: string, user?: any): Promise<any[]> {
    const appointment = await this.findById(id, user);
    if (!appointment) {
      return [];
    }

    return [
      {
        action: 'CREATED',
        timestamp: appointment.createdAt,
        description: 'Appointment created',
        user: appointment.userId,
      },
      ...(appointment.confirmedAt ? [{
        action: 'CONFIRMED',
        timestamp: appointment.confirmedAt,
        description: 'Appointment confirmed',
        user: appointment.userId,
      }] : []),
      ...(appointment.rescheduledAt ? [{
        action: 'RESCHEDULED',
        timestamp: appointment.rescheduledAt,
        description: `Appointment rescheduled: ${appointment.rescheduleReason}`,
        user: appointment.userId,
      }] : []),
      ...(appointment.cancelledAt ? [{
        action: 'CANCELLED',
        timestamp: appointment.cancelledAt,
        description: `Appointment cancelled: ${appointment.cancellationReason}`,
        user: appointment.userId,
      }] : []),
      ...(appointment.completedAt ? [{
        action: 'COMPLETED',
        timestamp: appointment.completedAt,
        description: 'Appointment completed',
        user: appointment.userId,
      }] : []),
    ];
  }

  async getStats(
    startDate?: Date,
    endDate?: Date,
    consultantId?: string
  ): Promise<{
    totalAppointments: number;
    statusBreakdown: Record<string, number>;
    averageDuration: number;
    completionRate: number;
  }> {
    const query = this.appointmentRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.consultant', 'consultant');

    if (startDate) {
      query.andWhere('appointment.dateTime >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('appointment.dateTime <= :endDate', { endDate });
    }

    if (consultantId) {
      query.andWhere('appointment.consultantId = :consultantId', { consultantId });
    }

    const appointments = await query.getMany();

    const totalAppointments = appointments.length;
    const statusBreakdown = appointments.reduce((acc, appointment) => {
      acc[appointment.status] = (acc[appointment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED');
    const averageDuration = completedAppointments.length > 0 
      ? completedAppointments.reduce((sum, apt) => sum + (apt.duration || 0), 0) / completedAppointments.length
      : 0;

    const completionRate = totalAppointments > 0 
      ? (completedAppointments.length / totalAppointments) * 100 
      : 0;

    return {
      totalAppointments,
      statusBreakdown,
      averageDuration,
      completionRate,
    };
  }

  private generateConfirmationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async findByConfirmationCode(confirmationCode: string): Promise<Appointment | null> {
    return this.appointmentRepository.findOne({
      where: { confirmationCode },
      relations: ['user', 'consultant'],
    });
  }
}
