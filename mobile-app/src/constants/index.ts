/**
 * Application Constants
 * 
 * Contains all constant values used throughout the application including
 * colors, spacing, vaccination schedules, and configuration values.
 */

// ============================================================================
// THEME & COLORS
// ============================================================================

export const COLORS = {
  // Primary colors (based on UI screenshots - pink/rose theme)
  primary: '#E91E63',
  primaryLight: '#FCE4EC',
  primaryDark: '#C2185B',
  
  // Secondary colors
  secondary: '#4CAF50',
  secondaryLight: '#E8F5E9',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Background colors
  background: '#FFF5F7',
  backgroundSecondary: '#FFFFFF',
  
  // Text colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  
  // Vaccine status colors
  vaccineCompleted: '#4CAF50',
  vaccineDue: '#F44336',
  vaccineUpcoming: '#2196F3',
  
  // Chart colors
  chartPrimary: '#E91E63',
  chartSecondary: '#4CAF50',
  chartTertiary: '#2196F3',
};

// ============================================================================
// SPACING & SIZING
// ============================================================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
};

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ============================================================================
// SRI LANKA NATIONAL IMMUNIZATION SCHEDULE
// ============================================================================

/**
 * Official vaccination schedule as per Ministry of Health, Sri Lanka
 * Reference: National Immunization Programme
 */
export const VACCINATION_SCHEDULE = [
  // Birth vaccines
  { id: 'bcg', name: 'BCG', shortName: 'BCG', scheduledAgeMonths: 0, description: 'Bacillus Calmette-Guérin vaccine for tuberculosis protection' },
  { id: 'opv0', name: 'Oral Polio Vaccine (Birth dose)', shortName: 'OPV-0', scheduledAgeMonths: 0, description: 'First dose of oral polio vaccine' },
  { id: 'hepb0', name: 'Hepatitis B (Birth dose)', shortName: 'Hep B', scheduledAgeMonths: 0, description: 'Hepatitis B vaccine birth dose' },
  
  // 2 months vaccines
  { id: 'penta1', name: 'Pentavalent Vaccine (1st dose)', shortName: 'Pentavalent-1', scheduledAgeMonths: 2, description: 'DTP + Hep B + Hib combination vaccine' },
  { id: 'opv1', name: 'Oral Polio Vaccine (1st dose)', shortName: 'OPV-1', scheduledAgeMonths: 2, description: 'First dose of oral polio vaccine' },
  { id: 'pcv1', name: 'Pneumococcal Vaccine (1st dose)', shortName: 'PCV-1', scheduledAgeMonths: 2, description: 'Pneumococcal conjugate vaccine' },
  
  // 4 months vaccines
  { id: 'penta2', name: 'Pentavalent Vaccine (2nd dose)', shortName: 'Pentavalent-2', scheduledAgeMonths: 4, description: 'DTP + Hep B + Hib combination vaccine' },
  { id: 'opv2', name: 'Oral Polio Vaccine (2nd dose)', shortName: 'OPV-2', scheduledAgeMonths: 4, description: 'Second dose of oral polio vaccine' },
  { id: 'pcv2', name: 'Pneumococcal Vaccine (2nd dose)', shortName: 'PCV-2', scheduledAgeMonths: 4, description: 'Pneumococcal conjugate vaccine' },
  
  // 6 months vaccines
  { id: 'penta3', name: 'Pentavalent Vaccine (3rd dose)', shortName: 'Pentavalent-3', scheduledAgeMonths: 6, description: 'DTP + Hep B + Hib combination vaccine' },
  { id: 'opv3', name: 'Oral Polio Vaccine (3rd dose)', shortName: 'OPV-3', scheduledAgeMonths: 6, description: 'Third dose of oral polio vaccine' },
  { id: 'pcv3', name: 'Pneumococcal Vaccine (3rd dose)', shortName: 'PCV-3', scheduledAgeMonths: 6, description: 'Pneumococcal conjugate vaccine' },
  
  // 9 months vaccines
  { id: 'measles1', name: 'Measles Vaccine (1st dose)', shortName: 'Measles-1', scheduledAgeMonths: 9, description: 'First dose of measles vaccine' },
  
  // 12 months vaccines
  { id: 'mmr', name: 'MMR Vaccine', shortName: 'MMR', scheduledAgeMonths: 12, description: 'Measles, Mumps, Rubella combination vaccine' },
  { id: 'je', name: 'Japanese Encephalitis Vaccine', shortName: 'JE', scheduledAgeMonths: 12, description: 'Japanese Encephalitis vaccine' },
  
  // 18 months vaccines
  { id: 'dpt_booster', name: 'DPT Booster', shortName: 'DPT Booster', scheduledAgeMonths: 18, description: 'Diphtheria, Pertussis, Tetanus booster' },
  { id: 'opv_booster', name: 'OPV Booster', shortName: 'OPV Booster', scheduledAgeMonths: 18, description: 'Oral Polio Vaccine booster' },
  { id: 'measles2', name: 'Measles Vaccine (2nd dose)', shortName: 'Measles-2', scheduledAgeMonths: 18, description: 'Second dose of measles vaccine' },
];

