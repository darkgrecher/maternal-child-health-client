/**
 * Admin Analytics Page
 *
 * Shows system-wide analytics for administrators.
 */

'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Baby,
  Calendar,
  Activity,
  Users,
  Syringe,
  Heart,
  MapPin,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { AdminHeader } from '../layout';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingSpinner,
  ProgressBar,
  SectionTitle,
} from '../../components/ui';
import apiClient from '../../lib/api-client';
import { useAuthStore } from '../../lib/stores';
import type { AdminAnalyticsResponse, ApiResponse, AnalyticsTrend } from '../../lib/types';

const RANGE_OPTIONS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

interface StatTileProps {
  title: string;
  value: number;
  icon: React.ElementType;
  trend: AnalyticsTrend | null;
}

const StatTile: React.FC<StatTileProps> = ({ title, value, icon: Icon, trend }) => {
  const trendLabel = useMemo(() => {
    if (!trend) return 'No prior data';
    if (trend.changePercent === null) return 'New';
    return `${Math.abs(trend.changePercent)}%`;
  }, [trend]);

  const trendColor = trend?.direction === 'down'
    ? 'text-red-500'
    : trend?.direction === 'up'
      ? 'text-emerald-500'
      : 'text-slate-400';

  return (
    <Card className="flex items-start gap-4">
      <div className="p-3 rounded-xl bg-pink-100 dark:bg-pink-900/30">
        <Icon className="w-6 h-6 text-pink-500" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
          {value.toLocaleString()}
        </p>
        {trend && (
          <div className={`flex items-center gap-1 text-xs mt-2 ${trendColor}`}>
            {trend.direction === 'down' ? (
              <ArrowDownRight className="w-4 h-4" />
            ) : (
              <ArrowUpRight className="w-4 h-4" />
            )}
            <span className="font-medium">{trendLabel}</span>
            <span className="text-slate-400">vs previous period</span>
          </div>
        )}
      </div>
    </Card>
  );
};

interface MiniChartProps {
  values: number[];
  labels: string[];
  color: string;
}

