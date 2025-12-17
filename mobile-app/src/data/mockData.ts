/**
 * Mock Data for Development
 * 
 * Contains sample data for testing and development purposes.
 * This data simulates what would be returned from the backend API.
 */

import {
  ChildProfile,
  Vaccine,
  GrowthMeasurement,
  Appointment,
  Activity,
  EmergencyContact,
  HealthTip,
  DevelopmentMilestone,
} from '../types';

// ============================================================================
// MOCK CHILD PROFILE
// ============================================================================

export const mockChildProfile: ChildProfile = {
  id: 'child-001',
  chdrNumber: 'CHD/2024/001234',
  
  // Personal Information
  firstName: 'Amara',
  lastName: 'Perera',
  dateOfBirth: '2024-04-15',
  gender: 'female',
  photoUri: undefined, // Would be a local file URI in real app
  
  // Birth Information
  birthWeight: 3.2,
  birthHeight: 50,
  birthHeadCircumference: 34,
  bloodType: 'O+',
  placeOfBirth: 'Castle Street Hospital, Colombo',
  deliveryType: 'normal',
  
  // Medical Information
  allergies: [],
  specialConditions: [],
  
  // Family Information
  motherName: 'Sanduni Perera',
  fatherName: 'Kasun Perera',
  emergencyContact: '+94 77 123 4567',
  address: '123 Galle Road, Colombo 03',
  
  // Healthcare Providers
  assignedMidwife: {
    id: 'midwife-001',
    name: 'Midwife Kamala Jayawardena',
    role: 'midwife',
    phone: '+94 71 987 6543',
    clinic: 'Colombo MOH Office',
  },
  pediatrician: {
    id: 'doctor-001',
    name: 'Dr. Nimal Silva',
    role: 'pediatrician',
    phone: '+94 77 123 4567',
    clinic: 'Asiri Hospital Colombo',
  },
  
  // Metadata
  createdAt: '2024-04-15T10:00:00Z',
  updatedAt: '2024-12-15T14:30:00Z',
  syncStatus: 'synced',
};

// ============================================================================
// MOCK VACCINES
// ============================================================================

