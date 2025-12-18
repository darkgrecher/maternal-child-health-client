/**
 * Child API Service
 * 
 * API client methods for child profile management.
 */

import { apiClient } from './apiClient';
import { ChildProfile } from '../types';

export interface CreateChildRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  chdrNumber?: string;
  photoUri?: string;
  birthWeight?: number;
  birthHeight?: number;
  birthHeadCircumference?: number;
  bloodType?: string;
  placeOfBirth?: string;
  deliveryType?: string;
  allergies?: string[];
  specialConditions?: string[];
  motherName?: string;
  fatherName?: string;
  emergencyContact?: string;
  address?: string;
}

export interface UpdateChildRequest extends Partial<CreateChildRequest> {}

export interface ChildApiResponse {
  id: string;
  chdrNumber: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  photoUri: string | null;
  birthWeight: number | null;
  birthHeight: number | null;
  birthHeadCircumference: number | null;
  bloodType: string;
  placeOfBirth: string | null;
  deliveryType: string | null;
  allergies: string[];
  specialConditions: string[];
  motherName: string | null;
  fatherName: string | null;
  emergencyContact: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert API response to ChildProfile format
 */
const mapToChildProfile = (data: ChildApiResponse): ChildProfile => ({
  id: data.id,
  chdrNumber: data.chdrNumber || '',
  firstName: data.firstName,
  lastName: data.lastName,
  dateOfBirth: data.dateOfBirth,
  gender: data.gender,
  photoUri: data.photoUri || undefined,
  birthWeight: data.birthWeight || 0,
  birthHeight: data.birthHeight || 0,
  birthHeadCircumference: data.birthHeadCircumference || undefined,
  bloodType: (data.bloodType as any) || 'unknown',
  placeOfBirth: data.placeOfBirth || undefined,
  deliveryType: (data.deliveryType as any) || undefined,
  allergies: data.allergies || [],
  specialConditions: data.specialConditions || [],
  motherName: data.motherName || '',
  fatherName: data.fatherName || '',
  emergencyContact: data.emergencyContact || '',
  address: data.address || undefined,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
  syncStatus: 'synced',
});

export const childService = {
  /**
   * Get all children for the current user
   */
  async getChildren(): Promise<ChildProfile[]> {
    const response = await apiClient.get<{ success: boolean; data: ChildApiResponse[] }>('/children');
    return response.data.map(mapToChildProfile);
  },

  /**
   * Get a specific child by ID
   */
  async getChild(childId: string): Promise<ChildProfile> {
    const response = await apiClient.get<{ success: boolean; data: ChildApiResponse }>(`/children/${childId}`);
    return mapToChildProfile(response.data);
  },

  /**
   * Create a new child profile
   */
  async createChild(data: CreateChildRequest): Promise<ChildProfile> {
    const response = await apiClient.post<{ success: boolean; data: ChildApiResponse }>('/children', data);
    return mapToChildProfile(response.data);
  },

  /**
   * Update a child profile
   */
  async updateChild(childId: string, data: UpdateChildRequest): Promise<ChildProfile> {
    const response = await apiClient.patch<{ success: boolean; data: ChildApiResponse }>(`/children/${childId}`, data);
    return mapToChildProfile(response.data);
  },

  /**
   * Delete a child profile
   */
  async deleteChild(childId: string): Promise<void> {
    await apiClient.delete<{ success: boolean; message: string }>(`/children/${childId}`);
  },
};
