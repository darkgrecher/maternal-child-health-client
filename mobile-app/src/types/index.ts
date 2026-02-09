/**
 * Core Type Definitions for Maternal & Child Health Management System
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the application for type safety and code documentation.
 */

// ============================================================================
// CHILD & PROFILE TYPES
// ============================================================================

/**
 * Represents the gender options for a child
 */
export type Gender = 'male' | 'female';

/**
 * Blood type options following standard classification
 */
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';

/**
 * Profile type indicating whether user is in pregnancy or child phase
 */
export type ProfileType = 'pregnancy' | 'child';

/**
 * Pregnancy status
 */
export type PregnancyStatus = 'active' | 'delivered' | 'terminated' | 'converted';

/**
 * Pregnancy profile for tracking mother during pregnancy
 * After delivery, this can be converted to a ChildProfile
 */
export interface PregnancyProfile {
  id: string;
  userId: string;
  
  // Mother's Information
  motherFirstName: string;
  motherLastName: string;
  motherFullName: string;
  motherDateOfBirth: string;
  motherBloodType: BloodType;
  motherPhotoUri?: string;
  
  // Pregnancy Information
  expectedDeliveryDate: string; // EDD
  lastMenstrualPeriod?: string; // LMP
  conceptionDate?: string;
  
  // Current Status
  status: PregnancyStatus;
  currentWeek: number;
  trimester: 1 | 2 | 3;
  
  // Medical Information
  gravida?: number; // Number of pregnancies
  para?: number; // Number of deliveries
  bloodPressure?: string;
  prePregnancyWeight?: number; // in kg
  currentWeight?: number; // in kg
  height?: number; // in cm
  
  // Risk Factors
  isHighRisk: boolean;
  riskFactors: string[];
  medicalConditions: string[];
  allergies: string[];
  medications: string[];
  
  // Healthcare
  hospitalName?: string;
  obgynName?: string;
  obgynContact?: string;
  midwifeName?: string;
  midwifeContact?: string;
  
  // Baby Information
  expectedGender?: Gender;
  babyNickname?: string;
  numberOfBabies: number;
  
  // Conversion to Child (after delivery)
  convertedToChildId?: string;
  deliveryDate?: string;
  deliveryType?: 'normal' | 'cesarean' | 'assisted';
  deliveryNotes?: string;
  
  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  
  // Related records
  checkups?: PregnancyCheckup[];
  measurements?: PregnancyMeasurement[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  syncStatus?: SyncStatus;
}

/**
 * Pregnancy checkup record (prenatal visits)
 */
export interface PregnancyCheckup {
  id: string;
  pregnancyId: string;
  
  // Checkup details
  checkupDate: string;
  weekOfPregnancy: number;
  
  // Mother's measurements
  weight?: number;
  bloodPressure?: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  fundalHeight?: number;
  
  // Baby's measurements
  fetalHeartRate?: number;
  fetalWeight?: number;
  fetalLength?: number;
  amnioticFluid?: string;
  placentaPosition?: string;
  
  // Test results
  urineProtein?: string;
  urineGlucose?: string;
  hemoglobin?: number;
  
  // Notes
  notes?: string;
  recommendations?: string[];
  nextCheckupDate?: string;
  
  // Provider
  providerName?: string;
  location?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Mother's weight/measurement record during pregnancy
 */
export interface PregnancyMeasurement {
  id: string;
  pregnancyId: string;
  
  measurementDate: string;
  weekOfPregnancy: number;
  
  weight: number;
  bellyCircumference?: number;
  bloodPressure?: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  
  symptoms?: string[];
  mood?: string;
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Child profile containing all personal and medical information
 * This is the core entity of the application
 */
export interface ChildProfile {
  id: string;
  chdrNumber: string; // Child Health Development Record number
  
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  gender: Gender;
  photoUri?: string;
  
  // Birth Information
  birthWeight: number; // in kg
  birthHeight: number; // in cm
  birthHeadCircumference?: number; // in cm
  bloodType: BloodType;
  placeOfBirth?: string;
  deliveryType?: 'normal' | 'cesarean' | 'assisted';
  
  // Medical Information
  allergies: string[];
  specialConditions: string[];
  
  // Family Information
  motherName: string;
  fatherName: string;
  emergencyContact: string;
  address?: string;
  
  // Healthcare Providers
  assignedMidwife?: HealthcareProvider;
  pediatrician?: HealthcareProvider;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

/**
 * Healthcare provider information
 */
export interface HealthcareProvider {
  id: string;
  name: string;
  role: 'midwife' | 'pediatrician' | 'doctor' | 'nurse';
  phone: string;
  email?: string;
  clinic?: string;
  address?: string;
}

// ============================================================================
// VACCINATION TYPES
// ============================================================================

/**
 * Status of a vaccination
 */
export type VaccinationStatus = 'completed' | 'due' | 'upcoming' | 'overdue' | 'missed';

/**
 * Individual vaccine record
 */
export interface Vaccine {
  id: string;
  name: string;
  shortName: string; // e.g., BCG, OPV, etc.
  description?: string;
  scheduledAgeMonths: number; // Age in months when vaccine is due
  scheduledDate: string; // Calculated based on DOB
  administeredDate?: string;
  status: VaccinationStatus;
  batchNumber?: string;
  administeredBy?: string;
  location?: string;
  sideEffects?: string;
  notes?: string;
  syncStatus: SyncStatus;
}

/**
 * Vaccine group by age milestone
 */
export interface VaccineGroup {
  ageLabel: string; // e.g., "Birth", "2 months"
  ageMonths: number;
  vaccines: Vaccine[];
}

/**
 * Sri Lanka National Immunization Schedule vaccine definition
 */
export interface VaccineDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  scheduledAgeMonths: number;
  isRequired: boolean;
}

// ============================================================================
// GROWTH TRACKING TYPES
// ============================================================================

/**
 * Single growth measurement record
 */
export interface GrowthMeasurement {
  id: string;
  childId: string;
  date: string;
  ageInMonths: number;
  