// ============================================================================
// DEVELOPMENT MILESTONES (WHO Standards)
// ============================================================================

export const DEVELOPMENT_MILESTONES = [
  // Motor milestones
  { id: 'head_control', name: 'Head Control', description: 'Holds head steady when upright', expectedAgeMonths: 3, category: 'motor' },
  { id: 'rolling', name: 'Rolling Over', description: 'Rolls from tummy to back', expectedAgeMonths: 4, category: 'motor' },
  { id: 'sitting_support', name: 'Sitting with Support', description: 'Sits with support', expectedAgeMonths: 5, category: 'motor' },
  { id: 'sitting_alone', name: 'Sitting without Support', description: 'Sits without support', expectedAgeMonths: 6, category: 'motor' },
  { id: 'crawling', name: 'Crawling', description: 'Crawls on hands and knees', expectedAgeMonths: 8, category: 'motor' },
  { id: 'pulling_stand', name: 'Pulling to Stand', description: 'Pulls self to standing position', expectedAgeMonths: 9, category: 'motor' },
  { id: 'standing_alone', name: 'Standing Alone', description: 'Stands without support', expectedAgeMonths: 11, category: 'motor' },
  { id: 'walking', name: 'Walking', description: 'Takes first steps independently', expectedAgeMonths: 12, category: 'motor' },
  
  // Cognitive milestones
  { id: 'social_smile', name: 'Social Smile', description: 'Smiles in response to faces', expectedAgeMonths: 2, category: 'social' },
  { id: 'recognizes_parents', name: 'Recognizes Parents', description: 'Shows recognition of familiar faces', expectedAgeMonths: 3, category: 'cognitive' },
  { id: 'object_permanence', name: 'Object Permanence', description: 'Looks for hidden objects', expectedAgeMonths: 8, category: 'cognitive' },
  
  // Language milestones
  { id: 'cooing', name: 'Cooing', description: 'Makes cooing sounds', expectedAgeMonths: 2, category: 'language' },
  { id: 'babbling', name: 'Babbling', description: 'Babbles with expression', expectedAgeMonths: 6, category: 'language' },
  { id: 'first_words', name: 'First Words', description: 'Says first meaningful words', expectedAgeMonths: 12, category: 'language' },
  
  // Dental milestones
  { id: 'first_tooth', name: 'First Tooth Appeared', description: 'First tooth eruption', expectedAgeMonths: 7, category: 'motor' },
];

// ============================================================================
// FEEDING GUIDELINES (Ministry of Health, Sri Lanka)
// ============================================================================

