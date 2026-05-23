/**
 * Admin Notification Delivery Health Page
 *
 * Monitor failed notification deliveries and summary counts.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, RefreshCw, ShieldCheck } from 'lucide-react';
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
  AdminNotificationDeliveryHealthResponse,
  AdminNotificationDeliveryItem,
  ApiResponse,
} from '../../lib/types';

const RANGE_OPTIONS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const LIMIT_OPTIONS = [
  { value: '10', label: '10 records' },
  { value: '20', label: '20 records' },
  { value: '50', label: '50 records' },
];

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatActorLabel = (item: AdminNotificationDeliveryItem) => {
  return item.actor?.name || item.actor?.email || item.actorId || 'Unknown';
};

const formatChannelLabel = (value: AdminNotificationDeliveryItem['channel']) => {
  switch (value) {
    case 'web_push':
      return 'Web push';
    case 'in_app':
      return 'In-app';
    default:
      return value.replace('_', ' ');
  }
};

const formatTypeLabel = (value: AdminNotificationDeliveryItem['type']) => {
  return value.replace('_', ' ');
};

export default function AdminNotificationsPage() {
  const { user, hasHydrated } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [range, setRange] = useState('30d');
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [healthResponse, setHealthResponse] = useState<AdminNotificationDeliveryHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated || !isAdmin) return;

    let isActive = true;

    const loadHealth = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('range', range);
        params.set('limit', String(limit));

        const response = await apiClient.get<ApiResponse<AdminNotificationDeliveryHealthResponse>>(
          `/admin/notifications?${params.toString()}`
        );

        if (isActive) {
          setHealthResponse(response.data ?? null);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to load notification health.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadHealth();

    return () => {
      isActive = false;
    };
  }, [hasHydrated, isAdmin, range, limit, refreshKey]);

  const normalizedSearch = search.trim().toLowerCase();
  const items = healthResponse?.items ?? [];

  const filteredItems = useMemo(() => {
    if (!normalizedSearch) return items;
    return items.filter((item) => {
      const actorLabel = formatActorLabel(item).toLowerCase();
      const values = [item.title, item.message, item.deliveryError, actorLabel, item.channel, item.type]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return values.some((value) => value.includes(normalizedSearch));
    });
  }, [items, normalizedSearch]);

  const rangeLabel = healthResponse?.range.label ?? 'Last 30 days';
  const rangeDates = healthResponse
    ? `${new Date(healthResponse.range.start).toLocaleDateString()} - ${new Date(
        healthResponse.range.end
      ).toLocaleDateString()}`
    : '';

  const isInitialLoad = isLoading && healthResponse === null;

  if (!hasHydrated) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Loading delivery health</p>
            <p className="text-xs text-slate-500">Checking your access...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <AdminHeader title="Notification Health" subtitle="Delivery failures and error tracking" />
        <Alert variant="error" title="Restricted access" icon={ShieldCheck}>
          You need administrator privileges to view delivery health.
        </Alert>
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title="Notification Health"
        subtitle="Delivery failures and error tracking"
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
        <Alert variant="warning" title="Delivery health unavailable" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <Bell className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Failed deliveries</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              {healthResponse?.totalFailed ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">{rangeLabel}</p>
          </div>
        </Card>

        <Card>
          <SectionTitle title="By channel" subtitle={rangeDates} />
          <div className="flex flex-wrap gap-2">
            {(healthResponse?.summary.byChannel ?? []).length === 0 ? (
              <p className="text-xs text-slate-400">No failures recorded.</p>
            ) : (
              healthResponse?.summary.byChannel.map((entry) => (
                <Badge key={entry.channel} variant="warning">
                  {formatChannelLabel(entry.channel)}: {entry.count}
                </Badge>
              ))
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle title="By recipient" subtitle={rangeDates} />
          <div className="flex flex-wrap gap-2">
            {(healthResponse?.summary.byActorType ?? []).length === 0 ? (
              <p className="text-xs text-slate-400">No failures recorded.</p>
            ) : (
              healthResponse?.summary.byActorType.map((entry) => (
                <Badge key={entry.actorType} variant="info">
                  {entry.actorType}: {entry.count}
                </Badge>
              ))
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle title="By type" subtitle={rangeDates} />
          <div className="flex flex-wrap gap-2">
            {(healthResponse?.summary.byType ?? []).length === 0 ? (
              <p className="text-xs text-slate-400">No failures recorded.</p>
            ) : (
              healthResponse?.summary.byType.map((entry) => (
                <Badge key={entry.type} variant="default">
                  {formatTypeLabel(entry.type)}: {entry.count}
                </Badge>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="mb-8">
        <SectionTitle title="Filters" subtitle={rangeDates || rangeLabel} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Message, channel, actor, error"
          />
          <Select
            label="Range"
            options={RANGE_OPTIONS}
            value={range}
            onChange={(event) => setRange(event.target.value)}
          />
          <Select
            label="Limit"
            options={LIMIT_OPTIONS}
            value={String(limit)}
            onChange={(event) => setLimit(Number(event.target.value))}
          />
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Failed deliveries"
          subtitle={`${filteredItems.length} records found`}
          action={
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <AlertTriangle className="w-4 h-4" />
              {rangeDates || rangeLabel}
            </div>
          }
        />

        {isInitialLoad ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No failed deliveries"
            description="Delivery errors will appear here when they occur."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map((item) => (
              <div key={item.id} className="py-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {item.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
                      <Badge variant="warning">{formatChannelLabel(item.channel)}</Badge>
                      <Badge variant="info">{formatTypeLabel(item.type)}</Badge>
                      <Badge variant="default">{item.actorType}</Badge>
                      <span>{formatDateTime(item.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Recipient</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {formatActorLabel(item)}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-xs text-red-600 dark:text-red-400">
                  {item.deliveryError || 'Unknown delivery error'}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
