/**
 * Activity Service
 * 
 * API service for managing child activity records.
 */

import { apiClient } from '../config/api';

export interface Activity {
  id: string;
  childId: string;
  type: 'vaccination' | 'growth' | 'milestone' | 'appointment' | 'checkup';
  title: string;
  description?: string;
  date: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityRequest {
  type: 'vaccination' | 'growth' | 'milestone' | 'appointment' | 'checkup';
  title: string;
  description?: string;
  date?: string;
  icon?: string;
}

export interface UpdateActivityRequest {
  type?: 'vaccination' | 'growth' | 'milestone' | 'appointment' | 'checkup';
  title?: string;
  description?: string;
  date?: string;
  icon?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Activity Service for API operations
 */
export const activityService = {
  /**
   * Get all activities for a child
   */
  async getChildActivities(childId: string): Promise<Activity[]> {
    const response = await apiClient.get<ApiResponse<Activity[]>>(
      `/activity/child/${childId}`
    );
    return response.data;
  },

  /**
   * Get a single activity
   */
  async getActivity(id: string): Promise<Activity> {
    const response = await apiClient.get<ApiResponse<Activity>>(
      `/activity/${id}`
    );
    return response.data;
  },

  /**
   * Create a new activity
   */
  async createActivity(
    childId: string,
    data: CreateActivityRequest
  ): Promise<Activity> {
    const response = await apiClient.post<ApiResponse<Activity>>(
      `/activity/child/${childId}`,
      data
    );
    return response.data;
  },

  /**
   * Update an activity
   */
  async updateActivity(
    id: string,
    data: UpdateActivityRequest
  ): Promise<Activity> {
    const response = await apiClient.put<ApiResponse<Activity>>(
      `/activity/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Delete an activity
   */
  async deleteActivity(id: string): Promise<void> {
    await apiClient.delete(`/activity/${id}`);
  },
};
