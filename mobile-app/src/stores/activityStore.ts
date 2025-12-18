/**
 * Activity Store
 * 
 * Zustand store for managing child activity records.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  activityService,
  Activity,
  CreateActivityRequest,
  UpdateActivityRequest,
} from '../services/activityService';

interface ActivityState {
  // Data
  activities: Activity[];
  currentChildId: string | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // API Actions
  fetchActivities: (childId: string) => Promise<void>;
  createActivity: (childId: string, data: CreateActivityRequest) => Promise<void>;
  updateActivity: (id: string, data: UpdateActivityRequest) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  
  // Utility
  clearData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getActivitiesByType: (type: Activity['type']) => Activity[];
  getRecentActivities: (limit?: number) => Activity[];
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      // Initial state
      activities: [],
      currentChildId: null,
      isLoading: false,
      error: null,

      // Fetch all activities for a child
      fetchActivities: async (childId: string) => {
        const { currentChildId } = get();
        
        // Clear old data if switching to a different child
        if (currentChildId && currentChildId !== childId) {
          set({ activities: [] });
        }
        
        set({ isLoading: true, error: null, currentChildId: childId });
        try {
          const activities = await activityService.getChildActivities(childId);
          set({ activities, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || error.message || 'Failed to fetch activities',
            isLoading: false 
          });
        }
      },

      // Create a new activity
      createActivity: async (childId: string, data: CreateActivityRequest) => {
        set({ isLoading: true, error: null });
        try {
          const newActivity = await activityService.createActivity(childId, data);
          set(state => ({ 
            activities: [newActivity, ...state.activities],
            isLoading: false 
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || error.message || 'Failed to create activity',
            isLoading: false 
          });
          throw error;
        }
      },

      // Update an activity
      updateActivity: async (id: string, data: UpdateActivityRequest) => {
        set({ isLoading: true, error: null });
        try {
          const updatedActivity = await activityService.updateActivity(id, data);
          set(state => ({
            activities: state.activities.map(a => 
              a.id === id ? updatedActivity : a
            ),
            isLoading: false
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || error.message || 'Failed to update activity',
            isLoading: false 
          });
          throw error;
        }
      },

      // Delete an activity
      deleteActivity: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await activityService.deleteActivity(id);
          set(state => ({
            activities: state.activities.filter(a => a.id !== id),
            isLoading: false
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || error.message || 'Failed to delete activity',
            isLoading: false 
          });
          throw error;
        }
      },

      // Clear all data
      clearData: () => set({ 
        activities: [], 
        currentChildId: null, 
        error: null 
      }),

      // Set loading state
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // Set error
      setError: (error: string | null) => set({ error }),

      // Get activities by type
      getActivitiesByType: (type: Activity['type']) => {
        const { activities } = get();
        return activities.filter(a => a.type === type);
      },

      // Get recent activities
      getRecentActivities: (limit = 4) => {
        const { activities } = get();
        return activities
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
      },
    }),
    {
      name: 'activity-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activities: state.activities,
        currentChildId: state.currentChildId,
      }),
    }
  )
);
