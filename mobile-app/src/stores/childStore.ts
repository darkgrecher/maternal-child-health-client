/**
 * Child Store
 * 
 * Zustand store for managing child profile and related data.
 * Handles offline-first data storage and sync status.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChildProfile, GrowthMeasurement, DevelopmentMilestone, SyncStatus } from '../types';
import {
  mockChildProfile,
  mockGrowthMeasurements,
  mockMilestones,
} from '../data/mockData';

interface ChildState {
  // Data
  profile: ChildProfile | null;
  growthMeasurements: GrowthMeasurement[];
  milestones: DevelopmentMilestone[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setProfile: (profile: ChildProfile) => void;
  updateProfile: (updates: Partial<ChildProfile>) => void;
  
  // Growth measurements
  addGrowthMeasurement: (measurement: GrowthMeasurement) => void;
  updateGrowthMeasurement: (id: string, updates: Partial<GrowthMeasurement>) => void;
  
  // Milestones
  updateMilestone: (id: string, achievedDate: string) => void;
  
  // Utility
  loadMockData: () => void;
  clearData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getLatestMeasurement: () => GrowthMeasurement | null;
  getChildAgeInMonths: () => number;
  getChildAgeDisplay: () => { months: number; weeks: number };
}

/**
 * Calculate age in months from date of birth
 */
const calculateAgeInMonths = (dateOfBirth: string): number => {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + 
                 (today.getMonth() - birth.getMonth());
  return Math.max(0, months);
};

/**
 * Calculate age display with months and weeks
 */
const calculateAgeDisplay = (dateOfBirth: string): { months: number; weeks: number } => {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  const diffTime = today.getTime() - birth.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30);
  const remainingDays = diffDays % 30;
  const weeks = Math.floor(remainingDays / 7);
  return { months, weeks };
};

export const useChildStore = create<ChildState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      growthMeasurements: [],
      milestones: [],
      isLoading: false,
      error: null,

      // Set complete profile
      setProfile: (profile) => set({ profile }),

      // Update profile with partial data
      updateProfile: (updates) => set((state) => ({
        profile: state.profile 
          ? { 
              ...state.profile, 
              ...updates, 
              updatedAt: new Date().toISOString(),
              syncStatus: 'pending' as SyncStatus,
            } 
          : null,
      })),

      // Add new growth measurement
      addGrowthMeasurement: (measurement) => set((state) => ({
        growthMeasurements: [...state.growthMeasurements, {
          ...measurement,
          syncStatus: 'pending' as SyncStatus,
        }],
      })),

      // Update existing growth measurement
      updateGrowthMeasurement: (id, updates) => set((state) => ({
        growthMeasurements: state.growthMeasurements.map((m) =>
          m.id === id 
            ? { ...m, ...updates, syncStatus: 'pending' as SyncStatus } 
            : m
        ),
      })),

      // Update milestone as achieved
      updateMilestone: (id, achievedDate) => set((state) => ({
        milestones: state.milestones.map((m) =>
          m.id === id 
            ? { ...m, achievedDate, status: 'achieved' as const } 
            : m
        ),
      })),

      // Load mock data for development
      loadMockData: () => set({
        profile: mockChildProfile,
        growthMeasurements: mockGrowthMeasurements,
        milestones: mockMilestones,
        isLoading: false,
        error: null,
      }),

      // Clear all data
      clearData: () => set({
        profile: null,
        growthMeasurements: [],
        milestones: [],
        error: null,
      }),

      // Set loading state
      setLoading: (loading) => set({ isLoading: loading }),

      // Set error state
      setError: (error) => set({ error }),

      // Get latest growth measurement
      getLatestMeasurement: () => {
        const { growthMeasurements } = get();
        if (growthMeasurements.length === 0) return null;
        return growthMeasurements[growthMeasurements.length - 1];
      },

      // Get child age in months
      getChildAgeInMonths: () => {
        const { profile } = get();
        if (!profile) return 0;
        return calculateAgeInMonths(profile.dateOfBirth);
      },

      // Get child age display
      getChildAgeDisplay: () => {
        const { profile } = get();
        if (!profile) return { months: 0, weeks: 0 };
        return calculateAgeDisplay(profile.dateOfBirth);
      },
    }),
    {
      name: 'child-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        growthMeasurements: state.growthMeasurements,
        milestones: state.milestones,
      }),
    }
  )
);
