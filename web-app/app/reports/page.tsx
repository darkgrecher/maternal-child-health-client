/**
 * Reports Page
 *
 * Shows a backend-backed summary for midwife reporting.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Baby,
  Calendar,
  Syringe,
  Heart,
} from 'lucide-react';
import { MainLayout, Header } from '../components/main-layout';
import {
  Card,
  StatCard,
  Badge,
  SectionTitle,
  Alert,
  EmptyState,
} from '../components/ui';
import apiClient from '../lib/api-client';
import type { ApiResponse, DashboardResponse, DashboardStats } from '../lib/types';

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

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const stats = dashboard?.stats ?? DEFAULT_STATS;
  const highRiskPregnancies = dashboard?.highRiskPregnancies ?? [];
  const overdueVaccinations = dashboard?.overdueVaccinations ?? [];

  useEffect(() => {
    let isCancelled = false;

    const loadReport = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await apiClient.get<ApiResponse<DashboardResponse>>('/dashboard');
        if (!isCancelled) {
          setDashboard(response.data ?? null);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load report data.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      isCancelled = true;
    };
  }, []);

  const reportDate = useMemo(() => format(new Date(), 'MMMM d, yyyy'), []);

  return (
    <MainLayout>
      <Header title="Monthly Summary" subtitle={`Report generated on ${reportDate}`} />

      {error && (
        <Alert variant="warning" title="Unable to load report" className="mt-4">
          {error}
        </Alert>
      )}

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
        />
        <StatCard
          title="Upcoming Appointments"
          value={stats.upcomingAppointments}
          icon={Calendar}
          iconColor="text-blue-500"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Overdue Vaccinations"
          value={stats.overdueVaccinations}
          icon={Syringe}
          iconColor="text-red-500"
          iconBg="bg-red-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <SectionTitle
            title="High Risk Pregnancies"
            subtitle="Requires ongoing monitoring"
            action={
              <Badge variant="warning" size="md">
                {highRiskPregnancies.length} Cases
              </Badge>
            }
          />
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Loading summary...</div>
          ) : highRiskPregnancies.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No high risk cases"
              description="There are no active high risk pregnancies assigned."
            />
          ) : (
            <div className="space-y-3">
              {highRiskPregnancies.map((pregnancy) => (
                <div
                  key={pregnancy.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {pregnancy.motherName}
                    </p>
                    <p className="text-xs text-slate-500">
                      Week {pregnancy.currentWeek ?? '—'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pregnancy.riskFactors.length === 0 && (
                        <span className="text-xs text-amber-700">High risk monitoring</span>
                      )}
                      {pregnancy.riskFactors.map((factor, idx) => (
                        <span
                          key={`${pregnancy.id}-factor-${idx}`}
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
            <div className="py-8 text-center text-slate-500">Loading summary...</div>
          ) : overdueVaccinations.length === 0 ? (
            <EmptyState
              icon={Syringe}
              title="All caught up"
              description="There are no overdue vaccinations in your roster."
            />
          ) : (
            <div className="space-y-3">
              {overdueVaccinations.map((record) => (
                <div
                  key={`${record.childId}-${record.vaccineId}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {record.childName}
                    </p>
                    <p className="text-sm text-slate-500">{record.vaccineName}</p>
                    <p className="text-xs text-red-500 mt-1">
                      {record.daysOverdue} days overdue • {record.childAge}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
