import { HttpClient } from '../utils/http';
import {
  Availability,
  SetAvailabilityRequest,
} from '../types/appointment.types';
import { PaginatedResponse } from '../types/api.types';

// Define missing types
interface CreateAvailabilityRequest extends SetAvailabilityRequest {}

interface UpdateAvailabilityRequest extends Partial<SetAvailabilityRequest> {}

interface AvailabilityFilters {
  consultantId?: string;
  dateFrom?: string;
  dateTo?: string;
  isWorkingDay?: boolean;
}

export class AvailabilityService {
  constructor(private apiClient: HttpClient) {}

  // Availability Management
  async getAvailabilityList(params?: AvailabilityFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Availability[]>> {
    return this.apiClient.get<PaginatedResponse<Availability[]>>('/availability', { params });
  }

  async getAvailabilityById(availabilityId: string): Promise<Availability> {
    return this.apiClient.get<Availability>(`/availability/${availabilityId}`);
  }

  async getConsultantAvailability(consultantId: string, params?: {
    startDate?: string;
    endDate?: string;
    includeBooked?: boolean;
  }): Promise<Array<{
    id: string;
    consultantId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
    appointmentId?: string;
    notes?: string;
  }>> {
    return this.apiClient.get<any[]>(`/availability/consultant/${consultantId}`, { params });
  }

  async getShowroomAvailability(showroomId: string, params?: {
    startDate?: string;
    endDate?: string;
    includeBooked?: boolean;
  }): Promise<Array<{
    id: string;
    showroomId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
    appointmentId?: string;
    consultantId?: string;
    notes: string;
  }>> {
    return this.apiClient.get<any[]>(`/availability/showroom/${showroomId}`, { params });
  }

  async createAvailability(availabilityData: CreateAvailabilityRequest): Promise<Availability> {
    return this.apiClient.post<Availability>('/availability', availabilityData);
  }

  async updateAvailability(availabilityId: string, updateData: UpdateAvailabilityRequest): Promise<Availability> {
    return this.apiClient.put<Availability>(`/availability/${availabilityId}`, updateData);
  }

  async deleteAvailability(availabilityId: string): Promise<void> {
    return this.apiClient.delete<void>(`/availability/${availabilityId}`);
  }

  // Availability Scheduling
  async generateAvailability(consultantId: string, params: {
    startDate: string;
    endDate: string;
    pattern: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    timeSlots: Array<{
      startTime: string;
      endTime: string;
      daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
    }>;
    exceptions?: Array<{
      date: string;
      startTime: string;
      endTime: string;
      status: 'AVAILABLE' | 'BLOCKED';
    }>;
  }): Promise<Array<{
    id: string;
    consultantId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'AVAILABLE';
    generated: true;
  }>> {
    return this.apiClient.post<any[]>(`/availability/consultant/${consultantId}/generate`, params);
  }

  async generateShowroomAvailability(showroomId: string, params: {
    startDate: string;
    endDate: string;
    capacity: number;
    timeSlots: Array<{
      startTime: string;
      endTime: string;
      daysOfWeek?: number[];
    }>;
    exceptions?: Array<{
      date: string;
      startTime: string;
      endTime: string;
      capacity?: number;
      status: 'AVAILABLE' | 'BLOCKED';
    }>;
  }): Promise<Array<{
    id: string;
    showroomId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'AVAILABLE';
    capacity: number;
    generated: true;
  }>> {
    return this.apiClient.post<any[]>(`/availability/showroom/${showroomId}/generate`, params);
  }

  // Availability Search
  async searchAvailability(params: {
    startDate: string;
    endDate: string;
    type: 'CONSULTANT' | 'SHOWROOM' | 'VIRTUAL';
    consultantId?: string;
    showroomId?: string;
    serviceType?: 'KITCHEN' | 'BEDROOM' | 'BOTH';
    duration: number; // minutes
    preferredTimes?: string[]; // array of time strings
  }): Promise<Array<{
    id: string;
    consultantId?: string;
    showroomId?: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'CONSULTANT' | 'SHOWROOM' | 'VIRTUAL';
    status: 'AVAILABLE';
    consultant?: {
      id: string;
      name: string;
      specialties: string[];
      rating: number;
    };
    showroom?: {
      id: string;
      name: string;
      address: any;
      features: string[];
    };
    score: number; // Match score based on preferences
  }>> {
    return this.apiClient.post<any[]>('/availability/search', params);
  }

  async getAvailableTimeSlots(params: {
    date: string;
    type: 'CONSULTANT' | 'SHOWROOM' | 'VIRTUAL';
    consultantId?: string;
    showroomId?: string;
    serviceType?: 'KITCHEN' | 'BEDROOM' | 'BOTH';
    duration: number;
  }): Promise<Array<{
    startTime: string;
    endTime: string;
    available: boolean;
    consultantId?: string;
    showroomId?: string;
    reason?: string;
  }>> {
    return this.apiClient.get<any[]>('/availability/time-slots', { params });
  }

  // Availability Blocking
  async blockAvailability(availabilityData: {
    consultantId?: string;
    showroomId?: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    reason: string;
    type: 'VACATION' | 'TRAINING' | 'MAINTENANCE' | 'OTHER';
    recurring?: {
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
      interval: number;
      endDate?: string;
    };
  }): Promise<Array<{
    id: string;
    consultantId?: string;
    showroomId?: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'BLOCKED';
    reason: string;
    type: string;
  }>> {
    return this.apiClient.post<any[]>('/availability/block', availabilityData);
  }

  async unblockAvailability(blockId: string): Promise<void> {
    return this.apiClient.delete<void>(`/availability/block/${blockId}`);
  }

  async getBlockedAvailability(params?: {
    consultantId?: string;
    showroomId?: string;
    startDate?: string;
    endDate?: string;
    type?: 'VACATION' | 'TRAINING' | 'MAINTENANCE' | 'OTHER';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    consultantId?: string;
    showroomId?: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'BLOCKED';
    reason: string;
    type: string;
    createdAt: string;
  }>>> {
    return this.apiClient.get<PaginatedResponse<any[]>>('/availability/blocked', { params });
  }

  // Availability Conflicts
  async checkAvailabilityConflicts(availabilityData: {
    consultantId?: string;
    showroomId?: string;
    date: string;
    startTime: string;
    endTime: string;
    excludeId?: string; // Exclude current availability from conflict check
  }): Promise<{
    hasConflicts: boolean;
    conflicts: Array<{
      id: string;
      type: 'APPOINTMENT' | 'AVAILABILITY' | 'BLOCK';
      startTime: string;
      endTime: string;
      description: string;
    }>;
    suggestions: Array<{
      startTime: string;
      endTime: string;
      reason: string;
    }>;
  }> {
    return this.apiClient.post<any>('/availability/check-conflicts', availabilityData);
  }

  async resolveAvailabilityConflicts(conflictId: string, resolution: {
    action: 'RESCHEDULE' | 'CANCEL' | 'KEEP';
    newTime?: {
      startTime: string;
      endTime: string;
    };
    reason?: string;
  }): Promise<any> {
    return this.apiClient.post<any>(`/availability/conflicts/${conflictId}/resolve`, resolution);
  }

  // Availability Analytics
  async getAvailabilityAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    consultantId?: string;
    showroomId?: string;
    type?: 'CONSULTANT' | 'SHOWROOM' | 'VIRTUAL';
  }): Promise<{
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
    blockedSlots: number;
    utilizationRate: number;
    bookingRate: number;
    noShowRate: number;
    averageBookingDuration: number;
    peakHours: Array<{
      hour: number;
      bookings: number;
      availability: number;
    }>;
    peakDays: Array<{
      day: string;
      bookings: number;
      availability: number;
    }>;
    consultantPerformance?: Array<{
      consultantId: string;
      consultantName: string;
      totalBookings: number;
      utilizationRate: number;
      averageRating: number;
    }>;
    showroomPerformance?: Array<{
      showroomId: string;
      showroomName: string;
      totalBookings: number;
      utilizationRate: number;
      averageRevenue: number;
    }>;
  }> {
    return this.apiClient.get<any>('/availability/analytics', { params });
  }

