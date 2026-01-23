/**
 * Pregnancy API Service
 * 
 * API client methods for pregnancy profile management.
 */

import { apiClient } from './apiClient';
import { PregnancyProfile, PregnancyCheckup, PregnancyMeasurement, ChildProfile, BloodType, Gender } from '../types';

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface CreatePregnancyRequest {
  motherFirstName: string;
  motherLastName: string;
  motherDateOfBirth: string;
  motherBloodType?: string;
  motherPhotoUri?: string;
  expectedDeliveryDate: string;
  lastMenstrualPeriod?: string;
  conceptionDate?: string;
  gravida?: number;
  para?: number;
  prePregnancyWeight?: number;
  currentWeight?: number;
  height?: number;
  isHighRisk?: boolean;
  riskFactors?: string[];
  medicalConditions?: string[];
  allergies?: string[];
  medications?: string[];
  hospitalName?: string;
  obgynName?: string;
  obgynContact?: string;
  midwifeName?: string;
  midwifeContact?: string;
  expectedGender?: 'male' | 'female';
  babyNickname?: string;
  numberOfBabies?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

export interface UpdatePregnancyRequest extends Partial<CreatePregnancyRequest> {
  deliveryDate?: string;
  deliveryType?: 'normal' | 'cesarean' | 'assisted';
  deliveryNotes?: string;
}

export interface ConvertToChildRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  chdrNumber?: string;
  photoUri?: string;
  birthWeight?: number;
  birthHeight?: number;
  birthHeadCircumference?: number;
  bloodType?: string;
  placeOfBirth?: string;
  deliveryType?: 'normal' | 'cesarean' | 'assisted';
  deliveryNotes?: string;
  allergies?: string[];
  specialConditions?: string[];
  address?: string;
}

export interface CreateCheckupRequest {
  checkupDate: string;
  weekOfPregnancy: number;
  weight?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  fundalHeight?: number;
  fetalHeartRate?: number;
  fetalWeight?: number;
  fetalLength?: number;
  amnioticFluid?: string;
  placentaPosition?: string;
  urineProtein?: string;
  urineGlucose?: string;
  hemoglobin?: number;
  notes?: string;
  recommendations?: string[];
  nextCheckupDate?: string;
  providerName?: string;
  location?: string;
}

