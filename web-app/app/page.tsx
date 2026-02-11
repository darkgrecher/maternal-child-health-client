/**
 * Midwife Dashboard - Home Page
 * 
 * Main dashboard showing overview of patients, appointments,
 * and key metrics for midwife care management.
 */

'use client';

import React from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import {
  Heart,
  Baby,
  Calendar,
  Users,
  Activity,
  AlertTriangle,
  Syringe,
  Clock,
  TrendingUp,
  ChevronRight,
  Plus,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';
import { MainLayout, Header } from './components/layout';
import {
  Card,
  StatCard,
  Button,
  Badge,
  Avatar,
  ProgressBar,
  SectionTitle,
  Alert,
} from './components/ui';

// Mock data for demonstration
const mockStats = {
  totalPatients: 47,
  activePregnancies: 23,
  childrenMonitored: 31,
  upcomingAppointments: 12,
  overdueVaccinations: 5,
  highRiskPregnancies: 4,
  appointmentsToday: 6,
  newPatientsThisMonth: 8,
};

const mockTodayAppointments = [
  {
    id: '1',
    time: '09:00 AM',
    patientName: 'Amaya Perera',
    type: 'prenatal',
    status: 'confirmed',
    week: 28,
  },
  {
    id: '2',
    time: '10:30 AM',
    patientName: 'Sithumi Fernando',
    type: 'vaccination',
    status: 'scheduled',
    childName: 'Baby Kavisha',
  },
  {
    id: '3',
    time: '11:30 AM',
    patientName: 'Nethmi Silva',
    type: 'growth_check',
    status: 'scheduled',
    childName: 'Kasun',
  },
  {
    id: '4',
    time: '02:00 PM',
    patientName: 'Dilani Jayawardena',
    type: 'prenatal',
    status: 'confirmed',
    week: 36,
  },
  {
    id: '5',
    time: '03:30 PM',
    patientName: 'Kumari Bandara',
    type: 'postnatal',
    status: 'scheduled',
    childName: 'Baby Nipun',
  },
  {
    id: '6',
    time: '04:30 PM',
    patientName: 'Rashmi Herath',
    type: 'vaccination',
    status: 'scheduled',
    childName: 'Dinithi',
  },
];

const mockHighRiskPregnancies = [
  {
    id: '1',
    name: 'Chamari Wickramasinghe',
    week: 32,
    riskFactors: ['Gestational Diabetes', 'High BP'],
    nextAppointment: '2026-01-29',
  },
  {
    id: '2',
    name: 'Malini Ratnayake',
    week: 28,
    riskFactors: ['Previous Cesarean', 'Age > 35'],
    nextAppointment: '2026-01-30',
  },
  {
    id: '3',
    name: 'Sanduni Gunasekara',
    week: 24,
    riskFactors: ['Multiple Pregnancy (Twins)'],
    nextAppointment: '2026-01-31',
  },
  {
    id: '4',
    name: 'Iresha Jayasuriya',
    week: 36,
    riskFactors: ['Pre-eclampsia Risk'],
    nextAppointment: '2026-01-28',
  },
];

const mockOverdueVaccinations = [
  {
    id: '1',
    childName: 'Tharindu Perera',
    age: '4 months',
    vaccine: 'DTP-HepB-Hib (Dose 2)',
    dueDate: '2026-01-20',
    daysOverdue: 8,
    parentPhone: '+94 77 123 4567',
  },
  {
    id: '2',
    childName: 'Kavindi Silva',
    age: '9 months',
    vaccine: 'MMR (Dose 1)',
    dueDate: '2026-01-15',
    daysOverdue: 13,
    parentPhone: '+94 71 234 5678',
  },
  {
    id: '3',
    childName: 'Isuru Fernando',
    age: '18 months',
    vaccine: 'DTP-HepB-Hib (Booster)',
    dueDate: '2026-01-22',
    daysOverdue: 6,
    parentPhone: '+94 76 345 6789',
  },
];

const mockRecentActivities = [
  {
    id: '1',
    type: 'vaccination',
    title: 'BCG Vaccination Completed',
    patient: 'Baby Nethara',
    time: '30 minutes ago',
    icon: Syringe,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  {
    id: '2',
    type: 'prenatal',
    title: 'Prenatal Checkup - Week 24',
    patient: 'Kumari Perera',
    time: '1 hour ago',
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-100',
  },
  {
    id: '3',
    type: 'growth',
    title: 'Growth Measurement Recorded',
    patient: 'Kavindu (8 months)',
    time: '2 hours ago',
    icon: TrendingUp,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100',
  },
  {
    id: '4',
    type: 'appointment',
    title: 'New Appointment Scheduled',
    patient: 'Dilhani Fernando',
    time: '3 hours ago',
    icon: Calendar,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
  },
];

const getAppointmentTypeColor = (type: string) => {
  switch (type) {
    case 'prenatal':
      return { bg: 'bg-pink-100', text: 'text-pink-600', badge: 'Prenatal' };
    case 'postnatal':
      return { bg: 'bg-purple-100', text: 'text-purple-600', badge: 'Postnatal' };
    case 'vaccination':
      return { bg: 'bg-blue-100', text: 'text-blue-600', badge: 'Vaccination' };
    case 'growth_check':
      return { bg: 'bg-emerald-100', text: 'text-emerald-600', badge: 'Growth Check' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-600', badge: type };
  }
};

export default function DashboardPage() {
  const today = new Date();

  return (
    <MainLayout>
      <Header
        title="Good Morning, Sarah! 👋"
        subtitle={format(today, 'EEEE, MMMM d, yyyy')}
        actions={
          <Button icon={Plus} variant="primary">
            New Appointment
          </Button>
        }
      />

      {/* Alert Banner */}
      {mockStats.overdueVaccinations > 0 && (
        <Alert variant="warning" title="Attention Required" icon={AlertTriangle}>
          <span>
            There are <strong>{mockStats.overdueVaccinations} overdue vaccinations</strong> that need follow-up.{' '}
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
          value={mockStats.activePregnancies}
          icon={Heart}
          iconColor="text-pink-500"
          iconBg="bg-pink-100"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Children Monitored"
          value={mockStats.childrenMonitored}
          icon={Baby}
          iconColor="text-purple-500"
          iconBg="bg-purple-100"
          subtitle="Under 5 years"
        />
        <StatCard
          title="Today's Appointments"
          value={mockStats.appointmentsToday}
          icon={Calendar}
          iconColor="text-blue-500"
          iconBg="bg-blue-100"
          subtitle={`${mockStats.upcomingAppointments} this week`}
        />
        <StatCard
          title="High Risk Cases"
          value={mockStats.highRiskPregnancies}
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
              subtitle={`${mockTodayAppointments.length} appointments scheduled`}
              action={
                <Button variant="ghost" icon={ChevronRight} iconPosition="right" size="sm">
                  View All
                </Button>
              }
            />
            <div className="space-y-3">
              {mockTodayAppointments.map((appointment) => {
                const typeStyle = getAppointmentTypeColor(appointment.type);
                return (
                  <div
                    key={appointment.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="text-center min-w-[60px]">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {appointment.time}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${typeStyle.bg}`}>
                      {appointment.type === 'prenatal' || appointment.type === 'postnatal' ? (
                        <Heart className={`w-5 h-5 ${typeStyle.text}`} />
                      ) : appointment.type === 'vaccination' ? (
                        <Syringe className={`w-5 h-5 ${typeStyle.text}`} />
                      ) : (
                        <Activity className={`w-5 h-5 ${typeStyle.text}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {appointment.patientName}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {appointment.childName || `Week ${appointment.week}`}
                      </p>
                    </div>
                    <Badge
                      variant={appointment.status === 'confirmed' ? 'success' : 'info'}
                      size="sm"
                    >
                      {typeStyle.badge}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <SectionTitle
              title="Recent Activity"
              action={
                <Button variant="ghost" icon={ChevronRight} iconPosition="right" size="sm">
                  View All
                </Button>
              }
            />
            <div className="space-y-4">
              {mockRecentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-slate-500">{activity.patient}</p>
                    <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
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
                {mockHighRiskPregnancies.length} Cases
              </Badge>
            }
          />
          <div className="space-y-3">
            {mockHighRiskPregnancies.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors cursor-pointer"
              >
                <Avatar name={patient.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {patient.name}
                    </p>
                    <Badge variant="warning" size="sm">
                      Week {patient.week}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {patient.riskFactors.map((factor, idx) => (
                      <span
                        key={idx}
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
                    {format(new Date(patient.nextAppointment), 'MMM d')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Overdue Vaccinations */}
        <Card>
          <SectionTitle
            title="Overdue Vaccinations"
            subtitle="Follow-up required"
            action={
              <Badge variant="error" size="md">
                {mockOverdueVaccinations.length} Overdue
              </Badge>
            }
          />
          <div className="space-y-3">
            {mockOverdueVaccinations.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10"
              >
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Syringe className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">
                    {record.childName}
                  </p>
                  <p className="text-sm text-slate-500">{record.vaccine}</p>
                  <p className="text-xs text-red-500 mt-1">
                    {record.daysOverdue} days overdue
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Phone}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Call
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <SectionTitle title="Quick Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card hover className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-3 rounded-xl bg-pink-100 mb-3">
              <Heart className="w-6 h-6 text-pink-500" />
            </div>
            <p className="font-medium text-slate-900 dark:text-white">New Pregnancy</p>
            <p className="text-xs text-slate-500 mt-1">Register patient</p>
          </Card>
          <Card hover className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-3 rounded-xl bg-purple-100 mb-3">
              <Baby className="w-6 h-6 text-purple-500" />
            </div>
            <p className="font-medium text-slate-900 dark:text-white">Add Child</p>
            <p className="text-xs text-slate-500 mt-1">Register newborn</p>
          </Card>
          <Card hover className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-3 rounded-xl bg-blue-100 mb-3">
              <Syringe className="w-6 h-6 text-blue-500" />
            </div>
            <p className="font-medium text-slate-900 dark:text-white">Record Vaccine</p>
            <p className="text-xs text-slate-500 mt-1">Log vaccination</p>
          </Card>
          <Card hover className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-3 rounded-xl bg-emerald-100 mb-3">
              <FileText className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="font-medium text-slate-900 dark:text-white">Generate Report</p>
            <p className="text-xs text-slate-500 mt-1">Monthly summary</p>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
