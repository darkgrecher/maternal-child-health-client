/**
 * Pregnancy Store
 * 
 * Zustand store for managing pregnancy profiles and related data.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PregnancyProfile, PregnancyCheckup, PregnancyMeasurement, ChildProfile } from '../types';
import { 
  pregnancyService, 
  CreatePregnancyRequest, 
  UpdatePregnancyRequest,
  ConvertToChildRequest,
  CreateCheckupRequest,
  CreateMeasurementRequest,
} from '../services/pregnancyService';

interface PregnancyState {
  // Data
  pregnancies: PregnancyProfile[];
  selectedPregnancyId: string | null;
  currentPregnancy: PregnancyProfile | null;
  viewedPregnancy: PregnancyProfile | null;  // The pregnancy being viewed (may be historical)
  viewedPregnancyId: string | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // API Actions
  fetchPregnancies: () => Promise<void>;
  fetchActivePregnancies: () => Promise<void>;
  fetchPregnancy: (pregnancyId: string) => Promise<void>;
  createPregnancy: (data: CreatePregnancyRequest) => Promise<PregnancyProfile>;
  updatePregnancy: (pregnancyId: string, data: UpdatePregnancyRequest) => Promise<PregnancyProfile>;
  deletePregnancy: (pregnancyId: string) => Promise<void>;
  selectPregnancy: (pregnancyId: string) => void;
  
  // View pregnancy (for viewing historical profiles)
  viewPregnancy: (pregnancyId: string) => void;
  viewActivePregnancy: () => void;
  isViewingCompleted: () => boolean;
  getActivePregnancy: () => PregnancyProfile | null;
  
  // Convert to child
  convertToChild: (pregnancyId: string, data: ConvertToChildRequest) => Promise<{ pregnancy: PregnancyProfile; child: ChildProfile }>;
  
  // Checkups
  addCheckup: (pregnancyId: string, data: CreateCheckupRequest) => Promise<PregnancyCheckup>;
  fetchCheckups: (pregnancyId: string) => Promise<PregnancyCheckup[]>;
  
  // Measurements
  addMeasurement: (pregnancyId: string, data: CreateMeasurementRequest) => Promise<PregnancyMeasurement>;
  fetchMeasurements: (pregnancyId: string) => Promise<PregnancyMeasurement[]>;
  
  // Symptoms
  saveSymptoms: (pregnancyId: string, data: { weekOfPregnancy: number; symptoms: string[]; notes?: string }) => Promise<any>;
  getSymptomsHistory: (pregnancyId: string) => Promise<any[]>;
  getTodaySymptoms: (pregnancyId: string) => Promise<any | null>;
  
  // Journal
  createJournalEntry: (pregnancyId: string, data: { weekOfPregnancy: number; title: string; content: string; mood?: string }) => Promise<any>;
  getJournalEntries: (pregnancyId: string) => Promise<any[]>;
  deleteJournalEntry: (pregnancyId: string, journalId: string) => Promise<void>;
  
  // Medical info
  updateMedicalConditions: (pregnancyId: string, conditions: string[]) => Promise<PregnancyProfile>;
  updateAllergies: (pregnancyId: string, allergies: string[]) => Promise<PregnancyProfile>;
  updateCurrentWeight: (pregnancyId: string, weight: number) => Promise<PregnancyProfile>;
  
  // Utility
  clearData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getActivePregnancies: () => PregnancyProfile[];
  getPregnancyWeekDisplay: (pregnancy?: PregnancyProfile | null) => { weeks: number; days: number };
  getTrimesterLabel: (trimester: number) => string;
  getDaysUntilDelivery: (pregnancy?: PregnancyProfile | null) => number;
}

/**
 * Calculate weeks and days from expected delivery date
 */
