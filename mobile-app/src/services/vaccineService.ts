/**
 * Vaccine API Service
 * 
 * API client methods for vaccine schedule and vaccination records.
 */

import { apiClient } from './apiClient';

// Types
export interface Vaccine {
  id: string;
  name: string;
  shortName: string;
  description: string | null;
  scheduledAgeMonths: number;
  scheduledAgeDays: number | null;
  doseNumber: number;
  totalDoses: number;
  ageGroup: string;
  diseasesPrevented: string[];
  sideEffects: string[];
  contraindications: string[];
  sortOrder: number;
  isActive: boolean;
}

export type VaccinationStatus = 'pending' | 'completed' | 'overdue' | 'missed' | 'scheduled';

export interface VaccinationRecord {
  id: string | null;
  vaccineId: string;
  vaccine: Vaccine;
  childId: string;
  scheduledDate: string;
  administeredDate: string | null;
  administeredBy: string | null;
  location: string | null;
  batchNumber: string | null;
  notes: string | null;
  sideEffectsOccurred: string[];
  status: VaccinationStatus;
}

export interface VaccinationStatistics {
  completed: number;
  total: number;
  overdue: number;
  pending: number;
  completionPercentage: number;
}

export interface ChildVaccinationData {
  child: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
  schedule: VaccinationRecord[];
  statistics: VaccinationStatistics;
  nextVaccine: VaccinationRecord | null;
}

export interface VaccineAgeGroup {
  ageGroup: string;
  vaccines: Vaccine[];
}

export interface AdministerVaccineRequest {
  administeredDate?: string;
  administeredBy?: string;
  location?: string;
  batchNumber?: string;
  notes?: string;
  sideEffectsOccurred?: string[];
}

export const vaccineService = {
  /**
   * Get all vaccines in the schedule
   */
  async getAllVaccines(): Promise<Vaccine[]> {
    const response = await apiClient.get<{ success: boolean; data: Vaccine[] }>('/vaccines', { requiresAuth: false });
    return response.data;
  },

  /**
   * Get vaccines grouped by age
   */
  async getVaccinesByAgeGroup(): Promise<VaccineAgeGroup[]> {
    const response = await apiClient.get<{ success: boolean; data: VaccineAgeGroup[] }>('/vaccines/by-age-group', { requiresAuth: false });
    return response.data;
  },

  /**
   * Get vaccination schedule for a specific child
   */
  async getChildVaccinationRecords(childId: string): Promise<ChildVaccinationData> {
    const response = await apiClient.get<{ success: boolean; data: ChildVaccinationData }>(`/vaccines/child/${childId}`);
    return response.data;
  },

  /**
   * Mark a vaccine as administered
   */
  async administerVaccine(
    childId: string,
    vaccineId: string,
    data: AdministerVaccineRequest = {},
  ): Promise<VaccinationRecord> {
    const response = await apiClient.post<{ success: boolean; data: VaccinationRecord }>(
      `/vaccines/child/${childId}/administer/${vaccineId}`,
      data,
    );
    return response.data;
  },

  /**
   * Update a vaccination record
   */
  async updateVaccinationRecord(
    recordId: string,
    data: Partial<AdministerVaccineRequest> & { status?: VaccinationStatus },
  ): Promise<VaccinationRecord> {
    const response = await apiClient.patch<{ success: boolean; data: VaccinationRecord }>(
      `/vaccines/records/${recordId}`,
      data,
    );
    return response.data;
  },

  /**
   * Seed the vaccination schedule (development only)
   */
  async seedVaccineSchedule(): Promise<{ message: string; count: number }> {
    const response = await apiClient.post<{ success: boolean; data: { message: string; count: number } }>(
      '/vaccines/seed',
      {},
      { requiresAuth: false },
    );
    return response.data;
  },
};