const MiniChart: React.FC<MiniChartProps> = ({ values, labels, color }) => {
  const maxValue = Math.max(...values, 1);
  const isEmpty = values.every((value) => value === 0);

  if (isEmpty) {
    return (
      <div className="py-8">
        <EmptyState
          icon={AlertTriangle}
          title="No activity"
          description="There is no data for the selected period."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end gap-1 h-28">
        {values.map((value, index) => (
          <div key={`${labels[index]}-${index}`} className="flex-1 min-w-1.5">
            <div
              className="rounded-md transition-all"
              style={{
                height: `${Math.max(6, (value / maxValue) * 100)}%`,
                background: color,
              }}
              title={`${labels[index]}: ${value}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{labels[0]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
};

export default function AdminAnalyticsPage() {
  const { user, hasHydrated } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [range, setRange] = useState('30d');
  const [refreshKey, setRefreshKey] = useState(0);
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated || !isAdmin) return;

    let isCancelled = false;

    const loadAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<ApiResponse<AdminAnalyticsResponse>>(
          `/admin/analytics?range=${range}`
        );
        if (!isCancelled) {
          setAnalytics(response.data ?? null);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load analytics.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      isCancelled = true;
    };
  }, [hasHydrated, isAdmin, range, refreshKey]);

  const rangeLabel = analytics?.range.label ?? 'Last 30 days';
  const rangeDates = analytics
    ? `${new Date(analytics.range.start).toLocaleDateString()} - ${new Date(analytics.range.end).toLocaleDateString()}`
    : '';

  const patientSeries = useMemo(() => {
    if (!analytics?.series) return [];
    return analytics.series.newChildren.map(
      (value, index) => value + (analytics.series.newPregnancies[index] ?? 0)
    );
  }, [analytics?.series]);

  const vaccinationTotal = analytics?.vaccinationStatus.reduce(
    (sum, stat) => sum + stat.count,
    0
  ) ?? 0;

  if (!hasHydrated) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Loading analytics</p>
            <p className="text-xs text-slate-500">Checking your access...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <AdminHeader
          title="Analytics"
          subtitle="System-wide insights and performance"
        />
        <Alert variant="error" title="Restricted access" icon={ShieldCheck}>
          You need administrator privileges to view analytics.
        </Alert>
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title="Analytics"
        subtitle="System-wide insights and performance"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(event) => setRange(event.target.value)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-900 dark:text-white border-none outline-none cursor-pointer"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              icon={RefreshCw}
              variant="secondary"
              isLoading={isLoading}
              onClick={() => setRefreshKey((prev) => prev + 1)}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="warning" title="Analytics unavailable" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Badge variant="info">{rangeLabel}</Badge>
        {rangeDates && <span className="text-sm text-slate-500">{rangeDates}</span>}
      </div>

      {isLoading && !analytics ? (
        <Card>
          <div className="flex items-center gap-3">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-slate-500">Loading analytics...</span>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <StatTile
              title="New Users"
              value={analytics?.trends.newUsers.current ?? 0}
              icon={Users}
              trend={analytics?.trends.newUsers ?? null}
            />
            <StatTile
              title="New Midwives"
              value={analytics?.trends.newMidwives.current ?? 0}
              icon={Heart}
              trend={analytics?.trends.newMidwives ?? null}
            />
            <StatTile
              title="New Children"
              value={analytics?.trends.newChildren.current ?? 0}
              icon={Baby}
              trend={analytics?.trends.newChildren ?? null}
            />
            <StatTile
              title="New Pregnancies"
              value={analytics?.trends.newPregnancies.current ?? 0}
              icon={Activity}
              trend={analytics?.trends.newPregnancies ?? null}
            />
            <StatTile
              title="Appointments"
              value={analytics?.trends.appointments.current ?? 0}
              icon={Calendar}
              trend={analytics?.trends.appointments ?? null}
            />
            <StatTile
              title="Vaccinations"
              value={analytics?.trends.vaccinations.current ?? 0}
              icon={Syringe}
              trend={analytics?.trends.vaccinations ?? null}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <SectionTitle
                title="New Patient Volume"
                subtitle="Children + pregnancies created"
                action={<Badge variant="success">{rangeLabel}</Badge>}
              />
              <MiniChart
                values={patientSeries}
                labels={analytics?.series.labels ?? []}
                color="linear-gradient(180deg, rgba(236,72,153,0.8), rgba(168,85,247,0.8))"
              />
            </Card>

            <Card>
              <SectionTitle title="System Snapshot" subtitle="Current totals" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Total Users</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {analytics?.summary.totalUsers.toLocaleString() ?? '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Total Midwives</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {analytics?.summary.totalMidwives.toLocaleString() ?? '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Children Profiles</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {analytics?.summary.totalChildren.toLocaleString() ?? '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Pregnancies</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {analytics?.summary.totalPregnancies.toLocaleString() ?? '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Active Pregnancies</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {analytics?.summary.activePregnancies.toLocaleString() ?? '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">High Risk Cases</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {analytics?.summary.highRiskPregnancies.toLocaleString() ?? '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Overdue Vaccinations</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {analytics?.summary.overdueVaccinations.toLocaleString() ?? '0'}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <SectionTitle title="Vaccination Status" subtitle="Distribution across records" />
              {analytics?.vaccinationStatus.length ? (
                <div className="space-y-4">
                  {analytics.vaccinationStatus.map((stat) => (
                    <div key={stat.status}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-300">
                          {stat.status.replace('_', ' ')}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {stat.count.toLocaleString()}
                        </span>
                      </div>
                      <ProgressBar
                        value={stat.count}
                        max={vaccinationTotal || 1}
                        color="bg-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Syringe}
                  title="No vaccination records"
                  description="Vaccination statistics will appear once records are added."
                />
              )}
            </Card>

            <Card>
              <SectionTitle title="Regional Coverage" subtitle="Midwife assignments by region" />
              {analytics?.regionStats.length ? (
                <div className="space-y-3">
                  {analytics.regionStats.map((region) => (
                    <div
                      key={region.region}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-pink-500" />
                        <span className="font-medium text-slate-900 dark:text-white">
                          {region.region}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{region.midwives} midwives</span>
                        <span>{region.children} children</span>
                        <span>{region.pregnancies} pregnancies</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={MapPin}
                  title="No regional data"
                  description="Assign midwives to regions to see coverage metrics."
                />
              )}
            </Card>
          </div>

          <Card>
            <SectionTitle title="Recent Activity" subtitle="Latest recorded events" />
            {analytics?.recentActivities.length ? (
              <div className="space-y-3">
                {analytics.recentActivities.map((activityItem) => (
                  <div
                    key={activityItem.id}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100 dark:border-slate-700"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {activityItem.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {activityItem.childName} • {activityItem.type.replace('_', ' ')}
                      </p>
                      {activityItem.description && (
                        <p className="text-xs text-slate-400 mt-1">{activityItem.description}</p>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(activityItem.date).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={AlertTriangle}
                title="No activity yet"
                description="Recent activity will show up as new records are added."
              />
            )}
          </Card>
        </>
      )}
    </>
  );
}
