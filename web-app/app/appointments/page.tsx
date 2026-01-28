/**
 * Appointments Management Page
 * 
 * Displays and manages all appointments including prenatal,
 * postnatal, vaccination, and growth check appointments.
 */

'use client';

import React, { useState } from 'react';
import { format, isPast, isFuture, isToday, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  Clock,
  User,
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
} from 'lucide-react';
import { MainLayout, Header } from '../components/layout';
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
} from '../components/ui';

// Mock appointments data
const mockAppointments = [
  {
    id: '1',
    patientName: 'Amaya Perera',
    patientType: 'pregnancy',
    type: 'prenatal',
    title: 'Prenatal Checkup - Week 28',
    dateTime: '2026-01-28T09:00:00',
    duration: 30,
    status: 'confirmed',
    phone: '+94 77 123 4567',
    location: 'MOH Office Colombo',
    notes: 'Regular checkup, monitor blood pressure',
  },
  {
    id: '2',
    patientName: 'Sithumi Fernando',
    childName: 'Baby Kavisha',
    patientType: 'child',
    type: 'vaccination',
    title: 'DTP-HepB-Hib Dose 2',
    dateTime: '2026-01-28T10:30:00',
    duration: 15,
    status: 'scheduled',
    phone: '+94 71 234 5678',
    location: 'MOH Office Colombo',
    notes: '',
  },
  {
    id: '3',
    patientName: 'Nethmi Silva',
    childName: 'Kasun',
    patientType: 'child',
    type: 'growth_check',
    title: 'Growth Measurement',
    dateTime: '2026-01-28T11:30:00',
    duration: 20,
    status: 'scheduled',
    phone: '+94 76 345 6789',
    location: 'MOH Office Colombo',
    notes: 'Check weight gain progress',
  },
  {
    id: '4',
    patientName: 'Dilani Jayawardena',
    patientType: 'pregnancy',
    type: 'prenatal',
    title: 'Prenatal Checkup - Week 36',
    dateTime: '2026-01-28T14:00:00',
    duration: 45,
    status: 'confirmed',
    phone: '+94 77 456 7890',
    location: 'MOH Office Colombo',
    notes: 'Final trimester assessment',
  },
  {
    id: '5',
    patientName: 'Kumari Bandara',
    childName: 'Baby Nipun',
    patientType: 'child',
    type: 'postnatal',
    title: 'Postnatal Checkup',
    dateTime: '2026-01-28T15:30:00',
    duration: 30,
    status: 'scheduled',
    phone: '+94 71 567 8901',
    location: 'MOH Office Colombo',
    notes: 'First postnatal visit',
  },
  {
    id: '6',
    patientName: 'Rashmi Herath',
    childName: 'Dinithi',
    patientType: 'child',
    type: 'vaccination',
    title: 'OPV Booster',
    dateTime: '2026-01-28T16:30:00',
    duration: 15,
    status: 'scheduled',
    phone: '+94 76 678 9012',
    location: 'MOH Office Colombo',
    notes: '',
  },
  {
    id: '7',
    patientName: 'Chamari Wickramasinghe',
    patientType: 'pregnancy',
    type: 'prenatal',
    title: 'High Risk Follow-up',
    dateTime: '2026-01-29T09:00:00',
    duration: 45,
    status: 'confirmed',
    phone: '+94 77 789 0123',
    location: 'MOH Office Colombo',
    notes: 'Monitor gestational diabetes',
  },
  {
    id: '8',
    patientName: 'Sanduni Gunasekara',
    patientType: 'pregnancy',
    type: 'prenatal',
    title: 'Twin Pregnancy Checkup',
    dateTime: '2026-01-30T10:00:00',
    duration: 60,
    status: 'scheduled',
    phone: '+94 71 890 1234',
    location: 'MOH Office Colombo',
    notes: 'Multiple pregnancy monitoring',
  },
];

