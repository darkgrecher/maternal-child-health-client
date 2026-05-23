/**
 * Notification Store
 *
 * Manages in-app notification list state.
 */

import { create } from 'zustand';
import { notificationsService } from '../services/notificationsService';
import type { NotificationListItem } from '../types';

interface NotificationState {
  items: NotificationListItem[];
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });

    try {
      const items = await notificationsService.listNotifications();
      set({ items, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load notifications';
      set({ error: message, isLoading: false });
    }
  },

  markRead: async (notificationId: string) => {
    const current = get().items;
    const target = current.find((item) => item.id === notificationId);
    if (!target || target.isRead) return;

    const optimistic = current.map((item) =>
      item.id === notificationId
        ? { ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() }
        : item
    );

    set({ items: optimistic });

    try {
      const updated = await notificationsService.markRead(notificationId);
      set({
        items: get().items.map((item) => (item.id === notificationId ? updated : item)),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update notification';
      set({ items: current, error: message });
    }
  },

  clear: () => set({ items: [], isLoading: false, error: null }),
}));
