import { HttpClient } from '../utils/http-client';
import { ServiceConfig } from '../config/services';
import { ApiResponse } from '../types';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import type {
  AppointmentType,
  BookingStatus,
  CreateBookingPayload,
  BookingResponse,
  AvailableSlot,
  ShowroomResponse,
  PaginationQuery,
} from '../types';

interface AvailabilityQueryParams {
  appointmentType?: AppointmentType;
  showroomId?: string;
  date?: string;
  forKitchen?: boolean;
  forBedroom?: boolean;
}

interface AppointmentListResponse {
  bookings: BookingResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class AppointmentClient {
  private readonly http: HttpClient;
  private readonly baseUrl: string;

  constructor(serviceConfig: ServiceConfig) {
    this.baseUrl = serviceConfig.url;
    this.http = new HttpClient({
      baseURL: this.baseUrl,
      timeout: serviceConfig.timeout ?? 10_000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'api-gateway',
      },
    });
  }

  async getAvailability(
    params: AvailabilityQueryParams,
    correlationId: string,
  ): Promise<ApiResponse<AvailableSlot[]>> {
    try {
      const query = new URLSearchParams({
        ...(params.appointmentType && { appointmentType: params.appointmentType }),
        ...(params.showroomId && { showroomId: params.showroomId }),
        ...(params.date && { date: params.date }),
        ...(params.forKitchen !== undefined && { forKitchen: String(params.forKitchen) }),
        ...(params.forBedroom !== undefined && { forBedroom: String(params.forBedroom) }),
      }).toString();

      const response = await this.http.get<ApiResponse<AvailableSlot[]>>(
        `/v1/appointments/availability?${query}`,
        { headers: { 'X-Correlation-ID': correlationId } },
      );

      logger.debug('Fetched appointment availability', {
        correlationId,
        params,
        slotCount: response.data?.length ?? 0,
      });

      return response;
    } catch (error) {
      logger.error('Failed to fetch appointment availability', { correlationId, error, params });
      throw this.normalizeError(error, 'Failed to fetch appointment availability');
    }
  }

  async bookAppointment(
    payload: CreateBookingPayload,
    correlationId: string,
  ): Promise<ApiResponse<BookingResponse>> {
    try {
      const response = await this.http.post<ApiResponse<BookingResponse>>(
        '/v1/appointments',
        payload,
        { headers: { 'X-Correlation-ID': correlationId } },
      );

      logger.info('Appointment booked successfully', {
        correlationId,
        appointmentType: payload.appointmentType,
        forKitchen: payload.serviceType.kitchen,
        forBedroom: payload.serviceType.bedroom,
      });

      return response;
    } catch (error) {
      logger.error('Failed to book appointment', { correlationId, error, payload });
      throw this.normalizeError(error, 'Failed to book appointment');
    }
  }

