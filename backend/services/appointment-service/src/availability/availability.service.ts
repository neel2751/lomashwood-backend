import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './entities/availability.entity';
import { TimeSlot } from './entities/time-slot.entity';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { CheckSlotsDto } from './dto/check-slots.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
    @InjectRepository(TimeSlot)
    private timeSlotRepository: Repository<TimeSlot>,
  ) {}

  async findAll(params: {
    consultantId?: string;
    startDate?: Date;
    endDate?: Date;
    showroomId?: string;
  }): Promise<Availability[]> {
    const { consultantId, startDate, endDate, showroomId } = params;
    
    const query = this.availabilityRepository.createQueryBuilder('availability')
      .leftJoinAndSelect('availability.consultant', 'consultant')
      .leftJoinAndSelect('availability.showroom', 'showroom')
      .leftJoinAndSelect('availability.timeSlots', 'timeSlots');

    if (consultantId) {
      query.andWhere('availability.consultantId = :consultantId', { consultantId });
    }

    if (showroomId) {
      query.andWhere('availability.showroomId = :showroomId', { showroomId });
    }

    if (startDate) {
      query.andWhere('availability.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('availability.date <= :endDate', { endDate });
    }

    return query
      .orderBy('availability.date', 'ASC')
      .addOrderBy('availability.startTime', 'ASC')
      .getMany();
  }

  async findById(id: string): Promise<Availability | null> {
    return this.availabilityRepository.findOne({
      where: { id },
      relations: ['consultant', 'showroom', 'timeSlots'],
    });
  }

  async setAvailability(setAvailabilityDto: SetAvailabilityDto): Promise<Availability[]> {
    const { consultantId, showroomId, availability } = setAvailabilityDto;
    
    const availabilityRecords = availability.map(avail => ({
      consultantId,
      showroomId,
      date: avail.date,
      startTime: avail.startTime,
      endTime: avail.endTime,
      isAvailable: avail.isAvailable,
      recurring: avail.recurring,
      recurringPattern: avail.recurringPattern,
    }));

    const savedAvailability = await this.availabilityRepository.save(availabilityRecords);
    
    // Create time slots for each availability record
    for (const avail of savedAvailability) {
      if (avail.isAvailable) {
        const slots = this.generateTimeSlots(avail);
        await this.timeSlotRepository.save(slots);
      }
    }

    return savedAvailability;
  }

  async update(id: string, updateData: Partial<Availability>): Promise<Availability | null> {
    await this.availabilityRepository.update(id, updateData);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    // Remove associated time slots first
    const availability = await this.findById(id);
    if (availability?.timeSlots) {
      await this.timeSlotRepository.remove(availability.timeSlots);
    }
    
    await this.availabilityRepository.delete(id);
  }

  async findByConsultant(
    consultantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Availability[]> {
    const { startDate, endDate } = filters;
    
    const query = this.availabilityRepository.createQueryBuilder('availability')
      .leftJoinAndSelect('availability.consultant', 'consultant')
      .leftJoinAndSelect('availability.showroom', 'showroom')
      .leftJoinAndSelect('availability.timeSlots', 'timeSlots')
      .where('availability.consultantId = :consultantId', { consultantId });

    if (startDate) {
      query.andWhere('availability.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('availability.date <= :endDate', { endDate });
    }

    return query
      .orderBy('availability.date', 'ASC')
      .addOrderBy('availability.startTime', 'ASC')
      .getMany();
  }

  async findByShowroom(
    showroomId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Availability[]> {
    const { startDate, endDate } = filters;
    
    const query = this.availabilityRepository.createQueryBuilder('availability')
      .leftJoinAndSelect('availability.consultant', 'consultant')
      .leftJoinAndSelect('availability.showroom', 'showroom')
      .leftJoinAndSelect('availability.timeSlots', 'timeSlots')
      .where('availability.showroomId = :showroomId', { showroomId });

    if (startDate) {
      query.andWhere('availability.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('availability.date <= :endDate', { endDate });
    }

    return query
      .orderBy('availability.date', 'ASC')
      .addOrderBy('availability.startTime', 'ASC')
      .getMany();
  }

  async getAvailableTimeSlots(checkSlotsDto: CheckSlotsDto): Promise<TimeSlot[]> {
    const { consultantId, date, duration } = checkSlotsDto;
    
    const availability = await this.availabilityRepository.find({
      where: {
        consultantId,
        date,
        isAvailable: true,
      },
      relations: ['timeSlots'],
      order: { startTime: 'ASC' },
    });

    const allSlots: TimeSlot[] = [];
    for (const avail of availability) {
      if (avail.timeSlots) {
        allSlots.push(...avail.timeSlots);
      } else {
        allSlots.push(...this.generateTimeSlots(avail));
      }
    }

    // Filter slots that can accommodate the requested duration
    return allSlots.filter(slot => {
      const slotDuration = (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60);
      return slotDuration >= duration;
    });
  }

  async bulkSetAvailability(consultantId: string, availabilityData: any[]): Promise<Availability[]> {
    // Remove existing availability for the date range
    const dates = availabilityData.map(avail => avail.date);
    await this.availabilityRepository.delete({
      consultantId,
      date: { $in: dates },
    });

    // Create new availability records
    const availabilityRecords = availabilityData.map(avail => ({
      consultantId,
      date: avail.date,
      startTime: avail.startTime,
      endTime: avail.endTime,
      isAvailable: avail.isAvailable,
      recurring: avail.recurring,
      recurringPattern: avail.recurringPattern,
    }));

    return this.availabilityRepository.save(availabilityRecords);
  }

  private generateTimeSlots(availability: Availability): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const slotDuration = 30; // 30 minutes per slot
    const startTime = new Date(availability.date);
    startTime.setHours(availability.startTime.getHours(), availability.startTime.getMinutes(), 0, 0);
    
    const endTime = new Date(availability.date);
    endTime.setHours(availability.endTime.getHours(), availability.endTime.getMinutes(), 0, 0);

    while (startTime < endTime) {
      const slotEndTime = new Date(startTime.getTime() + slotDuration * 60 * 1000);
      
      if (slotEndTime <= endTime) {
        slots.push({
          startTime: new Date(startTime),
          endTime: slotEndTime,
          duration: slotDuration,
          isBooked: false,
        });
      }
      
      startTime.setTime(startTime.getTime() + slotDuration * 60 * 1000);
    }

    return slots;
  }
}