export const mockVaccines: Vaccine[] = [
  // Birth vaccines - Completed
  {
    id: 'vax-001',
    name: 'BCG',
    shortName: 'BCG',
    scheduledAgeMonths: 0,
    scheduledDate: '2024-04-15',
    administeredDate: '2024-04-15',
    status: 'completed',
    batchNumber: 'BCG-2024-001',
    administeredBy: 'Dr. Silva',
    location: 'Castle Street Hospital',
    syncStatus: 'synced',
  },
  {
    id: 'vax-002',
    name: 'Oral Polio Vaccine (Birth dose)',
    shortName: 'OPV-0',
    scheduledAgeMonths: 0,
    scheduledDate: '2024-04-15',
    administeredDate: '2024-04-15',
    status: 'completed',
    syncStatus: 'synced',
  },
  {
    id: 'vax-003',
    name: 'Hepatitis B (Birth dose)',
    shortName: 'Hep B',
    scheduledAgeMonths: 0,
    scheduledDate: '2024-04-15',
    administeredDate: '2024-04-15',
    status: 'completed',
    syncStatus: 'synced',
  },
  
  // 2 months vaccines - Completed
  {
    id: 'vax-004',
    name: 'Pentavalent Vaccine (1st dose)',
    shortName: 'Pentavalent-1',
    scheduledAgeMonths: 2,
    scheduledDate: '2024-06-15',
    administeredDate: '2024-06-15',
    status: 'completed',
    syncStatus: 'synced',
  },
  {
    id: 'vax-005',
    name: 'Oral Polio Vaccine (1st dose)',
    shortName: 'OPV-1',
    scheduledAgeMonths: 2,
    scheduledDate: '2024-06-15',
    administeredDate: '2024-06-15',
    status: 'completed',
    syncStatus: 'synced',
  },
  {
    id: 'vax-006',
    name: 'Pneumococcal Vaccine (1st dose)',
    shortName: 'PCV-1',
    scheduledAgeMonths: 2,
    scheduledDate: '2024-06-15',
    administeredDate: '2024-06-15',
    status: 'completed',
    syncStatus: 'synced',
  },
  
  // 4 months vaccines - Completed
  {
    id: 'vax-007',
    name: 'Pentavalent Vaccine (2nd dose)',
    shortName: 'Pentavalent-2',
    scheduledAgeMonths: 4,
    scheduledDate: '2024-08-15',
    administeredDate: '2024-08-15',
    status: 'completed',
    syncStatus: 'synced',
  },
  {
    id: 'vax-008',
    name: 'Oral Polio Vaccine (2nd dose)',
    shortName: 'OPV-2',
    scheduledAgeMonths: 4,
    scheduledDate: '2024-08-15',
    administeredDate: '2024-08-15',
    status: 'completed',
    syncStatus: 'synced',
  },
  {
    id: 'vax-009',
    name: 'Pneumococcal Vaccine (2nd dose)',
    shortName: 'PCV-2',
    scheduledAgeMonths: 4,
    scheduledDate: '2024-08-15',
    administeredDate: '2024-08-15',
    status: 'completed',
    syncStatus: 'synced',
  },
  
  // 6 months vaccines - Completed
  {
    id: 'vax-010',
    name: 'Pentavalent Vaccine (3rd dose)',
    shortName: 'Pentavalent-3',
    scheduledAgeMonths: 6,
    scheduledDate: '2024-10-15',
    administeredDate: '2024-10-15',
    status: 'completed',
    syncStatus: 'synced',
  },
  {
    id: 'vax-011',
    name: 'Oral Polio Vaccine (3rd dose)',
    shortName: 'OPV-3',
    scheduledAgeMonths: 6,
    scheduledDate: '2024-10-15',
    administeredDate: '2024-10-15',
    status: 'completed',
    syncStatus: 'synced',
  },
  {
    id: 'vax-012',
    name: 'Pneumococcal Vaccine (3rd dose)',
    shortName: 'PCV-3',
    scheduledAgeMonths: 6,
    scheduledDate: '2024-10-15',
    administeredDate: '2024-12-01',
    status: 'completed',
    syncStatus: 'synced',
  },
  
  // 9 months vaccines - Due
  {
    id: 'vax-013',
    name: 'Measles Vaccine (1st dose)',
    shortName: 'Measles-1',
    scheduledAgeMonths: 9,
    scheduledDate: '2025-01-15',
    status: 'due',
    syncStatus: 'synced',
  },
  
  // 12 months vaccines - Upcoming
  {
    id: 'vax-014',
    name: 'MMR Vaccine',
    shortName: 'MMR',
    scheduledAgeMonths: 12,
    scheduledDate: '2025-04-15',
    status: 'upcoming',
    syncStatus: 'synced',
  },
  {
    id: 'vax-015',
    name: 'Japanese Encephalitis Vaccine',
    shortName: 'JE',
    scheduledAgeMonths: 12,
    scheduledDate: '2025-04-15',
    status: 'upcoming',
    syncStatus: 'synced',
  },
  
  // 18 months vaccines - Upcoming
  {
    id: 'vax-016',
    name: 'DPT Booster',
    shortName: 'DPT Booster',
    scheduledAgeMonths: 18,
    scheduledDate: '2025-10-15',
    status: 'upcoming',
    syncStatus: 'synced',
  },
  {
    id: 'vax-017',
    name: 'OPV Booster',
    shortName: 'OPV Booster',
    scheduledAgeMonths: 18,
    scheduledDate: '2025-10-15',
    status: 'upcoming',
    syncStatus: 'synced',
  },
  {
    id: 'vax-018',
    name: 'Measles Vaccine (2nd dose)',
    shortName: 'Measles-2',
    scheduledAgeMonths: 18,
    scheduledDate: '2025-10-15',
    status: 'upcoming',
    syncStatus: 'synced',
  },
];

// ============================================================================
// MOCK GROWTH MEASUREMENTS
// ============================================================================