const getAppointmentTypeConfig = (type: string) => {
  switch (type) {
    case 'prenatal':
      return { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-100', label: 'Prenatal' };
    case 'postnatal':
      return { icon: Baby, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Postnatal' };
    case 'vaccination':
      return { icon: Syringe, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Vaccination' };
    case 'growth_check':
      return { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-100', label: 'Growth Check' };
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
  if (isToday(appointmentDate)) {
    return <Badge variant="warning">Today</Badge>;
  }
  if (status === 'confirmed') {
    return <Badge variant="success">Confirmed</Badge>;
  }
  return <Badge variant="info">Scheduled</Badge>;
};

export default function AppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<typeof mockAppointments[0] | null>(null);

  const filteredAppointments = mockAppointments.filter((appointment) => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || appointment.type === filterType;
    return matchesSearch && matchesType;
  });

  const todayAppointments = mockAppointments.filter(a => isToday(new Date(a.dateTime)));
  const upcomingCount = mockAppointments.filter(a => isFuture(new Date(a.dateTime))).length;

  // Calendar helpers
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getAppointmentsForDate = (date: Date) => {
    return mockAppointments.filter(a => isSameDay(new Date(a.dateTime), date));
  };

  return (
    <MainLayout>
      <Header
        title="Appointments"
        subtitle={`${todayAppointments.length} appointments today`}
        actions={
          <Button icon={Plus} variant="primary" onClick={() => setIsNewAppointmentModalOpen(true)}>
            New Appointment
          </Button>
        }
      />

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
              {mockAppointments.filter(a => a.type === 'prenatal').length}
            </p>
            <p className="text-sm text-slate-500">Prenatal</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-emerald-100">
            <Syringe className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {mockAppointments.filter(a => a.type === 'vaccination').length}
            </p>
            <p className="text-sm text-slate-500">Vaccinations</p>
          </div>
        </Card>
      </div>

      {/* View Toggle & Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="flex-1">
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
              { value: 'prenatal', label: 'Prenatal' },
              { value: 'postnatal', label: 'Postnatal' },
              { value: 'vaccination', label: 'Vaccination' },
              { value: 'growth_check', label: 'Growth Check' },
            ]}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
      </Card>

      {viewMode === 'list' ? (
        /* List View */
        <div className="space-y-4">
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
                  
                  return (
                    <Card 
                      key={appointment.id} 
                      hover
                      onClick={() => setSelectedAppointment(appointment)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[70px]">
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
                              {appointment.patientName}
                            </h3>
                            {getStatusBadge(appointment.status, appointment.dateTime)}
                          </div>
                          <p className="text-sm text-slate-500">
                            {appointment.title}
                            {appointment.childName && ` • ${appointment.childName}`}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {appointment.duration} min
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {appointment.location}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" icon={Phone}>
                            Call
                          </Button>
                          <Button variant="outline" size="sm" icon={Check}>
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
                  
                  return (
                    <Card 
                      key={appointment.id} 
                      hover
                      onClick={() => setSelectedAppointment(appointment)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[70px]">
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
                              {appointment.patientName}
                            </h3>
                            <Badge variant="default" size="sm">{typeConfig.label}</Badge>
                          </div>
                          <p className="text-sm text-slate-500 truncate">
                            {appointment.title}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" icon={Edit}>
                          Edit
                        </Button>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>
        </div>
      ) : (
        /* Calendar View */
        <Card>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
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
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayAppointments = getAppointmentsForDate(day);
              const isCurrentDay = isToday(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[200px] rounded-lg border p-2 ${
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
                            {apt.patientName}
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
            <div className="flex items-center gap-4">
              <Avatar name={selectedAppointment.patientName} size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedAppointment.patientName}
                </h3>
                {selectedAppointment.childName && (
                  <p className="text-slate-500">Child: {selectedAppointment.childName}</p>
                )}
                <p className="text-sm text-slate-400">{selectedAppointment.phone}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                {selectedAppointment.title}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(selectedAppointment.dateTime), 'MMMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-4 h-4" />
                  {format(new Date(selectedAppointment.dateTime), 'h:mm a')} ({selectedAppointment.duration} min)
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

            {selectedAppointment.notes && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Notes:</strong> {selectedAppointment.notes}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="primary" icon={Check} className="flex-1">
                Complete
              </Button>
              <Button variant="outline" icon={Edit} className="flex-1">
                Reschedule
              </Button>
              <Button variant="ghost" icon={Trash2} className="text-red-500">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Appointment Modal */}
      <Modal
        isOpen={isNewAppointmentModalOpen}
        onClose={() => setIsNewAppointmentModalOpen(false)}
        title="Schedule New Appointment"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Appointment Type"
            options={[
              { value: 'prenatal', label: 'Prenatal Checkup' },
              { value: 'postnatal', label: 'Postnatal Checkup' },
              { value: 'vaccination', label: 'Vaccination' },
              { value: 'growth_check', label: 'Growth Check' },
            ]}
          />
          <Input label="Patient Name" placeholder="Search patient..." icon={Search} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" />
            <Input label="Time" type="time" />
          </div>
          <Select
            label="Duration"
            options={[
              { value: '15', label: '15 minutes' },
              { value: '30', label: '30 minutes' },
              { value: '45', label: '45 minutes' },
              { value: '60', label: '60 minutes' },
            ]}
          />
          <Input label="Location" placeholder="MOH Office..." icon={MapPin} />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Notes
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="primary" icon={Plus} className="flex-1">
              Schedule Appointment
            </Button>
            <Button variant="ghost" onClick={() => setIsNewAppointmentModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