  async getAppointmentById(
    appointmentId: string,
    correlationId: string,
    authToken?: string,
  ): Promise<ApiResponse<BookingResponse>> {
    try {
      const headers: Record<string, string> = {
        'X-Correlation-ID': correlationId,
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await this.http.get<ApiResponse<BookingResponse>>(
        `/v1/appointments/${appointmentId}`,
        { headers },
      );

      logger.debug('Fetched appointment by ID', { correlationId, appointmentId });

      return response;
    } catch (error) {
      logger.error('Failed to fetch appointment', { correlationId, error, appointmentId });
      throw this.normalizeError(error, 'Failed to fetch appointment');
    }
  }

  async listAppointments(
    query: PaginationQuery & {
      status?: BookingStatus;
      appointmentType?: AppointmentType;
      fromDate?: string;
      toDate?: string;
    },
    correlationId: string,
    authToken: string,
  ): Promise<ApiResponse<AppointmentListResponse>> {
    try {
      const params = new URLSearchParams({
        ...(query.page !== undefined && { page: String(query.page) }),
        ...(query.limit !== undefined && { limit: String(query.limit) }),
        ...(query.status && { status: query.status }),
        ...(query.appointmentType && { appointmentType: query.appointmentType }),
        ...(query.fromDate && { fromDate: query.fromDate }),
        ...(query.toDate && { toDate: query.toDate }),
      }).toString();

      const response = await this.http.get<ApiResponse<AppointmentListResponse>>(
        `/v1/appointments?${params}`,
        {
          headers: {
            'X-Correlation-ID': correlationId,
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      logger.debug('Fetched appointment list', {
        correlationId,
        total: response.data?.pagination?.total,
        filters: query,
      });

      return response;
    } catch (error) {
      logger.error('Failed to list appointments', { correlationId, error, query });
      throw this.normalizeError(error, 'Failed to list appointments');
    }
  }

  async updateAppointmentStatus(
    appointmentId: string,
    status: BookingStatus,
    correlationId: string,
    authToken: string,
  ): Promise<ApiResponse<BookingResponse>> {
    try {
      const response = await this.http.patch<ApiResponse<BookingResponse>>(
        `/v1/appointments/${appointmentId}/status`,
        { status },
        {
          headers: {
            'X-Correlation-ID': correlationId,
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      logger.info('Appointment status updated', { correlationId, appointmentId, status });

      return response;
    } catch (error) {
      logger.error('Failed to update appointment status', {
        correlationId,
        error,
        appointmentId,
        status,
      });
      throw this.normalizeError(error, 'Failed to update appointment status');
    }
  }

  async cancelAppointment(
    appointmentId: string,
    reason: string,
    correlationId: string,
    authToken: string,
  ): Promise<ApiResponse<BookingResponse>> {
    try {
      const response = await this.http.patch<ApiResponse<BookingResponse>>(
        `/v1/appointments/${appointmentId}/cancel`,
        { reason },
        {
          headers: {
            'X-Correlation-ID': correlationId,
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      logger.info('Appointment cancelled', { correlationId, appointmentId, reason });

      return response;
    } catch (error) {
      logger.error('Failed to cancel appointment', { correlationId, error, appointmentId });
      throw this.normalizeError(error, 'Failed to cancel appointment');
    }
  }

  async listShowrooms(
    query: PaginationQuery & { search?: string; city?: string },
    correlationId: string,
  ): Promise<ApiResponse<ShowroomResponse[]>> {
    try {
      const params = new URLSearchParams({
        ...(query.page !== undefined && { page: String(query.page) }),
        ...(query.limit !== undefined && { limit: String(query.limit) }),
        ...(query.search && { search: query.search }),
        ...(query.city && { city: query.city }),
      }).toString();

      const response = await this.http.get<ApiResponse<ShowroomResponse[]>>(
        `/v1/showrooms?${params}`,
        { headers: { 'X-Correlation-ID': correlationId } },
      );

      logger.debug('Fetched showroom list', {
        correlationId,
        total: response.data?.length,
      });

      return response;
    } catch (error) {
      logger.error('Failed to list showrooms', { correlationId, error, query });
      throw this.normalizeError(error, 'Failed to list showrooms');
    }
  }

  async getShowroomById(
    showroomId: string,
    correlationId: string,
  ): Promise<ApiResponse<ShowroomResponse>> {
    try {
      const response = await this.http.get<ApiResponse<ShowroomResponse>>(
        `/v1/showrooms/${showroomId}`,
        { headers: { 'X-Correlation-ID': correlationId } },
      );

      logger.debug('Fetched showroom by ID', { correlationId, showroomId });

      return response;
    } catch (error) {
      logger.error('Failed to fetch showroom', { correlationId, error, showroomId });
      throw this.normalizeError(error, 'Failed to fetch showroom');
    }
  }

  async getConsultantSlots(
    consultantId: string,
    date: string,
    correlationId: string,
    authToken: string,
  ): Promise<ApiResponse<AvailableSlot[]>> {
    try {
      const response = await this.http.get<ApiResponse<AvailableSlot[]>>(
        `/v1/appointments/consultants/${consultantId}/slots?date=${encodeURIComponent(date)}`,
        {
          headers: {
            'X-Correlation-ID': correlationId,
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      logger.debug('Fetched consultant slots', { correlationId, consultantId, date });

      return response;
    } catch (error) {
      logger.error('Failed to fetch consultant slots', {
        correlationId,
        error,
        consultantId,
        date,
      });
      throw this.normalizeError(error, 'Failed to fetch consultant slots');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.http.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  private normalizeError(error: unknown, fallbackMessage: string): AppError {
    if (error instanceof AppError) return error;

    if (typeof error === 'object' && error !== null && 'response' in error) {
      const httpError = error as {
        response?: { status?: number; data?: { message?: string; code?: string } };
      };
      const status = httpError.response?.status ?? 502;
      const message = httpError.response?.data?.message ?? fallbackMessage;
      const code = httpError.response?.data?.code ?? 'APPOINTMENT_SERVICE_ERROR';
      return new AppError(message, status, code);
    }

    return new AppError(fallbackMessage, 502, 'APPOINTMENT_SERVICE_UNAVAILABLE');
  }
}