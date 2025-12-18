/**
 * Growth Store
 * 
 * Zustand store for managing growth measurements and charts.
 * Tracks child growth data including weight, height, and head circumference.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  growthService,
  GrowthMeasurement,
  ChildGrowthData,
  ChartData,
  CreateGrowthMeasurementRequest,
  UpdateGrowthMeasurementRequest,
} from '../services/growthService';

interface GrowthState {
  // Data
  growthData: ChildGrowthData | null;
  chartData: ChartData | null;
  currentChildId: string | null;
  
  // Loading states
  isLoading: boolean;
  isChartLoading: boolean;
  error: string | null;
  
  // API Actions
  fetchGrowthData: (childId: string) => Promise<void>;
  fetchChartData: (childId: string, chartType: 'weight' | 'height' | 'head') => Promise<void>;
  addMeasurement: (childId: string, data: CreateGrowthMeasurementRequest) => Promise<void>;
  updateMeasurement: (measurementId: string, data: UpdateGrowthMeasurementRequest) => Promise<void>;
  deleteMeasurement: (measurementId: string) => Promise<void>;
  
  // Utility
  clearData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getLatestMeasurement: () => GrowthMeasurement | null;
  getMeasurements: () => GrowthMeasurement[];
}

export const useGrowthStore = create<GrowthState>()(
  persist(
    (set, get) => ({
      // Initial state
      growthData: null,
      chartData: null,
      currentChildId: null,
      isLoading: false,
      isChartLoading: false,
      error: null,

      // Fetch growth data for a child
      fetchGrowthData: async (childId: string) => {
        const { currentChildId } = get();
        
        // Clear old data if switching to a different child
        if (currentChildId && currentChildId !== childId) {
          set({ growthData: null, chartData: null });
        }
        
        set({ isLoading: true, error: null, currentChildId: childId });
        try {
          const data = await growthService.getChildMeasurements(childId);
          set({
            growthData: data,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to fetch growth data:', error);
          // Silently fail for mock data or non-existent children
          // This prevents showing errors when using mock data during development
          set({
            growthData: null,
            error: null, // Don't show error to user for missing child
            isLoading: false,
          });
        }
      },

      // Fetch chart data for visualization
      fetchChartData: async (childId: string, chartType: 'weight' | 'height' | 'head') => {
        const { currentChildId } = get();
        
        // Clear old chart data if switching to a different child
        if (currentChildId && currentChildId !== childId) {
          set({ chartData: null });
        }
        
        set({ isChartLoading: true, error: null });
        try {
          const data = await growthService.getChartData(childId, chartType);
          set({
            chartData: data,
            isChartLoading: false,
          });
        } catch (error) {
          console.error('Failed to fetch chart data:', error);
          // Silently fail for mock data or non-existent children
          set({
            chartData: null,
            error: null, // Don't show error to user for missing child
            isChartLoading: false,
          });
        }
      },

      // Add a new measurement
      addMeasurement: async (childId: string, data: CreateGrowthMeasurementRequest) => {
        set({ isLoading: true, error: null });
        try {
          await growthService.addMeasurement(childId, data);
          // Refresh growth data after adding
          await get().fetchGrowthData(childId);
        } catch (error) {
          console.error('Failed to add measurement:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to add measurement',
            isLoading: false,
          });
          throw error;
        }
      },

      // Update a measurement
      updateMeasurement: async (measurementId: string, data: UpdateGrowthMeasurementRequest) => {
        set({ isLoading: true, error: null });
        try {
          await growthService.updateMeasurement(measurementId, data);
          const { currentChildId } = get();
          if (currentChildId) {
            await get().fetchGrowthData(currentChildId);
          }
        } catch (error) {
          console.error('Failed to update measurement:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to update measurement',
            isLoading: false,
          });
          throw error;
        }
      },

      // Delete a measurement
      deleteMeasurement: async (measurementId: string) => {
        set({ isLoading: true, error: null });
        try {
          await growthService.deleteMeasurement(measurementId);
          const { currentChildId } = get();
          if (currentChildId) {
            await get().fetchGrowthData(currentChildId);
          }
        } catch (error) {
          console.error('Failed to delete measurement:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to delete measurement',
            isLoading: false,
          });
          throw error;
        }
      },

      // Clear all data
      clearData: () => {
        set({
          growthData: null,
          chartData: null,
          currentChildId: null,
          error: null,
        });
      },

      // Set loading state
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // Set error
      setError: (error: string | null) => set({ error }),

      // Get latest measurement
      getLatestMeasurement: () => {
        const { growthData, currentChildId } = get();
        if (!growthData || !currentChildId || growthData.measurements.length === 0) {
          return null;
        }
        // Verify the data belongs to the current child
        if (growthData.childId !== currentChildId) {
          return null;
        }
        return growthData.measurements[growthData.measurements.length - 1];
      },

      // Get all measurements
      getMeasurements: () => {
        const { growthData } = get();
        return growthData?.measurements || [];
      },
    }),
    {
      name: 'growth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        growthData: state.growthData,
        currentChildId: state.currentChildId,
      }),
    }
  )
);
