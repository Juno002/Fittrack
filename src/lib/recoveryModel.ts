import { differenceInHours, subDays } from 'date-fns';

import type {
  FoodEntry,
  MacroGoal,
  MuscleGroup,
  SleepLog,
  TrainingSchedule,
  UserProfile,
} from '@/store/types';

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

// evidence: acute muscle damage and performance impairment can linger for 3-5 days
export const ACUTE_FATIGUE_WINDOW_HOURS = 120;
// inference: neutral reference for bodyweight loading, centralized for future recalibration
export const REFERENCE_BODY_WEIGHT_KG = 70;
// inference: neutral starting point before systemic adjustments are applied
export const GLOBAL_READINESS_BASE = 75;
// ux: behavior gate for a normal training recommendation
export const READINESS_GATE_TRAIN = 65;
// ux: behavior gate for controlled-volume recommendations
export const READINESS_GATE_CONTROLLED = 45;
// ux: safer floor for guided rest presets and defaults
export const MIN_REST_DURATION_SECONDS = 45;
// ux: default that aligns better with hypertrophy-focused work than 60s
export const DEFAULT_REST_DURATION_SECONDS = 75;
// ux: upper guardrail for the current timer controls
export const MAX_REST_DURATION_SECONDS = 180;

export const RECOVERY_MUSCLE_GROUP_ORDER: MuscleGroup[] = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
];

export type ReadinessGate = 'train' | 'controlled' | 'recover';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface RollingSleepSummary {
  daysLogged: number;
  averageHours: number | null;
  averageQuality: number | null;
}

export interface NutritionAdequacySummary {
  isAvailable: boolean;
  daysLogged: number;
  calorieRatio: number | null;
  proteinRatio: number | null;
  carbsRatio: number | null;
  adjustment: number;
}

export interface SuggestedNutritionTargets {
  calories: number;
  macros: MacroGoal;
  proteinPerKg: number;
  activityFactor: number;
}

export function getReadinessGate(readiness: number): ReadinessGate {
  if (readiness >= READINESS_GATE_TRAIN) {
    return 'train';
  }

  if (readiness >= READINESS_GATE_CONTROLLED) {
    return 'controlled';
  }

  return 'recover';
}

export function clampRestDuration(seconds: number) {
  return clamp(Math.round(seconds), MIN_REST_DURATION_SECONDS, MAX_REST_DURATION_SECONDS);
}

export function getBodyweightLoadFactor(weightKg: number) {
  return clamp(weightKg / REFERENCE_BODY_WEIGHT_KG, 0.85, 1.25);
}

export function getRollingSleepSummary(
  sleepLogs: SleepLog[],
  referenceDate = new Date(),
  windowDays = 3,
): RollingSleepSummary {
  const recentLogs = sleepLogs.filter((log) => new Date(log.loggedAt) >= subDays(referenceDate, windowDays));
  if (recentLogs.length === 0) {
    return {
      daysLogged: 0,
      averageHours: null,
      averageQuality: null,
    };
  }

  const averageHours = recentLogs.reduce((total, log) => total + log.durationHours, 0) / recentLogs.length;
  const averageQuality = recentLogs.reduce((total, log) => total + log.qualityScore, 0) / recentLogs.length;

  return {
    daysLogged: recentLogs.length,
    averageHours,
    averageQuality,
  };
}

export function getSleepRecoveryPenaltyHours(sleepLogs: SleepLog[], referenceDate = new Date()) {
  const summary = getRollingSleepSummary(sleepLogs, referenceDate);
  if (summary.daysLogged === 0 || summary.averageHours === null || summary.averageQuality === null) {
    return 0;
  }

  const lowHours = summary.averageHours < 7;
  const lowQuality = summary.averageQuality < 70;

  if (lowHours && lowQuality) {
    return 24;
  }

  if (lowHours || lowQuality) {
    return 12;
  }

  return 0;
}

export function getSleepReadinessAdjustment(sleepLogs: SleepLog[], referenceDate = new Date()) {
  const summary = getRollingSleepSummary(sleepLogs, referenceDate);
  if (summary.daysLogged === 0 || summary.averageHours === null || summary.averageQuality === null) {
    return 0;
  }

  let adjustment = 0;

  if (summary.averageHours < 6) {
    adjustment -= 12;
  } else if (summary.averageHours < 7) {
    adjustment -= 6;
  } else if (summary.averageHours >= 9) {
    adjustment += 2;
  }

  if (summary.averageQuality < 55) {
    adjustment -= 8;
  } else if (summary.averageQuality < 70) {
    adjustment -= 4;
  } else if (summary.averageQuality >= 85) {
    adjustment += 3;
  }

  return adjustment;
}

export function getAgeRecoveryPenaltyHours(age: number) {
  if (age >= 50) {
    return 24;
  }

  if (age >= 40) {
    return 12;
  }

  return 0;
}

export function getAgeReadinessAdjustment(age: number) {
  if (age >= 50) {
    return -6;
  }

  if (age >= 40) {
    return -3;
  }

  return 0;
}

function getFoodWindowEntries(foods: FoodEntry[], referenceDate = new Date(), windowDays = 3) {
  const threshold = subDays(referenceDate, windowDays - 1);
  return foods.filter((entry) => new Date(entry.consumedAt) >= threshold);
}

