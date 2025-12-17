/**
 * Date Utility Functions
 * 
 * Helper functions for date formatting, calculations, and display.
 */

import { 
  format, 
  formatDistanceToNow, 
  differenceInDays, 
  differenceInMonths, 
  differenceInYears,
  addDays,
  addMonths,
  isAfter,
  isBefore,
  isToday,
  parseISO,
} from 'date-fns';

/**
 * Format date for display
 */
export const formatDate = (date: Date | string, formatStr: string = 'MMM d, yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Format date with time
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM d, yyyy h:mm a');
};

/**
 * Get relative time (e.g., "2 days ago")
 */
export const getRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

/**
 * Calculate age from birthdate
 */
export const calculateAge = (birthDate: Date | string): {
  years: number;
  months: number;
  days: number;
  totalMonths: number;
  displayText: string;
} => {
  const dateObj = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
  const now = new Date();
  
  const years = differenceInYears(now, dateObj);
  const months = differenceInMonths(now, dateObj) % 12;
  const totalMonths = differenceInMonths(now, dateObj);
  
  // Calculate remaining days
  const lastMonthDate = addMonths(dateObj, totalMonths);
  const days = differenceInDays(now, lastMonthDate);
  
  // Create display text
  let displayText = '';
  if (years > 0) {
    displayText = `${years} year${years !== 1 ? 's' : ''}`;
    if (months > 0) {
      displayText += `, ${months} month${months !== 1 ? 's' : ''}`;
    }
  } else if (totalMonths > 0) {
    displayText = `${totalMonths} month${totalMonths !== 1 ? 's' : ''}`;
    if (days > 0) {
      displayText += `, ${days} day${days !== 1 ? 's' : ''}`;
    }
  } else {
    displayText = `${days} day${days !== 1 ? 's' : ''}`;
  }
  
  return { years, months, days, totalMonths, displayText };
};

/**
 * Get age in months from birthdate
 */
export const getAgeInMonths = (birthDate: Date | string): number => {
  const dateObj = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
  return differenceInMonths(new Date(), dateObj);
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(dateObj, new Date());
};

/**
 * Check if a date is in the future
 */
export const isFutureDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(dateObj, new Date());
};

/**
 * Check if date is today
 */
export const isTodayDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isToday(dateObj);
};

/**
 * Get days until date
 */
export const getDaysUntil = (date: Date | string): number => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(dateObj, new Date());
};

/**
 * Get days since date
 */
export const getDaysSince = (date: Date | string): number => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(new Date(), dateObj);
};

/**
 * Add days to a date
 */
export const addDaysToDate = (date: Date | string, days: number): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addDays(dateObj, days);
};

/**
 * Add months to a date
 */
export const addMonthsToDate = (date: Date | string, months: number): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addMonths(dateObj, months);
};

/**
 * Get month name from date
 */
export const getMonthName = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMMM');
};

/**
 * Format birthdate for display
 */
export const formatBirthDate = (date: Date | string): string => {
  return formatDate(date, 'MMMM d, yyyy');
};

/**
 * Get age category for feeding guidelines
 */
export const getAgeCategoryForFeeding = (ageInMonths: number): string => {
  if (ageInMonths < 6) return 'exclusive_breastfeeding';
  if (ageInMonths < 9) return '6-8 months';
  if (ageInMonths < 12) return '9-11 months';
  return '12-23 months';
};

/**
 * Check if vaccination is due based on schedule
 */
export const isVaccinationDue = (
  birthDate: Date | string, 
  scheduledAgeInMonths: number, 
  gracePeriodDays: number = 14
): boolean => {
  const dateObj = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
  const dueDate = addMonths(dateObj, scheduledAgeInMonths);
  const dueDateWithGrace = addDays(dueDate, gracePeriodDays);
  
  const now = new Date();
  return isAfter(now, dueDate) && isBefore(now, dueDateWithGrace);
};

/**
 * Get vaccination status based on date
 */
export const getVaccinationStatus = (
  birthDate: Date | string,
  scheduledAgeInMonths: number,
  completedDate?: Date | string | null
): 'completed' | 'due' | 'overdue' | 'upcoming' => {
  if (completedDate) return 'completed';
  
  const dateObj = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
  const dueDate = addMonths(dateObj, scheduledAgeInMonths);
  const now = new Date();
  
  if (isAfter(now, addDays(dueDate, 30))) return 'overdue';
  if (isAfter(now, dueDate)) return 'due';
  if (differenceInDays(dueDate, now) <= 14) return 'due';
  
  return 'upcoming';
};

export default {
  formatDate,
  formatDateTime,
  getRelativeTime,
  calculateAge,
  getAgeInMonths,
  isPastDate,
  isFutureDate,
  isTodayDate,
  getDaysUntil,
  getDaysSince,
  addDaysToDate,
  addMonthsToDate,
  getMonthName,
  formatBirthDate,
  getAgeCategoryForFeeding,
  isVaccinationDue,
  getVaccinationStatus,
};
