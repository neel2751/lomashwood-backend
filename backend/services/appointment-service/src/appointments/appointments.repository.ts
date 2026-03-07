import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';

@Injectable()
export class AppointmentsRepository {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  async create(appointmentData: Partial<Appointment>): Promise<Appointment> {
    const appointment = this.appointmentsRepository.create(appointmentData);
    return this.appointmentsRepository.save(appointment);
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      relations: ['user', 'consultant', 'showroom'],
      order: { dateTime: 'ASC' },
    });
  }

  async findById(id: string): Promise<Appointment | null> {
    return this.appointmentsRepository.findOne({
      where: { id },
      relations: ['user', 'consultant', 'showroom'],
    });
  }

  async findByUserId(userId: string): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: { userId },
      relations: ['consultant', 'showroom'],
      order: { dateTime: 'ASC' },
    });
  }

  async findByConsultantId(consultantId: string): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: { consultantId },
      relations: ['user', 'showroom'],
      order: { dateTime: 'ASC' },
    });
  }

  async findByShowroomId(showroomId: string): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: { showroomId },
      relations: ['user', 'consultant'],
      order: { dateTime: 'ASC' },
    });
  }

  async update(id: string, updateData: Partial<Appointment>): Promise<Appointment | null> {
    await this.appointmentsRepository.update(id, updateData);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.appointmentsRepository.delete(id);
  }

  async findWithPagination(
    page: number,
    limit: number,
    filters?: {
      status?: string;
      consultantId?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ appointments: Appointment[]; total: number }> {
    const skip = (page - 1) * limit;
    const query = this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.user', 'user')
      .leftJoinAndSelect('appointment.consultant', 'consultant')
      .leftJoinAndSelect('appointment.showroom', 'showroom');

    if (filters?.status) {
      query.andWhere('appointment.status = :status', { status: filters.status });
    }

    if (filters?.consultantId) {
      query.andWhere('appointment.consultantId = :consultantId', { consultantId: filters.consultantId });
    }

    if (filters?.userId) {
      query.andWhere('appointment.userId = :userId', { userId: filters.userId });
    }

    if (filters?.startDate) {
      query.andWhere('appointment.dateTime >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('appointment.dateTime <= :endDate', { endDate: filters.endDate });
    }

    const [appointments, total] = await query
      .orderBy('appointment.dateTime', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { appointments, total };
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    consultantId?: string
  ): Promise<Appointment[]> {
    const query = this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.user', 'user')
      .leftJoinAndSelect('appointment.consultant', 'consultant')
      .leftJoinAndSelect('appointment.showroom', 'showroom')
      .where('appointment.dateTime >= :startDate', { startDate })
      .andWhere('appointment.dateTime <= :endDate', { endDate });

    if (consultantId) {
      query.andWhere('appointment.consultantId = :consultantId', { consultantId });
    }

    return query
      .orderBy('appointment.dateTime', 'ASC')
      .getMany();
  }

  async findUpcomingAppointments(userId: string): Promise<Appointment[]> {
    const now = new Date();
    return this.appointmentsRepository.find({
      where: {
        userId,
        dateTime: { $gte: now },
        status: { $in: ['SCHEDULED', 'CONFIRMED'] },
      },
      relations: ['consultant', 'showroom'],
      order: { dateTime: 'ASC' },
    });
  }

  async findPastAppointments(userId: string): Promise<Appointment[]> {
    const now = new Date();
    return this.appointmentsRepository.find({
      where: {
        userId,
        dateTime: { $lt: now },
      },
      relations: ['consultant', 'showroom'],
      order: { dateTime: 'DESC' },
    });
  }

  async getAppointmentStats(
    consultantId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    averageDuration: number;
  }> {
    const query = this.appointmentsRepository.createQueryBuilder('appointment');

    if (consultantId) {
      query.andWhere('appointment.consultantId = :consultantId', { consultantId });
    }

    if (startDate) {
      query.andWhere('appointment.dateTime >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('appointment.dateTime <= :endDate', { endDate });
    }

    const appointments = await query.getMany();

    const total = appointments.length;
    const completed = appointments.filter(apt => apt.status === 'COMPLETED').length;
    const cancelled = appointments.filter(apt => apt.status === 'CANCELLED').length;
    const noShow = appointments.filter(apt => apt.status === 'NO_SHOW').length;

    const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED' && apt.duration);
    const averageDuration = completedAppointments.length > 0
      ? completedAppointments.reduce((sum, apt) => sum + apt.duration, 0) / completedAppointments.length
      : 0;

    return {
      total,
      completed,
      cancelled,
      noShow,
      averageDuration,
    };
  }
}
