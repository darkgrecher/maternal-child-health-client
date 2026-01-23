/**
 * Emergency Contact Service
 * 
 * API service for managing emergency contacts.
 */

import { apiClient } from './apiClient';

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  role: string;
  phone: string;
  isPrimary: boolean;
  isDefault: boolean;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmergencyContactRequest {
  name: string;
  role: string;
  phone: string;
  isPrimary?: boolean;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateEmergencyContactRequest {
  name?: string;
  role?: string;
  phone?: string;
  isPrimary?: boolean;
  email?: string;
  address?: string;
  notes?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Emergency Contact Service for API operations
 */
export const emergencyContactService = {
  /**
   * Get all emergency contacts for the user
   */
  async getContacts(): Promise<EmergencyContact[]> {
    const response = await apiClient.get<ApiResponse<EmergencyContact[]>>(
      '/emergency-contacts'
    );
    return response.data;
  },

  /**
   * Get a single emergency contact
   */
  async getContact(id: string): Promise<EmergencyContact> {
    const response = await apiClient.get<ApiResponse<EmergencyContact>>(
      `/emergency-contacts/${id}`
    );
    return response.data;
  },

  /**
   * Create a new emergency contact
   */
  async createContact(data: CreateEmergencyContactRequest): Promise<EmergencyContact> {
    const response = await apiClient.post<ApiResponse<EmergencyContact>>(
      '/emergency-contacts',
      data
    );
    return response.data;
  },

  /**
   * Update an emergency contact
   */
  async updateContact(id: string, data: UpdateEmergencyContactRequest): Promise<EmergencyContact> {
    const response = await apiClient.put<ApiResponse<EmergencyContact>>(
      `/emergency-contacts/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Delete an emergency contact
   */
  async deleteContact(id: string): Promise<void> {
    await apiClient.delete(`/emergency-contacts/${id}`);
  },

  /**
   * Set a contact as primary
   */
  async setPrimaryContact(id: string): Promise<EmergencyContact> {
    const response = await apiClient.put<ApiResponse<EmergencyContact>>(
      `/emergency-contacts/${id}/primary`
    );
    return response.data;
  },
};