  // Measurements
  weight: number; // in kg
  height: number; // in cm
  headCircumference?: number; // in cm
  
  // Calculated percentiles (based on WHO standards)
  weightPercentile?: number;
  heightPercentile?: number;
  headCircumferencePercentile?: number;
  
  // BMI calculation
  bmi?: number;
  bmiPercentile?: number;
  
  notes?: string;
  recordedBy?: string;
  syncStatus: SyncStatus;
}

/**
 * Growth status indicator
 */
export type GrowthStatus = 'normal' | 'needs_attention' | 'critical';

/**
 * Development milestone tracking
 */
export interface DevelopmentMilestone {
  id: string;
  name: string;
  description: string;
  expectedAgeMonths: number;
  category: 'motor' | 'cognitive' | 'social' | 'language';
  achievedDate?: string;
  status: 'achieved' | 'expected' | 'delayed';
}

// ============================================================================
// FEEDING & NUTRITION TYPES
// ============================================================================

/**
 * Age range for feeding guidelines
 */
export interface AgeRange {
  minMonths: number;
  maxMonths: number;
  label: string;
}

/**
 * Feeding guideline for specific age range
 */
export interface FeedingGuideline {
  id: string;
  ageRange: AgeRange;
  texture: string;
  frequency: string;
  amountPerMeal: string;
  tips: string[];
  illnessFeeding: string[];
  examples: string[];
}

/**
 * Nutrition supplement eligibility
 */
export interface NutritionSupplement {
  id: string;
  name: string;
  description: string;
  eligibilityStatus: 'eligible' | 'not_eligible' | 'receiving';
  distributionSchedule?: string;
}

// ============================================================================
// APPOINTMENT TYPES
// ============================================================================

/**
 * Appointment status
 */
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'missed';

/**
 * Appointment type
 */
export type AppointmentType = 
  | 'vaccination'
  | 'growth_check'
  | 'development_check'
  | 'general_checkup'
  | 'specialist'
  | 'emergency';

/**
 * Healthcare appointment record
 */
export interface Appointment {
  id: string;
  childId: string;
  title: string;
  type: AppointmentType;
  
  // Schedule
  dateTime: string;
  duration?: number | null; // in minutes
  
  // Location
  location: string;
  address?: string | null;
  
  // Provider
  providerName?: string | null;
  providerRole?: string | null;
  providerPhone?: string | null;
  
  // Status & Notes
  status: AppointmentStatus;
  notes?: string | null;
  reminderSent?: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  
  // Child info (when included)
  child?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ============================================================================
// ACTIVITY & HEALTH TIP TYPES
// ============================================================================

/**
 * Recent activity record for timeline
 */
export interface Activity {
  id: string;
  type: 'vaccination' | 'growth' | 'milestone' | 'appointment' | 'checkup';
  title: string;
  description?: string;
  date: string;
  icon?: string;
}

/**
 * Daily health tip
 */
export interface HealthTip {
  id: string;
  title: string;
  content: string;
  ageRangeMin: number;
  ageRangeMax: number;
  source: string;
  category: 'nutrition' | 'development' | 'safety' | 'hygiene' | 'general';
}

// ============================================================================
// EMERGENCY CONTACT TYPES
// ============================================================================

/**
 * Emergency contact entry
 */
export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  isPrimary?: boolean;
}

// ============================================================================
// SYNC & OFFLINE TYPES
// ============================================================================

/**
 * Sync status for offline-first functionality
 */
export type SyncStatus = 'synced' | 'pending' | 'error';

/**
 * Offline queue item for sync
 */
export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: string;
  retryCount: number;
}

// ============================================================================
// APP STATE TYPES
// ============================================================================

/**
 * Supported languages
 */
export type Language = 'en' | 'si' | 'ta';

/**
 * App settings
 */
export interface AppSettings {
  language: Language;
  notifications: boolean;
  darkMode: boolean;
  offlineMode: boolean;
  lastSyncTime?: string;
}

/**
 * Navigation parameter types
 */
export type RootStackParamList = {
  Main: undefined;
  PregnancyMain: undefined;
  ProfileMain: undefined;
  EditProfile: { childId?: string; isNew?: boolean };
  EditChild: { childId: string };
  EditPregnancy: { pregnancyId: string };
  AddMeasurement: { childId: string };
  VaccineDetails: { vaccineId: string };
  AppointmentDetails: { appointmentId: string };
  Settings: undefined;
  Activities: undefined;
  AddChild: undefined;
  CreatePregnancy: { previousPregnancyId?: string } | undefined;
  PregnancyDashboard: undefined;
};

export type TabParamList = {
  Home: undefined;
  Vaccines: undefined;
  Growth: undefined;
  Feeding: undefined;
  Schedule: undefined;
};

export type PregnancyTabParamList = {
  PregnancyHome: undefined;
  Checkups: undefined;
  Health: undefined;
  Journal: undefined;
};

// Re-export auth types
export * from './auth';
