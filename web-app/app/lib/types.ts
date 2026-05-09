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
  userId: string;
  motherFirstName: string;
  motherLastName: string;
  motherFullName: string;
  motherDateOfBirth?: string;
  motherBloodType?: string;
  motherPhotoUri?: string;
  expectedDeliveryDate: string;
  lastMenstrualPeriod?: string;
  conceptionDate?: string;
  status: 'active' | 'delivered' | 'terminated' | 'converted';
  currentWeek?: number;
  trimester?: number;
  gravida?: number;
  para?: number;
  bloodPressure?: string;
  prePregnancyWeight?: number;
  currentWeight?: number;
  height?: number;
  isHighRisk: boolean;
  riskFactors: string[];
  medicalConditions: string[];
  allergies: string[];
  medications: string[];
  hospitalName?: string;
  obgynName?: string;
  obgynContact?: string;
  midwifeName?: string;
  midwifeContact?: string;
  expectedGender?: 'male' | 'female';
  babyNickname?: string;
  numberOfBabies?: number;
  convertedToChildId?: string;
  deliveryDate?: string;
  deliveryType?: 'normal' | 'cesarean' | 'assisted';
  deliveryNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  checkups?: PregnancyCheckup[];
  measurements?: PregnancyMeasurement[];
  createdAt: string;
  updatedAt: string;
}

export interface PregnancyCheckup {
  id: string;
  pregnancyId: string;
  checkupDate?: string;
  weekOfPregnancy?: number;
  weight?: number;
  bloodPressure?: string | null;
  notes?: string | null;
  recommendations?: string | null;
  nextCheckupDate?: string;
  providerName?: string | null;
  location?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PregnancyMeasurement {
  id: string;
  pregnancyId: string;
  measurementDate?: string;
  weekOfPregnancy?: number;
  weight?: number;
  bellyCircumference?: number | null;
  bloodPressure?: string | null;
  symptoms?: string[] | null;
  mood?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// CHILD TYPES
// ============================================================================

export interface ChildProfile {
  id: string;
  chdrNumber?: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  photoUri?: string | null;
  birthWeight?: number | null;
  birthHeight?: number | null;
  birthHeadCircumference?: number | null;
  bloodType?: string | null;
  placeOfBirth?: string | null;
  deliveryType?: 'normal' | 'cesarean' | 'assisted' | null;
  allergies: string[];
  specialConditions: string[];
  motherName?: string | null;
  fatherName?: string | null;
  emergencyContact?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// VACCINATION TYPES
// ============================================================================

export interface VaccineInfo {
  id: string;
  name: string;
  shortName: string;
  description?: string | null;
  scheduledAgeMonths: number;
  scheduledAgeDays?: number | null;
  doseNumber: number;
  totalDoses: number;
  ageGroup: string;
}

export interface VaccinationRecord {
  id?: string | null;
  vaccineId: string;
  vaccine?: VaccineInfo;
  childId: string;
  scheduledDate: string;
  administeredDate?: string | null;
  administeredBy?: string | null;
  location?: string | null;
  batchNumber?: string | null;
  notes?: string | null;
  sideEffectsOccurred?: string[];
  status: 'pending' | 'scheduled' | 'overdue' | 'completed' | 'missed';
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

export interface DashboardAppointment {
  id: string;
  childId: string;
  childName: string;
  dateTime: string;
  type: string;
  status: string;
  title: string;
  location: string;
}

export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  date: string;
  childId: string;
  childName: string;
}

export interface DashboardHighRiskPregnancy {
  id: string;
  motherName: string;
  currentWeek: number | null;
  riskFactors: string[];
  expectedDeliveryDate: string | null;
  nextCheckupDate: string | null;
}

export interface DashboardOverdueVaccination {
  childId: string;
  childName: string;
  childAge: string;
  vaccineId: string;
  vaccineName: string;
  scheduledDate: string;
  daysOverdue: number;
  parentPhone?: string | null;
}

export interface DashboardResponse {
  stats: DashboardStats;
  todayAppointments: DashboardAppointment[];
  recentActivities: DashboardActivity[];
  highRiskPregnancies: DashboardHighRiskPregnancy[];
  overdueVaccinations: DashboardOverdueVaccination[];
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
