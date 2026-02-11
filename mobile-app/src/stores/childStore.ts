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
import { childService, CreateChildRequest, UpdateChildRequest } from '../services/childService';

interface ChildState {
  // Data
  profile: ChildProfile | null;
  children: ChildProfile[];
  selectedChildId: string | null;
  growthMeasurements: GrowthMeasurement[];
  milestones: DevelopmentMilestone[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // API Actions
  fetchChildren: () => Promise<void>;
  fetchChild: (childId: string) => Promise<void>;
  createChild: (data: CreateChildRequest) => Promise<ChildProfile>;
  updateChildApi: (childId: string, data: UpdateChildRequest) => Promise<ChildProfile>;
  deleteChild: (childId: string) => Promise<void>;
  selectChild: (childId: string) => void;
  
  // Local Actions
  setProfile: (profile: ChildProfile) => void;
  updateProfile: (updates: Partial<ChildProfile>) => void;
  
  // Growth measurements
  addGrowthMeasurement: (measurement: GrowthMeasurement) => void;
  updateGrowthMeasurement: (id: string, updates: Partial<GrowthMeasurement>) => void;
  
  // Milestones
  updateMilestone: (id: string, achievedDate: string) => void;
  
  // Utility
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
      children: [],
      selectedChildId: null,
      growthMeasurements: [],
      milestones: [],
      isLoading: false,
      error: null,

      // Fetch all children from API
      fetchChildren: async () => {
        set({ isLoading: true, error: null });
        try {
          const children = await childService.getChildren();
          const currentSelectedId = get().selectedChildId;
          
          // Find currently selected child in new data, or default to first
          let selectedChild = children.find(c => c.id === currentSelectedId);
          if (!selectedChild && children.length > 0) {
            selectedChild = children[0];
          }
          
          set({ 
            children, 
            profile: selectedChild || null,
            selectedChildId: selectedChild?.id || null,
            isLoading: false 
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch children';
          set({ error: message, isLoading: false });
        }
      },

      // Fetch single child from API
      fetchChild: async (childId: string) => {
        set({ isLoading: true, error: null });
        try {
          const child = await childService.getChild(childId);
          set({ profile: child, selectedChildId: childId, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch child';
          set({ error: message, isLoading: false });
        }
      },

      // Create new child via API
      createChild: async (data: CreateChildRequest) => {
        set({ isLoading: true, error: null });
        try {
          const child = await childService.createChild(data);
          set((state) => ({
            children: [child, ...state.children],
            profile: child,
            selectedChildId: child.id,
            isLoading: false,
          }));
          return child;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create child';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Update child via API
      updateChildApi: async (childId: string, data: UpdateChildRequest) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await childService.updateChild(childId, data);
          set((state) => ({
            children: state.children.map((c) => c.id === childId ? updated : c),
            profile: state.profile?.id === childId ? updated : state.profile,
            isLoading: false,
          }));
          return updated;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update child';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Delete child via API
      deleteChild: async (childId: string) => {
        set({ isLoading: true, error: null });
        try {
          await childService.deleteChild(childId);
          set((state) => {
            const newChildren = state.children.filter((c) => c.id !== childId);
            const needNewSelection = state.selectedChildId === childId;
            return {
              children: newChildren,
              profile: needNewSelection ? (newChildren[0] || null) : state.profile,
              selectedChildId: needNewSelection ? (newChildren[0]?.id || null) : state.selectedChildId,
              isLoading: false,
            };
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete child';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Select a child
      selectChild: (childId: string) => {
        const child = get().children.find((c) => c.id === childId);
        if (child) {
          set({ profile: child, selectedChildId: childId });
        }
      },

      // Set complete profile
      setProfile: (profile) => set({ profile }),

      // Update profile with partial data (local only)
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
        children: state.children,
        selectedChildId: state.selectedChildId,
        growthMeasurements: state.growthMeasurements,
        milestones: state.milestones,
      }),
    }
  )
);