  async getConsultantAvailabilityAnalytics(consultantId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    consultantId: string;
    consultantName: string;
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
    blockedSlots: number;
    utilizationRate: number;
    bookingRate: number;
    noShowRate: number;
    averageBookingDuration: number;
    revenue: number;
    customerSatisfaction: number;
    dailyStats: Array<{
      date: string;
      availableSlots: number;
      bookedSlots: number;
      utilizationRate: number;
    }>;
    serviceTypeStats: Array<{
      serviceType: string;
      bookings: number;
      revenue: number;
      averageDuration: number;
    }>;
  }> {
    return this.apiClient.get<any>(`/availability/analytics/consultant/${consultantId}`, { params });
  }

  async getShowroomAvailabilityAnalytics(showroomId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    showroomId: string;
    showroomName: string;
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
    blockedSlots: number;
    utilizationRate: number;
    bookingRate: number;
    averageRevenue: number;
    peakHours: Array<{
      hour: number;
      bookings: number;
      revenue: number;
    }>;
    consultantUtilization: Array<{
      consultantId: string;
      consultantName: string;
      bookings: number;
      utilizationRate: number;
    }>;
    dailyStats: Array<{
      date: string;
      availableSlots: number;
      bookedSlots: number;
      utilizationRate: number;
      revenue: number;
    }>;
  }> {
    return this.apiClient.get<any>(`/availability/analytics/showroom/${showroomId}`, { params });
  }

