/**
 * Appointments Management Page
 * 
 * Displays and manages all appointments including prenatal,
 * postnatal, vaccination, and growth check appointments.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format, isFuture, isToday, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  Clock,
  Phone,
  MapPin,
  Heart,
  Baby,
  Syringe,
  TrendingUp,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  User,
} from 'lucide-react';
import { MainLayout, Header } from '../components/main-layout';
import {
  Card,
  Button,
  Badge,
  Avatar,
  SectionTitle,
  Input,
  Select,
  Modal,
  EmptyState,
  Alert,
} from '../components/ui';
import apiClient from '../lib/api-client';
import { useChildStore } from '../lib/stores';
import type { ApiResponse, ChildProfile } from '../lib/types';

interface ApiAppointment {
  id: string;
  childId: string;
  title: string;
  type: string;
  dateTime: string;
  duration?: number | null;
  status: string;
  location: string;
  address?: string | null;
  providerName?: string | null;
  providerRole?: string | null;
  providerPhone?: string | null;
  notes?: string | null;
  child?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const APPOINTMENT_TYPE_OPTIONS = [
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'growth_check', label: 'Growth Check' },
  { value: 'development_check', label: 'Development Check' },
  { value: 'general_checkup', label: 'General Checkup' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'emergency', label: 'Emergency' },
];

const getAppointmentTypeConfig = (type: string) => {
  switch (type) {
    case 'vaccination':
      return { icon: Syringe, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Vaccination' };
    case 'growth_check':
      return { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-100', label: 'Growth Check' };
    case 'development_check':
      return { icon: Baby, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Development' };
    case 'general_checkup':
      return { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-100', label: 'Checkup' };
    case 'specialist':
      return { icon: User, color: 'text-indigo-500', bg: 'bg-indigo-100', label: 'Specialist' };
    case 'emergency':
      return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100', label: 'Emergency' };
    default:
      return { icon: Calendar, color: 'text-slate-500', bg: 'bg-slate-100', label: type };
  }
};

const getStatusBadge = (status: string, dateTime: string) => {
  const appointmentDate = new Date(dateTime);

  if (status === 'completed') {
    return <Badge variant="success">Completed</Badge>;
  }
  if (status === 'cancelled') {
    return <Badge variant="error">Cancelled</Badge>;
  }
  if (status === 'missed') {
    return <Badge variant="error">Missed</Badge>;
  }
  if (status === 'rescheduled') {
    return <Badge variant="warning">Rescheduled</Badge>;
  }
  if (isToday(appointmentDate)) {
    return <Badge variant="warning">Today</Badge>;
  }
  return <Badge variant="info">Scheduled</Badge>;
};

export default function AppointmentsPage() {
  const searchParams = useSearchParams();
  const { children, isLoading: childrenLoading, error: childrenError, fetchChildren } = useChildStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<ApiAppointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<ApiAppointment | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    childId: '',
    title: '',
    type: 'general_checkup',
    dateTime: '',
    duration: '30',
    location: '',
    address: '',
    providerName: '',
    providerRole: '',
    providerPhone: '',
    notes: '',
  });

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingAppointment(null);
      setIsFormModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    let isCancelled = false;

    const loadAppointments = async () => {
      setAppointmentsLoading(true);
      setAppointmentsError('');

      try {
        const response = await apiClient.get<ApiResponse<ApiAppointment[]>>('/appointments');
        if (!isCancelled) {
          setAppointments(response.data ?? []);
        }
      } catch (error) {
        if (!isCancelled) {
          setAppointmentsError((error as Error).message || 'Failed to load appointments');
        }
      } finally {
        if (!isCancelled) {
          setAppointmentsLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isFormModalOpen) return;
    setFormError('');

    if (editingAppointment) {
      setFormState({
        childId: editingAppointment.childId,
        title: editingAppointment.title,
        type: editingAppointment.type,
        dateTime: format(new Date(editingAppointment.dateTime), "yyyy-MM-dd'T'HH:mm"),
        duration: editingAppointment.duration ? String(editingAppointment.duration) : '30',
        location: editingAppointment.location,
        address: editingAppointment.address ?? '',
        providerName: editingAppointment.providerName ?? '',
        providerRole: editingAppointment.providerRole ?? '',
        providerPhone: editingAppointment.providerPhone ?? '',
        notes: editingAppointment.notes ?? '',
      });
    } else {
      setFormState({
        childId: children[0]?.id ?? '',
        title: '',
        type: 'general_checkup',
        dateTime: '',
        duration: '30',
        location: '',
        address: '',
        providerName: '',
        providerRole: '',
        providerPhone: '',
        notes: '',
      });
    }
  }, [isFormModalOpen, editingAppointment, children]);

  const childLookup = useMemo(() => {
    return new Map(children.map((child) => [child.id, child]));
  }, [children]);

  const getChildName = (appointment: ApiAppointment) => {
    if (appointment.child) {
      return `${appointment.child.firstName} ${appointment.child.lastName}`.trim();
    }
    const child = childLookup.get(appointment.childId);
    if (!child) return 'Unknown Child';
    return `${child.firstName} ${child.lastName}`.trim();
  };

  const getParentName = (child?: ChildProfile) =>
    child?.motherName || child?.fatherName || 'Not provided';

  const getParentPhone = (child?: ChildProfile) =>
    child?.emergencyContact || '';

  const handleCall = (phone?: string) => {
    if (!phone) return;
    const digits = phone.replace(/\D+/g, '');
    if (!digits) return;
    window.open(`tel:${digits}`, '_self');
  };

  const handleSaveAppointment = async () => {
    if (!formState.childId || !formState.title || !formState.dateTime || !formState.location) {
      setFormError('Please fill in required fields.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    const payload = {
      title: formState.title,
      type: formState.type,
      dateTime: new Date(formState.dateTime).toISOString(),
      duration: formState.duration ? Number(formState.duration) : undefined,
      location: formState.location,
      address: formState.address || undefined,
      providerName: formState.providerName || undefined,
      providerRole: formState.providerRole || undefined,
      providerPhone: formState.providerPhone || undefined,
      notes: formState.notes || undefined,
    };

    try {
      if (editingAppointment) {
        const updated = await apiClient.patch<ApiAppointment>(
          `/appointments/${editingAppointment.id}`,
          payload
        );
        setAppointments((prev) => prev.map((apt) => (apt.id === updated.id ? updated : apt)));
      } else {
        const created = await apiClient.post<ApiAppointment>(
          `/appointments/child/${formState.childId}`,
          payload
        );
        setAppointments((prev) => [created, ...prev]);
      }

      setIsFormModalOpen(false);
      setEditingAppointment(null);
    } catch (error) {
      setFormError((error as Error).message || 'Failed to save appointment');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleComplete = async (appointment: ApiAppointment) => {
    try {
      const updated = await apiClient.patch<ApiAppointment>(
        `/appointments/${appointment.id}/complete`
      );
      setAppointments((prev) => prev.map((apt) => (apt.id === updated.id ? updated : apt)));
    } catch (error) {
      setAppointmentsError((error as Error).message || 'Failed to complete appointment');
    }
  };

  const handleCancel = async (appointment: ApiAppointment) => {
    try {
      const updated = await apiClient.patch<ApiAppointment>(
        `/appointments/${appointment.id}/cancel`
      );
      setAppointments((prev) => prev.map((apt) => (apt.id === updated.id ? updated : apt)));
    } catch (error) {
      setAppointmentsError((error as Error).message || 'Failed to cancel appointment');
    }
  };

  const handleDelete = async (appointment: ApiAppointment) => {
    try {
      await apiClient.delete(`/appointments/${appointment.id}`);
      setAppointments((prev) => prev.filter((apt) => apt.id !== appointment.id));
      setSelectedAppointment(null);
    } catch (error) {
      setAppointmentsError((error as Error).message || 'Failed to delete appointment');
    }
  };

  const openNewAppointment = () => {
    setEditingAppointment(null);
    setIsFormModalOpen(true);
  };

  const openEditAppointment = (appointment: ApiAppointment) => {
    setEditingAppointment(appointment);
    setIsFormModalOpen(true);
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const childName = getChildName(appointment);
      const matchesSearch = childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || appointment.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [appointments, searchTerm, filterType, childLookup]);

  const todayAppointments = filteredAppointments.filter(a => isToday(new Date(a.dateTime)));
  const upcomingCount = appointments.filter(a => isFuture(new Date(a.dateTime))).length;
  const errorMessage = appointmentsError || childrenError || '';
  const isLoading = appointmentsLoading || childrenLoading;
  const selectedChild = selectedAppointment ? childLookup.get(selectedAppointment.childId) : undefined;
  const selectedChildName = selectedAppointment ? getChildName(selectedAppointment) : '';
  const selectedParentName = getParentName(selectedChild);
  const selectedParentPhone = getParentPhone(selectedChild);

  // Calendar helpers
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getAppointmentsForDate = (date: Date) => {
    return filteredAppointments.filter(a => isSameDay(new Date(a.dateTime), date));
  };

  return (
    <MainLayout>
      <Header
        title="Appointments"
        subtitle={`${todayAppointments.length} appointments today`}
        actions={
          <Button icon={Plus} variant="primary" onClick={openNewAppointment}>
            New Appointment
          </Button>
        }
      />

      {errorMessage && (
        <Alert variant="warning" title="Unable to load appointments" className="mt-4" icon={AlertCircle}>
          {errorMessage}
        </Alert>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-pink-100">
            <Calendar className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{todayAppointments.length}</p>
            <p className="text-sm text-slate-500">Today</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-blue-100">
            <Clock className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{upcomingCount}</p>
            <p className="text-sm text-slate-500">Upcoming</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-purple-100">
            <Heart className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {appointments.filter(a => a.type === 'general_checkup').length}
            </p>
            <p className="text-sm text-slate-500">Checkups</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-emerald-100">
            <Syringe className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {appointments.filter(a => a.type === 'vaccination').length}
            </p>
            <p className="text-sm text-slate-500">Vaccinations</p>
          </div>
        </Card>
      </div>

      {/* View Toggle & Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List View
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </Button>
          </div>
          <div className="flex-1 w-full">
            <Input
              placeholder="Search appointments..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Types' },
              ...APPOINTMENT_TYPE_OPTIONS,
            ]}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-44"
          />
        </div>
      </Card>

      {viewMode === 'list' ? (
        /* List View */
        <div className="space-y-4">
          {isLoading ? (
            <Card className="text-center py-8 text-slate-500">Loading appointments...</Card>
          ) : filteredAppointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No appointments found"
              description="Try adjusting your filters or schedule a new appointment."
            />
          ) : (
            <>
              {/* Today's Appointments */}
              <div>
                <SectionTitle
                  title="Today's Appointments"
                  subtitle={format(new Date(), 'EEEE, MMMM d, yyyy')}
                />
                {todayAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {todayAppointments.map((appointment) => {
                      const typeConfig = getAppointmentTypeConfig(appointment.type);
                      const Icon = typeConfig.icon;
                      const child = childLookup.get(appointment.childId);
                      const childName = getChildName(appointment);
                      const parentName = getParentName(child);
                      const parentPhone = getParentPhone(child);
                      
                      return (
                        <Card 
                          key={appointment.id} 
                          hover
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="text-center min-w-17.5">
                              <p className="text-lg font-bold text-slate-900 dark:text-white">
                                {format(new Date(appointment.dateTime), 'h:mm')}
                              </p>
                              <p className="text-xs text-slate-500">
                                {format(new Date(appointment.dateTime), 'a')}
                              </p>
                            </div>
                            <div className={`p-3 rounded-xl ${typeConfig.bg}`}>
                              <Icon className={`w-6 h-6 ${typeConfig.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                  {childName}
                                </h3>
                                {getStatusBadge(appointment.status, appointment.dateTime)}
                              </div>
                              <p className="text-sm text-slate-500">
                                {appointment.title}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                Parent: {parentName}{parentPhone ? ` • ${parentPhone}` : ''}
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {appointment.duration ? `${appointment.duration} min` : '—'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {appointment.location}
                                </span>
                              </div>
                            </div>
                            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={Phone}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleCall(parentPhone);
                                }}
                              >
                                Call
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                icon={Check}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleComplete(appointment);
                                }}
                                disabled={appointment.status !== 'scheduled'}
                              >
                                Complete
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="text-center py-8">
                    <p className="text-slate-500">No appointments scheduled for today</p>
                  </Card>
                )}
              </div>

              {/* Upcoming Appointments */}
              <div className="mt-8">
                <SectionTitle
                  title="Upcoming Appointments"
                  subtitle="Next 7 days"
                />
                <div className="space-y-3">
                  {filteredAppointments
                    .filter(a => isFuture(new Date(a.dateTime)) && !isToday(new Date(a.dateTime)))
                    .slice(0, 10)
                    .map((appointment) => {
                      const typeConfig = getAppointmentTypeConfig(appointment.type);
                      const Icon = typeConfig.icon;
                      const child = childLookup.get(appointment.childId);
                      const childName = getChildName(appointment);
                      const parentName = getParentName(child);
                      
                      return (
                        <Card 
                          key={appointment.id} 
                          hover
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="text-center min-w-17.5">
                              <p className="text-sm font-medium text-slate-500">
                                {format(new Date(appointment.dateTime), 'MMM d')}
                              </p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">
                                {format(new Date(appointment.dateTime), 'h:mm a')}
                              </p>
                            </div>
                            <div className={`p-3 rounded-xl ${typeConfig.bg}`}>
                              <Icon className={`w-6 h-6 ${typeConfig.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                  {childName}
                                </h3>
                                <Badge variant="default" size="sm">{typeConfig.label}</Badge>
                              </div>
                              <p className="text-sm text-slate-500 truncate">
                                {appointment.title}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                Parent: {parentName}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Edit}
                              className="self-start sm:self-auto"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditAppointment(appointment);
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Calendar View */
        <Card>
          {/* Calendar Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <Button
              variant="ghost"
              icon={ChevronLeft}
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {format(weekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
            </h2>
            <Button
              variant="ghost"
              icon={ChevronRight}
              iconPosition="right"
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            />
          </div>

          {/* Week Grid */}
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-2 min-w-[720px]">
              {weekDays.map((day) => {
              const dayAppointments = getAppointmentsForDate(day);
              const isCurrentDay = isToday(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-50 rounded-lg border p-2 ${
                    isCurrentDay
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/10'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="text-center mb-2">
                    <p className="text-xs text-slate-500">{format(day, 'EEE')}</p>
                    <p
                      className={`text-lg font-semibold ${
                        isCurrentDay
                          ? 'text-pink-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {format(day, 'd')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 4).map((apt) => {
                      const typeConfig = getAppointmentTypeConfig(apt.type);
                      const childName = getChildName(apt);
                      return (
                        <div
                          key={apt.id}
                          className={`p-1.5 rounded text-xs cursor-pointer hover:opacity-80 ${typeConfig.bg}`}
                          onClick={() => setSelectedAppointment(apt)}
                        >
                          <p className={`font-medium truncate ${typeConfig.color}`}>
                            {format(new Date(apt.dateTime), 'h:mm a')}
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 truncate">
                            {childName}
                          </p>
                        </div>
                      );
                    })}
                    {dayAppointments.length > 4 && (
                      <p className="text-xs text-center text-slate-500">
                        +{dayAppointments.length - 4} more
                      </p>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Appointment Detail Modal */}
      <Modal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        title="Appointment Details"
        size="md"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={selectedChildName} size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedChildName}
                </h3>
                <p className="text-slate-500">Parent: {selectedParentName}</p>
                {selectedParentPhone && (
                  <button
                    type="button"
                    className="text-sm text-slate-400 hover:text-slate-600"
                    onClick={() => handleCall(selectedParentPhone)}
                  >
                    {selectedParentPhone}
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                {selectedAppointment.title}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(selectedAppointment.dateTime), 'MMMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-4 h-4" />
                  {format(new Date(selectedAppointment.dateTime), 'h:mm a')}
                  {selectedAppointment.duration ? ` (${selectedAppointment.duration} min)` : ''}
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="w-4 h-4" />
                  {selectedAppointment.location}
                </div>
                <div>
                  {getStatusBadge(selectedAppointment.status, selectedAppointment.dateTime)}
                </div>
              </div>
            </div>

            {(selectedAppointment.providerName || selectedAppointment.providerPhone) && (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Provider</h4>
                <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <p>
                    {selectedAppointment.providerName || 'Unknown'}
                    {selectedAppointment.providerRole ? ` • ${selectedAppointment.providerRole}` : ''}
                  </p>
                  {selectedAppointment.providerPhone && (
                    <button
                      type="button"
                      className="text-sm text-slate-500 hover:text-slate-700"
                      onClick={() => handleCall(selectedAppointment.providerPhone ?? undefined)}
                    >
                      {selectedAppointment.providerPhone}
                    </button>
                  )}
                </div>
              </div>
            )}

            {selectedAppointment.notes && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Notes:</strong> {selectedAppointment.notes}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="primary"
                icon={Check}
                className="flex-1"
                onClick={() => handleComplete(selectedAppointment)}
                disabled={selectedAppointment.status !== 'scheduled'}
              >
                Complete
              </Button>
              <Button
                variant="outline"
                icon={Edit}
                className="flex-1"
                onClick={() => {
                  setSelectedAppointment(null);
                  openEditAppointment(selectedAppointment);
                }}
              >
                Reschedule
              </Button>
              <Button
                variant="ghost"
                icon={Trash2}
                className="text-red-500"
                onClick={() => handleCancel(selectedAppointment)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Appointment Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingAppointment ? 'Edit Appointment' : 'Schedule Appointment'}
        size="lg"
      >
        {children.length === 0 ? (
          <Alert variant="warning" title="No patients available" icon={AlertCircle}>
            Please register a child before scheduling an appointment.
          </Alert>
        ) : (
          <div className="space-y-4">
            <Select
              label="Child"
              options={children.map((child) => ({
                value: child.id,
                label: `${child.firstName} ${child.lastName}`.trim(),
              }))}
              value={formState.childId}
              onChange={(e) => setFormState((prev) => ({ ...prev, childId: e.target.value }))}
            />
            <Input
              label="Title"
              placeholder="Appointment title"
              value={formState.title}
              onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Select
              label="Appointment Type"
              options={APPOINTMENT_TYPE_OPTIONS}
              value={formState.type}
              onChange={(e) => setFormState((prev) => ({ ...prev, type: e.target.value }))}
            />
            <Input
              label="Date & Time"
              type="datetime-local"
              value={formState.dateTime}
              onChange={(e) => setFormState((prev) => ({ ...prev, dateTime: e.target.value }))}
            />
            <Select
              label="Duration"
              options={[
                { value: '15', label: '15 minutes' },
                { value: '30', label: '30 minutes' },
                { value: '45', label: '45 minutes' },
                { value: '60', label: '60 minutes' },
              ]}
              value={formState.duration}
              onChange={(e) => setFormState((prev) => ({ ...prev, duration: e.target.value }))}
            />
            <Input
              label="Location"
              placeholder="MOH Office..."
              icon={MapPin}
              value={formState.location}
              onChange={(e) => setFormState((prev) => ({ ...prev, location: e.target.value }))}
            />
            <Input
              label="Address"
              placeholder="Address (optional)"
              value={formState.address}
              onChange={(e) => setFormState((prev) => ({ ...prev, address: e.target.value }))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Provider Name"
                placeholder="Doctor or clinic name"
                value={formState.providerName}
                onChange={(e) => setFormState((prev) => ({ ...prev, providerName: e.target.value }))}
              />
              <Input
                label="Provider Role"
                placeholder="Specialist, nurse..."
                value={formState.providerRole}
                onChange={(e) => setFormState((prev) => ({ ...prev, providerRole: e.target.value }))}
              />
            </div>
            <Input
              label="Provider Phone"
              placeholder="Phone (optional)"
              value={formState.providerPhone}
              onChange={(e) => setFormState((prev) => ({ ...prev, providerPhone: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Notes
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder="Additional notes..."
                value={formState.notes}
                onChange={(e) => setFormState((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            {formError && (
              <Alert variant="warning" title="Unable to save" icon={AlertCircle}>
                {formError}
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                icon={Plus}
                className="flex-1"
                onClick={handleSaveAppointment}
                disabled={formSubmitting}
              >
                {editingAppointment ? 'Save Changes' : 'Schedule Appointment'}
              </Button>
              <Button variant="ghost" onClick={() => setIsFormModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
