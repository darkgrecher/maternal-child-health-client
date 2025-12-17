/**
 * Appointment Store
 * 
 * Zustand store for managing healthcare appointments and schedules.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment, AppointmentStatus, SyncStatus } from '../types';
import { mockAppointments } from '../data/mockData';

interface AppointmentState {
  // Data
  appointments: Appointment[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  cancelAppointment: (id: string) => void;
  completeAppointment: (id: string) => void;
  
  // Utility
  loadMockData: () => void;
  clearData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getUpcomingAppointments: () => Appointment[];
  getPastAppointments: () => Appointment[];
  getNextAppointment: () => Appointment | null;
}

export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (set, get) => ({
      // Initial state
      appointments: [],
      isLoading: false,
      error: null,

      // Set all appointments
      setAppointments: (appointments) => set({ appointments }),

      // Add new appointment
      addAppointment: (appointment) => set((state) => ({
        appointments: [...state.appointments, {
          ...appointment,
          syncStatus: 'pending' as SyncStatus,
        }],
      })),

      // Update appointment
      updateAppointment: (id, updates) => set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id
            ? {
                ...a,
                ...updates,
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending' as SyncStatus,
              }
            : a
        ),
      })),

      // Cancel appointment
      cancelAppointment: (id) => set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id
            ? {
                ...a,
                status: 'cancelled' as AppointmentStatus,
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending' as SyncStatus,
              }
            : a
        ),
      })),

      // Mark appointment as completed
      completeAppointment: (id) => set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id
            ? {
                ...a,
                status: 'completed' as AppointmentStatus,
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending' as SyncStatus,
              }
            : a
        ),
      })),

      // Load mock data
      loadMockData: () => set({
        appointments: mockAppointments,
        isLoading: false,
        error: null,
      }),

      // Clear all data
      clearData: () => set({
        appointments: [],
        error: null,
      }),

      // Set loading state
      setLoading: (loading) => set({ isLoading: loading }),

      // Set error state
      setError: (error) => set({ error }),

      // Get upcoming appointments (scheduled, not past)
      getUpcomingAppointments: () => {
        const { appointments } = get();
        const now = new Date();
        return appointments
          .filter((a) => {
            const appointmentDate = new Date(a.dateTime);
            return appointmentDate >= now && a.status === 'scheduled';
          })
          .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      },

      // Get past appointments
      getPastAppointments: () => {
        const { appointments } = get();
        const now = new Date();
        return appointments
          .filter((a) => {
            const appointmentDate = new Date(a.dateTime);
            return appointmentDate < now || a.status === 'completed' || a.status === 'cancelled';
          })
          .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
      },

      // Get next upcoming appointment
      getNextAppointment: () => {
        const upcoming = get().getUpcomingAppointments();
        return upcoming[0] || null;
      },
    }),
    {
      name: 'appointment-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        appointments: state.appointments,
      }),
    }
  )
);