  // Availability Optimization
  async optimizeAvailability(params: {
    consultantId?: string;
    showroomId?: string;
    startDate: string;
    endDate: string;
    objectives: Array<'MAXIMIZE_BOOKINGS' | 'BALANCE_WORKLOAD' | 'REDUCE_GAPS' | 'PEAK_HOURS'>;
    constraints?: {
      maxHoursPerDay?: number;
      maxHoursPerWeek?: number;
      requiredBreakTime?: number;
      preferredDays?: number[];
      blockedTimes?: Array<{
        startTime: string;
        endTime: string;
        daysOfWeek?: number[];
      }>;
    };
  }): Promise<{
    optimizationId: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    recommendations?: Array<{
      date: string;
      action: 'ADD_SLOT' | 'REMOVE_SLOT' | 'ADJUST_TIME';
      startTime: string;
      endTime: string;
      reason: string;
      expectedImprovement: number;
    }>;
    summary?: {
      totalRecommendations: number;
      expectedBookingIncrease: number;
      expectedUtilizationImprovement: number;
    };
  }> {
    return this.apiClient.post<any>('/availability/optimize', params);
  }

  async getOptimizationResults(optimizationId: string): Promise<{
    optimizationId: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    recommendations: Array<{
      date: string;
      action: 'ADD_SLOT' | 'REMOVE_SLOT' | 'ADJUST_TIME';
      startTime: string;
      endTime: string;
      reason: string;
      expectedImprovement: number;
    }>;
    summary: {
      totalRecommendations: number;
      expectedBookingIncrease: number;
      expectedUtilizationImprovement: number;
    };
    completedAt?: string;
    error?: string;
  }> {
    return this.apiClient.get<any>(`/availability/optimize/${optimizationId}`);
  }

  async applyOptimizationRecommendations(optimizationId: string, recommendations: Array<{
    date: string;
    action: string;
    startTime: string;
    endTime: string;
  }>): Promise<{
    applied: number;
    failed: number;
    results: Array<{
      recommendation: any;
      success: boolean;
      error?: string;
    }>;
  }> {
    return this.apiClient.post<any>(`/availability/optimize/${optimizationId}/apply`, { recommendations });
  }

  // Availability Templates
  async getAvailabilityTemplates(params?: {
    page?: number;
    limit?: number;
    type?: 'CONSULTANT' | 'SHOWROOM';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    name: string;
    description?: string;
    type: 'CONSULTANT' | 'SHOWROOM';
    pattern: {
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
      timeSlots: Array<{
        startTime: string;
        endTime: string;
        daysOfWeek?: number[];
      }>;
    };
    isActive: boolean;
    createdAt: string;
  }>>> {
    return this.apiClient.get<PaginatedResponse<any[]>>('/availability/templates', { params });
  }

  async createAvailabilityTemplate(templateData: {
    name: string;
    description?: string;
    type: 'CONSULTANT' | 'SHOWROOM';
    pattern: {
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
      timeSlots: Array<{
        startTime: string;
        endTime: string;
        daysOfWeek?: number[];
      }>;
    };
  }): Promise<any> {
    return this.apiClient.post<any>('/availability/templates', templateData);
  }

  async applyAvailabilityTemplate(templateId: string, params: {
    consultantId?: string;
    showroomId?: string;
    startDate: string;
    endDate: string;
    overwrite?: boolean;
  }): Promise<{
    templateId: string;
    applied: number;
    skipped: number;
    results: Array<{
      date: string;
      startTime: string;
      endTime: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    return this.apiClient.post<any>(`/availability/templates/${templateId}/apply`, params);
  }

  // Availability Import/Export
  async exportAvailability(params?: {
    format?: 'csv' | 'excel' | 'json';
    consultantId?: string;
    showroomId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<Blob> {
    return this.apiClient.getBlob('/availability/export', params);
  }

  async importAvailability(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateConsultants?: boolean;
    validateShowrooms?: boolean;
  }): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{
      row: number;
      error: string;
      data: any;
    }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    return this.apiClient.upload<any>('/availability/import', formData);
  }

  // Availability Settings
  async getAvailabilitySettings(): Promise<{
    defaultDuration: number;
    minBookingWindow: number; // hours
    maxBookingWindow: number; // days
    cancellationWindow: number; // hours
    autoConfirmBookings: boolean;
    enableWaitlist: boolean;
    maxWaitlistSize: number;
    bufferTime: number; // minutes between appointments
    workingHours: {
      start: string;
      end: string;
      daysOfWeek: number[];
    };
    timezone: string;
  }> {
    return this.apiClient.get<any>('/availability/settings');
  }

  async updateAvailabilitySettings(settings: {
    defaultDuration?: number;
    minBookingWindow?: number;
    maxBookingWindow?: number;
    cancellationWindow?: number;
    autoConfirmBookings?: boolean;
    enableWaitlist?: boolean;
    maxWaitlistSize?: number;
    bufferTime?: number;
    workingHours?: {
      start: string;
      end: string;
      daysOfWeek: number[];
    };
    timezone?: string;
  }): Promise<any> {
    return this.apiClient.put<any>('/availability/settings', settings);
  }
}
