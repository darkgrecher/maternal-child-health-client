/**
 * Admin Dashboard Page
 * 
 * Main admin dashboard with system overview, user management, and analytics
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Baby,
  Heart,
  MapPin,
  RefreshCw,
  Server,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { Alert, Badge, Button, Card, Avatar, EmptyState, SectionTitle } from '../components/ui';
import { AdminHeader } from './layout';
import apiClient from '../lib/api-client';
import { useAuthStore } from '../lib/stores';
import type {
  AdminAlertsResponse,
  AdminAnalyticsResponse,
  AdminDistrictsResponse,
  AdminLogActor,
  AdminLogsResponse,
  AnalyticsTrend,
  ApiResponse,
} from '../lib/types';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-pink-500',
  iconBg = 'bg-pink-100 dark:bg-pink-900/30',
  trend,
  subtitle,
}) => {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend.isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{trend.value}%</span>
              <span className="text-xs text-slate-400">vs last month</span>
            </div>
          )}
          {subtitle && (
            <p className="text-xs text-slate-400 mt-2">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
};

// System Status Component
interface SystemStatusProps {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: string;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ name, status, uptime }) => {
  const statusConfig = {
    operational: { color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Operational' },
    degraded: { color: 'text-amber-500', bg: 'bg-amber-500', label: 'Degraded' },
    down: { color: 'text-red-500', bg: 'bg-red-500', label: 'Down' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${config.bg}`} />
        <span className="font-medium text-slate-900 dark:text-white">{name}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">{uptime}</span>
        <Badge variant={status === 'operational' ? 'success' : status === 'degraded' ? 'warning' : 'error'}>
          {config.label}
        </Badge>
      </div>
    </div>
  );
};

// Recent Activity Item
interface ActivityItemProps {
  user: string;
  action: string;
  time: string;
  type: 'user' | 'system' | 'alert';
}

const ActivityItem: React.FC<ActivityItemProps> = ({ user, action, time, type }) => {
  const typeConfig = {
    user: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    system: { icon: Server, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    alert: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
      <div className={`p-2 rounded-lg ${config.bg}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 dark:text-white">
          <span className="font-medium">{user}</span> {action}
        </p>
        <p className="text-xs text-slate-400 mt-1">{time}</p>
      </div>
    </div>
  );
};

// User Row Component
interface UserRowProps {
  name: string;
  email: string;
  role: string;
  district: string;
  status: 'active' | 'inactive';
  lastActive: string;
}

const UserRow: React.FC<UserRowProps> = ({ name, email, role, district, status, lastActive }) => {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Avatar name={name} size="sm" />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{name}</p>
            <p className="text-xs text-slate-500">{email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <Badge variant={role === 'Admin' ? 'info' : 'default'}>{role}</Badge>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-slate-600 dark:text-slate-400">{district}</span>
      </td>
      <td className="py-4 px-4">
        <Badge variant={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-slate-500">{lastActive}</span>
      </td>
    </tr>
  );
};

const RANGE_OPTIONS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  midwife: 'Midwife',
};

const formatRelativeTime = (value?: string | null) => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = date.getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) return rtf.format(diffSeconds, 'second');
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day');
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, 'month');
  const diffYears = Math.round(diffDays / 365);
  return rtf.format(diffYears, 'year');
};

const formatActorLabel = (actor: AdminLogActor) => {
  if (actor.type === 'system') return 'System';
  return actor.name || actor.email || 'Unknown';
};

const toStatTrend = (trend?: AnalyticsTrend | null) => {
  if (!trend || trend.changePercent === null) return undefined;
  return {
    value: Math.abs(trend.changePercent),
    isPositive: trend.direction === 'up',
  };
};

const buildCombinedTrend = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? { value: 0, isPositive: true } : undefined;
  }
  const changePercent = Math.round(((current - previous) / previous) * 100);
  return {
    value: Math.abs(changePercent),
    isPositive: changePercent >= 0,
  };
};

const resolveStatus = (errorCount: number, warningCount = 0) => {
  if (errorCount > 0) return 'down' as const;
  if (warningCount > 0) return 'degraded' as const;
  return 'operational' as const;
};

const formatCount = (value: number) => value.toLocaleString();

interface MidwifeAccount {
  id: string;
  email: string;
  name?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  role: 'midwife' | 'admin' | 'supervisor';
  region?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export default function AdminDashboardPage() {
  const { user, hasHydrated } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshKey, setRefreshKey] = useState(0);
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [alerts, setAlerts] = useState<AdminAlertsResponse | null>(null);
  const [logs, setLogs] = useState<AdminLogsResponse | null>(null);
  const [districtsResponse, setDistrictsResponse] = useState<AdminDistrictsResponse | null>(null);
  const [midwives, setMidwives] = useState<MidwifeAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated || !isAdmin) return;

    let isActive = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        apiClient.get<ApiResponse<AdminAnalyticsResponse>>(`/admin/analytics?range=${timeRange}`),
        apiClient.get<ApiResponse<AdminAlertsResponse>>(`/admin/alerts?range=${timeRange}&limit=5`),
        apiClient.get<ApiResponse<AdminLogsResponse>>(
          `/admin/logs?range=${timeRange}&page=1&pageSize=6`
        ),
        apiClient.get<ApiResponse<AdminDistrictsResponse>>('/admin/districts'),
        apiClient.get<ApiResponse<MidwifeAccount[]>>('/auth/midwives'),
      ]);

      if (!isActive) return;

      const failures: string[] = [];

      const [analyticsResult, alertsResult, logsResult, districtsResult, midwivesResult] = results;

      if (analyticsResult.status === 'fulfilled') {
        setAnalytics(analyticsResult.value.data ?? null);
      } else {
        failures.push('analytics');
      }

      if (alertsResult.status === 'fulfilled') {
        setAlerts(alertsResult.value.data ?? null);
      } else {
        failures.push('alerts');
      }

      if (logsResult.status === 'fulfilled') {
        setLogs(logsResult.value.data ?? null);
      } else {
        failures.push('logs');
      }

      if (districtsResult.status === 'fulfilled') {
        setDistrictsResponse(districtsResult.value.data ?? null);
      } else {
        failures.push('districts');
      }

      if (midwivesResult.status === 'fulfilled') {
        setMidwives(midwivesResult.value.data ?? []);
      } else {
        failures.push('midwives');
      }

      if (failures.length > 0) {
        setError(`Unable to load ${failures.join(', ')} data. Please refresh.`);
      }

      setIsLoading(false);
    };

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, [hasHydrated, isAdmin, timeRange, refreshKey]);

  const totalPatients =
    (analytics?.summary.totalChildren ?? 0) + (analytics?.summary.totalPregnancies ?? 0);

  const patientTrend = buildCombinedTrend(
    (analytics?.trends.newChildren.current ?? 0) + (analytics?.trends.newPregnancies.current ?? 0),
    (analytics?.trends.newChildren.previous ?? 0) + (analytics?.trends.newPregnancies.previous ?? 0)
  );

  const totalAlerts = (alerts?.system.total ?? 0) + (alerts?.link.total ?? 0);
  const warningCount = alerts?.system.summary.warningCount ?? 0;
  const errorCount = alerts?.system.summary.errorCount ?? 0;
  const mismatchCount = alerts?.link.summary.mismatchCount ?? 0;
  const unregisteredCount = alerts?.link.summary.unregisteredCount ?? 0;

  const logWarnCount = logs?.levelSummary.find((entry) => entry.level === 'warn')?.count ?? 0;
  const logErrorCount = logs?.levelSummary.find((entry) => entry.level === 'error')?.count ?? 0;

  const stats = [
    {
      title: 'Total Users',
      value: formatCount(analytics?.summary.totalUsers ?? 0),
      icon: Users,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      trend: toStatTrend(analytics?.trends.newUsers),
      subtitle: analytics?.range.label,
    },
    {
      title: 'Total Midwives',
      value: formatCount(analytics?.summary.totalMidwives ?? 0),
      icon: Heart,
      iconColor: 'text-pink-500',
      iconBg: 'bg-pink-100 dark:bg-pink-900/30',
      trend: toStatTrend(analytics?.trends.newMidwives),
      subtitle: analytics?.range.label,
    },
    {
      title: 'Patients Registered',
      value: formatCount(totalPatients),
      icon: Baby,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      trend: patientTrend,
      subtitle: analytics?.range.label,
    },
    {
      title: 'System Alerts',
      value: formatCount(totalAlerts),
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      subtitle: `${warningCount} warnings, ${errorCount} errors`,
    },
  ];

  const systemServices = useMemo(() => {
    const services: Array<{ name: string; status: 'operational' | 'degraded' | 'down'; uptime: string }> = [];

    if (logs) {
      services.push({
        name: 'System Logs',
        status: resolveStatus(logErrorCount, logWarnCount),
        uptime: `${logWarnCount} warnings, ${logErrorCount} errors`,
      });
    }

    if (alerts) {
      services.push({
        name: 'System Alerts',
        status: resolveStatus(errorCount, warningCount),
        uptime: `${warningCount} warnings, ${errorCount} errors`,
      });

      services.push({
        name: 'QR Link Alerts',
        status: unregisteredCount + mismatchCount > 0 ? 'degraded' : 'operational',
        uptime: `${unregisteredCount} unregistered, ${mismatchCount} mismatch`,
      });
    }

    return services;
  }, [alerts, errorCount, logErrorCount, logWarnCount, logs, mismatchCount, unregisteredCount, warningCount]);

  const overallStatus = useMemo(() => {
    if (systemServices.length === 0) {
      return { label: 'Awaiting data', variant: 'default' as const };
    }

    if (systemServices.some((service) => service.status === 'down')) {
      return { label: 'Issues detected', variant: 'error' as const };
    }

    if (systemServices.some((service) => service.status === 'degraded')) {
      return { label: 'Degraded', variant: 'warning' as const };
    }

    return { label: 'All Systems Operational', variant: 'success' as const };
  }, [systemServices]);

  const recentActivity = useMemo(() => {
    const items = logs?.items ?? [];
    return items.slice(0, 5).map((log) => {
      const actor = formatActorLabel(log.actor);
      const isAlert = log.level === 'error' || log.level === 'warn';
      const type: ActivityItemProps['type'] = isAlert
        ? 'alert'
        : log.actor.type === 'system'
          ? 'system'
          : 'user';
      return {
        user: actor,
        action: log.message || log.event || log.source,
        time: formatRelativeTime(log.createdAt),
        type,
      };
    });
  }, [logs]);

  const districtStats = useMemo(() => {
    const districts = districtsResponse?.districts ?? [];
    return [...districts]
      .sort((a, b) => (b.children + b.pregnancies) - (a.children + a.pregnancies))
      .slice(0, 5)
      .map((district) => ({
        name: district.name,
        midwives: district.midwives,
        children: district.children,
        pregnancies: district.pregnancies,
      }));
  }, [districtsResponse]);

  const recentUsers = useMemo<UserRowProps[]>(() => {
    return midwives.slice(0, 5).map((midwife) => {
      const displayName =
        midwife.name?.trim() ||
        [midwife.givenName, midwife.familyName].filter(Boolean).join(' ') ||
        midwife.email;
      const lastLogin = midwife.lastLoginAt ? new Date(midwife.lastLoginAt) : null;
      const isActive = lastLogin
        ? Date.now() - lastLogin.getTime() <= THIRTY_DAYS_MS
        : false;

      return {
        name: displayName,
        email: midwife.email,
        role: roleLabels[midwife.role] ?? 'Midwife',
        district: midwife.region?.trim() || 'Unassigned',
        status: isActive ? 'active' : 'inactive',
        lastActive: formatRelativeTime(midwife.lastLoginAt),
      };
    });
  }, [midwives]);

  if (!hasHydrated) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Loading dashboard</p>
            <p className="text-xs text-slate-500">Checking your access...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <AdminHeader title="Admin Dashboard" subtitle="System overview and management" />
        <Alert variant="error" title="Restricted access" icon={ShieldCheck}>
          You need administrator privileges to view this dashboard.
        </Alert>
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title="Admin Dashboard"
        subtitle="System overview and management"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
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
        <Alert variant="warning" title="Some data is unavailable" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* System Status */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">System Status</h3>
            <Badge variant={overallStatus.variant}>{overallStatus.label}</Badge>
          </div>
          <div>
            {systemServices.length === 0 ? (
              <EmptyState
                icon={Server}
                title="No system data"
                description="System status will appear once logs and alerts are available."
              />
            ) : (
              systemServices.map((service, index) => (
                <SystemStatus key={index} {...service} />
              ))
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
            <Link
              href="/admin/logs"
              className="text-sm text-pink-500 hover:text-pink-600 font-medium"
            >
              View All
            </Link>
          </div>
          <div>
            {recentActivity.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="No recent activity"
                description="System activity will appear here once logs are recorded."
              />
            ) : (
              recentActivity.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))
            )}
          </div>
        </Card>
      </div>

      {/* District Overview */}
      <div className="mb-8">
        <SectionTitle title="District Overview" />
        {districtStats.length === 0 ? (
          <Card>
            <EmptyState
              icon={MapPin}
              title="No district data"
              description="District summaries will appear once midwife regions are assigned."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {districtStats.map((district, index) => (
              <Card key={index} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-pink-500" />
                  <h4 className="font-semibold text-slate-900 dark:text-white">{district.name}</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Midwives</span>
                    <span className="font-medium text-slate-900 dark:text-white">{district.midwives}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Children</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatCount(district.children)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Pregnancies</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatCount(district.pregnancies)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* User Management Table */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Users</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/users">
              <Button variant="secondary" icon={UserPlus}>
                Add User
              </Button>
            </Link>
            <Link
              href="/admin/users"
              className="text-sm text-pink-500 hover:text-pink-600 font-medium"
            >
              View All Users
            </Link>
          </div>
        </div>
        {recentUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users yet"
            description="Midwife accounts will appear once they are provisioned."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">User</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">District</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user, index) => (
                  <UserRow key={index} {...user} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

    </>
  );
}
