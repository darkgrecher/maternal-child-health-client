/**
 * Appointment Service
 *
 * Handles all API calls related to appointments.
 */

import { apiClient } from './apiClient';

// Appointment types matching backend enum
export type AppointmentType =
  | 'vaccination'
  | 'growth_check'
  | 'development_check'
  | 'general_checkup'
  | 'specialist'
  | 'emergency';

// Appointment status matching backend enum
export type AppointmentStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'missed';

// Appointment interface
export interface Appointment {
  id: string;
  childId: string;
  title: string;
  type: AppointmentType;
  dateTime: string;
  duration: number | null;
  location: string;
  address: string | null;
  providerName: string | null;
  providerRole: string | null;
  providerPhone: string | null;
  status: AppointmentStatus;
  notes: string | null;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
  child?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// Create appointment DTO
export interface CreateAppointmentDto {
  title: string;
  type: AppointmentType;
  dateTime: string;
  duration?: number;
  location: string;
  address?: string;
  providerName?: string;
  providerRole?: string;
  providerPhone?: string;
  notes?: string;
}

// Update appointment DTO
export interface UpdateAppointmentDto {
  title?: string;
  type?: AppointmentType;
  dateTime?: string;
  duration?: number;
  location?: string;
  address?: string;
  providerName?: string;
  providerRole?: string;
  providerPhone?: string;
  status?: AppointmentStatus;
  notes?: string;
  reminderSent?: boolean;
}

// Response for child appointments
export interface ChildAppointmentsResponse {
  childId: string;
  childName: string;
  appointments: Appointment[];
  upcoming: Appointment[];
  past: Appointment[];
  summary: {
    totalAppointments: number;
    upcomingCount: number;
    completedCount: number;
    cancelledCount: number;
    nextAppointment: Appointment | null;
  };
}

class AppointmentService {
  /**
   * Get all appointments for a child
   */
  async getChildAppointments(childId: string): Promise<ChildAppointmentsResponse> {
    return apiClient.get<ChildAppointmentsResponse>(`/appointments/child/${childId}`);
  }

  /**
   * Get upcoming appointments for the current user
   */
  async getUpcomingAppointments(): Promise<Appointment[]> {
    return apiClient.get<Appointment[]>('/appointments/upcoming');
  }

  /**
   * Get a single appointment by ID
   */
  async getAppointment(appointmentId: string): Promise<Appointment> {
    return apiClient.get<Appointment>(`/appointments/${appointmentId}`);
  }

  /**
   * Create a new appointment for a child
   */
  async createAppointment(
    childId: string,
    data: CreateAppointmentDto
  ): Promise<Appointment> {
    return apiClient.post<Appointment>(`/appointments/child/${childId}`, data);
  }

  /**
   * Update an appointment
   */
  async updateAppointment(
    appointmentId: string,
    data: UpdateAppointmentDto
  ): Promise<Appointment> {
    return apiClient.patch<Appointment>(`/appointments/${appointmentId}`, data);
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string): Promise<Appointment> {
    return apiClient.patch<Appointment>(`/appointments/${appointmentId}/cancel`, {});
  }

  /**
   * Mark an appointment as completed
   */
  async completeAppointment(appointmentId: string): Promise<Appointment> {
    return apiClient.patch<Appointment>(`/appointments/${appointmentId}/complete`, {});
  }

  /**
   * Delete an appointment
   */
  async deleteAppointment(appointmentId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/appointments/${appointmentId}`);
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
