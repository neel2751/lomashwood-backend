import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';

// ── Missing types (move to api.types.ts and re-export from there if preferred) ──

export interface Consultant {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  specialties: string[];
  experience: number;
  languages: string[];
  rating: number;
  reviewCount: number;
  completedAppointments: number;
  profileImage?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultantRequest {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio?: string;
  specialties?: string[];
  experience?: number;
  languages?: string[];
  profileImage?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface UpdateConsultantRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  specialties?: string[];
  experience?: number;
  languages?: string[];
  profileImage?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface ConsultantFilters {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  specialties?: string[];
  serviceType?: 'KITCHEN' | 'BEDROOM' | 'BOTH';
  minRating?: number;
  languages?: string[];
  startDate?: string;
  endDate?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class ConsultantService {
  constructor(private HttpClient: HttpClient) {}

  // ── Consultant Management ────────────────────────────────────────────────────

  async getConsultants(params?: ConsultantFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Consultant[]>> {
    return this.HttpClient.get<PaginatedResponse<Consultant[]>>('/consultants', { params });
  }

  async getConsultant(consultantId: string): Promise<Consultant> {
    return this.HttpClient.get<Consultant>(`/consultants/${consultantId}`);
  }

  async createConsultant(consultantData: CreateConsultantRequest): Promise<Consultant> {
    return this.HttpClient.post<Consultant>('/consultants', consultantData);
  }

  async updateConsultant(consultantId: string, updateData: UpdateConsultantRequest): Promise<Consultant> {
    return this.HttpClient.put<Consultant>(`/consultants/${consultantId}`, updateData);
  }

  async deleteConsultant(consultantId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/consultants/${consultantId}`);
  }

  // ── Consultant Profiles ──────────────────────────────────────────────────────

  async getConsultantProfile(consultantId: string): Promise<{
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bio: string;
    specialties: string[];
    certifications: Array<{
      name: string;
      issuer: string;
      issuedDate: string;
      expiryDate?: string;
      certificateUrl?: string;
    }>;
    experience: number;
    languages: string[];
    rating: number;
    reviewCount: number;
    completedAppointments: number;
    averageResponseTime: number;
    profileImage?: string;
    coverImage?: string;
    socialLinks: {
      linkedin?: string;
      portfolio?: string;
      instagram?: string;
    };
    availability: {
      isActive: boolean;
      maxAppointmentsPerDay: number;
      workingHours: {
        start: string;
        end: string;
        daysOfWeek: number[];
      };
      timezone: string;
    };
    services: {
      kitchenConsultation: boolean;
      bedroomConsultation: boolean;
      virtualConsultation: boolean;
      showroomConsultation: boolean;
      homeVisit: boolean;
    };
    pricing: {
      hourlyRate: number;
      consultationFee: number;
      travelFee?: number;
    };
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    createdAt: string;
    updatedAt: string;
  }> {
    return this.HttpClient.get<any>(`/consultants/${consultantId}/profile`);
  }

  async updateConsultantProfile(consultantId: string, profileData: {
    bio?: string;
    specialties?: string[];
    certifications?: Array<{
      name: string;
      issuer: string;
      issuedDate: string;
      expiryDate?: string;
      certificateUrl?: string;
    }>;
    languages?: string[];
    socialLinks?: {
      linkedin?: string;
      portfolio?: string;
      instagram?: string;
    };
    services?: {
      kitchenConsultation?: boolean;
      bedroomConsultation?: boolean;
      virtualConsultation?: boolean;
      showroomConsultation?: boolean;
      homeVisit?: boolean;
    };
    pricing?: {
      hourlyRate?: number;
      consultationFee?: number;
      travelFee?: number;
    };
  }): Promise<any> {
    return this.HttpClient.put<any>(`/consultants/${consultantId}/profile`, profileData);
  }

  // ── Consultant Availability ──────────────────────────────────────────────────

  async getConsultantAvailability(consultantId: string, params?: {
    startDate?: string;
    endDate?: string;
    includeBooked?: boolean;
  }): Promise<Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
    appointmentId?: string;
    notes?: string;
  }>> {
    return this.HttpClient.get<any[]>(`/consultants/${consultantId}/availability`, { params });
  }

  async updateConsultantAvailability(consultantId: string, availabilityData: {
    isActive: boolean;
    maxAppointmentsPerDay: number;
    workingHours: {
      start: string;
      end: string;
      daysOfWeek: number[];
    };
    timezone: string;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/consultants/${consultantId}/availability`, availabilityData);
  }

  // ── Consultant Reviews ───────────────────────────────────────────────────────

  async getConsultantReviews(consultantId: string, params?: {
    page?: number;
    limit?: number;
    rating?: number;
    serviceType?: 'KITCHEN' | 'BEDROOM' | 'BOTH';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    consultantId: string;
    customerId: string;
    customerName: string;
    appointmentId: string;
    rating: number;
    title: string;
    content: string;
    serviceType: 'KITCHEN' | 'BEDROOM' | 'BOTH';
    response?: {
      content: string;
      respondedAt: string;
    };
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>(`/consultants/${consultantId}/reviews`, { params });
  }

  async respondToReview(consultantId: string, reviewId: string, response: {
    content: string;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/consultants/${consultantId}/reviews/${reviewId}/respond`, response);
  }

  // ── Consultant Analytics ─────────────────────────────────────────────────────

  async getConsultantAnalytics(consultantId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    consultantId: string;
    consultantName: string;
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    completionRate: number;
    averageRating: number;
    totalRevenue: number;
    averageRevenuePerAppointment: number;
    averageAppointmentDuration: number;
    customerSatisfaction: number;
    repeatCustomerRate: number;
    bookingConversionRate: number;
    responseTime: {
      average: number;
      median: number;
      fastest: number;
      slowest: number;
    };
    serviceTypeStats: Array<{
      serviceType: string;
      appointments: number;
      revenue: number;
      averageRating: number;
      averageDuration: number;
    }>;
    monthlyStats: Array<{
      month: string;
      appointments: number;
      revenue: number;
      rating: number;
      completionRate: number;
    }>;
    customerFeedback: {
      positive: number;
      neutral: number;
      negative: number;
      commonThemes: Array<{
        theme: string;
        count: number;
        sentiment: 'positive' | 'negative' | 'neutral';
      }>;
    };
  }> {
    return this.HttpClient.get<any>(`/consultants/${consultantId}/analytics`, { params });
  }

  async getConsultantPerformanceMetrics(consultantId: string, params?: {
    period?: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
    startDate?: string;
    endDate?: string;
  }): Promise<{
    consultantId: string;
    period: string;
    metrics: {
      appointments: {
        total: number;
        completed: number;
        cancelled: number;
        noShow: number;
        completionRate: number;
      };
      revenue: {
        total: number;
        average: number;
        growth: number;
      };
      customer: {
        satisfaction: number;
        repeatRate: number;
        newCustomers: number;
        retentionRate: number;
      };
      efficiency: {
        utilizationRate: number;
        averageDuration: number;
        onTimeRate: number;
        responseTime: number;
      };
      quality: {
        rating: number;
        reviewCount: number;
        complaintRate: number;
        resolutionRate: number;
      };
    };
    benchmarks: {
      industryAverage: any;
      topPerformers: any;
      ranking: {
        overall: number;
        totalConsultants: number;
        percentile: number;
      };
    };
    trends: Array<{
      date: string;
      appointments: number;
      revenue: number;
      rating: number;
    }>;
  }> {
    return this.HttpClient.get<any>(`/consultants/${consultantId}/performance`, { params });
  }

  // ── Consultant Scheduling ────────────────────────────────────────────────────

  async getConsultantSchedule(consultantId: string, params?: {
    startDate?: string;
    endDate?: string;
    includeAvailability?: boolean;
    includeAppointments?: boolean;
  }): Promise<{
    consultantId: string;
    period: {
      start: string;
      end: string;
    };
    schedule: Array<{
      date: string;
      dayOfWeek: number;
      availability: Array<{
        startTime: string;
        endTime: string;
        status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
        appointmentId?: string;
        customerName?: string;
        serviceType?: string;
      }>;
      summary: {
        totalSlots: number;
        availableSlots: number;
        bookedSlots: number;
        blockedSlots: number;
        utilizationRate: number;
      };
    }>;
    summary: {
      totalSlots: number;
      availableSlots: number;
      bookedSlots: number;
      blockedSlots: number;
      utilizationRate: number;
      totalAppointments: number;
      totalRevenue: number;
    };
  }> {
    return this.HttpClient.get<any>(`/consultants/${consultantId}/schedule`, { params });
  }

  async optimizeConsultantSchedule(consultantId: string, params: {
    startDate: string;
    endDate: string;
    objectives: Array<'MAXIMIZE_BOOKINGS' | 'BALANCE_WORKLOAD' | 'REDUCE_GAPS' | 'IMPROVE_RATINGS'>;
    constraints?: {
      maxHoursPerDay?: number;
      maxHoursPerWeek?: number;
      preferredTimes?: Array<{
        startTime: string;
        endTime: string;
        daysOfWeek?: number[];
      }>;
      breakTimes?: Array<{
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
      action: 'ADD_SLOT' | 'REMOVE_SLOT' | 'ADJUST_TIME' | 'ADD_BREAK';
      startTime: string;
      endTime: string;
      reason: string;
      expectedImprovement: number;
    }>;
  }> {
    return this.HttpClient.post<any>(`/consultants/${consultantId}/optimize-schedule`, params);
  }

  // ── Consultant Search ────────────────────────────────────────────────────────

  async searchConsultants(params: {
    query?: string;
    specialties?: string[];
    serviceType?: 'KITCHEN' | 'BEDROOM' | 'BOTH';
    location?: string;
    rating?: number;
    priceRange?: {
      min?: number;
      max?: number;
    };
    availability?: {
      date: string;
      startTime?: string;
      endTime?: string;
    };
    languages?: string[];
    experience?: {
      min?: number;
      max?: number;
    };
    page?: number;
    limit?: number;
    sortBy?: 'rating' | 'experience' | 'price' | 'availability' | 'reviews';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    firstName: string;
    lastName: string;
    bio: string;
    specialties: string[];
    rating: number;
    reviewCount: number;
    experience: number;
    languages: string[];
    pricing: {
      hourlyRate: number;
      consultationFee: number;
    };
    services: {
      kitchenConsultation: boolean;
      bedroomConsultation: boolean;
      virtualConsultation: boolean;
      showroomConsultation: boolean;
      homeVisit: boolean;
    };
    availability: {
      nextAvailable?: string;
      availableSlots: number;
    };
    location?: {
      city: string;
      state: string;
      country: string;
    };
    profileImage?: string;
    matchScore: number;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/consultants/search', { params });
  }

  // ── Consultant Recommendations ───────────────────────────────────────────────

  async getConsultantRecommendations(params: {
    customerId?: string;
    serviceType: 'KITCHEN' | 'BEDROOM' | 'BOTH';
    location?: string;
    budget?: {
      min?: number;
      max?: number;
    };
    preferences?: {
      specialties?: string[];
      languages?: string[];
      experience?: number;
      rating?: number;
    };
    availability?: {
      date: string;
      timeRange?: string;
    };
  }): Promise<Array<{
    consultant: {
      id: string;
      firstName: string;
      lastName: string;
      bio: string;
      specialties: string[];
      rating: number;
      reviewCount: number;
      experience: number;
      languages: string[];
      pricing: any;
      services: any;
      profileImage?: string;
    };
    recommendationScore: number;
    reasons: Array<{
      factor: string;
      score: number;
      explanation: string;
    }>;
    availability: {
      nextAvailable?: string;
      availableSlots: number;
    };
  }>> {
    return this.HttpClient.post<any[]>('/consultants/recommendations', params);
  }

  // ── Consultant Certifications ────────────────────────────────────────────────

  async getConsultantCertifications(consultantId: string): Promise<Array<{
    id: string;
    consultantId: string;
    name: string;
    issuer: string;
    issuedDate: string;
    expiryDate?: string;
    certificateUrl?: string;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    verifiedAt?: string;
    verifiedBy?: string;
    notes?: string;
  }>> {
    return this.HttpClient.get<any[]>(`/consultants/${consultantId}/certifications`);
  }

  async addConsultantCertification(consultantId: string, certificationData: {
    name: string;
    issuer: string;
    issuedDate: string;
    expiryDate?: string;
    certificateFile?: File;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('name', certificationData.name);
    formData.append('issuer', certificationData.issuer);
    formData.append('issuedDate', certificationData.issuedDate);

    if (certificationData.expiryDate) {
      formData.append('expiryDate', certificationData.expiryDate);
    }

    if (certificationData.certificateFile) {
      formData.append('certificateFile', certificationData.certificateFile);
    }

    // Content-Type set automatically when passing FormData
    return this.HttpClient.post<any>(`/consultants/${consultantId}/certifications`, formData);
  }

  async updateConsultantCertification(consultantId: string, certificationId: string, updateData: {
    name?: string;
    issuer?: string;
    issuedDate?: string;
    expiryDate?: string;
    verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
    notes?: string;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/consultants/${consultantId}/certifications/${certificationId}`, updateData);
  }

  async deleteConsultantCertification(consultantId: string, certificationId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/consultants/${consultantId}/certifications/${certificationId}`);
  }

  // ── Consultant Training ──────────────────────────────────────────────────────

  async getConsultantTraining(consultantId: string): Promise<Array<{
    id: string;
    consultantId: string;
    title: string;
    description: string;
    type: 'ONLINE' | 'IN_PERSON' | 'WORKSHOP';
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    startDate: string;
    endDate?: string;
    duration: number;
    provider: string;
    certificateUrl?: string;
    completedAt?: string;
    notes?: string;
  }>> {
    return this.HttpClient.get<any[]>(`/consultants/${consultantId}/training`);
  }

  async addConsultantTraining(consultantId: string, trainingData: {
    title: string;
    description: string;
    type: 'ONLINE' | 'IN_PERSON' | 'WORKSHOP';
    startDate: string;
    endDate?: string;
    duration: number;
    provider: string;
    certificateFile?: File;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('title', trainingData.title);
    formData.append('description', trainingData.description);
    formData.append('type', trainingData.type);
    formData.append('startDate', trainingData.startDate);
    formData.append('duration', trainingData.duration.toString());
    formData.append('provider', trainingData.provider);

    if (trainingData.endDate) {
      formData.append('endDate', trainingData.endDate);
    }

    if (trainingData.certificateFile) {
      formData.append('certificateFile', trainingData.certificateFile);
    }

    // Content-Type set automatically when passing FormData
    return this.HttpClient.post<any>(`/consultants/${consultantId}/training`, formData);
  }

  // ── Consultant Reports ───────────────────────────────────────────────────────

  async generateConsultantReport(consultantId: string, params?: {
    type?: 'PERFORMANCE' | 'ANALYTICS' | 'REVIEWS' | 'SCHEDULE';
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'excel' | 'pdf';
  }): Promise<Blob> {
    // responseType must be handled by the HttpClient interceptor; pass as a separate config if supported,
    // otherwise cast the response — here we match the 2-arg limit of HttpClient.post
    return this.HttpClient.post<Blob>(`/consultants/${consultantId}/reports`, params);
  }

  // ── Consultant Settings ──────────────────────────────────────────────────────

  async getConsultantSettings(consultantId: string): Promise<{
    notifications: {
      emailNotifications: boolean;
      smsNotifications: boolean;
      appointmentReminders: boolean;
      reviewNotifications: boolean;
      marketingEmails: boolean;
    };
    privacy: {
      showEmail: boolean;
      showPhone: boolean;
      showSocialLinks: boolean;
      allowDirectContact: boolean;
    };
    scheduling: {
      autoAcceptAppointments: boolean;
      requireApproval: boolean;
      bufferTime: number;
      cancellationPolicy: string;
    };
    payment: {
      acceptOnlinePayments: boolean;
      paymentMethods: string[];
      depositRequired: boolean;
      depositAmount: number;
    };
  }> {
    return this.HttpClient.get<any>(`/consultants/${consultantId}/settings`);
  }

  async updateConsultantSettings(consultantId: string, settings: {
    notifications?: {
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      appointmentReminders?: boolean;
      reviewNotifications?: boolean;
      marketingEmails?: boolean;
    };
    privacy?: {
      showEmail?: boolean;
      showPhone?: boolean;
      showSocialLinks?: boolean;
      allowDirectContact?: boolean;
    };
    scheduling?: {
      autoAcceptAppointments?: boolean;
      requireApproval?: boolean;
      bufferTime?: number;
      cancellationPolicy?: string;
    };
    payment?: {
      acceptOnlinePayments?: boolean;
      paymentMethods?: string[];
      depositRequired?: boolean;
      depositAmount?: number;
    };
  }): Promise<any> {
    return this.HttpClient.put<any>(`/consultants/${consultantId}/settings`, settings);
  }
}