export const FEEDING_GUIDELINES = [
  {
    id: 'feeding_0_5',
    ageRange: { minMonths: 0, maxMonths: 5, label: '0-5 months' },
    texture: 'Exclusive breastfeeding only. No water, other liquids or foods are needed.',
    frequency: 'Breastfeed on demand, at least 8-12 times in 24 hours including night feeds. Let baby finish one breast before switching.',
    amountPerMeal: 'Allow baby to feed until satisfied. Newborns feed 8-12 times daily, gradually reducing to 6-8 times by 4-5 months.',
    tips: [
      'Initiate breastfeeding within 1 hour of birth (early initiation)',
      'Feed colostrum (first yellowish milk) - it is rich in antibodies and nutrients',
      'Practice skin-to-skin contact to promote bonding and milk production',
      'No water, honey, gripe water or any other liquids needed - breast milk provides complete nutrition',
      'Look for hunger cues: rooting, sucking fingers, fussiness. Crying is a late hunger sign',
      'Ensure proper latch: baby\'s mouth covers most of the areola, not just the nipple',
    ],
    illnessFeeding: [
      'Continue breastfeeding more frequently during illness',
      'Breast milk provides antibodies to help fight infection',
      'If baby has difficulty feeding, express milk and feed with a clean cup or spoon',
      'Keep baby hydrated with frequent breastfeeds',
      'Seek medical attention if baby refuses to feed or shows signs of dehydration',
    ],
    examples: ['Breast milk only', 'No supplementary foods or water'],
  },
  {
    id: 'feeding_6_8',
    ageRange: { minMonths: 6, maxMonths: 8, label: '6-8 months' },
    texture: 'Well mashed foods. Start with mashed rice. Continue introducing mashed foods.',
    frequency: '2-3 main meals per day plus frequent breast feeds. Depending on child\'s appetite one or two snacks may be offered.',
    amountPerMeal: 'Start with 2-3 teaspoonfuls per feed, increasing gradually to a little more than ½ a cup of a 200 ml cup (tea cup).',
    tips: [
      'Feed infants directly; let older children feed themselves and assist when needed',
      'Feed slowly and patiently; encourage children to eat but never force feed',
      'If children refuse many foods, experiment with different food combinations, tastes, textures and methods of encouragement',
      'Minimize distraction during meals',
      'Talk to children lovingly during feeding, keep eye to eye contact and try and make meal times interesting to the child',
    ],
    illnessFeeding: [
      'Offer foods that the child likes, in small amounts and frequently',
      'Ensure intake of variety of nutrient rich foods with continued breastfeeding',
      'Use energy dense foods – oil, thick coconut milk to improve taste and aroma',
      'Give extra food during convalescence to help quick recovery',
      'Continue extra feeding for some time after recovery to aid catch-up growth',
    ],
    examples: ['Mashed rice with dhal', 'Mashed banana', 'Well-cooked vegetables'],
  },
  {
    id: 'feeding_9_11',
    ageRange: { minMonths: 9, maxMonths: 11, label: '9-11 months' },
    texture: 'Finely chopped or mashed foods. Include finger foods.',
    frequency: '3-4 meals per day plus breast feeds. 1-2 snacks may be offered.',
    amountPerMeal: 'Gradually increase to ½ to ¾ of a 200 ml cup per meal.',
    tips: [
      'Introduce finger foods to encourage self-feeding',
      'Offer variety of foods from all food groups',
      'Continue breastfeeding on demand',
      'Be patient with messy eating – it\'s part of learning',
    ],
    illnessFeeding: [
      'Increase fluid intake',
      'Continue breastfeeding more frequently',
      'Offer favorite foods in small amounts',
      'Resume normal feeding as appetite returns',
    ],
    examples: ['Soft rice with curry', 'Chopped fruits', 'Soft bread pieces'],
  },
  {
    id: 'feeding_12_23',
    ageRange: { minMonths: 12, maxMonths: 23, label: '12-23 months' },
    texture: 'Family foods, chopped or mashed if needed. Child can eat most foods.',
    frequency: '3-4 meals plus 1-2 nutritious snacks per day.',
    amountPerMeal: '¾ to 1 cup (200 ml cup) per meal.',
    tips: [
      'Include child in family meals',
      'Offer variety from all food groups daily',
      'Avoid added sugar and salt',
      'Continue breastfeeding if possible',
      'Establish regular meal times',
    ],
    illnessFeeding: [
      'Give plenty of fluids including oral rehydration solution if diarrhea',
      'Continue feeding even if appetite is reduced',
      'Offer extra meals during recovery',
    ],
    examples: ['Rice with vegetables and fish', 'Egg dishes', 'Fruits', 'Milk-based foods'],
  },
];

// ============================================================================
// HEALTH TIPS DATABASE
// ============================================================================

export const HEALTH_TIPS = [
  {
    id: 'tip_1',
    title: 'Daily Health Tip',
    content: 'At 8 months, your baby should be eating finger foods. Try soft fruits like banana pieces and well-cooked vegetables. Continue breastfeeding alongside complementary foods.',
    ageRangeMin: 6,
    ageRangeMax: 12,
    source: 'Ministry of Health, Sri Lanka',
    category: 'nutrition',
  },
  {
    id: 'tip_2',
    title: 'Development Tip',
    content: 'Encourage tummy time to strengthen your baby\'s neck and shoulder muscles. This helps prepare them for crawling.',
    ageRangeMin: 0,
    ageRangeMax: 6,
    source: 'Ministry of Health, Sri Lanka',
    category: 'development',
  },
  {
    id: 'tip_3',
    title: 'Safety Reminder',
    content: 'Always supervise your baby during feeding to prevent choking. Cut food into small pieces appropriate for their age.',
    ageRangeMin: 6,
    ageRangeMax: 24,
    source: 'Ministry of Health, Sri Lanka',
    category: 'safety',
  },
  {
    id: 'tip_4',
    title: 'Hygiene Tip',
    content: 'Wash your hands before preparing food and feeding your baby. Keep feeding utensils clean to prevent infections.',
    ageRangeMin: 0,
    ageRangeMax: 24,
    source: 'Ministry of Health, Sri Lanka',
    category: 'hygiene',
  },
];

// ============================================================================
// API & SYNC CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  // TODO: Replace with actual backend URL
  baseUrl: 'http://localhost:3000/api',
  timeout: 30000,
  retryAttempts: 3,
  syncInterval: 300000, // 5 minutes
};

// ============================================================================
// APP CONFIGURATION
// ============================================================================

export const APP_CONFIG = {
  appName: 'Child Health',
  version: '1.0.0',
  supportEmail: 'support@childhealth.lk',
  defaultLanguage: 'en' as const,
  supportedLanguages: ['en', 'si', 'ta'] as const,
};
