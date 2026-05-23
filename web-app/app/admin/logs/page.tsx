/**
 * Admin System Logs Page
 *
 * View and filter system logs across the platform.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bug,
  Calendar,
  Clock,
  FileText,
  Info,
  RefreshCw,
  Search,
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
  AdminLogActor,
  AdminLogActorSummary,
  AdminLogEntry,
  AdminLogLevel,
  AdminLogLevelSummary,
  AdminLogsResponse,
  ApiResponse,
} from '../../lib/types';

const RANGE_OPTIONS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const LEVEL_OPTIONS = [
  { value: '', label: 'All levels' },
  { value: 'debug', label: 'Debug' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warn' },
  { value: 'error', label: 'Error' },
];

const ACTOR_OPTIONS = [
  { value: '', label: 'All actors' },
  { value: 'system', label: 'System' },
  { value: 'midwife', label: 'Midwife' },
  { value: 'user', label: 'User' },
];

const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10 per page' },
  { value: '20', label: '20 per page' },
  { value: '50', label: '50 per page' },
];

const levelBadgeVariant = (level: AdminLogLevel) => {
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

const levelIcon = (level: AdminLogLevel) => {
  switch (level) {
    case 'error':
    case 'warn':
      return AlertTriangle;
    case 'info':
      return Info;
    default:
      return Bug;
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

const getSummaryCount = (summary: AdminLogLevelSummary[] | undefined, level: AdminLogLevel) => {
  return summary?.find((entry) => entry.level === level)?.count ?? 0;
};

const getActorCount = (summary: AdminLogActorSummary[] | undefined, actorType: AdminLogActor['type']) => {
  return summary?.find((entry) => entry.actorType === actorType)?.count ?? 0;
};

export default function AdminLogsPage() {
  const { user, hasHydrated } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [range, setRange] = useState('30d');
  const [level, setLevel] = useState('');
  const [actorType, setActorType] = useState('');
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [refreshKey, setRefreshKey] = useState(0);
  const [logsResponse, setLogsResponse] = useState<AdminLogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [range, level, actorType, source, search, pageSize]);

  useEffect(() => {
    if (!hasHydrated || !isAdmin) return;

    let isActive = true;

    const loadLogs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('range', range);
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));

        if (level) params.set('level', level);
        if (actorType) params.set('actorType', actorType);
        if (source.trim()) params.set('source', source.trim());
        if (search.trim()) params.set('search', search.trim());

        const response = await apiClient.get<ApiResponse<AdminLogsResponse>>(
          `/admin/logs?${params.toString()}`
        );
        if (isActive) {
          setLogsResponse(response.data ?? null);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to load system logs.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadLogs();

    return () => {
      isActive = false;
    };
  }, [hasHydrated, isAdmin, range, level, actorType, source, search, page, pageSize, refreshKey]);

  const logs = logsResponse?.items ?? [];
  const total = logsResponse?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeLabel = logsResponse?.range.label ?? 'Last 30 days';
  const rangeDates = logsResponse
    ? `${new Date(logsResponse.range.start).toLocaleDateString()} - ${new Date(logsResponse.range.end).toLocaleDateString()}`
    : '';

  const errorCount = getSummaryCount(logsResponse?.levelSummary, 'error');
  const warnCount = getSummaryCount(logsResponse?.levelSummary, 'warn');
  const infoCount = getSummaryCount(logsResponse?.levelSummary, 'info');
  const systemCount = getActorCount(logsResponse?.actorSummary, 'system');

  const isInitialLoad = isLoading && logsResponse === null;

  if (!hasHydrated) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Loading logs</p>
            <p className="text-xs text-slate-500">Checking your access...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <AdminHeader title="System Logs" subtitle="Audit trails and system events" />
        <Alert variant="error" title="Restricted access" icon={ShieldCheck}>
          You need administrator privileges to view system logs.
        </Alert>
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title="System Logs"
        subtitle="Audit trails and system events"
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
        <Alert variant="warning" title="Logs unavailable" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-100 dark:bg-pink-900/30">
            <FileText className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total logs</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{total}</p>
            <p className="text-xs text-slate-400 mt-1">{rangeLabel}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Errors</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{errorCount}</p>
            <p className="text-xs text-slate-400 mt-1">{warnCount} warnings</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <Info className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Info entries</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{infoCount}</p>
            <p className="text-xs text-slate-400 mt-1">Stable system activity</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700">
            <Server className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">System events</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{systemCount}</p>
            <p className="text-xs text-slate-400 mt-1">Automated services</p>
          </div>
        </Card>
      </div>

      <Card className="mb-8">
        <SectionTitle title="Filters" subtitle={rangeDates} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Search"
            icon={Search}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Message, source, event, actor"
          />
          <Input
            label="Source"
            icon={Server}
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="auth, scheduler, notifications"
          />
          <Select
            label="Range"
            options={RANGE_OPTIONS}
            value={range}
            onChange={(event) => setRange(event.target.value)}
          />
          <Select
            label="Level"
            options={LEVEL_OPTIONS}
            value={level}
            onChange={(event) => setLevel(event.target.value)}
          />
          <Select
            label="Actor"
            options={ACTOR_OPTIONS}
            value={actorType}
            onChange={(event) => setActorType(event.target.value)}
          />
          <Select
            label="Page size"
            options={PAGE_SIZE_OPTIONS}
            value={String(pageSize)}
            onChange={(event) => setPageSize(Number(event.target.value))}
          />
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Log entries"
          subtitle={`${total} entries found`}
          action={
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              {rangeDates || rangeLabel}
            </div>
          }
        />

        {isInitialLoad ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No logs found"
            description="Try adjusting the filters or expanding the time range."
          />
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const Icon = levelIcon(log.level);
              const metadata = formatMetadata(log.metadata ?? null);
              const actorLabel = formatActor(log.actor);

              return (
                <div
                  key={log.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/40"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={levelBadgeVariant(log.level)}>{log.level.toUpperCase()}</Badge>
                          <Badge variant={actorBadgeVariant(log.actor.type)}>{log.actor.type}</Badge>
                          <span className="text-xs text-slate-500">{log.source}</span>
                          {log.event && (
                            <span className="text-xs text-slate-400">{log.event}</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2">
                          {log.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {actorLabel}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDateTime(log.createdAt)}
                          </span>
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        </div>
                        {metadata && (
                          <p className="mt-2 text-xs text-slate-500">
                            Metadata: <span className="text-slate-600 dark:text-slate-300">{metadata}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    {log.userAgent && (
                      <div className="text-xs text-slate-400 md:text-right">
                        <p>User agent</p>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs break-words">
                          {log.userAgent}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
