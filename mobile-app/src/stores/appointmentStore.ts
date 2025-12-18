/**
 * Appointment Store
 * 
 * Zustand store for managing healthcare appointments and schedules.
 * Integrates with backend API for data persistence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment, AppointmentStatus, AppointmentType } from '../types';
import appointmentService, {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  ChildAppointmentsResponse,
} from '../services/appointmentService';

interface AppointmentState {
  // Data
  appointments: Appointment[];
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
  summary: {
    totalAppointments: number;
    upcomingCount: number;
    completedCount: number;
    cancelledCount: number;
    nextAppointment: Appointment | null;
  } | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions - API
  fetchAppointments: (childId: string) => Promise<void>;
  fetchUpcomingAppointments: () => Promise<void>;
  createAppointment: (childId: string, data: CreateAppointmentDto) => Promise<Appointment | null>;
  updateAppointmentApi: (appointmentId: string, data: UpdateAppointmentDto) => Promise<Appointment | null>;
  cancelAppointmentApi: (appointmentId: string) => Promise<boolean>;
  completeAppointmentApi: (appointmentId: string) => Promise<boolean>;
  deleteAppointment: (appointmentId: string) => Promise<boolean>;
  
  // Utility
  clearData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getUpcomingAppointments: () => Appointment[];
  getPastAppointments: () => Appointment[];
  getNextAppointment: () => Appointment | null;
  getAppointmentsByType: (type: AppointmentType) => Appointment[];
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (set, get) => ({
      // Initial state
      appointments: [],
      upcomingAppointments: [],
      pastAppointments: [],
      summary: null,
      isLoading: false,
      error: null,

      /**
       * Fetch all appointments for a specific child
       */
      fetchAppointments: async (childId: string) => {
        const state = get();
        
        // Clear old data if switching to a different child
        if (state.appointments.length > 0 && state.appointments[0]?.childId !== childId) {
          set({ appointments: [], upcomingAppointments: [], pastAppointments: [], summary: null });
        }
        
        // Skip if childId is not a valid UUID (likely mock data)
        if (!UUID_REGEX.test(childId)) {
          set({ appointments: [], upcomingAppointments: [], pastAppointments: [], summary: null, error: null });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response: ChildAppointmentsResponse = await appointmentService.getChildAppointments(childId);
          set({
            appointments: response.appointments,
            upcomingAppointments: response.upcoming,
            pastAppointments: response.past,
            summary: response.summary,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch appointments:', error);
          // Silently handle missing child errors (UUID was valid but child doesn't exist yet)
          if (error.message?.includes('not found')) {
            set({ appointments: [], upcomingAppointments: [], pastAppointments: [], summary: null, isLoading: false, error: null });
          } else {
            set({ isLoading: false, error: error.message || 'Failed to fetch appointments' });
          }
        }
      },

      /**
       * Fetch upcoming appointments for all user's children
       */
      fetchUpcomingAppointments: async () => {
        set({ isLoading: true, error: null });
        try {
          const appointments = await appointmentService.getUpcomingAppointments();
          set({
            upcomingAppointments: appointments,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch upcoming appointments:', error);
          set({ isLoading: false, error: error.message || 'Failed to fetch upcoming appointments' });
        }
      },

      /**
       * Create a new appointment
       */
      createAppointment: async (childId: string, data: CreateAppointmentDto) => {
        set({ isLoading: true, error: null });
        try {
          const newAppointment = await appointmentService.createAppointment(childId, data);
          
          // Add to local state
          set((state) => ({
            appointments: [...state.appointments, newAppointment],
            upcomingAppointments: newAppointment.status === 'scheduled' && new Date(newAppointment.dateTime) >= new Date()
              ? [...state.upcomingAppointments, newAppointment].sort(
                  (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
                )
              : state.upcomingAppointments,
            isLoading: false,
          }));
          
          return newAppointment;
        } catch (error: any) {
          console.error('Failed to create appointment:', error);
          set({ isLoading: false, error: error.message || 'Failed to create appointment' });
          return null;
        }
      },

      /**
       * Update an existing appointment
       */
      updateAppointmentApi: async (appointmentId: string, data: UpdateAppointmentDto) => {
        set({ isLoading: true, error: null });
        try {
          const updatedAppointment = await appointmentService.updateAppointment(appointmentId, data);
          
          // Update in local state
          set((state) => ({
            appointments: state.appointments.map((a) =>
              a.id === appointmentId ? updatedAppointment : a
            ),
            upcomingAppointments: state.upcomingAppointments.map((a) =>
              a.id === appointmentId ? updatedAppointment : a
            ).filter((a) => a.status === 'scheduled' && new Date(a.dateTime) >= new Date()),
            pastAppointments: state.pastAppointments.map((a) =>
              a.id === appointmentId ? updatedAppointment : a
            ),
            isLoading: false,
          }));
          
          return updatedAppointment;
        } catch (error: any) {
          console.error('Failed to update appointment:', error);
          set({ isLoading: false, error: error.message || 'Failed to update appointment' });
          return null;
        }
      },

      /**
       * Cancel an appointment
       */
      cancelAppointmentApi: async (appointmentId: string) => {
        set({ isLoading: true, error: null });
        try {
          const cancelledAppointment = await appointmentService.cancelAppointment(appointmentId);
          
          // Update in local state
          set((state) => ({
            appointments: state.appointments.map((a) =>
              a.id === appointmentId ? cancelledAppointment : a
            ),
            upcomingAppointments: state.upcomingAppointments.filter((a) => a.id !== appointmentId),
            pastAppointments: [...state.pastAppointments, cancelledAppointment].sort(
              (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
            ),
            isLoading: false,
          }));
          
          return true;
        } catch (error: any) {
          console.error('Failed to cancel appointment:', error);
          set({ isLoading: false, error: error.message || 'Failed to cancel appointment' });
          return false;
        }
      },

      /**
       * Mark an appointment as completed
       */
      completeAppointmentApi: async (appointmentId: string) => {
        set({ isLoading: true, error: null });
        try {
          const completedAppointment = await appointmentService.completeAppointment(appointmentId);
          
          // Update in local state
          set((state) => ({
            appointments: state.appointments.map((a) =>
              a.id === appointmentId ? completedAppointment : a
            ),
            upcomingAppointments: state.upcomingAppointments.filter((a) => a.id !== appointmentId),
            pastAppointments: [...state.pastAppointments, completedAppointment].sort(
              (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
            ),
            isLoading: false,
          }));
          
          return true;
        } catch (error: any) {
          console.error('Failed to complete appointment:', error);
          set({ isLoading: false, error: error.message || 'Failed to complete appointment' });
          return false;
        }
      },

      /**
       * Delete an appointment
       */
      deleteAppointment: async (appointmentId: string) => {
        set({ isLoading: true, error: null });
        try {
          await appointmentService.deleteAppointment(appointmentId);
          
          // Remove from local state
          set((state) => ({
            appointments: state.appointments.filter((a) => a.id !== appointmentId),
            upcomingAppointments: state.upcomingAppointments.filter((a) => a.id !== appointmentId),
            pastAppointments: state.pastAppointments.filter((a) => a.id !== appointmentId),
            isLoading: false,
          }));
          
          return true;
        } catch (error: any) {
          console.error('Failed to delete appointment:', error);
          set({ isLoading: false, error: error.message || 'Failed to delete appointment' });
          return false;
        }
      },

      // Clear all data
      clearData: () => set({
        appointments: [],
        upcomingAppointments: [],
        pastAppointments: [],
        summary: null,
        error: null,
      }),

      // Set loading state
      setLoading: (loading) => set({ isLoading: loading }),

      // Set error state
      setError: (error) => set({ error }),

      // Get upcoming appointments (scheduled, not past)
      getUpcomingAppointments: () => {
        const { upcomingAppointments } = get();
        return upcomingAppointments;
      },

      // Get past appointments
      getPastAppointments: () => {
        const { pastAppointments } = get();
        return pastAppointments;
      },

      // Get next upcoming appointment
      getNextAppointment: () => {
        const { summary, upcomingAppointments } = get();
        return summary?.nextAppointment || upcomingAppointments[0] || null;
      },

      // Get appointments by type
      getAppointmentsByType: (type: AppointmentType) => {
        const { appointments } = get();
        return appointments.filter((a) => a.type === type);
      },
    }),
    {
      name: 'appointment-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        appointments: state.appointments,
        upcomingAppointments: state.upcomingAppointments,
        pastAppointments: state.pastAppointments,
        summary: state.summary,
      }),
    }
  )
);
