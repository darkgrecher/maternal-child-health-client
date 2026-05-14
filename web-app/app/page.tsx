/**
 * Midwife Dashboard - Home Page
 * 
 * Main dashboard showing overview of patients, appointments,
 * and key metrics for midwife care management.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Baby,
  Calendar,
  Activity,
  AlertTriangle,
  Syringe,
  TrendingUp,
  ChevronRight,
  Plus,
  Phone,
  FileText,
  QrCode,
} from 'lucide-react';
import { MainLayout, Header } from './components/main-layout';
import {
  Card,
  StatCard,
  Button,
  Badge,
  Avatar,
  SectionTitle,
  Alert,
  EmptyState,
  Input,
  Select,
  Modal,
} from './components/ui';
import apiClient from './lib/api-client';
import { useAuthStore } from './lib/stores';
import QRCode from 'qrcode';
import type {
  ApiResponse,
  DashboardResponse,
  DashboardStats,
  ChildProfile,
  PregnancyProfile,
  VaccinationRecord,
} from './lib/types';

const DEFAULT_STATS: DashboardStats = {
  totalPatients: 0,
  activePregnancies: 0,
  childrenMonitored: 0,
  upcomingAppointments: 0,
  overdueVaccinations: 0,
  highRiskPregnancies: 0,
  appointmentsToday: 0,
  newPatientsThisMonth: 0,
};

const getAppointmentTypeColor = (type: string) => {
  switch (type) {
    case 'vaccination':
      return { bg: 'bg-blue-100', text: 'text-blue-600', badge: 'Vaccination' };
    case 'growth_check':
      return { bg: 'bg-emerald-100', text: 'text-emerald-600', badge: 'Growth Check' };
    case 'development_check':
      return { bg: 'bg-purple-100', text: 'text-purple-600', badge: 'Development' };
    case 'general_checkup':
      return { bg: 'bg-pink-100', text: 'text-pink-600', badge: 'Checkup' };
    case 'specialist':
      return { bg: 'bg-indigo-100', text: 'text-indigo-600', badge: 'Specialist' };
    case 'emergency':
      return { bg: 'bg-red-100', text: 'text-red-600', badge: 'Emergency' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-600', badge: type };
  }
};

const getStatusVariant = (status: string): 'success' | 'error' | 'warning' | 'info' => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'cancelled':
    case 'missed':
      return 'error';
    case 'rescheduled':
      return 'warning';
    default:
      return 'info';
  }
};

const getVaccinationStatusVariant = (status: string): 'success' | 'error' | 'warning' | 'info' => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'overdue':
    case 'missed':
      return 'error';
    case 'scheduled':
      return 'info';
    default:
      return 'warning';
  }
};

const getActivityVisual = (type: string) => {
  switch (type) {
    case 'vaccination':
      return { icon: Syringe, color: 'text-blue-500', bgColor: 'bg-blue-100' };
    case 'growth':
      return { icon: TrendingUp, color: 'text-emerald-500', bgColor: 'bg-emerald-100' };
    case 'appointment':
      return { icon: Calendar, color: 'text-purple-500', bgColor: 'bg-purple-100' };
    case 'checkup':
      return { icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-100' };
    default:
      return { icon: Activity, color: 'text-slate-500', bgColor: 'bg-slate-100' };
  }
};

type LinkProfileType = 'child' | 'pregnancy';

interface LinkStatusData {
  code: string;
  profileType: LinkProfileType | 'any';
  isActive: boolean;
  lastUsedAt: string | null;
  profileId: string | null;
  notification: {
    id: string;
    type: 'mismatch' | 'unregistered';
    message: string;
    createdAt: string;
  } | null;
}

interface VaccineStatistics {
  completed: number;
  total: number;
  overdue: number;
  pending: number;
  completionPercentage: number;
}

interface ChildGrowthMeasurement {
  id: string;
  childId: string;
  measurementDate: string;
  weight: number;
  height: number;
  headCircumference?: number | null;
  notes?: string | null;
}

interface ChildGrowthResponse {
  childId: string;
  childName: string;
  measurements: ChildGrowthMeasurement[];
  summary?: {
    latestWeight?: number | null;
    latestHeight?: number | null;
    lastMeasurementDate?: string | null;
    latestWeightPercentile?: number | null;
    latestHeightPercentile?: number | null;
  } | null;
}

interface AppointmentRecord {
  id: string;
  childId: string;
  title: string;
  type: 'vaccination' | 'growth_check' | 'development_check' | 'general_checkup' | 'specialist' | 'emergency';
  dateTime: string;
  duration?: number | null;
  location: string;
  address?: string | null;
  providerName?: string | null;
  providerRole?: string | null;
  providerPhone?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'missed';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentSummary {
  totalAppointments: number;
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
  nextAppointment?: AppointmentRecord | null;
}

interface ChildAppointmentsResponse {
  childId: string;
  childName: string;
  appointments: AppointmentRecord[];
  upcoming: AppointmentRecord[];
  past: AppointmentRecord[];
  summary: AppointmentSummary;
}

interface PregnancyCheckupRecord {
  id: string;
  pregnancyId: string;
  checkupDate?: string;
  weekOfPregnancy?: number;
  weight?: number | null;
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  notes?: string | null;
  nextCheckupDate?: string | null;
  providerName?: string | null;
  location?: string | null;
}

interface PregnancyMeasurementRecord {
  id: string;
  pregnancyId: string;
  measurementDate?: string;
  weekOfPregnancy?: number;
  weight?: number | null;
  bellyCircumference?: number | null;
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  symptoms?: string[] | null;
  mood?: string | null;
  notes?: string | null;
}

interface PregnancySymptomRecord {
  id: string;
  pregnancyId: string;
  date?: string;
  weekOfPregnancy: number;
  symptoms: string[];
  notes?: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [qrWarning, setQrWarning] = useState<string | null>(null);
  const [qrNotificationId, setQrNotificationId] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkedProfileType, setLinkedProfileType] = useState<LinkProfileType | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkedChild, setLinkedChild] = useState<ChildProfile | null>(null);
  const [childVaccines, setChildVaccines] = useState<VaccinationRecord[]>([]);
  const [childVaccineStats, setChildVaccineStats] = useState<VaccineStatistics | null>(null);
  const [childGrowth, setChildGrowth] = useState<ChildGrowthMeasurement[]>([]);
  const [childGrowthSummary, setChildGrowthSummary] = useState<ChildGrowthResponse['summary'] | null>(null);
  const [childAppointments, setChildAppointments] = useState<AppointmentRecord[]>([]);
  const [childActionError, setChildActionError] = useState<string | null>(null);
  const [isGrowthSubmitting, setIsGrowthSubmitting] = useState(false);
  const [growthForm, setGrowthForm] = useState({
    measurementDate: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    height: '',
    headCircumference: '',
    notes: '',
  });
  const [isAppointmentSubmitting, setIsAppointmentSubmitting] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    title: '',
    type: 'general_checkup',
    dateTime: '',
    location: '',
    notes: '',
  });
  const [appointmentActionId, setAppointmentActionId] = useState<string | null>(null);
  const [vaccineActionId, setVaccineActionId] = useState<string | null>(null);
  const [pregnancyProfile, setPregnancyProfile] = useState<PregnancyProfile | null>(null);
  const [pregnancyCheckups, setPregnancyCheckups] = useState<PregnancyCheckupRecord[]>([]);
  const [pregnancyMeasurements, setPregnancyMeasurements] = useState<PregnancyMeasurementRecord[]>([]);
  const [pregnancySymptoms, setPregnancySymptoms] = useState<PregnancySymptomRecord[]>([]);
  const [pregnancyActionError, setPregnancyActionError] = useState<string | null>(null);
  const [pregnancySubmitKey, setPregnancySubmitKey] = useState<string | null>(null);
  const [checkupForm, setCheckupForm] = useState({
    checkupDate: format(new Date(), 'yyyy-MM-dd'),
    weekOfPregnancy: '',
    weight: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    notes: '',
    nextCheckupDate: '',
  });
  const [measurementForm, setMeasurementForm] = useState({
    measurementDate: format(new Date(), 'yyyy-MM-dd'),
    weekOfPregnancy: '',
    weight: '',
    bellyCircumference: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    symptoms: '',
    mood: '',
    notes: '',
  });
  const [symptomForm, setSymptomForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weekOfPregnancy: '',
    symptoms: '',
    notes: '',
  });
  const [medicalConditionsInput, setMedicalConditionsInput] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [weightInput, setWeightInput] = useState('');

  const today = new Date();
  const stats = dashboard?.stats ?? DEFAULT_STATS;
  const todayAppointments = dashboard?.todayAppointments ?? [];
  const recentActivities = dashboard?.recentActivities ?? [];
  const highRiskPregnancies = dashboard?.highRiskPregnancies ?? [];
  const overdueVaccinations = dashboard?.overdueVaccinations ?? [];

  const greetingName = useMemo(() => {
    if (user?.name) {
      const [firstName] = user.name.split(' ');
      return firstName || user.name;
    }
    return 'Midwife';
  }, [user?.name]);

  const formatShortDate = (value?: string | null) => {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not set';
    return format(date, 'MMM d, yyyy');
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Not scheduled';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not scheduled';
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const parseList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const toIsoDateTime = (value: string) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  };

  useEffect(() => {
    let isCancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await apiClient.get<ApiResponse<DashboardResponse>>('/dashboard');
        if (!isCancelled) {
          setDashboard(response.data ?? null);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isQrModalOpen) {
      setQrImageUrl(null);
      setQrError(null);
      setQrCode(null);
      setQrWarning(null);
      setQrNotificationId(null);
      return;
    }

    let isCancelled = false;
    setQrWarning(null);
    setQrNotificationId(null);

    const loadQrCode = async () => {
      setIsQrLoading(true);
      setQrError(null);

      try {
        const response = await apiClient.post<ApiResponse<{ qrPayload: string; code: string }>>('/midwife-links/qr');
        const qrPayload = response.data?.qrPayload;
        const code = response.data?.code ?? null;
        if (!qrPayload) {
          throw new Error('QR code payload unavailable');
        }

        const dataUrl = await QRCode.toDataURL(qrPayload, { width: 320, margin: 1 });
        if (!isCancelled) {
          setQrImageUrl(dataUrl);
          setQrCode(code);
        }
      } catch (err) {
        if (!isCancelled) {
          const message = err instanceof Error ? err.message : 'Failed to generate QR code';
          setQrError(message);
          setQrImageUrl(null);
        }
      } finally {
        if (!isCancelled) {
          setIsQrLoading(false);
        }
      }
    };

    loadQrCode();

    return () => {
      isCancelled = true;
    };
  }, [isQrModalOpen]);

  const resetLinkedData = () => {
    setLinkedChild(null);
    setChildVaccines([]);
    setChildVaccineStats(null);
    setChildGrowth([]);
    setChildGrowthSummary(null);
    setChildAppointments([]);
    setChildActionError(null);
    setPregnancyProfile(null);
    setPregnancyCheckups([]);
    setPregnancyMeasurements([]);
    setPregnancySymptoms([]);
    setPregnancyActionError(null);
  };

  const loadLinkedChild = async (profileId: string) => {
    setLinkLoading(true);
    setLinkError(null);
    setChildActionError(null);

    try {
      const [childResponse, vaccineResponse, growthResponse, appointmentResponse] = await Promise.all([
        apiClient.get<ApiResponse<ChildProfile>>(`/children/${profileId}`),
        apiClient.get<ApiResponse<{ schedule: VaccinationRecord[]; statistics: VaccineStatistics; nextVaccine?: VaccinationRecord | null }>>(
          `/vaccines/child/${profileId}`
        ),
        apiClient.get<ApiResponse<ChildGrowthResponse>>(`/growth/child/${profileId}`),
        apiClient.get<ChildAppointmentsResponse>(`/appointments/child/${profileId}`),
      ]);

      setLinkedChild(childResponse.data ?? null);
      setChildVaccines(vaccineResponse.data?.schedule ?? []);
      setChildVaccineStats(vaccineResponse.data?.statistics ?? null);
      setChildGrowth(growthResponse.data?.measurements ?? []);
      setChildGrowthSummary(growthResponse.data?.summary ?? null);
      setChildAppointments(appointmentResponse.appointments ?? []);
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Unable to load linked child profile.');
    } finally {
      setLinkLoading(false);
    }
  };

  const loadLinkedPregnancy = async (profileId: string) => {
    setLinkLoading(true);
    setLinkError(null);
    setPregnancyActionError(null);

    try {
      const [profile, checkups, measurements, symptoms] = await Promise.all([
        apiClient.get<PregnancyProfile>(`/pregnancies/${profileId}`),
        apiClient.get<PregnancyCheckupRecord[]>(`/pregnancies/${profileId}/checkups`),
        apiClient.get<PregnancyMeasurementRecord[]>(`/pregnancies/${profileId}/measurements`),
        apiClient.get<PregnancySymptomRecord[]>(`/pregnancies/${profileId}/symptoms`),
      ]);

      setPregnancyProfile(profile);
      setPregnancyCheckups(checkups ?? []);
      setPregnancyMeasurements(measurements ?? []);
      setPregnancySymptoms(symptoms ?? []);
      setMedicalConditionsInput(profile.medicalConditions?.join(', ') ?? '');
      setAllergiesInput(profile.allergies?.join(', ') ?? '');
      setWeightInput(profile.currentWeight?.toString() ?? '');
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Unable to load linked pregnancy profile.');
    } finally {
      setLinkLoading(false);
    }
  };

  const openLinkedProfile = (profileType: LinkProfileType, profileId: string) => {
    resetLinkedData();
    setLinkedProfileType(profileType);
    setIsLinkModalOpen(true);
    if (profileType === 'child') {
      void loadLinkedChild(profileId);
    } else {
      void loadLinkedPregnancy(profileId);
    }
  };

  useEffect(() => {
    if (!isQrModalOpen || !qrCode) return;

    let isCancelled = false;
    const intervalId = setInterval(async () => {
      try {
        const response = await apiClient.get<ApiResponse<LinkStatusData>>(`/midwife-links/status/${qrCode}`);
        const status = response.data ?? null;
        if (!status) return;

        if (!isCancelled && status.notification && status.notification.id !== qrNotificationId) {
          setQrNotificationId(status.notification.id);
          setQrWarning(status.notification.message);
        }

        if (!isCancelled && (status.lastUsedAt || !status.isActive)) {
          setIsQrModalOpen(false);
          setQrCode(null);
          setQrImageUrl(null);
          if (status.profileId) {
            const resolvedType = status.profileType === 'pregnancy' ? 'pregnancy' : 'child';
            openLinkedProfile(resolvedType, status.profileId);
          }
        }
      } catch {
        // Ignore polling errors while modal is open.
      }
    }, 3000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [isQrModalOpen, qrCode, qrNotificationId]);

  const handleAdministerVaccine = async (record: VaccinationRecord) => {
    if (!linkedChild || vaccineActionId) return;
    setVaccineActionId(record.vaccineId);
    setChildActionError(null);

    try {
      await apiClient.post<ApiResponse<VaccinationRecord>>(
        `/vaccines/child/${linkedChild.id}/administer/${record.vaccineId}`,
        {
          status: 'completed',
          administeredDate: new Date().toISOString(),
          administeredBy: user?.name ?? 'Midwife',
        }
      );
      await loadLinkedChild(linkedChild.id);
    } catch (err) {
      setChildActionError(err instanceof Error ? err.message : 'Unable to update vaccination.');
    } finally {
      setVaccineActionId(null);
    }
  };

  const handleGrowthSubmit = async () => {
    if (!linkedChild) return;
    if (!growthForm.measurementDate || !growthForm.weight || !growthForm.height) {
      setChildActionError('Please provide measurement date, weight, and height.');
      return;
    }

    setIsGrowthSubmitting(true);
    setChildActionError(null);

    try {
      await apiClient.post(`/growth/child/${linkedChild.id}`, {
        measurementDate: growthForm.measurementDate,
        weight: Number(growthForm.weight),
        height: Number(growthForm.height),
        headCircumference: growthForm.headCircumference ? Number(growthForm.headCircumference) : undefined,
        notes: growthForm.notes || undefined,
      });
      setGrowthForm({
        measurementDate: format(new Date(), 'yyyy-MM-dd'),
        weight: '',
        height: '',
        headCircumference: '',
        notes: '',
      });
      await loadLinkedChild(linkedChild.id);
    } catch (err) {
      setChildActionError(err instanceof Error ? err.message : 'Unable to add growth measurement.');
    } finally {
      setIsGrowthSubmitting(false);
    }
  };

  const handleAppointmentSubmit = async () => {
    if (!linkedChild) return;
    if (!appointmentForm.title.trim() || !appointmentForm.dateTime || !appointmentForm.location.trim()) {
      setChildActionError('Please provide title, date/time, and location.');
      return;
    }

    const dateTime = toIsoDateTime(appointmentForm.dateTime);
    if (!dateTime) {
      setChildActionError('Please provide a valid appointment date/time.');
      return;
    }

    setIsAppointmentSubmitting(true);
    setChildActionError(null);

    try {
      await apiClient.post(`/appointments/child/${linkedChild.id}`, {
        title: appointmentForm.title.trim(),
        type: appointmentForm.type,
        dateTime,
        location: appointmentForm.location.trim(),
        notes: appointmentForm.notes.trim() || undefined,
      });
      setAppointmentForm({
        title: '',
        type: 'general_checkup',
        dateTime: '',
        location: '',
        notes: '',
      });
      await loadLinkedChild(linkedChild.id);
    } catch (err) {
      setChildActionError(err instanceof Error ? err.message : 'Unable to create appointment.');
    } finally {
      setIsAppointmentSubmitting(false);
    }
  };

  const handleAppointmentStatus = async (appointmentId: string, action: 'complete' | 'cancel') => {
    if (appointmentActionId) return;
    setAppointmentActionId(appointmentId);
    setChildActionError(null);

    try {
      await apiClient.patch(`/appointments/${appointmentId}/${action}`);
      if (linkedChild) {
        await loadLinkedChild(linkedChild.id);
      }
    } catch (err) {
      setChildActionError(err instanceof Error ? err.message : 'Unable to update appointment.');
    } finally {
      setAppointmentActionId(null);
    }
  };

  const handleCheckupSubmit = async () => {
    if (!pregnancyProfile) return;
    if (!checkupForm.checkupDate || !checkupForm.weekOfPregnancy) {
      setPregnancyActionError('Please provide checkup date and pregnancy week.');
      return;
    }

    setPregnancySubmitKey('checkup');
    setPregnancyActionError(null);

    try {
      await apiClient.post(`/pregnancies/${pregnancyProfile.id}/checkups`, {
        checkupDate: checkupForm.checkupDate,
        weekOfPregnancy: Number(checkupForm.weekOfPregnancy),
        weight: checkupForm.weight ? Number(checkupForm.weight) : undefined,
        bloodPressureSystolic: checkupForm.bloodPressureSystolic ? Number(checkupForm.bloodPressureSystolic) : undefined,
        bloodPressureDiastolic: checkupForm.bloodPressureDiastolic ? Number(checkupForm.bloodPressureDiastolic) : undefined,
        notes: checkupForm.notes || undefined,
        nextCheckupDate: checkupForm.nextCheckupDate || undefined,
      });
      setCheckupForm({
        checkupDate: format(new Date(), 'yyyy-MM-dd'),
        weekOfPregnancy: '',
        weight: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        notes: '',
        nextCheckupDate: '',
      });
      await loadLinkedPregnancy(pregnancyProfile.id);
    } catch (err) {
      setPregnancyActionError(err instanceof Error ? err.message : 'Unable to add checkup.');
    } finally {
      setPregnancySubmitKey(null);
    }
  };

  const handleMeasurementSubmit = async () => {
    if (!pregnancyProfile) return;
    if (!measurementForm.measurementDate || !measurementForm.weekOfPregnancy || !measurementForm.weight) {
      setPregnancyActionError('Please provide measurement date, pregnancy week, and weight.');
      return;
    }

    setPregnancySubmitKey('measurement');
    setPregnancyActionError(null);

    try {
      await apiClient.post(`/pregnancies/${pregnancyProfile.id}/measurements`, {
        measurementDate: measurementForm.measurementDate,
        weekOfPregnancy: Number(measurementForm.weekOfPregnancy),
        weight: Number(measurementForm.weight),
        bellyCircumference: measurementForm.bellyCircumference ? Number(measurementForm.bellyCircumference) : undefined,
        bloodPressureSystolic: measurementForm.bloodPressureSystolic ? Number(measurementForm.bloodPressureSystolic) : undefined,
        bloodPressureDiastolic: measurementForm.bloodPressureDiastolic ? Number(measurementForm.bloodPressureDiastolic) : undefined,
        symptoms: measurementForm.symptoms ? parseList(measurementForm.symptoms) : undefined,
        mood: measurementForm.mood || undefined,
        notes: measurementForm.notes || undefined,
      });
      setMeasurementForm({
        measurementDate: format(new Date(), 'yyyy-MM-dd'),
        weekOfPregnancy: '',
        weight: '',
        bellyCircumference: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        symptoms: '',
        mood: '',
        notes: '',
      });
      await loadLinkedPregnancy(pregnancyProfile.id);
    } catch (err) {
      setPregnancyActionError(err instanceof Error ? err.message : 'Unable to add measurement.');
    } finally {
      setPregnancySubmitKey(null);
    }
  };

  const handleSymptomSubmit = async () => {
    if (!pregnancyProfile) return;
    if (!symptomForm.weekOfPregnancy || !symptomForm.symptoms.trim()) {
      setPregnancyActionError('Please provide pregnancy week and symptoms.');
      return;
    }

    setPregnancySubmitKey('symptom');
    setPregnancyActionError(null);

    try {
      await apiClient.post(`/pregnancies/${pregnancyProfile.id}/symptoms`, {
        date: symptomForm.date || undefined,
        weekOfPregnancy: Number(symptomForm.weekOfPregnancy),
        symptoms: parseList(symptomForm.symptoms),
        notes: symptomForm.notes || undefined,
      });
      setSymptomForm({
        date: format(new Date(), 'yyyy-MM-dd'),
        weekOfPregnancy: '',
        symptoms: '',
        notes: '',
      });
      await loadLinkedPregnancy(pregnancyProfile.id);
    } catch (err) {
      setPregnancyActionError(err instanceof Error ? err.message : 'Unable to save symptoms.');
    } finally {
      setPregnancySubmitKey(null);
    }
  };

  const handleMedicalConditionsSubmit = async () => {
    if (!pregnancyProfile) return;
    setPregnancySubmitKey('medical');
    setPregnancyActionError(null);

    try {
      await apiClient.put(`/pregnancies/${pregnancyProfile.id}/medical-conditions`, {
        conditions: parseList(medicalConditionsInput),
      });
      await loadLinkedPregnancy(pregnancyProfile.id);
    } catch (err) {
      setPregnancyActionError(err instanceof Error ? err.message : 'Unable to update medical conditions.');
    } finally {
      setPregnancySubmitKey(null);
    }
  };

  const handleAllergiesSubmit = async () => {
    if (!pregnancyProfile) return;
    setPregnancySubmitKey('allergies');
    setPregnancyActionError(null);

    try {
      await apiClient.put(`/pregnancies/${pregnancyProfile.id}/allergies`, {
        allergies: parseList(allergiesInput),
      });
      await loadLinkedPregnancy(pregnancyProfile.id);
    } catch (err) {
      setPregnancyActionError(err instanceof Error ? err.message : 'Unable to update allergies.');
    } finally {
      setPregnancySubmitKey(null);
    }
  };

  const handleWeightSubmit = async () => {
    if (!pregnancyProfile || !weightInput) return;
    const weightValue = Number(weightInput);
    if (Number.isNaN(weightValue) || weightValue <= 0) {
      setPregnancyActionError('Please provide a valid weight.');
      return;
    }

    setPregnancySubmitKey('weight');
    setPregnancyActionError(null);

    try {
      await apiClient.put(`/pregnancies/${pregnancyProfile.id}/weight`, { weight: weightValue });
      await loadLinkedPregnancy(pregnancyProfile.id);
    } catch (err) {
      setPregnancyActionError(err instanceof Error ? err.message : 'Unable to update weight.');
    } finally {
      setPregnancySubmitKey(null);
    }
  };

  const handleCloseLinkModal = () => {
    setIsLinkModalOpen(false);
    setLinkedProfileType(null);
    setLinkError(null);
    setLinkLoading(false);
    resetLinkedData();
  };

  const handleCall = (phone?: string | null) => {
    if (!phone) return;
    const digits = phone.replace(/\D+/g, '');
    if (!digits) return;
    window.open(`tel:${digits}`, '_self');
  };

  return (
    <MainLayout>
      <Header
        title={`Good Morning, ${greetingName}! 👋`}
        subtitle={format(today, 'EEEE, MMMM d, yyyy')}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-500 text-slate-500 transition-all"
              title="Generate QR code"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <Button
              icon={Plus}
              variant="primary"
              onClick={() => router.push('/appointments?new=1')}
            >
              New Appointment
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="warning" title="Unable to load dashboard" className="mt-4">
          {error}
        </Alert>
      )}

      {/* Alert Banner */}
      {stats.overdueVaccinations > 0 && (
        <Alert variant="warning" title="Attention Required" icon={AlertTriangle}>
          <span>
            There are <strong>{stats.overdueVaccinations} overdue vaccinations</strong> that need follow-up.{' '}
            <a href="/vaccinations" className="underline font-medium">
              View details →
            </a>
          </span>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard
          title="Active Pregnancies"
          value={stats.activePregnancies}
          icon={Heart}
          iconColor="text-pink-500"
          iconBg="bg-pink-100"
          subtitle={`${stats.newPatientsThisMonth} new this month`}
        />
        <StatCard
          title="Children Monitored"
          value={stats.childrenMonitored}
          icon={Baby}
          iconColor="text-purple-500"
          iconBg="bg-purple-100"
          subtitle="Under 5 years"
        />
        <StatCard
          title="Today's Appointments"
          value={stats.appointmentsToday}
          icon={Calendar}
          iconColor="text-blue-500"
          iconBg="bg-blue-100"
          subtitle={`${stats.upcomingAppointments} this week`}
        />
        <StatCard
          title="High Risk Cases"
          value={stats.highRiskPregnancies}
          icon={AlertTriangle}
          iconColor="text-amber-500"
          iconBg="bg-amber-100"
          subtitle="Requires attention"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <Card>
            <SectionTitle
              title="Today's Schedule"
              subtitle={`${todayAppointments.length} appointments scheduled`}
              action={
                <Button
                  variant="ghost"
                  icon={ChevronRight}
                  iconPosition="right"
                  size="sm"
                  onClick={() => router.push('/appointments')}
                >
                  View All
                </Button>
              }
            />
            {isLoading ? (
              <div className="py-10 text-center text-slate-500">Loading appointments...</div>
            ) : todayAppointments.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No appointments today"
                description="You're all caught up. Schedule the next visit when ready."
                action={
                  <Button variant="outline" onClick={() => router.push('/appointments?new=1')}>
                    Schedule Appointment
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => {
                  const typeStyle = getAppointmentTypeColor(appointment.type);
                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="text-center min-w-17.5">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {format(new Date(appointment.dateTime), 'h:mm a')}
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg ${typeStyle.bg}`}>
                        {appointment.type === 'vaccination' ? (
                          <Syringe className={`w-5 h-5 ${typeStyle.text}`} />
                        ) : appointment.type === 'growth_check' ? (
                          <TrendingUp className={`w-5 h-5 ${typeStyle.text}`} />
                        ) : (
                          <Heart className={`w-5 h-5 ${typeStyle.text}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {appointment.childName}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {appointment.title}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(appointment.status)} size="sm">
                        {typeStyle.badge}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <SectionTitle
              title="Recent Activity"
              action={
                <Button
                  variant="ghost"
                  icon={ChevronRight}
                  iconPosition="right"
                  size="sm"
                  onClick={() => router.push('/activities')}
                >
                  View All
                </Button>
              }
            />
            {isLoading ? (
              <div className="py-8 text-center text-slate-500">Loading activity...</div>
            ) : recentActivities.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No recent activity"
                description="New activity will appear as you log visits and vaccinations."
              />
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const visual = getActivityVisual(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${visual.bgColor}`}>
                        <visual.icon className={`w-4 h-4 ${visual.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-slate-500">{activity.childName}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* High Risk Pregnancies */}
        <Card>
          <SectionTitle
            title="High Risk Pregnancies"
            subtitle="Requires close monitoring"
            action={
              <Badge variant="warning" size="md">
                {highRiskPregnancies.length} Cases
              </Badge>
            }
          />
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Loading high risk cases...</div>
          ) : highRiskPregnancies.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No high risk pregnancies"
              description="All monitored pregnancies are within standard risk levels."
            />
          ) : (
            <div className="space-y-3">
              {highRiskPregnancies.map((pregnancy) => (
                <div
                  key={pregnancy.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors cursor-pointer"
                >
                  <Avatar name={pregnancy.motherName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {pregnancy.motherName}
                      </p>
                      {pregnancy.currentWeek !== null && (
                        <Badge variant="warning" size="sm">
                          Week {pregnancy.currentWeek}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pregnancy.riskFactors.length === 0 && (
                        <span className="text-xs text-amber-700">High risk monitoring</span>
                      )}
                      {pregnancy.riskFactors.map((factor, idx) => (
                        <span
                          key={`${pregnancy.id}-risk-${idx}`}
                          className="text-xs px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Next Visit</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {pregnancy.nextCheckupDate
                        ? format(new Date(pregnancy.nextCheckupDate), 'MMM d')
                        : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Overdue Vaccinations */}
        <Card>
          <SectionTitle
            title="Overdue Vaccinations"
            subtitle="Follow-up required"
            action={
              <Badge variant="error" size="md">
                {overdueVaccinations.length} Overdue
              </Badge>
            }
          />
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Loading vaccination alerts...</div>
          ) : overdueVaccinations.length === 0 ? (
            <EmptyState
              icon={Syringe}
              title="No overdue vaccinations"
              description="All tracked vaccinations are up to date."
            />
          ) : (
            <div className="space-y-3">
              {overdueVaccinations.map((record) => (
                <div
                  key={`${record.childId}-${record.vaccineId}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10"
                >
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <Syringe className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {record.childName}
                    </p>
                    <p className="text-sm text-slate-500">{record.vaccineName}</p>
                    <p className="text-xs text-red-500 mt-1">
                      {record.daysOverdue} days overdue • {record.childAge}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Phone}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleCall(record.parentPhone)}
                  >
                    Call
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <SectionTitle title="Quick Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card
            hover
            className="flex flex-col items-center justify-center py-6 text-center"
            onClick={() => router.push('/pregnancies?new=1')}
          >
            <div className="p-3 rounded-xl bg-pink-100 mb-3">
              <Heart className="w-6 h-6 text-pink-500" />
            </div>
            <p className="font-medium text-slate-900 dark:text-white">New Pregnancy</p>
            <p className="text-xs text-slate-500 mt-1">Register patient</p>
          </Card>
          <Card
            hover
            className="flex flex-col items-center justify-center py-6 text-center"
            onClick={() => router.push('/children?new=1')}
          >
            <div className="p-3 rounded-xl bg-purple-100 mb-3">
              <Baby className="w-6 h-6 text-purple-500" />
            </div>
            <p className="font-medium text-slate-900 dark:text-white">Add Child</p>
            <p className="text-xs text-slate-500 mt-1">Register newborn</p>
          </Card>
          <Card
            hover
            className="flex flex-col items-center justify-center py-6 text-center"
            onClick={() => router.push('/vaccinations?record=1')}
          >
            <div className="p-3 rounded-xl bg-blue-100 mb-3">
              <Syringe className="w-6 h-6 text-blue-500" />
            </div>
            <p className="font-medium text-slate-900 dark:text-white">Record Vaccine</p>
            <p className="text-xs text-slate-500 mt-1">Log vaccination</p>
          </Card>
          <Card
            hover
            className="flex flex-col items-center justify-center py-6 text-center"
            onClick={() => router.push('/reports')}
          >
            <div className="p-3 rounded-xl bg-emerald-100 mb-3">
              <FileText className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="font-medium text-slate-900 dark:text-white">Generate Report</p>
            <p className="text-xs text-slate-500 mt-1">Monthly summary</p>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Scan to Link Profile"
        size="md"
      >
        <div className="space-y-4">
          {isQrLoading && (
            <div className="w-full rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center text-sm text-slate-500">
              Generating QR code...
            </div>
          )}
          {qrError && (
            <Alert variant="warning" title="Unable to generate QR code" className="w-full">
              {qrError}
            </Alert>
          )}
          {qrImageUrl && !isQrLoading && (
            <img
              src={qrImageUrl}
              alt="Midwife QR code"
              className="w-full max-w-xs mx-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
            />
          )}
          {qrWarning && (
            <Alert variant="warning" title="Scan blocked" className="w-full">
              {qrWarning}
            </Alert>
          )}
          <p className="text-center text-sm text-slate-500">
            Scan this QR code with the selected profile in the mobile app.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isLinkModalOpen}
        onClose={handleCloseLinkModal}
        title={linkedProfileType === 'child' ? 'Linked Child Details' : 'Linked Pregnancy Details'}
        size="2xl"
      >
        {linkLoading && (
          <div className="py-10 text-center text-slate-500">Loading linked profile...</div>
        )}

        {!linkLoading && linkError && (
          <Alert variant="warning" title="Unable to load linked profile">
            {linkError}
          </Alert>
        )}

        {!linkLoading && !linkError && linkedProfileType === 'child' && linkedChild && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={`${linkedChild.firstName} ${linkedChild.lastName}`} size="lg" />
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {linkedChild.firstName} {linkedChild.lastName}
                </p>
                <p className="text-sm text-slate-500">
                  {formatShortDate(linkedChild.dateOfBirth)} • {linkedChild.gender === 'male' ? 'Male' : 'Female'}
                </p>
              </div>
            </div>

            {childActionError && (
              <Alert variant="warning" title="Update failed">
                {childActionError}
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Vaccinations</p>
                  {childVaccineStats && (
                    <Badge variant="info" size="sm">
                      {childVaccineStats.completionPercentage}% complete
                    </Badge>
                  )}
                </div>
                {childVaccines.length === 0 ? (
                  <p className="text-sm text-slate-500">No vaccination records yet.</p>
                ) : (
                  <div className="space-y-2">
                    {childVaccines.map((record) => (
                      <div
                        key={`${record.childId}-${record.vaccineId}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {record.vaccine?.name ?? 'Vaccine'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Due {formatShortDate(record.scheduledDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getVaccinationStatusVariant(record.status)} size="sm">
                            {record.status}
                          </Badge>
                          {record.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              isLoading={vaccineActionId === record.vaccineId}
                              onClick={() => handleAdministerVaccine(record)}
                            >
                              Administer
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Growth Tracking</p>
                {childGrowth.length === 0 ? (
                  <p className="text-sm text-slate-500">No growth measurements yet.</p>
                ) : (
                  <div className="space-y-2">
                    {childGrowth.slice(0, 4).map((measurement) => (
                      <div
                        key={measurement.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                      >
                        <div>
                          <p className="text-sm text-slate-900 dark:text-white">
                            {formatShortDate(measurement.measurementDate)}
                          </p>
                          <p className="text-xs text-slate-500">{measurement.weight} kg • {measurement.height} cm</p>
                        </div>
                        <Badge variant="info" size="sm">
                          {childGrowthSummary?.latestWeightPercentile ?? '--'}%ile
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-4 space-y-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Add measurement</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Measurement Date"
                      type="date"
                      value={growthForm.measurementDate}
                      onChange={(event) => setGrowthForm((prev) => ({ ...prev, measurementDate: event.target.value }))}
                    />
                    <Input
                      label="Weight (kg)"
                      type="number"
                      value={growthForm.weight}
                      onChange={(event) => setGrowthForm((prev) => ({ ...prev, weight: event.target.value }))}
                    />
                    <Input
                      label="Height (cm)"
                      type="number"
                      value={growthForm.height}
                      onChange={(event) => setGrowthForm((prev) => ({ ...prev, height: event.target.value }))}
                    />
                    <Input
                      label="Head Circumference (cm)"
                      type="number"
                      value={growthForm.headCircumference}
                      onChange={(event) => setGrowthForm((prev) => ({ ...prev, headCircumference: event.target.value }))}
                    />
                  </div>
                  <Input
                    label="Notes"
                    value={growthForm.notes}
                    onChange={(event) => setGrowthForm((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                  <Button isLoading={isGrowthSubmitting} onClick={handleGrowthSubmit}>
                    Save Measurement
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Appointments</p>
                <Badge variant="info" size="sm">
                  {childAppointments.length} total
                </Badge>
              </div>
              {childAppointments.length === 0 ? (
                <p className="text-sm text-slate-500">No appointments scheduled yet.</p>
              ) : (
                <div className="space-y-2">
                  {childAppointments.slice(0, 5).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{appointment.title}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(appointment.dateTime)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(appointment.status)} size="sm">
                          {appointment.status}
                        </Badge>
                        {appointment.status === 'scheduled' && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              isLoading={appointmentActionId === appointment.id}
                              onClick={() => handleAppointmentStatus(appointment.id, 'complete')}
                            >
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              isLoading={appointmentActionId === appointment.id}
                              onClick={() => handleAppointmentStatus(appointment.id, 'cancel')}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Schedule appointment</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Title"
                    value={appointmentForm.title}
                    onChange={(event) => setAppointmentForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                  <Select
                    label="Type"
                    options={[
                      { value: 'general_checkup', label: 'Checkup' },
                      { value: 'vaccination', label: 'Vaccination' },
                      { value: 'growth_check', label: 'Growth Check' },
                      { value: 'development_check', label: 'Development Check' },
                      { value: 'specialist', label: 'Specialist' },
                      { value: 'emergency', label: 'Emergency' },
                    ]}
                    value={appointmentForm.type}
                    onChange={(event) => setAppointmentForm((prev) => ({ ...prev, type: event.target.value }))}
                  />
                  <Input
                    label="Date & Time"
                    type="datetime-local"
                    value={appointmentForm.dateTime}
                    onChange={(event) => setAppointmentForm((prev) => ({ ...prev, dateTime: event.target.value }))}
                  />
                  <Input
                    label="Location"
                    value={appointmentForm.location}
                    onChange={(event) => setAppointmentForm((prev) => ({ ...prev, location: event.target.value }))}
                  />
                </div>
                <Input
                  label="Notes"
                  value={appointmentForm.notes}
                  onChange={(event) => setAppointmentForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
                <Button isLoading={isAppointmentSubmitting} onClick={handleAppointmentSubmit}>
                  Add Appointment
                </Button>
              </div>
            </div>
          </div>
        )}

        {!linkLoading && !linkError && linkedProfileType === 'pregnancy' && pregnancyProfile && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={pregnancyProfile.motherFullName} size="lg" />
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {pregnancyProfile.motherFullName}
                </p>
                <p className="text-sm text-slate-500">
                  Week {pregnancyProfile.currentWeek ?? '--'} • Due {formatShortDate(pregnancyProfile.expectedDeliveryDate)}
                </p>
              </div>
            </div>

            {pregnancyActionError && (
              <Alert variant="warning" title="Update failed">
                {pregnancyActionError}
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Checkups</p>
                {pregnancyCheckups.length === 0 ? (
                  <p className="text-sm text-slate-500">No checkups recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {pregnancyCheckups.slice(0, 4).map((checkup) => (
                      <div
                        key={checkup.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                      >
                        <p className="text-sm text-slate-900 dark:text-white">
                          {formatShortDate(checkup.checkupDate)} • Week {checkup.weekOfPregnancy ?? '--'}
                        </p>
                        <p className="text-xs text-slate-500">Weight {checkup.weight ?? '--'} kg</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-4 space-y-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Add checkup</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Checkup Date"
                      type="date"
                      value={checkupForm.checkupDate}
                      onChange={(event) => setCheckupForm((prev) => ({ ...prev, checkupDate: event.target.value }))}
                    />
                    <Input
                      label="Week"
                      type="number"
                      value={checkupForm.weekOfPregnancy}
                      onChange={(event) => setCheckupForm((prev) => ({ ...prev, weekOfPregnancy: event.target.value }))}
                    />
                    <Input
                      label="Weight (kg)"
                      type="number"
                      value={checkupForm.weight}
                      onChange={(event) => setCheckupForm((prev) => ({ ...prev, weight: event.target.value }))}
                    />
                    <Input
                      label="Next Checkup"
                      type="date"
                      value={checkupForm.nextCheckupDate}
                      onChange={(event) => setCheckupForm((prev) => ({ ...prev, nextCheckupDate: event.target.value }))}
                    />
                    <Input
                      label="BP Systolic"
                      type="number"
                      value={checkupForm.bloodPressureSystolic}
                      onChange={(event) => setCheckupForm((prev) => ({ ...prev, bloodPressureSystolic: event.target.value }))}
                    />
                    <Input
                      label="BP Diastolic"
                      type="number"
                      value={checkupForm.bloodPressureDiastolic}
                      onChange={(event) => setCheckupForm((prev) => ({ ...prev, bloodPressureDiastolic: event.target.value }))}
                    />
                  </div>
                  <Input
                    label="Notes"
                    value={checkupForm.notes}
                    onChange={(event) => setCheckupForm((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                  <Button isLoading={pregnancySubmitKey === 'checkup'} onClick={handleCheckupSubmit}>
                    Save Checkup
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Weight Tracking</p>
                {pregnancyMeasurements.length === 0 ? (
                  <p className="text-sm text-slate-500">No measurements recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {pregnancyMeasurements.slice(0, 4).map((measurement) => (
                      <div
                        key={measurement.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                      >
                        <p className="text-sm text-slate-900 dark:text-white">
                          {formatShortDate(measurement.measurementDate)} • Week {measurement.weekOfPregnancy ?? '--'}
                        </p>
                        <p className="text-xs text-slate-500">Weight {measurement.weight ?? '--'} kg</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-4 space-y-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Add measurement</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Measurement Date"
                      type="date"
                      value={measurementForm.measurementDate}
                      onChange={(event) => setMeasurementForm((prev) => ({ ...prev, measurementDate: event.target.value }))}
                    />
                    <Input
                      label="Week"
                      type="number"
                      value={measurementForm.weekOfPregnancy}
                      onChange={(event) => setMeasurementForm((prev) => ({ ...prev, weekOfPregnancy: event.target.value }))}
                    />
                    <Input
                      label="Weight (kg)"
                      type="number"
                      value={measurementForm.weight}
                      onChange={(event) => setMeasurementForm((prev) => ({ ...prev, weight: event.target.value }))}
                    />
                    <Input
                      label="Belly Circumference (cm)"
                      type="number"
                      value={measurementForm.bellyCircumference}
                      onChange={(event) => setMeasurementForm((prev) => ({ ...prev, bellyCircumference: event.target.value }))}
                    />
                    <Input
                      label="BP Systolic"
                      type="number"
                      value={measurementForm.bloodPressureSystolic}
                      onChange={(event) => setMeasurementForm((prev) => ({ ...prev, bloodPressureSystolic: event.target.value }))}
                    />
                    <Input
                      label="BP Diastolic"
                      type="number"
                      value={measurementForm.bloodPressureDiastolic}
                      onChange={(event) => setMeasurementForm((prev) => ({ ...prev, bloodPressureDiastolic: event.target.value }))}
                    />
                  </div>
                  <Input
                    label="Symptoms (comma-separated)"
                    value={measurementForm.symptoms}
                    onChange={(event) => setMeasurementForm((prev) => ({ ...prev, symptoms: event.target.value }))}
                  />
                  <Input
                    label="Mood"
                    value={measurementForm.mood}
                    onChange={(event) => setMeasurementForm((prev) => ({ ...prev, mood: event.target.value }))}
                  />
                  <Input
                    label="Notes"
                    value={measurementForm.notes}
                    onChange={(event) => setMeasurementForm((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                  <Button isLoading={pregnancySubmitKey === 'measurement'} onClick={handleMeasurementSubmit}>
                    Save Measurement
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Symptoms</p>
                {pregnancySymptoms.length === 0 ? (
                  <p className="text-sm text-slate-500">No symptoms logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {pregnancySymptoms.slice(0, 4).map((symptom) => (
                      <div
                        key={symptom.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                      >
                        <p className="text-sm text-slate-900 dark:text-white">
                          {formatShortDate(symptom.date)} • Week {symptom.weekOfPregnancy}
                        </p>
                        <p className="text-xs text-slate-500">{symptom.symptoms.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-4 space-y-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Log symptoms</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Date"
                      type="date"
                      value={symptomForm.date}
                      onChange={(event) => setSymptomForm((prev) => ({ ...prev, date: event.target.value }))}
                    />
                    <Input
                      label="Week"
                      type="number"
                      value={symptomForm.weekOfPregnancy}
                      onChange={(event) => setSymptomForm((prev) => ({ ...prev, weekOfPregnancy: event.target.value }))}
                    />
                  </div>
                  <Input
                    label="Symptoms (comma-separated)"
                    value={symptomForm.symptoms}
                    onChange={(event) => setSymptomForm((prev) => ({ ...prev, symptoms: event.target.value }))}
                  />
                  <Input
                    label="Notes"
                    value={symptomForm.notes}
                    onChange={(event) => setSymptomForm((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                  <Button isLoading={pregnancySubmitKey === 'symptom'} onClick={handleSymptomSubmit}>
                    Save Symptoms
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Medical Information</p>
                <Input
                  label="Medical Conditions (comma-separated)"
                  value={medicalConditionsInput}
                  onChange={(event) => setMedicalConditionsInput(event.target.value)}
                />
                <Button
                  variant="outline"
                  isLoading={pregnancySubmitKey === 'medical'}
                  onClick={handleMedicalConditionsSubmit}
                >
                  Update Conditions
                </Button>
                <Input
                  label="Allergies (comma-separated)"
                  value={allergiesInput}
                  onChange={(event) => setAllergiesInput(event.target.value)}
                />
                <Button
                  variant="outline"
                  isLoading={pregnancySubmitKey === 'allergies'}
                  onClick={handleAllergiesSubmit}
                >
                  Update Allergies
                </Button>
                <Input
                  label="Current Weight (kg)"
                  type="number"
                  value={weightInput}
                  onChange={(event) => setWeightInput(event.target.value)}
                />
                <Button
                  variant="primary"
                  isLoading={pregnancySubmitKey === 'weight'}
                  onClick={handleWeightSubmit}
                >
                  Update Weight
                </Button>
              </div>
            </div>
          </div>
        )}

        {!linkLoading && !linkError && linkedProfileType === 'child' && !linkedChild && (
          <p className="text-sm text-slate-500">Linked child profile not found.</p>
        )}
        {!linkLoading && !linkError && linkedProfileType === 'pregnancy' && !pregnancyProfile && (
          <p className="text-sm text-slate-500">Linked pregnancy profile not found.</p>
        )}
      </Modal>
    </MainLayout>
  );
}
