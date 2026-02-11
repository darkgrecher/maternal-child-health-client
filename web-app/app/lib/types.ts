/**
 * Type Definitions for Midwife Web Application
 */

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'midwife' | 'admin' | 'supervisor';
  employeeId?: string;
  district?: string;
  area?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PREGNANCY TYPES
// ============================================================================

export interface PregnancyProfile {
  id: string;
  patientId: string;
  patientName: string;
  lmp: string; // Last Menstrual Period
  edd: string; // Expected Due Date
  gestationalAge: number;
  riskLevel: 'low' | 'medium' | 'high';
  bloodType?: string;
  complications?: string[];
  notes?: string;
  status: 'active' | 'completed' | 'terminated';
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CHILD TYPES
// ============================================================================

export interface ChildProfile {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  birthWeight?: number;
  birthLength?: number;
  parentId: string;
  parentName: string;
  bloodType?: string;
  allergies?: string[];
  medicalConditions?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// VACCINATION TYPES
// ============================================================================

export interface VaccinationRecord {
  id: string;
  childId: string;
  childName: string;
  vaccineName: string;
  vaccineType: string;
  scheduledDate: string;
  administeredDate?: string;
  status: 'scheduled' | 'administered' | 'missed' | 'overdue';
  batchNumber?: string;
  administeredBy?: string;
  sideEffects?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// GROWTH MEASUREMENT TYPES
// ============================================================================

export interface GrowthMeasurement {
  id: string;
  childId: string;
  date: string;
  weight: number;
  height: number;
  headCircumference?: number;
  muac?: number; // Mid-Upper Arm Circumference
  zScoreWeight?: number;
  zScoreHeight?: number;
  zScoreWeightForHeight?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// APPOINTMENT TYPES
// ============================================================================

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  type: 'prenatal' | 'postnatal' | 'vaccination' | 'checkup' | 'consultation';
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // in minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  location?: string;
  midwifeId: string;
  midwifeName: string;
  notes?: string;
  reminderSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ACTIVITY TYPES
// ============================================================================

export interface Activity {
  id: string;
  type: 'home_visit' | 'clinic_visit' | 'vaccination' | 'assessment' | 'follow_up' | 'emergency';
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  location: string;
  midwifeId: string;
  midwifeName: string;
  description: string;
  findings?: string;
  recommendations?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  status: 'planned' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// EMERGENCY CONTACT TYPES
// ============================================================================

export interface EmergencyContact {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  phone: string;
  alternativePhone?: string;
  address?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// DASHBOARD STATS TYPES
// ============================================================================

export interface DashboardStats {
  totalPatients: number;
  activePregnancies: number;
  childrenMonitored: number;
  upcomingAppointments: number;
  overdueVaccinations: number;
  highRiskPregnancies: number;
  appointmentsToday: number;
  newPatientsThisMonth: number;
  totalPregnancies?: number;
  totalChildren?: number;
  upcomingVaccinations?: number;
  todayAppointments?: number;
  weekAppointments?: number;
  recentActivities?: Activity[];
  alerts?: Alert[];
}

export interface Alert {
  id: string;
  type: 'high_risk' | 'overdue_vaccination' | 'missed_appointment' | 'follow_up_required';
  severity: 'low' | 'medium' | 'high' | 'critical';
  patientId: string;
  patientName: string;
  message: string;
  date: string;
  isRead: boolean;
  actionRequired?: boolean;
}

// ============================================================================
// PATIENT TYPES
// ============================================================================

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  nic?: string; // National Identity Card
  address: string;
  district: string;
  phone: string;
  alternativePhone?: string;
  email?: string;
  bloodType?: string;
  emergencyContacts: EmergencyContact[];
  medicalHistory?: string;
  allergies?: string[];
  currentMedications?: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface PregnancyFormData {
  patientId: string;
  lmp: string;
  bloodType?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  complications?: string[];
  notes?: string;
}

export interface ChildFormData {
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  birthWeight?: number;
  birthLength?: number;
  parentId: string;
  bloodType?: string;
  allergies?: string[];
  medicalConditions?: string[];
  notes?: string;
}

export interface AppointmentFormData {
  patientId: string;
  type: 'prenatal' | 'postnatal' | 'vaccination' | 'checkup' | 'consultation';
  scheduledDate: string;
  scheduledTime: string;
  duration?: number;
  location?: string;
  notes?: string;
}

export interface ActivityFormData {
  type: 'home_visit' | 'clinic_visit' | 'vaccination' | 'assessment' | 'follow_up' | 'emergency';
  patientId: string;
  date: string;
  time: string;
  location: string;
  description: string;
  findings?: string;
  recommendations?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
}