export const mockGrowthMeasurements: GrowthMeasurement[] = [
  {
    id: 'growth-001',
    childId: 'child-001',
    date: '2024-04-15',
    ageInMonths: 0,
    weight: 3.2,
    height: 50,
    headCircumference: 34,
    weightPercentile: 50,
    heightPercentile: 55,
    headCircumferencePercentile: 52,
    syncStatus: 'synced',
  },
  {
    id: 'growth-002',
    childId: 'child-001',
    date: '2024-05-15',
    ageInMonths: 1,
    weight: 4.1,
    height: 54,
    headCircumference: 37,
    weightPercentile: 55,
    heightPercentile: 60,
    headCircumferencePercentile: 55,
    syncStatus: 'synced',
  },
  {
    id: 'growth-003',
    childId: 'child-001',
    date: '2024-06-15',
    ageInMonths: 2,
    weight: 5.0,
    height: 57,
    headCircumference: 39,
    weightPercentile: 58,
    heightPercentile: 62,
    headCircumferencePercentile: 58,
    syncStatus: 'synced',
  },
  {
    id: 'growth-004',
    childId: 'child-001',
    date: '2024-07-15',
    ageInMonths: 3,
    weight: 5.7,
    height: 60,
    headCircumference: 40,
    weightPercentile: 60,
    heightPercentile: 65,
    headCircumferencePercentile: 60,
    syncStatus: 'synced',
  },
  {
    id: 'growth-005',
    childId: 'child-001',
    date: '2024-08-15',
    ageInMonths: 4,
    weight: 6.2,
    height: 62,
    headCircumference: 41,
    weightPercentile: 62,
    heightPercentile: 68,
    headCircumferencePercentile: 60,
    syncStatus: 'synced',
  },
  {
    id: 'growth-006',
    childId: 'child-001',
    date: '2024-09-15',
    ageInMonths: 5,
    weight: 6.6,
    height: 64,
    headCircumference: 42,
    weightPercentile: 63,
    heightPercentile: 68,
    headCircumferencePercentile: 60,
    syncStatus: 'synced',
  },
  {
    id: 'growth-007',
    childId: 'child-001',
    date: '2024-10-15',
    ageInMonths: 6,
    weight: 6.9,
    height: 65,
    headCircumference: 43,
    weightPercentile: 64,
    heightPercentile: 69,
    headCircumferencePercentile: 60,
    syncStatus: 'synced',
  },
  {
    id: 'growth-008',
    childId: 'child-001',
    date: '2024-11-15',
    ageInMonths: 7,
    weight: 7.1,
    height: 67,
    headCircumference: 43.5,
    weightPercentile: 65,
    heightPercentile: 70,
    headCircumferencePercentile: 60,
    syncStatus: 'synced',
  },
  {
    id: 'growth-009',
    childId: 'child-001',
    date: '2024-12-15',
    ageInMonths: 8,
    weight: 7.2,
    height: 68,
    headCircumference: 44,
    weightPercentile: 65,
    heightPercentile: 70,
    headCircumferencePercentile: 60,
    syncStatus: 'synced',
  },
];

// ============================================================================
// MOCK DEVELOPMENT MILESTONES
// ============================================================================

export const mockMilestones: DevelopmentMilestone[] = [
  {
    id: 'milestone-001',
    name: 'Social Smile',
    description: 'Smiles in response to faces',
    expectedAgeMonths: 2,
    category: 'social',
    achievedDate: '2024-06-10',
    status: 'achieved',
  },
  {
    id: 'milestone-002',
    name: 'Head Control',
    description: 'Holds head steady when upright',
    expectedAgeMonths: 3,
    category: 'motor',
    achievedDate: '2024-07-20',
    status: 'achieved',
  },
  {
    id: 'milestone-003',
    name: 'Rolling Over',
    description: 'Rolls from tummy to back',
    expectedAgeMonths: 4,
    category: 'motor',
    achievedDate: '2024-08-25',
    status: 'achieved',
  },
  {
    id: 'milestone-004',
    name: 'Sitting without Support',
    description: 'Sits without support',
    expectedAgeMonths: 6,
    category: 'motor',
    achievedDate: '2024-10-20',
    status: 'achieved',
  },
  {
    id: 'milestone-005',
    name: 'First Tooth Appeared',
    description: 'First tooth eruption',
    expectedAgeMonths: 7,
    category: 'motor',
    achievedDate: '2024-11-10',
    status: 'achieved',
  },
  {
    id: 'milestone-006',
    name: 'Crawling',
    description: 'Crawls on hands and knees',
    expectedAgeMonths: 8,
    category: 'motor',
    status: 'expected',
  },
  {
    id: 'milestone-007',
    name: 'Pulling to Stand',
    description: 'Pulls self to standing position',
    expectedAgeMonths: 9,
    category: 'motor',
    status: 'expected',
  },
];

// ============================================================================
// MOCK APPOINTMENTS
// ============================================================================

