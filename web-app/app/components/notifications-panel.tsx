'use client';

import React, { useEffect, useState } from 'react';
import { Bell, AlertTriangle, X } from 'lucide-react';
import apiClient from '../lib/api-client';
import { useAuthStore } from '../lib/stores';
import type { ApiResponse } from '../lib/types';

interface LinkNotification {
  id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type: string;
  expectedProfileType: 'child' | 'pregnancy';
  scannedProfileType: 'child' | 'pregnancy';
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString();
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { accessToken } = useAuthStore();
  const [notifications, setNotifications] = useState<LinkNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !accessToken) return;

    let isCancelled = false;

    const loadNotifications = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<ApiResponse<LinkNotification[]>>('/midwife-links/notifications');
        if (!isCancelled) {
          setNotifications(response.data ?? []);
        }
      } catch (err) {
        if (!isCancelled) {
          const message = err instanceof Error ? err.message : 'Unable to load notifications';
          setError(message);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, accessToken]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-12 w-80 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-bg)] shadow-xl z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--border)]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[color:var(--text-muted)]" />
          <p className="text-sm font-semibold text-[color:var(--text-primary)]">Notifications</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[color:var(--surface-elevated)]"
          aria-label="Close notifications"
        >
          <X className="w-4 h-4 text-[color:var(--text-muted)]" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading && (
          <div className="p-4 text-sm text-[color:var(--text-secondary)]">Loading notifications...</div>
        )}
        {error && (
          <div className="p-4 text-sm text-red-500">{error}</div>
        )}
        {!isLoading && !error && notifications.length === 0 && (
          <div className="p-4 text-sm text-[color:var(--text-secondary)]">No new notifications.</div>
        )}
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="px-4 py-3 border-b border-[color:var(--border)] last:border-none"
          >
            <div className="flex items-start gap-2">
              <div className="mt-1 rounded-full bg-[color:var(--accent-light)] p-1">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-[color:var(--text-primary)]">{notification.message}</p>
                <p className="text-xs text-[color:var(--text-muted)] mt-1">{formatTimestamp(notification.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
