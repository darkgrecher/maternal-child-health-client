/**
 * Admin Alerts Page
 *
 * Monitor system warnings/errors and QR link notifications.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Bug,
  Clock,
  QrCode,
  RefreshCw,
  Server,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AdminHeader } from '../layout';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  LoadingSpinner,
  SectionTitle,
  Select,
} from '../../components/ui';
import apiClient from '../../lib/api-client';
import { useAuthStore } from '../../lib/stores';
import type {
  AdminAlertsResponse,
  AdminLinkNotification,
  AdminLogActor,
  AdminLogEntry,
  ApiResponse,
} from '../../lib/types';

const RANGE_OPTIONS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const LIMIT_OPTIONS = [
  { value: '10', label: '10 per list' },
  { value: '20', label: '20 per list' },
  { value: '50', label: '50 per list' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All alerts' },
  { value: 'system', label: 'System alerts' },
  { value: 'link', label: 'QR link alerts' },
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All severities' },
  { value: 'error', label: 'Errors' },
  { value: 'warn', label: 'Warnings' },
];

const levelBadgeVariant = (level: AdminLogEntry['level']) => {
  switch (level) {
    case 'error':
      return 'error';
    case 'warn':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'default';
  }
};

const actorBadgeVariant = (actorType: AdminLogActor['type']) => {
  switch (actorType) {
    case 'midwife':
      return 'success';
    case 'user':
      return 'info';
    default:
      return 'default';
  }
};

const linkBadgeVariant = (type: AdminLinkNotification['type']) => {
  return type === 'unregistered' ? 'error' : 'warning';
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatActor = (actor: AdminLogActor) => {
  if (actor.type === 'system') return 'System';
  return actor.name || actor.email || actor.id || 'Unknown';
};

const formatMetadata = (metadata?: Record<string, unknown> | null) => {
  if (!metadata) return null;
  try {
    const text = JSON.stringify(metadata);
    if (text.length > 160) {
      return `${text.slice(0, 160)}...`;
    }
    return text;
  } catch (error) {
    return String(metadata);
  }
};

const formatProfileType = (value: AdminLinkNotification['expectedProfileType']) => {
  if (value === 'any') return 'Any';
  return value === 'child' ? 'Child' : 'Pregnancy';
};

const formatMidwifeLabel = (notification: AdminLinkNotification) => {
  if (!notification.midwife) return 'Unknown midwife';
  return notification.midwife.name || notification.midwife.email || notification.midwife.id;
};

export default function AdminAlertsPage() {
  const { user, hasHydrated } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [range, setRange] = useState('30d');
  const [limit, setLimit] = useState(20);
  const [category, setCategory] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [alertsResponse, setAlertsResponse] = useState<AdminAlertsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated || !isAdmin) return;

    let isActive = true;

    const loadAlerts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('range', range);
        params.set('limit', String(limit));

        const response = await apiClient.get<ApiResponse<AdminAlertsResponse>>(
          `/admin/alerts?${params.toString()}`
        );
        if (isActive) {
          setAlertsResponse(response.data ?? null);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to load alerts.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadAlerts();

    return () => {
      isActive = false;
    };
  }, [hasHydrated, isAdmin, range, limit, refreshKey]);

  const systemAlerts = alertsResponse?.system.items ?? [];
  const linkAlerts = alertsResponse?.link.items ?? [];
  const rangeLabel = alertsResponse?.range.label ?? 'Last 30 days';
  const rangeDates = alertsResponse
    ? `${new Date(alertsResponse.range.start).toLocaleDateString()} - ${
        new Date(alertsResponse.range.end).toLocaleDateString()
      }`
    : '';

  const totalSystem = alertsResponse?.system.total ?? 0;
  const warningCount = alertsResponse?.system.summary.warningCount ?? 0;
  const errorCount = alertsResponse?.system.summary.errorCount ?? 0;
  const totalLink = alertsResponse?.link.total ?? 0;
  const mismatchCount = alertsResponse?.link.summary.mismatchCount ?? 0;
  const unregisteredCount = alertsResponse?.link.summary.unregisteredCount ?? 0;
  const totalAlerts = totalSystem + totalLink;

  const normalizedSearch = search.trim().toLowerCase();

  const filteredSystemAlerts = useMemo(() => {
    if (category === 'link') return [] as AdminLogEntry[];

    return systemAlerts.filter((alert) => {
      if (severity !== 'all' && alert.level !== severity) return false;
      if (!normalizedSearch) return true;

      const actorLabel = formatActor(alert.actor).toLowerCase();
      return [alert.message, alert.source, alert.event, actorLabel]
        .filter(Boolean)
        .some((value) => (value as string).toLowerCase().includes(normalizedSearch));
    });
  }, [category, severity, normalizedSearch, systemAlerts]);

  const filteredLinkAlerts = useMemo(() => {
    if (category === 'system') return [] as AdminLinkNotification[];

    return linkAlerts.filter((alert) => {
      if (!normalizedSearch) return true;

      const midwifeLabel = formatMidwifeLabel(alert).toLowerCase();
      return [alert.message, alert.type, midwifeLabel]
        .filter(Boolean)
        .some((value) => (value as string).toLowerCase().includes(normalizedSearch));
    });
  }, [category, normalizedSearch, linkAlerts]);

  const isInitialLoad = isLoading && alertsResponse === null;

  if (!hasHydrated) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Loading alerts</p>
            <p className="text-xs text-slate-500">Checking your access...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <AdminHeader title="Alerts" subtitle="System warnings and QR link issues" />
        <Alert variant="error" title="Restricted access" icon={ShieldCheck}>
          You need administrator privileges to view alerts.
        </Alert>
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title="Alerts"
        subtitle="System warnings and QR link issues"
        actions={
          <Button
            icon={RefreshCw}
            variant="secondary"
            isLoading={isLoading}
            onClick={() => setRefreshKey((prev) => prev + 1)}
          >
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert variant="warning" title="Alerts unavailable" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-100 dark:bg-pink-900/30">
            <Bell className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total alerts</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{totalAlerts}</p>
            <p className="text-xs text-slate-400 mt-1">{rangeLabel}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Warnings</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{warningCount}</p>
            <p className="text-xs text-slate-400 mt-1">System-level warnings</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
            <Bug className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Errors</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{errorCount}</p>
            <p className="text-xs text-slate-400 mt-1">System-level errors</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <QrCode className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">QR link issues</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{totalLink}</p>
            <p className="text-xs text-slate-400 mt-1">
              {mismatchCount} mismatch, {unregisteredCount} unregistered
            </p>
          </div>
        </Card>
      </div>

      <Card className="mb-8">
        <SectionTitle title="Filters" subtitle={rangeDates} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Message, source, midwife"
          />
          <Select
            label="Range"
            options={RANGE_OPTIONS}
            value={range}
            onChange={(event) => setRange(event.target.value)}
          />
          <Select
            label="Category"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
          <Select
            label="Severity"
            options={SEVERITY_OPTIONS}
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
          />
          <Select
            label="Limit"
            options={LIMIT_OPTIONS}
            value={String(limit)}
            onChange={(event) => setLimit(Number(event.target.value))}
          />
        </div>
      </Card>

      {category !== 'link' && (
        <Card className="mb-8">
          <SectionTitle
            title="System alerts"
            subtitle={`${filteredSystemAlerts.length} alerts found`}
            action={
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Server className="w-4 h-4" />
                {rangeDates || rangeLabel}
              </div>
            }
          />

          {isInitialLoad ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredSystemAlerts.length === 0 ? (
            <EmptyState
              icon={Server}
              title="No system alerts"
              description="System warnings and errors will show up here."
            />
          ) : (
            <div className="space-y-4">
              {filteredSystemAlerts.map((alert) => {
                const actorLabel = formatActor(alert.actor);
                const metadata = formatMetadata(alert.metadata ?? null);

                return (
                  <div
                    key={alert.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/40"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <AlertTriangle className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={levelBadgeVariant(alert.level)}>
                              {alert.level.toUpperCase()}
                            </Badge>
                            <Badge variant={actorBadgeVariant(alert.actor.type)}>
                              {alert.actor.type}
                            </Badge>
                            <span className="text-xs text-slate-500">{alert.source}</span>
                            {alert.event && (
                              <span className="text-xs text-slate-400">{alert.event}</span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2">
                            {alert.message}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {actorLabel}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDateTime(alert.createdAt)}
                            </span>
                            {alert.ipAddress && <span>IP: {alert.ipAddress}</span>}
                          </div>
                          {metadata && (
                            <p className="mt-2 text-xs text-slate-500">
                              Metadata:{' '}
                              <span className="text-slate-600 dark:text-slate-300">{metadata}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      {alert.userAgent && (
                        <div className="text-xs text-slate-400 md:text-right">
                          <p>User agent</p>
                          <p className="text-slate-500 dark:text-slate-400 max-w-xs break-words">
                            {alert.userAgent}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {category !== 'system' && (
        <Card>
          <SectionTitle
            title="QR link alerts"
            subtitle={`${filteredLinkAlerts.length} alerts found`}
            action={
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <QrCode className="w-4 h-4" />
                {rangeDates || rangeLabel}
              </div>
            }
          />

          {isInitialLoad ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredLinkAlerts.length === 0 ? (
            <EmptyState
              icon={QrCode}
              title="No QR alerts"
              description="QR link mismatches and unregistered scans will show up here."
            />
          ) : (
            <div className="space-y-4">
              {filteredLinkAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/40"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <AlertTriangle className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={linkBadgeVariant(alert.type)}>
                          {alert.type.toUpperCase()}
                        </Badge>
                        {!alert.isRead && <Badge variant="warning">Unread</Badge>}
                        <span className="text-xs text-slate-500">{formatMidwifeLabel(alert)}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2">
                        {alert.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                        <span>
                          Expected: {formatProfileType(alert.expectedProfileType)}
                        </span>
                        <span>
                          Scanned: {formatProfileType(alert.scannedProfileType)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDateTime(alert.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </>
  );
}
