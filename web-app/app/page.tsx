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
} from './components/ui';
import apiClient from './lib/api-client';
import { useAuthStore } from './lib/stores';
import type { ApiResponse, DashboardResponse, DashboardStats } from './lib/types';

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

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
          <Button
            icon={Plus}
            variant="primary"
            onClick={() => router.push('/appointments?new=1')}
          >
            New Appointment
          </Button>
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
    </MainLayout>
  );
}
