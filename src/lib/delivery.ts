/**
 * Jordan Delivery Day Calculator Utility (Standard & Express Same-Day)
 */

export interface DeliveryEstimate {
  dayName: string;
  fullFormatted: string;
  isBeforeCutoff: boolean;
  isSameDay: boolean;
}

const ARABIC_DAYS: Record<number, string> = {
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

/**
 * Standard Delivery: Cutoff 4:00 PM (16:00), Includes inspection, No Friday delivery
 */
export function calculateDeliveryEstimate(currentDate: Date = new Date()): DeliveryEstimate {
  const day = currentDate.getDay();
  const hour = currentDate.getHours();
  const isBefore4PM = hour < 16;

  let estimatedDayIndex: number;

  switch (day) {
    case 0: estimatedDayIndex = isBefore4PM ? 1 : 2; break; // Sun -> Mon / Tue
    case 1: estimatedDayIndex = isBefore4PM ? 2 : 3; break; // Mon -> Tue / Wed
    case 2: estimatedDayIndex = isBefore4PM ? 3 : 4; break; // Tue -> Wed / Thu
    case 3: estimatedDayIndex = isBefore4PM ? 4 : 6; break; // Wed -> Thu / Sat
    case 4: estimatedDayIndex = 6; break;                   // Thu -> Sat
    case 5: estimatedDayIndex = 6; break;                   // Fri -> Sat
    case 6: estimatedDayIndex = isBefore4PM ? 0 : 1; break; // Sat -> Sun / Mon
    default: estimatedDayIndex = (day + 1) % 7;
  }

  const dayName = ARABIC_DAYS[estimatedDayIndex];

  return {
    dayName,
    fullFormatted: `يصلك يوم ${dayName}`,
    isBeforeCutoff: isBefore4PM,
    isSameDay: false,
  };
}

/**
 * Express Delivery: Cutoff 3:00 PM (15:00), Same-Day arrival if before 3 PM (except Friday), NO inspection
 */
export function calculateExpressDeliveryEstimate(currentDate: Date = new Date()): DeliveryEstimate {
  const day = currentDate.getDay();
  const hour = currentDate.getHours();
  const isBefore3PM = hour < 15;

  let estimatedDayIndex: number;
  let isSameDay = false;

  if (day === 5) {
    // Friday: Always arrives Saturday
    estimatedDayIndex = 6;
  } else if (isBefore3PM) {
    // Before 3 PM on Sun-Thu or Sat -> Same day arrival!
    estimatedDayIndex = day;
    isSameDay = true;
  } else {
    // After 3 PM -> Postponed to next available delivery day
    switch (day) {
      case 0: estimatedDayIndex = 1; break; // Sun 3+ PM -> Mon
      case 1: estimatedDayIndex = 2; break; // Mon 3+ PM -> Tue
      case 2: estimatedDayIndex = 3; break; // Tue 3+ PM -> Wed
      case 3: estimatedDayIndex = 4; break; // Wed 3+ PM -> Thu
      case 4: estimatedDayIndex = 6; break; // Thu 3+ PM -> Sat (skip Fri)
      case 6: estimatedDayIndex = 0; break; // Sat 3+ PM -> Sun
      default: estimatedDayIndex = (day + 1) % 7;
    }
  }

  const dayName = ARABIC_DAYS[estimatedDayIndex];

  return {
    dayName,
    fullFormatted: isSameDay ? 'يصلك اليوم بنفس اليوم ⚡' : `يصلك يوم ${dayName}`,
    isBeforeCutoff: isBefore3PM,
    isSameDay,
  };
}