export function getNutritionAdequacySummary({
  foods,
  calorieGoal,
  macroGoal,
  foodSignalEnabled,
  referenceDate = new Date(),
}: {
  foods: FoodEntry[];
  calorieGoal: number;
  macroGoal: MacroGoal;
  foodSignalEnabled: boolean;
  referenceDate?: Date;
}): NutritionAdequacySummary {
  if (!foodSignalEnabled) {
    return {
      isAvailable: false,
      daysLogged: 0,
      calorieRatio: null,
      proteinRatio: null,
      carbsRatio: null,
      adjustment: 0,
    };
  }

  const windowEntries = getFoodWindowEntries(foods, referenceDate);
  const dayKeys = Array.from(new Set(windowEntries.map((entry) => entry.dayKey)));
  if (dayKeys.length < 2) {
    return {
      isAvailable: false,
      daysLogged: dayKeys.length,
      calorieRatio: null,
      proteinRatio: null,
      carbsRatio: null,
      adjustment: 0,
    };
  }

  const totals = windowEntries.reduce(
    (summary, entry) => ({
      calories: summary.calories + entry.calories,
      protein: summary.protein + entry.protein,
      carbs: summary.carbs + entry.carbs,
    }),
    { calories: 0, protein: 0, carbs: 0 },
  );
  const averageCalories = totals.calories / dayKeys.length;
  const averageProtein = totals.protein / dayKeys.length;
  const averageCarbs = totals.carbs / dayKeys.length;

  const calorieRatio = calorieGoal > 0 ? averageCalories / calorieGoal : null;
  const proteinRatio = macroGoal.protein > 0 ? averageProtein / macroGoal.protein : null;
  const carbsRatio = macroGoal.carbs > 0 ? averageCarbs / macroGoal.carbs : null;

  let adjustment = 0;

  if (calorieRatio !== null) {
    if (calorieRatio < 0.7) {
      adjustment -= 8;
    } else if (calorieRatio < 0.85) {
      adjustment -= 4;
    } else if (calorieRatio > 1.1) {
      adjustment += 1;
    }
  }

  if (proteinRatio !== null) {
    if (proteinRatio < 0.7) {
      adjustment -= 8;
    } else if (proteinRatio < 0.9) {
      adjustment -= 4;
    }
  }

  if (carbsRatio !== null) {
    if (carbsRatio < 0.6) {
      adjustment -= 6;
    } else if (carbsRatio < 0.8) {
      adjustment -= 3;
    }
  }

  return {
    isAvailable: true,
    daysLogged: dayKeys.length,
    calorieRatio,
    proteinRatio,
    carbsRatio,
    adjustment: Math.min(2, adjustment),
  };
}

function roundToNearest(value: number, step: number) {
  return Math.round(value / step) * step;
}

export function getTrainingActivityFactor(trainingSchedule: TrainingSchedule) {
  const days = trainingSchedule.days.length;
  if (days >= 5) {
    return 1.65;
  }

  if (days >= 3) {
    return 1.5;
  }

  return 1.35;
}

export function getSuggestedNutritionTargets(
  profile: UserProfile,
  trainingSchedule: TrainingSchedule,
): SuggestedNutritionTargets {
  const activityFactor = getTrainingActivityFactor(trainingSchedule);
  const genderConstant = profile.gender === 'male' ? 5 : profile.gender === 'female' ? -161 : 0;
  const restingMetabolism = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + genderConstant;
  const calories = roundToNearest(Math.max(1200, restingMetabolism * activityFactor), 50);
  const proteinPerKg = profile.age >= 50 ? 2.2 : 2.0;
  const protein = roundToNearest(Math.max(60, profile.weight * proteinPerKg), 5);
  const fat = roundToNearest(Math.max(40, profile.weight * 0.8), 5);
  const proteinCalories = protein * 4;
  const fatCalories = fat * 9;
  const remainingCalories = Math.max(0, calories - proteinCalories - fatCalories);
  const carbs = roundToNearest(remainingCalories / 4, 5);

  return {
    calories,
    macros: {
      protein,
      carbs,
      fat,
    },
    proteinPerKg,
    activityFactor,
  };
}

export function getRecoveryConfidence({
  sessions,
  recentSleepLogs,
  recentRecoveryCheckins,
  nutritionDaysLogged,
}: {
  sessions: number;
  recentSleepLogs: number;
  recentRecoveryCheckins: number;
  nutritionDaysLogged: number;
}): ConfidenceLevel {
  const hasHistory = sessions > 0;
  const recentSignals = recentSleepLogs + recentRecoveryCheckins;

  if (hasHistory && (recentSignals > 0 || nutritionDaysLogged >= 2)) {
    return 'high';
  }

  if ((hasHistory && recentSignals === 0) || (!hasHistory && (recentSignals > 0 || nutritionDaysLogged >= 2))) {
    return 'medium';
  }

  return 'low';
}

export function getRecentSignalCounts({
  sleepLogs,
  recoveryCheckins,
  referenceDate = new Date(),
}: {
  sleepLogs: SleepLog[];
  recoveryCheckins: Array<{ loggedAt: string }>;
  referenceDate?: Date;
}) {
  return {
    recentSleepLogs: sleepLogs.filter((entry) => differenceInHours(referenceDate, new Date(entry.loggedAt)) <= 72).length,
    recentRecoveryCheckins: recoveryCheckins.filter((entry) => differenceInHours(referenceDate, new Date(entry.loggedAt)) <= 24).length,
  };
}