export interface CreateMeasurementRequest {
  measurementDate: string;
  weekOfPregnancy: number;
  weight: number;
  bellyCircumference?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  symptoms?: string[];
  mood?: string;
  notes?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

interface PregnancyApiResponse {
  id: string;
  userId: string;
  motherFirstName: string;
  motherLastName: string;
  motherFullName: string;
  motherDateOfBirth: string;
  motherBloodType: string;
  motherPhotoUri: string | null;
  expectedDeliveryDate: string;
  lastMenstrualPeriod: string | null;
  conceptionDate: string | null;
  status: 'active' | 'delivered' | 'terminated' | 'converted';
  currentWeek: number;
  trimester: number;
  gravida: number | null;
  para: number | null;
  bloodPressure: string | null;
  prePregnancyWeight: number | null;
  currentWeight: number | null;
  height: number | null;
  isHighRisk: boolean;
  riskFactors: string[];
  medicalConditions: string[];
  allergies: string[];
  medications: string[];
  hospitalName: string | null;
  obgynName: string | null;
  obgynContact: string | null;
  midwifeName: string | null;
  midwifeContact: string | null;
  expectedGender: 'male' | 'female' | null;
  babyNickname: string | null;
  numberOfBabies: number;
  convertedToChildId: string | null;
  deliveryDate: string | null;
  deliveryType: 'normal' | 'cesarean' | 'assisted' | null;
  deliveryNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  checkups?: CheckupApiResponse[];
  measurements?: MeasurementApiResponse[];
  createdAt: string;
  updatedAt: string;
}

interface CheckupApiResponse {
  id: string;
  pregnancyId: string;
  checkupDate: string;
  weekOfPregnancy: number;
  weight: number | null;
  bloodPressure: string | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  fundalHeight: number | null;
  fetalHeartRate: number | null;
  fetalWeight: number | null;
  fetalLength: number | null;
  amnioticFluid: string | null;
  placentaPosition: string | null;
  urineProtein: string | null;
  urineGlucose: string | null;
  hemoglobin: number | null;
  notes: string | null;
  recommendations: string[];
  nextCheckupDate: string | null;
  providerName: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MeasurementApiResponse {
  id: string;
  pregnancyId: string;
  measurementDate: string;
  weekOfPregnancy: number;
  weight: number;
  bellyCircumference: number | null;
  bloodPressure: string | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  symptoms: string[];
  mood: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConvertToChildResponse {
  pregnancy: PregnancyApiResponse;
  child: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female';
    chdrNumber: string | null;
    photoUri: string | null;
    birthWeight: number | null;
    birthHeight: number | null;
    birthHeadCircumference: number | null;
    bloodType: string;
    placeOfBirth: string | null;
    deliveryType: string | null;
    allergies: string[];
    specialConditions: string[];
    motherName: string | null;
    fatherName: string | null;
    emergencyContact: string | null;
    address: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

// ============================================================================
// MAPPERS
// ============================================================================

const mapToPregnancyProfile = (data: PregnancyApiResponse): PregnancyProfile => ({
  id: data.id,
  userId: data.userId,
  motherFirstName: data.motherFirstName,
  motherLastName: data.motherLastName,
  motherFullName: data.motherFullName,
  motherDateOfBirth: data.motherDateOfBirth,
  motherBloodType: (data.motherBloodType as BloodType) || 'unknown',
  motherPhotoUri: data.motherPhotoUri || undefined,
  expectedDeliveryDate: data.expectedDeliveryDate,
  lastMenstrualPeriod: data.lastMenstrualPeriod || undefined,
  conceptionDate: data.conceptionDate || undefined,
  status: data.status,
  currentWeek: data.currentWeek,
  trimester: data.trimester as 1 | 2 | 3,
  gravida: data.gravida || undefined,
  para: data.para || undefined,
  bloodPressure: data.bloodPressure || undefined,
  prePregnancyWeight: data.prePregnancyWeight || undefined,
  currentWeight: data.currentWeight || undefined,
  height: data.height || undefined,
  isHighRisk: data.isHighRisk,
  riskFactors: data.riskFactors || [],
  medicalConditions: data.medicalConditions || [],
  allergies: data.allergies || [],
  medications: data.medications || [],
  hospitalName: data.hospitalName || undefined,
  obgynName: data.obgynName || undefined,
  obgynContact: data.obgynContact || undefined,
  midwifeName: data.midwifeName || undefined,
  midwifeContact: data.midwifeContact || undefined,
  expectedGender: data.expectedGender || undefined,
  babyNickname: data.babyNickname || undefined,
  numberOfBabies: data.numberOfBabies,
  convertedToChildId: data.convertedToChildId || undefined,
  deliveryDate: data.deliveryDate || undefined,
  deliveryType: data.deliveryType || undefined,
  deliveryNotes: data.deliveryNotes || undefined,
  emergencyContactName: data.emergencyContactName || undefined,
  emergencyContactPhone: data.emergencyContactPhone || undefined,
  emergencyContactRelation: data.emergencyContactRelation || undefined,
  checkups: data.checkups?.map(mapToCheckup),
  measurements: data.measurements?.map(mapToMeasurement),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
  syncStatus: 'synced',
});

const mapToCheckup = (data: CheckupApiResponse): PregnancyCheckup => ({
  id: data.id,
  pregnancyId: data.pregnancyId,
  checkupDate: data.checkupDate,
  weekOfPregnancy: data.weekOfPregnancy,
  weight: data.weight || undefined,
  bloodPressure: data.bloodPressure || undefined,
  bloodPressureSystolic: data.bloodPressureSystolic || undefined,
  bloodPressureDiastolic: data.bloodPressureDiastolic || undefined,
  fundalHeight: data.fundalHeight || undefined,
  fetalHeartRate: data.fetalHeartRate || undefined,
  fetalWeight: data.fetalWeight || undefined,
  fetalLength: data.fetalLength || undefined,
  amnioticFluid: data.amnioticFluid || undefined,
  placentaPosition: data.placentaPosition || undefined,
  urineProtein: data.urineProtein || undefined,
  urineGlucose: data.urineGlucose || undefined,
  hemoglobin: data.hemoglobin || undefined,
  notes: data.notes || undefined,
  recommendations: data.recommendations,
  nextCheckupDate: data.nextCheckupDate || undefined,
  providerName: data.providerName || undefined,
  location: data.location || undefined,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const mapToMeasurement = (data: MeasurementApiResponse): PregnancyMeasurement => ({
  id: data.id,
  pregnancyId: data.pregnancyId,
  measurementDate: data.measurementDate,
  weekOfPregnancy: data.weekOfPregnancy,
  weight: data.weight,
  bellyCircumference: data.bellyCircumference || undefined,
  bloodPressure: data.bloodPressure || undefined,
  bloodPressureSystolic: data.bloodPressureSystolic || undefined,
  bloodPressureDiastolic: data.bloodPressureDiastolic || undefined,
  symptoms: data.symptoms,
  mood: data.mood || undefined,
  notes: data.notes || undefined,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const mapToChildProfile = (data: ConvertToChildResponse['child']): ChildProfile => ({
  id: data.id,
  chdrNumber: data.chdrNumber || '',
  firstName: data.firstName,
  lastName: data.lastName,
  dateOfBirth: data.dateOfBirth,
  gender: data.gender,
  photoUri: data.photoUri || undefined,
  birthWeight: data.birthWeight || 0,
  birthHeight: data.birthHeight || 0,
  birthHeadCircumference: data.birthHeadCircumference || undefined,
  bloodType: (data.bloodType as BloodType) || 'unknown',
  placeOfBirth: data.placeOfBirth || undefined,
  deliveryType: (data.deliveryType as any) || undefined,
  allergies: data.allergies || [],
  specialConditions: data.specialConditions || [],
  motherName: data.motherName || '',
  fatherName: data.fatherName || '',
  emergencyContact: data.emergencyContact || '',
  address: data.address || undefined,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
  syncStatus: 'synced',
});

// ============================================================================
// SERVICE
// ============================================================================

export const pregnancyService = {
  /**
   * Get all pregnancies for the current user
   */
  async getPregnancies(): Promise<PregnancyProfile[]> {
    const response = await apiClient.get<PregnancyApiResponse[]>('/pregnancies');
    return response.map(mapToPregnancyProfile);
  },

  /**
   * Get active pregnancies for the current user
   */
  async getActivePregnancies(): Promise<PregnancyProfile[]> {
    const response = await apiClient.get<PregnancyApiResponse[]>('/pregnancies/active');
    return response.map(mapToPregnancyProfile);
  },

  /**
   * Get a specific pregnancy by ID
   */
  async getPregnancy(pregnancyId: string): Promise<PregnancyProfile> {
    const response = await apiClient.get<PregnancyApiResponse>(`/pregnancies/${pregnancyId}`);
    return mapToPregnancyProfile(response);
  },

  /**
   * Create a new pregnancy profile
   */
  async createPregnancy(data: CreatePregnancyRequest): Promise<PregnancyProfile> {
    const response = await apiClient.post<PregnancyApiResponse>('/pregnancies', data);
    return mapToPregnancyProfile(response);
  },

  /**
   * Update a pregnancy profile
   */
  async updatePregnancy(pregnancyId: string, data: UpdatePregnancyRequest): Promise<PregnancyProfile> {
    const response = await apiClient.put<PregnancyApiResponse>(`/pregnancies/${pregnancyId}`, data);
    return mapToPregnancyProfile(response);
  },

  /**
   * Delete a pregnancy profile
   */
  async deletePregnancy(pregnancyId: string): Promise<void> {
    await apiClient.delete(`/pregnancies/${pregnancyId}`);
  },

  /**
   * Convert a pregnancy to a child profile after delivery
   */
  async convertToChild(pregnancyId: string, data: ConvertToChildRequest): Promise<{ pregnancy: PregnancyProfile; child: ChildProfile }> {
    const response = await apiClient.post<ConvertToChildResponse>(`/pregnancies/${pregnancyId}/convert-to-child`, data);
    return {
      pregnancy: mapToPregnancyProfile(response.pregnancy),
      child: mapToChildProfile(response.child),
    };
  },

  /**
   * Add a checkup record to a pregnancy
   */
  async addCheckup(pregnancyId: string, data: CreateCheckupRequest): Promise<PregnancyCheckup> {
    const response = await apiClient.post<CheckupApiResponse>(`/pregnancies/${pregnancyId}/checkups`, data);
    return mapToCheckup(response);
  },

  /**
   * Get all checkups for a pregnancy
   */
  async getCheckups(pregnancyId: string): Promise<PregnancyCheckup[]> {
    const response = await apiClient.get<CheckupApiResponse[]>(`/pregnancies/${pregnancyId}/checkups`);
    return response.map(mapToCheckup);
  },

  /**
   * Add a measurement record to a pregnancy
   */
  async addMeasurement(pregnancyId: string, data: CreateMeasurementRequest): Promise<PregnancyMeasurement> {
    const response = await apiClient.post<MeasurementApiResponse>(`/pregnancies/${pregnancyId}/measurements`, data);
    return mapToMeasurement(response);
  },

  /**
   * Get all measurements for a pregnancy
   */
  async getMeasurements(pregnancyId: string): Promise<PregnancyMeasurement[]> {
    const response = await apiClient.get<MeasurementApiResponse[]>(`/pregnancies/${pregnancyId}/measurements`);
    return response.map(mapToMeasurement);
  },
};
