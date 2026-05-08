/**
 * Zustand Stores for Midwife Web Application
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from './api-client';
import type {
  User,
  PregnancyProfile,
  ChildProfile,
  VaccinationRecord,
  GrowthMeasurement,
  Appointment,
  Activity,
  EmergencyContact,
  DashboardStats,
  ApiResponse,
} from './types';

// ============================================================================
// AUTH STORE
// ============================================================================

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  loginWithAuth0Token: (auth0Token: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setAccessToken: (token) => {
        apiClient.setAccessToken(token);
        set({ accessToken: token });
      },

      /**
       * Exchange an Auth0 access token for backend JWT tokens
       */
      loginWithAuth0Token: async (auth0Token: string) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post<{
            success: boolean;
            data: {
              accessToken: string;
              refreshToken: string;
              expiresIn: number;
              user: User;
            };
          }>(
            '/auth/auth0',
            { auth0Token },
            { requiresAuth: false }
          );
          const { accessToken, refreshToken, user } = response.data;
          apiClient.setAccessToken(accessToken);
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        const { refreshToken } = get();
        // Attempt to invalidate on server (fire-and-forget)
        if (refreshToken) {
          apiClient.post('/auth/logout', { refreshToken }, { keepalive: true }).catch(() => {});
        }
        apiClient.setAccessToken(null);
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        apiClient.setAccessToken(state?.accessToken ?? null);
      },
    }
  )
);

// ============================================================================
// PREGNANCY STORE
// ============================================================================

interface PregnancyStore {
  pregnancies: PregnancyProfile[];
  currentPregnancy: PregnancyProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchPregnancies: () => Promise<void>;
  fetchPregnancy: (id: string) => Promise<void>;
  createPregnancy: (data: Partial<PregnancyProfile>) => Promise<PregnancyProfile>;
  updatePregnancy: (id: string, data: Partial<PregnancyProfile>) => Promise<void>;
  deletePregnancy: (id: string) => Promise<void>;
  setCurrentPregnancy: (pregnancy: PregnancyProfile | null) => void;
}

