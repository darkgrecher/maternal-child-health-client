/**
 * Type Definitions for Midwife Web Application
 */

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: 'midwife' | 'admin' | 'supervisor';
  employeeId?: string;
  district?: string;
  area?: string;
  phone?: string;
  licenseNumber?: string;
  facilityName?: string;
  region?: string;
  picture?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MidwifeNotificationPreferences {
  appointments: boolean;
  vaccinations: boolean;
  highRisk: boolean;
  dailyDigest: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface MidwifePreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  dateFormat: string;
  notifications: MidwifeNotificationPreferences;
}

export interface MidwifeProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: 'midwife' | 'admin' | 'supervisor';
  licenseNumber: string | null;
  facilityName: string | null;
  region: string | null;
  picture: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface MidwifeStats {
  patientsManaged: number;
  appointmentsThisMonth: number;
  vaccinationsAdministered: number;
}

export interface MidwifeSettingsResponse {
  profile: MidwifeProfile;
  preferences: MidwifePreferences;
  stats: MidwifeStats;
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

// ============================================================================
// ADMIN ANALYTICS TYPES
// ============================================================================

export interface AnalyticsRange {
  label: string;
  start: string;
  end: string;
  days: number;
}

export interface AnalyticsSummary {
  totalUsers: number;
  totalMidwives: number;
  totalChildren: number;
  totalPregnancies: number;
  activePregnancies: number;
  highRiskPregnancies: number;
  overdueVaccinations: number;
  appointmentsInRange: number;
  vaccinationsInRange: number;
}

export interface AnalyticsTrend {
  current: number;
  previous: number;
  changePercent: number | null;
  direction: 'up' | 'down' | 'flat';
}

export interface AnalyticsSeries {
  labels: string[];
  newUsers: number[];
  newChildren: number[];
  newPregnancies: number[];
  appointments: number[];
  vaccinations: number[];
}

export interface AnalyticsRegionStat {
  region: string;
  midwives: number;
  children: number;
  pregnancies: number;
}

export interface AnalyticsVaccinationStatus {
  status: string;
  count: number;
}

export interface AnalyticsRecentActivity {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  date: string;
  childId: string;
  childName: string;
}

export interface AdminAnalyticsResponse {
  range: AnalyticsRange;
  summary: AnalyticsSummary;
  trends: {
    newUsers: AnalyticsTrend;
    newMidwives: AnalyticsTrend;
    newChildren: AnalyticsTrend;
    newPregnancies: AnalyticsTrend;
    appointments: AnalyticsTrend;
    vaccinations: AnalyticsTrend;
  };
  series: AnalyticsSeries;
  regionStats: AnalyticsRegionStat[];
  vaccinationStatus: AnalyticsVaccinationStatus[];
  recentActivities: AnalyticsRecentActivity[];
}

// ============================================================================
// ADMIN DISTRICTS TYPES
// ============================================================================

export interface AdminDistrictSummary {
  name: string;
  midwives: number;
  children: number;
  pregnancies: number;
}

export interface AdminDistrictMidwife {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  licenseNumber: string | null;
  facilityName: string | null;
  region: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminDistrictsResponse {
  districts: AdminDistrictSummary[];
  midwives: AdminDistrictMidwife[];
}

// ============================================================================
// ADMIN LOGS TYPES
// ============================================================================

export type AdminLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type AdminLogActorType = 'system' | 'user' | 'midwife';

export interface AdminLogActor {
  type: AdminLogActorType;
  id?: string | null;
  name?: string | null;
  email?: string | null;
}

export interface AdminLogEntry {
  id: string;
  level: AdminLogLevel;
  source: string;
  event?: string | null;
  message: string;
  metadata?: Record<string, unknown> | null;
  actor: AdminLogActor;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AdminLogLevelSummary {
  level: AdminLogLevel;
  count: number;
}

export interface AdminLogActorSummary {
  actorType: AdminLogActorType;
  count: number;
}

export interface AdminLogsResponse {
  range: {
    label: string;
    start: string;
    end: string;
    days: number;
  };
  items: AdminLogEntry[];
  page: number;
  pageSize: number;
  total: number;
  levelSummary: AdminLogLevelSummary[];
  actorSummary: AdminLogActorSummary[];
}

// ============================================================================
// ADMIN ALERTS TYPES
// ============================================================================

export type AdminLinkNotificationType = 'mismatch' | 'unregistered';

export type AdminLinkProfileType = 'any' | 'child' | 'pregnancy';

export interface AdminLinkNotification {
  id: string;
  type: AdminLinkNotificationType;
  expectedProfileType: AdminLinkProfileType;
  scannedProfileType: AdminLinkProfileType;
  message: string;
  createdAt: string;
  isRead: boolean;
  midwife: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

export interface AdminAlertsResponse {
  range: {
    label: string;
    start: string;
    end: string;
    days: number;
  };
  system: {
    total: number;
    summary: {
      warningCount: number;
      errorCount: number;
    };
    items: AdminLogEntry[];
  };
  link: {
    total: number;
    summary: {
      mismatchCount: number;
      unregisteredCount: number;
    };
    items: AdminLinkNotification[];
  };
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