const calculateWeekDisplay = (expectedDeliveryDate: string): { weeks: number; days: number } => {
  const today = new Date();
  const edd = new Date(expectedDeliveryDate);
  
  // Pregnancy is typically 40 weeks (280 days) from LMP
  // EDD is 40 weeks from LMP
  const msPerDay = 24 * 60 * 60 * 1000;
  const msPerWeek = 7 * msPerDay;
  
  // Days from today to EDD
  const daysUntilEDD = Math.floor((edd.getTime() - today.getTime()) / msPerDay);
  
  // Total pregnancy is 280 days, so current day = 280 - daysUntilEDD
  const currentDay = 280 - daysUntilEDD;
  
  const weeks = Math.floor(currentDay / 7);
  const days = currentDay % 7;
  
  return { weeks: Math.max(0, Math.min(42, weeks)), days: Math.max(0, days) };
};

/**
 * Calculate days until expected delivery
 */
const calculateDaysUntilDelivery = (expectedDeliveryDate: string): number => {
  const today = new Date();
  const edd = new Date(expectedDeliveryDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((edd.getTime() - today.getTime()) / msPerDay);
};

export const usePregnancyStore = create<PregnancyState>()(
  persist(
    (set, get) => ({
      // Initial state
      pregnancies: [],
      selectedPregnancyId: null,
      currentPregnancy: null,
      viewedPregnancy: null,
      viewedPregnancyId: null,
      isLoading: false,
      error: null,

      // Fetch all pregnancies
      fetchPregnancies: async () => {
        set({ isLoading: true, error: null });
        try {
          const pregnancies = await pregnancyService.getPregnancies();
          const currentSelectedId = get().selectedPregnancyId;
          
          // Find currently selected pregnancy, or default to first active
          let selectedPregnancy = pregnancies.find(p => p.id === currentSelectedId);
          if (!selectedPregnancy) {
            selectedPregnancy = pregnancies.find(p => p.status === 'active') || pregnancies[0];
          }
          
          set({ 
            pregnancies, 
            currentPregnancy: selectedPregnancy || null,
            selectedPregnancyId: selectedPregnancy?.id || null,
            viewedPregnancy: selectedPregnancy || null,
            viewedPregnancyId: selectedPregnancy?.id || null,
            isLoading: false 
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch pregnancies';
          set({ error: message, isLoading: false });
        }
      },

      // Fetch active pregnancies only
      fetchActivePregnancies: async () => {
        set({ isLoading: true, error: null });
        try {
          const pregnancies = await pregnancyService.getActivePregnancies();
          const currentSelectedId = get().selectedPregnancyId;
          
          let selectedPregnancy = pregnancies.find(p => p.id === currentSelectedId);
          if (!selectedPregnancy && pregnancies.length > 0) {
            selectedPregnancy = pregnancies[0];
          }
          
          // Merge with existing data (keep completed pregnancies)
          const existingPregnancies = get().pregnancies.filter(p => p.status !== 'active');
          const allPregnancies = [...pregnancies, ...existingPregnancies];
          
          set({ 
            pregnancies: allPregnancies,
            currentPregnancy: selectedPregnancy || null,
            selectedPregnancyId: selectedPregnancy?.id || null,
            isLoading: false 
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch active pregnancies';
          set({ error: message, isLoading: false });
        }
      },

      // Fetch single pregnancy
      fetchPregnancy: async (pregnancyId: string) => {
        set({ isLoading: true, error: null });
        try {
          const pregnancy = await pregnancyService.getPregnancy(pregnancyId);
          set((state) => ({
            pregnancies: state.pregnancies.map(p => p.id === pregnancyId ? pregnancy : p),
            currentPregnancy: pregnancy,
            selectedPregnancyId: pregnancyId,
            isLoading: false,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch pregnancy';
          set({ error: message, isLoading: false });
        }
      },

      // Create new pregnancy
      createPregnancy: async (data: CreatePregnancyRequest) => {
        set({ isLoading: true, error: null });
        try {
          const pregnancy = await pregnancyService.createPregnancy(data);
          set((state) => ({
            pregnancies: [pregnancy, ...state.pregnancies],
            currentPregnancy: pregnancy,
            selectedPregnancyId: pregnancy.id,
            isLoading: false,
          }));
          return pregnancy;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create pregnancy';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Update pregnancy
      updatePregnancy: async (pregnancyId: string, data: UpdatePregnancyRequest) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await pregnancyService.updatePregnancy(pregnancyId, data);
          set((state) => ({
            pregnancies: state.pregnancies.map(p => p.id === pregnancyId ? updated : p),
            currentPregnancy: state.currentPregnancy?.id === pregnancyId ? updated : state.currentPregnancy,
            isLoading: false,
          }));
          return updated;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update pregnancy';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Delete pregnancy
      deletePregnancy: async (pregnancyId: string) => {
        set({ isLoading: true, error: null });
        try {
          await pregnancyService.deletePregnancy(pregnancyId);
          set((state) => {
            const newPregnancies = state.pregnancies.filter(p => p.id !== pregnancyId);
            const needNewSelection = state.selectedPregnancyId === pregnancyId;
            const newSelection = needNewSelection 
              ? (newPregnancies.find(p => p.status === 'active') || newPregnancies[0]) 
              : state.currentPregnancy;
            return {
              pregnancies: newPregnancies,
              currentPregnancy: needNewSelection ? (newSelection || null) : state.currentPregnancy,
              selectedPregnancyId: needNewSelection ? (newSelection?.id || null) : state.selectedPregnancyId,
              isLoading: false,
            };
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete pregnancy';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Select a pregnancy
      selectPregnancy: (pregnancyId: string) => {
        const pregnancy = get().pregnancies.find(p => p.id === pregnancyId);
        if (pregnancy) {
          set({ 
            currentPregnancy: pregnancy, 
            selectedPregnancyId: pregnancyId,
            viewedPregnancy: pregnancy,
            viewedPregnancyId: pregnancyId,
          });
        }
      },

      // View a specific pregnancy (for viewing historical profiles without changing current)
      viewPregnancy: (pregnancyId: string) => {
        const pregnancy = get().pregnancies.find(p => p.id === pregnancyId);
        if (pregnancy) {
          set({ viewedPregnancy: pregnancy, viewedPregnancyId: pregnancyId });
        }
      },

      // Switch back to viewing the active pregnancy
      viewActivePregnancy: () => {
        const { currentPregnancy, selectedPregnancyId } = get();
        set({ 
          viewedPregnancy: currentPregnancy, 
          viewedPregnancyId: selectedPregnancyId 
        });
      },

      // Check if currently viewing a completed pregnancy
      isViewingCompleted: () => {
        const { viewedPregnancy, currentPregnancy } = get();
        if (!viewedPregnancy) return false;
        // Viewing completed if viewing different from current active, or current is completed
        const isCompleted = viewedPregnancy.expectedDeliveryDate 
          ? new Date() >= new Date(viewedPregnancy.expectedDeliveryDate)
          : false;
        return isCompleted || viewedPregnancy.id !== currentPregnancy?.id;
      },

      // Get the active (non-completed) pregnancy
      getActivePregnancy: () => {
        const { pregnancies } = get();
        return pregnancies.find(p => {
          if (!p.expectedDeliveryDate) return true;
          return new Date() < new Date(p.expectedDeliveryDate);
        }) || null;
      },

      // Convert pregnancy to child profile
      convertToChild: async (pregnancyId: string, data: ConvertToChildRequest) => {
        set({ isLoading: true, error: null });
        try {
          const result = await pregnancyService.convertToChild(pregnancyId, data);
          
          // Update the pregnancy in state
          set((state) => ({
            pregnancies: state.pregnancies.map(p => 
              p.id === pregnancyId ? result.pregnancy : p
            ),
            currentPregnancy: state.currentPregnancy?.id === pregnancyId 
              ? result.pregnancy 
              : state.currentPregnancy,
            isLoading: false,
          }));
          
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to convert pregnancy to child';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Add checkup
      addCheckup: async (pregnancyId: string, data: CreateCheckupRequest) => {
        set({ isLoading: true, error: null });
        try {
          const checkup = await pregnancyService.addCheckup(pregnancyId, data);
          
          // Update pregnancy with new checkup
          set((state) => {
            const updatePregnancy = (p: PregnancyProfile) => {
              if (p.id !== pregnancyId) return p;
              return {
                ...p,
                checkups: [checkup, ...(p.checkups || [])],
                currentWeight: data.weight || p.currentWeight,
              };
            };
            
            return {
              pregnancies: state.pregnancies.map(updatePregnancy),
              currentPregnancy: state.currentPregnancy ? updatePregnancy(state.currentPregnancy) : null,
              isLoading: false,
            };
          });
          
          return checkup;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to add checkup';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Fetch checkups
      fetchCheckups: async (pregnancyId: string) => {
        try {
          const checkups = await pregnancyService.getCheckups(pregnancyId);
          
          // Update pregnancy with checkups
          set((state) => {
            const updatePregnancy = (p: PregnancyProfile) => {
              if (p.id !== pregnancyId) return p;
              return { ...p, checkups };
            };
            
            return {
              pregnancies: state.pregnancies.map(updatePregnancy),
              currentPregnancy: state.currentPregnancy ? updatePregnancy(state.currentPregnancy) : null,
            };
          });
          
          return checkups;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch checkups';
          set({ error: message });
          throw error;
        }
      },

      // Add measurement
      addMeasurement: async (pregnancyId: string, data: CreateMeasurementRequest) => {
        set({ isLoading: true, error: null });
        try {
          const measurement = await pregnancyService.addMeasurement(pregnancyId, data);
          
          // Update pregnancy with new measurement
          set((state) => {
            const updatePregnancy = (p: PregnancyProfile) => {
              if (p.id !== pregnancyId) return p;
              return {
                ...p,
                measurements: [measurement, ...(p.measurements || [])],
                currentWeight: data.weight,
              };
            };
            
            return {
              pregnancies: state.pregnancies.map(updatePregnancy),
              currentPregnancy: state.currentPregnancy ? updatePregnancy(state.currentPregnancy) : null,
              isLoading: false,
            };
          });
          
          return measurement;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to add measurement';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Fetch measurements
      fetchMeasurements: async (pregnancyId: string) => {
        try {
          const measurements = await pregnancyService.getMeasurements(pregnancyId);
          
          // Update pregnancy with measurements
          set((state) => {
            const updatePregnancy = (p: PregnancyProfile) => {
              if (p.id !== pregnancyId) return p;
              return { ...p, measurements };
            };
            
            return {
              pregnancies: state.pregnancies.map(updatePregnancy),
              currentPregnancy: state.currentPregnancy ? updatePregnancy(state.currentPregnancy) : null,
            };
          });
          
          return measurements;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch measurements';
          set({ error: message });
          throw error;
        }
      },

      // ============================================================================
      // SYMPTOMS
      // ============================================================================

      // Save symptoms for today
      saveSymptoms: async (pregnancyId: string, data: { weekOfPregnancy: number; symptoms: string[]; notes?: string }) => {
        set({ isLoading: true, error: null });
        try {
          const result = await pregnancyService.saveSymptoms(pregnancyId, data);
          set({ isLoading: false });
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to save symptoms';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Get symptoms history
      getSymptomsHistory: async (pregnancyId: string) => {
        try {
          return await pregnancyService.getSymptomsHistory(pregnancyId);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch symptoms history';
          set({ error: message });
          throw error;
        }
      },

      // Get today's symptoms
      getTodaySymptoms: async (pregnancyId: string) => {
        try {
          return await pregnancyService.getTodaySymptoms(pregnancyId);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch today symptoms';
          set({ error: message });
          throw error;
        }
      },

      // ============================================================================
      // JOURNAL
      // ============================================================================

      // Create journal entry
      createJournalEntry: async (pregnancyId: string, data: { weekOfPregnancy: number; title: string; content: string; mood?: string }) => {
        set({ isLoading: true, error: null });
        try {
          const result = await pregnancyService.createJournalEntry(pregnancyId, data);
          set({ isLoading: false });
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create journal entry';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Get journal entries
      getJournalEntries: async (pregnancyId: string) => {
        try {
          return await pregnancyService.getJournalEntries(pregnancyId);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch journal entries';
          set({ error: message });
          throw error;
        }
      },

      // Delete journal entry
      deleteJournalEntry: async (pregnancyId: string, journalId: string) => {
        set({ isLoading: true, error: null });
        try {
          await pregnancyService.deleteJournalEntry(pregnancyId, journalId);
          set({ isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete journal entry';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // ============================================================================
      // MEDICAL INFO
      // ============================================================================

      // Update medical conditions
      updateMedicalConditions: async (pregnancyId: string, conditions: string[]) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await pregnancyService.updateMedicalConditions(pregnancyId, conditions);
          set((state) => ({
            pregnancies: state.pregnancies.map(p => p.id === pregnancyId ? updated : p),
            currentPregnancy: state.currentPregnancy?.id === pregnancyId ? updated : state.currentPregnancy,
            isLoading: false,
          }));
          return updated;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update medical conditions';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Update allergies
      updateAllergies: async (pregnancyId: string, allergies: string[]) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await pregnancyService.updateAllergies(pregnancyId, allergies);
          set((state) => ({
            pregnancies: state.pregnancies.map(p => p.id === pregnancyId ? updated : p),
            currentPregnancy: state.currentPregnancy?.id === pregnancyId ? updated : state.currentPregnancy,
            isLoading: false,
          }));
          return updated;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update allergies';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Update weight
      updateCurrentWeight: async (pregnancyId: string, weight: number) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await pregnancyService.updateWeight(pregnancyId, weight);
          set((state) => ({
            pregnancies: state.pregnancies.map(p => p.id === pregnancyId ? updated : p),
            currentPregnancy: state.currentPregnancy?.id === pregnancyId ? updated : state.currentPregnancy,
            isLoading: false,
          }));
          return updated;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update weight';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Clear data
      clearData: () => set({
        pregnancies: [],
        selectedPregnancyId: null,
        currentPregnancy: null,
        error: null,
      }),

      // Set loading state
      setLoading: (loading) => set({ isLoading: loading }),

      // Set error state
      setError: (error) => set({ error }),

      // Get active pregnancies
      getActivePregnancies: () => {
        return get().pregnancies.filter(p => p.status === 'active');
      },

      // Get pregnancy week display
      getPregnancyWeekDisplay: (pregnancy?: PregnancyProfile | null) => {
        const p = pregnancy || get().currentPregnancy;
        if (!p) return { weeks: 0, days: 0 };
        return calculateWeekDisplay(p.expectedDeliveryDate);
      },

      // Get trimester label
      getTrimesterLabel: (trimester: number) => {
        switch (trimester) {
          case 1: return 'First Trimester';
          case 2: return 'Second Trimester';
          case 3: return 'Third Trimester';
          default: return 'Unknown';
        }
      },

      // Get days until delivery
      getDaysUntilDelivery: (pregnancy?: PregnancyProfile | null) => {
        const p = pregnancy || get().currentPregnancy;
        if (!p) return 0;
        return calculateDaysUntilDelivery(p.expectedDeliveryDate);
      },
    }),
    {
      name: 'pregnancy-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pregnancies: state.pregnancies,
        selectedPregnancyId: state.selectedPregnancyId,
        currentPregnancy: state.currentPregnancy,
      }),
    }
  )
);
