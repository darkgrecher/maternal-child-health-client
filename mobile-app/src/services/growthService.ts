/**
 * Growth Service
 * 
 * API client for growth measurement operations.
 */

import { apiClient } from './apiClient';

// Types
export interface GrowthMeasurement {
  id: string;
  childId: string;
  measurementDate: string;
  ageInMonths: number;
  ageInDays: number | null;
  weight: number;
  height: number;
  headCircumference: number | null;
  weightPercentile: number | null;
  heightPercentile: number | null;
  headCircumferencePercentile: number | null;
  weightZScore: number | null;
  heightZScore: number | null;
  headCircumferenceZScore: number | null;
  bmi: number | null;
  bmiPercentile: number | null;
  bmiZScore: number | null;
  measuredBy: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GrowthSummary {
  latestWeight: number;
  latestHeight: number;
  latestHeadCircumference: number | null;
  latestWeightPercentile: number | null;
  latestHeightPercentile: number | null;
  latestHeadCircumferencePercentile: number | null;
  totalMeasurements: number;
  lastMeasurementDate: string;
}

export interface ChildGrowthData {
  childId: string;
  childName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  birthWeight: number | null;
  birthHeight: number | null;
  birthHeadCircumference: number | null;
  measurements: GrowthMeasurement[];
  summary: GrowthSummary | null;
}

export interface ChartDataPoint {
  date: string;
  ageInMonths: number;
  value: number | null;
  percentile: number | null;
}

export interface PercentileLine {
  age: number;
  value: number;
}

export interface ChartData {
  childId: string;
  chartType: 'weight' | 'height' | 'head';
  gender: 'male' | 'female';
  dataPoints: ChartDataPoint[];
  referenceData: {
    p3: PercentileLine[];
    p15: PercentileLine[];
    p50: PercentileLine[];
    p85: PercentileLine[];
    p97: PercentileLine[];
  };
}

export interface CreateGrowthMeasurementRequest {
  measurementDate: string;
  weight: number;
  height: number;
  headCircumference?: number;
  measuredBy?: string;
  location?: string;
  notes?: string;
}

export interface UpdateGrowthMeasurementRequest {
  measurementDate?: string;
  weight?: number;
  height?: number;
  headCircumference?: number;
  measuredBy?: string;
  location?: string;
  notes?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Growth Service for API operations
 */
export const growthService = {
  /**
   * Get all growth measurements for a child
   */
  async getChildMeasurements(childId: string): Promise<ChildGrowthData> {
    const response = await apiClient.get<ApiResponse<ChildGrowthData>>(
      `/growth/child/${childId}`
    );
    return response.data;
  },

  /**
   * Get chart data for growth visualization
   */
  async getChartData(
    childId: string,
    chartType: 'weight' | 'height' | 'head' = 'weight'
  ): Promise<ChartData> {
    const response = await apiClient.get<ApiResponse<ChartData>>(
      `/growth/child/${childId}/chart?type=${chartType}`
    );
    return response.data;
  },

  /**
   * Add a new growth measurement
   */
  async addMeasurement(
    childId: string,
    data: CreateGrowthMeasurementRequest
  ): Promise<GrowthMeasurement> {
    const response = await apiClient.post<ApiResponse<GrowthMeasurement>>(
      `/growth/child/${childId}`,
      data
    );
    return response.data;
  },

  /**
   * Update a growth measurement
   */
  async updateMeasurement(
    measurementId: string,
    data: UpdateGrowthMeasurementRequest
  ): Promise<GrowthMeasurement> {
    const response = await apiClient.patch<ApiResponse<GrowthMeasurement>>(
      `/growth/${measurementId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a growth measurement
   */
  async deleteMeasurement(measurementId: string): Promise<void> {
    await apiClient.delete(`/growth/${measurementId}`);
  },
};
