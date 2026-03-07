import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, PaginatedResponse } from '../../../../../packages/api-client/src/types/api.types';

interface Appointment {
  id: string;
  customerId: string;
  consultantId?: string;
  showroomId?: string;
  type: 'HOME' | 'VIRTUAL' | 'SHOWROOM';
  serviceType: 'KITCHEN' | 'BEDROOM' | 'BOTH';
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  customerDetails: any;
  scheduledDate: Date;
  scheduledTime: string;
  duration: number;
  notes?: string;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Consultant {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  specializations: string[];
  bio?: string;
  avatar?: string;
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Showroom {
  id: string;
  name: string;
  slug: string;
  address: any;
  image?: string;
  email?: string;
  phone?: string;
  openingHours: any;
  mapUrl?: string;
  coordinates?: any;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TimeSlot {
  id: string;
  time: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Availability {
  id: string;
  consultantId: string;
  date: Date;
  timeSlots: any;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GetAppointmentsParams {
  page: number;
  limit: number;
  filters: {
    customerId?: string;
    consultantId?: string;
    showroomId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface GetAvailabilityParams {
  consultantId?: string;
  showroomId?: string;
  startDate: Date;
  endDate: Date;
}

export class AppointmentService {
  private appointments: Appointment[] = [];
  private consultants: Consultant[] = [];
  private showrooms: Showroom[] = [];
  private timeSlots: TimeSlot[] = [];
  private availability: Availability[] = [];

  constructor() {
    this.initializeMockData();
  }

  async getAppointments(params: GetAppointmentsParams): Promise<PaginatedResponse<Appointment[]>> {
    try {
      let filteredAppointments = [...this.appointments];

      // Apply filters
      if (params.filters.customerId) {
        filteredAppointments = filteredAppointments.filter(a => a.customerId === params.filters.customerId);
      }

      if (params.filters.consultantId) {
        filteredAppointments = filteredAppointments.filter(a => a.consultantId === params.filters.consultantId);
      }

      if (params.filters.showroomId) {
        filteredAppointments = filteredAppointments.filter(a => a.showroomId === params.filters.showroomId);
      }

      if (params.filters.status) {
        filteredAppointments = filteredAppointments.filter(a => a.status === params.filters.status);
      }

      if (params.filters.startDate) {
        filteredAppointments = filteredAppointments.filter(a => 
          new Date(a.scheduledDate) >= params.filters.startDate!
        );
      }

      if (params.filters.endDate) {
        filteredAppointments = filteredAppointments.filter(a => 
          new Date(a.scheduledDate) <= params.filters.endDate!
        );
      }

      // Sort appointments
      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';
      
      filteredAppointments.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Appointment];
        let bValue: any = b[sortBy as keyof Appointment];
        
        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Pagination
      const total = filteredAppointments.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedAppointments,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get appointments error:', error);
      return {
        success: false,
        message: 'Failed to fetch appointments',
        error: 'GET_APPOINTMENTS_FAILED',
      };
    }
  }

  async getAppointment(id: string): Promise<ApiResponse<Appointment>> {
    try {
      const appointment = this.appointments.find(a => a.id === id);
      
      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found',
          error: 'APPOINTMENT_NOT_FOUND',
        };
      }

      return {
        success: true,
        data: appointment,
      };
    } catch (error) {
      console.error('Get appointment error:', error);
      return {
        success: false,
        message: 'Failed to fetch appointment',
        error: 'GET_APPOINTMENT_FAILED',
      };
    }
  }

  async createAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'reminderSent'>): Promise<ApiResponse<Appointment>> {
    try {
      // Check if time slot is available
      const isAvailable = await this.checkTimeSlotAvailability(
        appointmentData.consultantId,
        appointmentData.scheduledDate,
        appointmentData.scheduledTime,
        appointmentData.duration
      );

      if (!isAvailable) {
        return {
          success: false,
          message: 'Time slot is not available',
          error: 'TIME_SLOT_NOT_AVAILABLE',
        };
      }

      const appointment: Appointment = {
        id: uuidv4(),
        ...appointmentData,
        reminderSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.appointments.push(appointment);

      return {
        success: true,
        data: appointment,
      };
    } catch (error) {
      console.error('Create appointment error:', error);
      return {
        success: false,
        message: 'Failed to create appointment',
        error: 'CREATE_APPOINTMENT_FAILED',
      };
    }
  }

  async updateAppointment(id: string, appointmentData: Partial<Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Appointment>> {
    try {
      const appointmentIndex = this.appointments.findIndex(a => a.id === id);
      
      if (appointmentIndex === -1) {
        return {
          success: false,
          message: 'Appointment not found',
          error: 'APPOINTMENT_NOT_FOUND',
        };
      }

      const updatedAppointment: Appointment = {
        ...this.appointments[appointmentIndex],
        ...appointmentData,
        updatedAt: new Date(),
      };

      this.appointments[appointmentIndex] = updatedAppointment;

      return {
        success: true,
        data: updatedAppointment,
      };
    } catch (error) {
      console.error('Update appointment error:', error);
      return {
        success: false,
        message: 'Failed to update appointment',
        error: 'UPDATE_APPOINTMENT_FAILED',
      };
    }
  }

  async cancelAppointment(id: string, reason: string): Promise<ApiResponse<Appointment>> {
    try {
      const appointmentIndex = this.appointments.findIndex(a => a.id === id);
      
      if (appointmentIndex === -1) {
        return {
          success: false,
          message: 'Appointment not found',
          error: 'APPOINTMENT_NOT_FOUND',
        };
      }

      // Only allow cancellation of appointments that are not already completed/cancelled
      const appointment = this.appointments[appointmentIndex];
      if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
        return {
          success: false,
          message: 'Appointment cannot be cancelled at this stage',
          error: 'APPOINTMENT_CANNOT_BE_CANCELLED',
        };
      }

      const updatedAppointment: Appointment = {
        ...appointment,
        status: 'CANCELLED',
        notes: reason,
        updatedAt: new Date(),
      };

      this.appointments[appointmentIndex] = updatedAppointment;

      return {
        success: true,
        data: updatedAppointment,
      };
    } catch (error) {
      console.error('Cancel appointment error:', error);
      return {
        success: false,
        message: 'Failed to cancel appointment',
        error: 'CANCEL_APPOINTMENT_FAILED',
      };
    }
  }

  async getAvailability(params: GetAvailabilityParams): Promise<ApiResponse<Availability[]>> {
    try {
      let filteredAvailability = [...this.availability];

      if (params.consultantId) {
        filteredAvailability = filteredAvailability.filter(a => a.consultantId === params.consultantId);
      }

      // Filter by date range
      filteredAvailability = filteredAvailability.filter(a => 
        a.date >= params.startDate && a.date <= params.endDate
      );

      return {
        success: true,
        data: filteredAvailability,
      };
    } catch (error) {
      console.error('Get availability error:', error);
      return {
        success: false,
        message: 'Failed to fetch availability',
        error: 'GET_AVAILABILITY_FAILED',
      };
    }
  }

  async getConsultants(active: boolean = true): Promise<ApiResponse<Consultant[]>> {
    try {
      const filteredConsultants = this.consultants.filter(c => c.isActive === active);
      
      return {
        success: true,
        data: filteredConsultants,
      };
    } catch (error) {
      console.error('Get consultants error:', error);
      return {
        success: false,
        message: 'Failed to fetch consultants',
        error: 'GET_CONSULTANTS_FAILED',
      };
    }
  }

  async getShowrooms(active: boolean = true): Promise<ApiResponse<Showroom[]>> {
    try {
      const filteredShowrooms = this.showrooms.filter(s => s.isActive === active);
      
      return {
        success: true,
        data: filteredShowrooms,
      };
    } catch (error) {
      console.error('Get showrooms error:', error);
      return {
        success: false,
        message: 'Failed to fetch showrooms',
        error: 'GET_SHOWROOMS_FAILED',
      };
    }
  }

  async getTimeSlots(date: Date): Promise<ApiResponse<TimeSlot[]>> {
    try {
      // Get time slots for the specific date
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      
      let availableSlots = this.timeSlots.filter(slot => slot.isActive);
      
      // Adjust time slots based on weekend/weekday
      if (isWeekend) {
        // Weekend hours (e.g., 10 AM - 6 PM)
        availableSlots = availableSlots.filter(slot => {
          const hour = parseInt(slot.time.split(':')[0]);
          return hour >= 10 && hour < 18;
        });
      } else {
        // Weekday hours (e.g., 9 AM - 7 PM)
        availableSlots = availableSlots.filter(slot => {
          const hour = parseInt(slot.time.split(':')[0]);
          return hour >= 9 && hour < 19;
        });
      }

      return {
        success: true,
        data: availableSlots,
      };
    } catch (error) {
      console.error('Get time slots error:', error);
      return {
        success: false,
        message: 'Failed to fetch time slots',
        error: 'GET_TIME_SLOTS_FAILED',
      };
    }
  }

  async rescheduleAppointment(id: string, newDate: string, newTime: string, reason: string): Promise<ApiResponse<Appointment>> {
    try {
      const appointmentIndex = this.appointments.findIndex(a => a.id === id);
      
      if (appointmentIndex === -1) {
        return {
          success: false,
          message: 'Appointment not found',
          error: 'APPOINTMENT_NOT_FOUND',
        };
      }

      const appointment = this.appointments[appointmentIndex];
      
      // Check if new time slot is available
      const isAvailable = await this.checkTimeSlotAvailability(
        appointment.consultantId,
        new Date(newDate),
        newTime,
        appointment.duration
      );

      if (!isAvailable) {
        return {
          success: false,
          message: 'New time slot is not available',
          error: 'TIME_SLOT_NOT_AVAILABLE',
        };
      }

      const updatedAppointment: Appointment = {
        ...appointment,
        scheduledDate: new Date(newDate),
        scheduledTime: newTime,
        notes: reason,
        updatedAt: new Date(),
      };

      this.appointments[appointmentIndex] = updatedAppointment;

      return {
        success: true,
        data: updatedAppointment,
      };
    } catch (error) {
      console.error('Reschedule appointment error:', error);
      return {
        success: false,
        message: 'Failed to reschedule appointment',
        error: 'RESCHEDULE_APPOINTMENT_FAILED',
      };
    }
  }

  private async checkTimeSlotAvailability(
    consultantId: string | undefined,
    date: Date,
    time: string,
    duration: number
  ): Promise<boolean> {
    try {
      if (!consultantId) {
        return true; // If no consultant specified, assume available
      }

      // Check if there are any existing appointments at the same time
      const conflictingAppointments = this.appointments.filter(a => 
        a.consultantId === consultantId &&
        a.scheduledDate.toDateString() === date.toDateString() &&
        a.status !== 'CANCELLED' &&
        this.isTimeConflict(a.scheduledTime, time, a.duration, duration)
      );

      return conflictingAppointments.length === 0;
    } catch (error) {
      console.error('Check time slot availability error:', error);
      return false;
    }
  }

  private isTimeConflict(
    existingTime: string,
    newTime: string,
    existingDuration: number,
    newDuration: number
  ): boolean {
    const [existingHour, existingMin] = existingTime.split(':').map(Number);
    const [newHour, newMin] = newTime.split(':').map(Number);

    const existingStart = existingHour * 60 + existingMin;
    const existingEnd = existingStart + existingDuration;
    const newStart = newHour * 60 + newMin;
    const newEnd = newStart + newDuration;

    // Check if time ranges overlap
    return (existingStart < newEnd && newStart < existingEnd);
  }

  private initializeMockData(): void {
    // Initialize mock consultants
    this.consultants = [
      {
        id: uuidv4(),
        userId: 'user-1',
        name: 'John Smith',
        email: 'john.smith@lomashwood.com',
        phone: '+44 20 7123 4567',
        specializations: ['KITCHEN', 'BEDROOM'],
        bio: 'Experienced furniture consultant with 10+ years in the industry.',
        avatar: '/images/consultants/john.jpg',
        isActive: true,
        rating: 4.8,
        reviewCount: 45,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        userId: 'user-2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@lomashwood.com',
        phone: '+44 20 7123 4568',
        specializations: ['KITCHEN'],
        bio: 'Kitchen design specialist focused on modern and contemporary styles.',
        avatar: '/images/consultants/sarah.jpg',
        isActive: true,
        rating: 4.9,
        reviewCount: 32,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Initialize mock showrooms
    this.showrooms = [
      {
        id: uuidv4(),
        name: 'London Showroom',
        slug: 'london-showroom',
        address: {
          street: '123 High Street',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'UK',
        },
        image: '/images/showrooms/london.jpg',
        email: 'london@lomashwood.com',
        phone: '+44 20 7123 4569',
        openingHours: {
          monday: '9:00 - 18:00',
          tuesday: '9:00 - 18:00',
          wednesday: '9:00 - 18:00',
          thursday: '9:00 - 18:00',
          friday: '9:00 - 18:00',
          saturday: '10:00 - 17:00',
          sunday: 'Closed',
        },
        mapUrl: 'https://maps.google.com/?q=lomashwood+london',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        features: ['Parking', 'Wheelchair Access', 'Coffee Bar'],
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Initialize mock time slots
    this.timeSlots = [
      { id: uuidv4(), time: '09:00', label: '9:00 AM', isActive: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), time: '10:00', label: '10:00 AM', isActive: true, sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), time: '11:00', label: '11:00 AM', isActive: true, sortOrder: 3, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), time: '12:00', label: '12:00 PM', isActive: true, sortOrder: 4, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), time: '13:00', label: '1:00 PM', isActive: true, sortOrder: 5, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), time: '14:00', label: '2:00 PM', isActive: true, sortOrder: 6, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), time: '15:00', label: '3:00 PM', isActive: true, sortOrder: 7, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), time: '16:00', label: '4:00 PM', isActive: true, sortOrder: 8, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), time: '17:00', label: '5:00 PM', isActive: true, sortOrder: 9, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), time: '18:00', label: '6:00 PM', isActive: true, sortOrder: 10, createdAt: new Date(), updatedAt: new Date() },
    ];

    // Initialize mock appointments
    this.appointments = [
      {
        id: uuidv4(),
        customerId: 'customer-1',
        consultantId: this.consultants[0].id,
        showroomId: this.showrooms[0].id,
        type: 'SHOWROOM',
        serviceType: 'KITCHEN',
        status: 'CONFIRMED',
        customerDetails: {
          name: 'Alice Brown',
          email: 'alice@example.com',
          phone: '+44 20 7123 4567',
        },
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        scheduledTime: '14:00',
        duration: 60,
        notes: 'Interested in modern kitchen designs',
        reminderSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}