export const mockAppointments: Appointment[] = [
  {
    id: 'apt-001',
    childId: 'child-001',
    title: 'Measles-1 Vaccination',
    type: 'vaccination',
    dateTime: '2025-01-15T10:00:00',
    location: 'Colombo MOH Clinic',
    address: '123 Galle Road, Colombo 03',
    provider: {
      id: 'midwife-001',
      name: 'Midwife Kamala Jayawardena',
      role: 'midwife',
      phone: '+94 71 987 6543',
    },
    status: 'scheduled',
    notes: 'Bring CHDR book and previous vaccination records',
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    syncStatus: 'synced',
  },
  {
    id: 'apt-002',
    childId: 'child-001',
    title: '9-Month Development Check',
    type: 'development_check',
    dateTime: '2025-01-20T14:30:00',
    location: 'Asiri Hospital Colombo',
    address: '181 Kirula Road, Colombo 05',
    provider: {
      id: 'doctor-001',
      name: 'Dr. Nimal Silva',
      role: 'pediatrician',
      phone: '+94 77 123 4567',
    },
    status: 'scheduled',
    notes: 'Growth monitoring and milestone assessment',
    createdAt: '2024-12-05T10:00:00Z',
    updatedAt: '2024-12-05T10:00:00Z',
    syncStatus: 'synced',
  },
  {
    id: 'apt-003',
    childId: 'child-001',
    title: 'Monthly Weight Check',
    type: 'growth_check',
    dateTime: '2025-02-01T09:00:00',
    location: 'Field Weighing Post - Nugegoda',
    address: 'Community Center, Nugegoda',
    provider: {
      id: 'chw-001',
      name: 'Community Health Worker',
      role: 'nurse',
      phone: '+94 70 555 1234',
    },
    status: 'scheduled',
    notes: 'Regular growth monitoring session',
    createdAt: '2024-12-10T10:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
    syncStatus: 'synced',
  },
  // Past appointments
  {
    id: 'apt-004',
    childId: 'child-001',
    title: 'PCV-3 Vaccination',
    type: 'vaccination',
    dateTime: '2024-12-01T10:00:00',
    location: 'Colombo MOH Clinic',
    address: '123 Galle Road, Colombo 03',
    provider: {
      id: 'midwife-001',
      name: 'Midwife Kamala Jayawardena',
      role: 'midwife',
      phone: '+94 71 987 6543',
    },
    status: 'completed',
    createdAt: '2024-11-15T10:00:00Z',
    updatedAt: '2024-12-01T11:00:00Z',
    syncStatus: 'synced',
  },
  {
    id: 'apt-005',
    childId: 'child-001',
    title: '6-Month Health Checkup',
    type: 'general_checkup',
    dateTime: '2024-10-20T14:00:00',
    location: 'Asiri Hospital Colombo',
    address: '181 Kirula Road, Colombo 05',
    provider: {
      id: 'doctor-001',
      name: 'Dr. Nimal Silva',
      role: 'pediatrician',
      phone: '+94 77 123 4567',
    },
    status: 'completed',
    createdAt: '2024-10-01T10:00:00Z',
    updatedAt: '2024-10-20T15:00:00Z',
    syncStatus: 'synced',
  },
];

// ============================================================================
// MOCK RECENT ACTIVITIES
// ============================================================================

export const mockActivities: Activity[] = [
  {
    id: 'activity-001',
    type: 'vaccination',
    title: 'PCV-3 Vaccination Completed',
    description: 'Third dose of Pneumococcal vaccine administered',
    date: '2024-12-01',
    icon: 'vaccine',
  },
  {
    id: 'activity-002',
    type: 'growth',
    title: 'Monthly Growth Recorded',
    description: 'Weight: 7.2 kg, Height: 68 cm',
    date: '2024-12-15',
    icon: 'growth',
  },
  {
    id: 'activity-003',
    type: 'milestone',
    title: 'First Tooth Milestone Achieved',
    description: 'Baby\'s first tooth appeared',
    date: '2024-11-10',
    icon: 'milestone',
  },
  {
    id: 'activity-004',
    type: 'checkup',
    title: '6-Month Health Checkup',
    description: 'Regular checkup completed at Asiri Hospital',
    date: '2024-10-20',
    icon: 'checkup',
  },
];

// ============================================================================
// MOCK EMERGENCY CONTACTS
// ============================================================================

export const mockEmergencyContacts: EmergencyContact[] = [
  {
    id: 'emergency-001',
    name: 'Dr. Nimal Silva',
    role: 'Pediatrician',
    phone: '+94 77 123 4567',
    isPrimary: true,
  },
  {
    id: 'emergency-002',
    name: 'Midwife Kamala',
    role: 'Community Midwife',
    phone: '+94 71 987 6543',
  },
  {
    id: 'emergency-003',
    name: 'Emergency Services',
    role: 'Ambulance',
    phone: '1990',
  },
];

// ============================================================================
// MOCK HEALTH TIP
// ============================================================================

export const mockHealthTip: HealthTip = {
  id: 'tip-001',
  title: 'Daily Health Tip',
  content: 'At 8 months, your baby should be eating finger foods. Try soft fruits like banana pieces and well-cooked vegetables. Continue breastfeeding alongside complementary foods.',
  ageRangeMin: 6,
  ageRangeMax: 12,
  source: 'Ministry of Health, Sri Lanka',
  category: 'nutrition',
};
