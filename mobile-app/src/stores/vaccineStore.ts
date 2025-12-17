/**
 * Vaccine Store
 * 
 * Zustand store for managing vaccination records and schedules.
 * Tracks immunization progress based on Sri Lanka's national schedule.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vaccine, VaccineGroup, VaccinationStatus, SyncStatus } from '../types';
import { mockVaccines } from '../data/mockData';

interface VaccineState {
  // Data
  vaccines: Vaccine[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setVaccines: (vaccines: Vaccine[]) => void;
  updateVaccine: (id: string, updates: Partial<Vaccine>) => void;
  markVaccineCompleted: (id: string, administeredDate: string, details?: Partial<Vaccine>) => void;
  
  // Utility
  loadMockData: () => void;
  clearData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getVaccinesByAgeGroup: () => VaccineGroup[];
  getCompletedCount: () => number;
  getTotalCount: () => number;
  getCompletionPercentage: () => number;
  getOverdueCount: () => number;
  getDueVaccines: () => Vaccine[];
  getNextVaccine: () => Vaccine | null;
}

/**
 * Group vaccines by age milestone
 */
const groupVaccinesByAge = (vaccines: Vaccine[]): VaccineGroup[] => {
  const ageLabels: { [key: number]: string } = {
    0: 'Birth',
    2: '2 months',
    4: '4 months',
    6: '6 months',
    9: '9 months',
    12: '12 months',
    18: '18 months',
  };

  const groups: { [key: number]: Vaccine[] } = {};
  
  vaccines.forEach((vaccine) => {
    const age = vaccine.scheduledAgeMonths;
    if (!groups[age]) {
      groups[age] = [];
    }
    groups[age].push(vaccine);
  });

  return Object.entries(groups)
    .map(([ageStr, vaccineList]) => ({
      ageMonths: parseInt(ageStr),
      ageLabel: ageLabels[parseInt(ageStr)] || `${ageStr} months`,
      vaccines: vaccineList,
    }))
    .sort((a, b) => a.ageMonths - b.ageMonths);
};

export const useVaccineStore = create<VaccineState>()(
  persist(
    (set, get) => ({
      // Initial state
      vaccines: [],
      isLoading: false,
      error: null,

      // Set all vaccines
      setVaccines: (vaccines) => set({ vaccines }),

      // Update a specific vaccine
      updateVaccine: (id, updates) => set((state) => ({
        vaccines: state.vaccines.map((v) =>
          v.id === id 
            ? { ...v, ...updates, syncStatus: 'pending' as SyncStatus } 
            : v
        ),
      })),

      // Mark vaccine as completed
      markVaccineCompleted: (id, administeredDate, details = {}) => set((state) => ({
        vaccines: state.vaccines.map((v) =>
          v.id === id
            ? {
                ...v,
                ...details,
                administeredDate,
                status: 'completed' as VaccinationStatus,
                syncStatus: 'pending' as SyncStatus,
              }
            : v
        ),
      })),

      // Load mock data for development
      loadMockData: () => set({
        vaccines: mockVaccines,
        isLoading: false,
        error: null,
      }),

      // Clear all data
      clearData: () => set({
        vaccines: [],
        error: null,
      }),

      // Set loading state
      setLoading: (loading) => set({ isLoading: loading }),

      // Set error state
      setError: (error) => set({ error }),

      // Get vaccines grouped by age
      getVaccinesByAgeGroup: () => {
        const { vaccines } = get();
        return groupVaccinesByAge(vaccines);
      },

      // Get count of completed vaccines
      getCompletedCount: () => {
        const { vaccines } = get();
        return vaccines.filter((v) => v.status === 'completed').length;
      },

      // Get total vaccine count
      getTotalCount: () => {
        const { vaccines } = get();
        return vaccines.length;
      },

      // Get completion percentage
      getCompletionPercentage: () => {
        const { vaccines } = get();
        if (vaccines.length === 0) return 0;
        const completed = vaccines.filter((v) => v.status === 'completed').length;
        return Math.round((completed / vaccines.length) * 100);
      },

      // Get count of overdue vaccines
      getOverdueCount: () => {
        const { vaccines } = get();
        return vaccines.filter((v) => v.status === 'overdue' || v.status === 'due').length;
      },

      // Get list of due vaccines
      getDueVaccines: () => {
        const { vaccines } = get();
        return vaccines.filter((v) => v.status === 'due' || v.status === 'overdue');
      },

      // Get next upcoming vaccine
      getNextVaccine: () => {
        const { vaccines } = get();
        const upcomingOrDue = vaccines
          .filter((v) => v.status === 'due' || v.status === 'upcoming')
          .sort((a, b) => a.scheduledAgeMonths - b.scheduledAgeMonths);
        return upcomingOrDue[0] || null;
      },
    }),
    {
      name: 'vaccine-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        vaccines: state.vaccines,
      }),
    }
  )
);