export const usePregnancyStore = create<PregnancyStore>((set, get) => ({
  pregnancies: [],
  currentPregnancy: null,
  isLoading: false,
  error: null,

  fetchPregnancies: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient.get<PregnancyProfile[]>('/pregnancies');
      set({ pregnancies: data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchPregnancy: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient.get<PregnancyProfile>(`/pregnancies/${id}`);
      set({ currentPregnancy: data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createPregnancy: async (data: Partial<PregnancyProfile>) => {
    set({ isLoading: true, error: null });
    try {
      const newPregnancy = await apiClient.post<PregnancyProfile>('/pregnancies', data);
      set((state) => ({
        pregnancies: [...state.pregnancies, newPregnancy],
        isLoading: false,
      }));
      return newPregnancy;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updatePregnancy: async (id: string, data: Partial<PregnancyProfile>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiClient.put<PregnancyProfile>(`/pregnancies/${id}`, data);
      set((state) => ({
        pregnancies: state.pregnancies.map((p) => (p.id === id ? updated : p)),
        currentPregnancy: state.currentPregnancy?.id === id ? updated : state.currentPregnancy,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deletePregnancy: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/pregnancies/${id}`);
      set((state) => ({
        pregnancies: state.pregnancies.filter((p) => p.id !== id),
        currentPregnancy: state.currentPregnancy?.id === id ? null : state.currentPregnancy,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setCurrentPregnancy: (pregnancy) => set({ currentPregnancy: pregnancy }),
}));

// ============================================================================
// CHILD STORE
// ============================================================================

interface ChildStore {
  children: ChildProfile[];
  currentChild: ChildProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchChildren: () => Promise<void>;
  fetchChild: (id: string) => Promise<void>;
  createChild: (data: Partial<ChildProfile>) => Promise<ChildProfile>;
  updateChild: (id: string, data: Partial<ChildProfile>) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;
  setCurrentChild: (child: ChildProfile | null) => void;
}

export const useChildStore = create<ChildStore>((set, get) => ({
  children: [],
  currentChild: null,
  isLoading: false,
  error: null,

  fetchChildren: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<ApiResponse<ChildProfile[]>>('/children');
      set({ children: response.data ?? [], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchChild: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<ApiResponse<ChildProfile>>(`/children/${id}`);
      set({ currentChild: response.data ?? null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createChild: async (data: Partial<ChildProfile>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<ApiResponse<ChildProfile>>('/children', data);
      const newChild = response.data as ChildProfile;
      set((state) => ({
        children: [...state.children, newChild],
        isLoading: false,
      }));
      return newChild;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateChild: async (id: string, data: Partial<ChildProfile>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put<ApiResponse<ChildProfile>>(`/children/${id}`, data);
      const updated = response.data as ChildProfile;
      set((state) => ({
        children: state.children.map((c) => (c.id === id ? updated : c)),
        currentChild: state.currentChild?.id === id ? updated : state.currentChild,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteChild: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/children/${id}`);
      set((state) => ({
        children: state.children.filter((c) => c.id !== id),
        currentChild: state.currentChild?.id === id ? null : state.currentChild,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setCurrentChild: (child) => set({ currentChild: child }),
}));

// ============================================================================
// VACCINE STORE
// ============================================================================

interface VaccineStatistics {
  completed: number;
  total: number;
  overdue: number;
  pending: number;
  completionPercentage: number;
}

interface VaccineStore {
  records: VaccinationRecord[];
  statistics: VaccineStatistics | null;
  nextVaccine: VaccinationRecord | null;
  isLoading: boolean;
  error: string | null;
  fetchRecords: (childId: string) => Promise<void>;
  administerVaccine: (childId: string, vaccineId: string, data: Partial<VaccinationRecord>) => Promise<void>;
  getCompletionPercentage: (childId?: string) => number;
  getOverdueCount: (childId?: string) => number;
}

export const useVaccineStore = create<VaccineStore>((set, get) => ({
  records: [],
  statistics: null,
  nextVaccine: null,
  isLoading: false,
  error: null,

  fetchRecords: async (childId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<ApiResponse<{
        schedule: VaccinationRecord[];
        statistics: VaccineStatistics;
        nextVaccine: VaccinationRecord | null;
      }>>(`/vaccines/child/${childId}`);
      set({
        records: response.data?.schedule ?? [],
        statistics: response.data?.statistics ?? null,
        nextVaccine: response.data?.nextVaccine ?? null,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  administerVaccine: async (childId: string, vaccineId: string, data: Partial<VaccinationRecord>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<ApiResponse<VaccinationRecord>>(
        `/vaccines/child/${childId}/administer/${vaccineId}`,
        data
      );
      const updated = response.data as VaccinationRecord;
      set((state) => ({
        records: state.records.map((r) => (r.vaccineId === updated.vaccineId ? { ...r, ...updated } : r)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  getCompletionPercentage: () => {
    const { records, statistics } = get();
    if (statistics) return statistics.completionPercentage;
    if (records.length === 0) return 0;
    const completed = records.filter((r) => r.status === 'completed').length;
    return Math.round((completed / records.length) * 100);
  },

  getOverdueCount: () => {
    const { records, statistics } = get();
    if (statistics) return statistics.overdue;
    return records.filter((r) => r.status === 'overdue').length;
  },
}));

// ============================================================================
// APPOINTMENT STORE
// ============================================================================

interface AppointmentStore {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  fetchAppointments: () => Promise<void>;
  createAppointment: (data: Partial<Appointment>) => Promise<Appointment>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getUpcomingAppointments: () => Appointment[];
  getTodayAppointments: () => Appointment[];
}

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  appointments: [],
  isLoading: false,
  error: null,

  fetchAppointments: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient.get<Appointment[]>('/appointment');
      set({ appointments: data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createAppointment: async (data: Partial<Appointment>) => {
    set({ isLoading: true, error: null });
    try {
      const newAppointment = await apiClient.post<Appointment>('/appointment', data);
      set((state) => ({
        appointments: [...state.appointments, newAppointment],
        isLoading: false,
      }));
      return newAppointment;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateAppointment: async (id: string, data: Partial<Appointment>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiClient.patch<Appointment>(`/appointment/${id}`, data);
      set((state) => ({
        appointments: state.appointments.map((a) => (a.id === id ? updated : a)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteAppointment: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/appointment/${id}`);
      set((state) => ({
        appointments: state.appointments.filter((a) => a.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  getUpcomingAppointments: () => {
    const { appointments } = get();
    const now = new Date();
    return appointments
      .filter((a) => new Date(`${a.scheduledDate}T${a.scheduledTime}`) > now && a.status !== 'cancelled')
      .sort((a, b) => new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime() - new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime());
  },

  getTodayAppointments: () => {
    const { appointments } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return appointments.filter((a) => {
      const appointmentDate = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
      return appointmentDate >= today && appointmentDate < tomorrow;
    });
  },
}));

// ============================================================================
// ACTIVITY STORE
// ============================================================================

interface ActivityStore {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  fetchActivities: (childId?: string) => Promise<void>;
  createActivity: (data: Partial<Activity>) => Promise<Activity>;
  deleteActivity: (id: string) => Promise<void>;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  isLoading: false,
  error: null,

  fetchActivities: async (childId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint = childId ? `/activity/child/${childId}` : '/activity';
      const data = await apiClient.get<Activity[]>(endpoint);
      set({ activities: data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createActivity: async (data: Partial<Activity>) => {
    set({ isLoading: true, error: null });
    try {
      const newActivity = await apiClient.post<Activity>('/activity', data);
      set((state) => ({
        activities: [newActivity, ...state.activities],
        isLoading: false,
      }));
      return newActivity;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteActivity: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/activity/${id}`);
      set((state) => ({
        activities: state.activities.filter((a) => a.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));

// ============================================================================
// DASHBOARD STORE
// ============================================================================

interface DashboardStore {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  isLoading: false,
  error: null,

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      // Since there's no dashboard endpoint, we'll calculate from other data
      // For now, we'll set mock data that will be replaced with real API calls
      const stats: DashboardStats = {
        totalPatients: 0,
        activePregnancies: 0,
        childrenMonitored: 0,
        upcomingAppointments: 0,
        overdueVaccinations: 0,
        highRiskPregnancies: 0,
        appointmentsToday: 0,
        newPatientsThisMonth: 0,
      };
      set({ stats, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
