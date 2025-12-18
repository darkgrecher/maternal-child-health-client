/**
 * Vaccine Store
 * 
 * Zustand store for managing vaccination records and schedules.
 * Tracks immunization progress based on Sri Lanka's national schedule.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  vaccineService,
  Vaccine,
  VaccinationRecord,
  VaccinationStatistics,
  ChildVaccinationData,
  AdministerVaccineRequest,
} from '../services/vaccineService';

export interface VaccineRecordGroup {
  ageGroup: string;
  records: VaccinationRecord[];
}

interface VaccineState {
  // Data
  vaccines: Vaccine[];
  vaccinationData: ChildVaccinationData | null;
  currentChildId: string | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // API Actions
  fetchVaccines: () => Promise<void>;
  fetchChildVaccinationRecords: (childId: string) => Promise<void>;
  administerVaccine: (childId: string, vaccineId: string, data?: AdministerVaccineRequest) => Promise<void>;
  
  // Utility
  clearData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values from vaccinationData
  getVaccinesByAgeGroup: () => VaccineRecordGroup[];
  getCompletedCount: () => number;
  getTotalCount: () => number;
  getCompletionPercentage: () => number;
  getOverdueCount: () => number;
  getPendingCount: () => number;
  getNextVaccine: () => VaccinationRecord | null;
  getStatistics: () => VaccinationStatistics | null;
}

export const useVaccineStore = create<VaccineState>()(
  persist(
    (set, get) => ({
      // Initial state
      vaccines: [],
      vaccinationData: null,
      currentChildId: null,
      isLoading: false,
      error: null,

      // Fetch all vaccines (schedule reference)
      fetchVaccines: async () => {
        set({ isLoading: true, error: null });
        try {
          const vaccines = await vaccineService.getAllVaccines();
          set({ vaccines, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch vaccines';
          set({ error: message, isLoading: false });
        }
      },

      // Fetch vaccination records for a child
      fetchChildVaccinationRecords: async (childId: string) => {
        set({ isLoading: true, error: null, currentChildId: childId });
        try {
          const data = await vaccineService.getChildVaccinationRecords(childId);
          set({ vaccinationData: data, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch vaccination records';
          set({ error: message, isLoading: false });
        }
      },

      // Administer a vaccine
      administerVaccine: async (childId: string, vaccineId: string, data: AdministerVaccineRequest = {}) => {
        set({ isLoading: true, error: null });
        try {
          await vaccineService.administerVaccine(childId, vaccineId, data);
          // Refresh the vaccination records
          const updatedData = await vaccineService.getChildVaccinationRecords(childId);
          set({ vaccinationData: updatedData, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to administer vaccine';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Clear all data
      clearData: () => set({
        vaccines: [],
        vaccinationData: null,
        currentChildId: null,
        error: null,
      }),

      // Set loading state
      setLoading: (loading) => set({ isLoading: loading }),

      // Set error state
      setError: (error) => set({ error }),

      // Get vaccines grouped by age from vaccination data
      getVaccinesByAgeGroup: () => {
        const { vaccinationData } = get();
        if (!vaccinationData) return [];

        const groups: Record<string, VaccinationRecord[]> = {};
        for (const record of vaccinationData.schedule) {
          const ageGroup = record.vaccine.ageGroup;
          if (!groups[ageGroup]) {
            groups[ageGroup] = [];
          }
          groups[ageGroup].push(record);
        }

        // Sort by vaccine sortOrder within each group
        return Object.entries(groups).map(([ageGroup, records]) => ({
          ageGroup,
          records: records.sort((a, b) => a.vaccine.sortOrder - b.vaccine.sortOrder),
        }));
      },

      // Get count of completed vaccines
      getCompletedCount: () => {
        const { vaccinationData } = get();
        return vaccinationData?.statistics.completed ?? 0;
      },

      // Get total vaccine count
      getTotalCount: () => {
        const { vaccinationData } = get();
        return vaccinationData?.statistics.total ?? 0;
      },

      // Get completion percentage
      getCompletionPercentage: () => {
        const { vaccinationData } = get();
        return vaccinationData?.statistics.completionPercentage ?? 0;
      },

      // Get count of overdue vaccines
      getOverdueCount: () => {
        const { vaccinationData } = get();
        return vaccinationData?.statistics.overdue ?? 0;
      },

      // Get count of pending vaccines
      getPendingCount: () => {
        const { vaccinationData } = get();
        return vaccinationData?.statistics.pending ?? 0;
      },

      // Get next upcoming vaccine
      getNextVaccine: () => {
        const { vaccinationData } = get();
        return vaccinationData?.nextVaccine ?? null;
      },

      // Get full statistics
      getStatistics: () => {
        const { vaccinationData } = get();
        return vaccinationData?.statistics ?? null;
      },
    }),
    {
      name: 'vaccine-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        vaccines: state.vaccines,
        currentChildId: state.currentChildId,
        // Don't persist vaccinationData - always fetch fresh
      }),
    }
  )
);
