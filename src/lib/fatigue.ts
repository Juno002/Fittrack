import { differenceInHours, subDays } from 'date-fns';

import { getTrackedSetCount } from '@/lib/workout';
import type { MuscleGroup, SleepLog, UserProfile, WorkoutSession } from '@/store/types';

export const FATIGUE_PER_SET = 15;
export const RECOVERY_HOURS = 48;
export const BASE_RECOVERY_PER_HOUR = 100 / RECOVERY_HOURS;

interface FatigueInputs {
  sessions: WorkoutSession[];
  sleepLogs: SleepLog[];
  profile: UserProfile;
  referenceDate?: Date;
}

const EMPTY_FATIGUE: Record<MuscleGroup, number> = {
  chest: 0,
  back: 0,
  legs: 0,
  shoulders: 0,
  arms: 0,
  core: 0,
};

export function getEffectiveRecoveryPerHour(
  profile: UserProfile,
  sleepLogs: SleepLog[],
  referenceDate = new Date(),
) {
  const recentLogs = sleepLogs.filter((log) => new Date(log.loggedAt) >= subDays(referenceDate, 3));

  const averageScore = recentLogs.length > 0
    ? recentLogs.reduce((total, log) => total + log.qualityScore, 0) / recentLogs.length
    : 80;
  const averageHours = recentLogs.length > 0
    ? recentLogs.reduce((total, log) => total + log.durationHours, 0) / recentLogs.length
    : 8;
  const sleepEfficiency = (averageHours / 8) * (averageScore / 80);
  const sleepMultiplier = Math.max(0.3, Math.min(1.5, sleepEfficiency));
  const ageMultiplier = profile.age > 30 ? Math.max(0.7, 1 - ((profile.age - 30) * 0.01)) : 1;

  return BASE_RECOVERY_PER_HOUR * sleepMultiplier * ageMultiplier;
}

export function calculateFatigue({
  sessions,
  sleepLogs,
  profile,
  referenceDate = new Date(),
}: FatigueInputs) {
  const fatigue = { ...EMPTY_FATIGUE };
  const recoveryPerHour = getEffectiveRecoveryPerHour(profile, sleepLogs, referenceDate);

  sessions.forEach((session) => {
    const hoursSince = differenceInHours(referenceDate, new Date(session.performedAt));

    if (hoursSince < 0 || hoursSince > RECOVERY_HOURS * 2) {
      return;
    }

    session.logs.forEach((log) => {
      const addedFatigue = getTrackedSetCount(log) * FATIGUE_PER_SET;
      const decayedFatigue = Math.max(0, addedFatigue - (hoursSince * recoveryPerHour));

      fatigue[log.muscleGroup] += decayedFatigue;
    });
  });

  (Object.keys(fatigue) as MuscleGroup[]).forEach((muscleGroup) => {
    fatigue[muscleGroup] = Math.min(100, Math.max(0, fatigue[muscleGroup]));
  });

  return fatigue;
}

export interface FatigueContribution {
  sessionName: string;
  performedAt: string;
  exerciseName: string;
  sets: number;
  fatigueContribution: number;
}

export function getFatigueBreakdown(
  { sessions, sleepLogs, profile, referenceDate = new Date() }: FatigueInputs,
  muscleGroup: MuscleGroup,
) {
  const recoveryPerHour = getEffectiveRecoveryPerHour(profile, sleepLogs, referenceDate);
  const contributions: FatigueContribution[] = [];

  sessions.forEach((session) => {
    const hoursSince = differenceInHours(referenceDate, new Date(session.performedAt));

    if (hoursSince < 0 || hoursSince > RECOVERY_HOURS * 2) {
      return;
    }

    session.logs.forEach((log) => {
      if (log.muscleGroup !== muscleGroup) {
        return;
      }

      const sets = getTrackedSetCount(log);
      const addedFatigue = sets * FATIGUE_PER_SET;
      const decayedFatigue = Math.max(0, addedFatigue - (hoursSince * recoveryPerHour));

      if (decayedFatigue > 0) {
        contributions.push({
          sessionName: session.name,
          performedAt: session.performedAt,
          exerciseName: log.exerciseName,
          sets,
          fatigueContribution: decayedFatigue,
        });
      }
    });
  });

  return [...contributions].sort((left, right) => right.performedAt.localeCompare(left.performedAt));
}

export function getRecoveryColor(fatigue: number) {
  if (fatigue < 20) {
    return 'bg-emerald-500';
  }

  if (fatigue < 50) {
    return 'bg-amber-400';
  }

  if (fatigue < 80) {
    return 'bg-orange-500';
  }

  return 'bg-red-500';
}

export function getRecoveryText(fatigue: number) {
  if (fatigue < 20) {
    return 'Listo para entrenar';
  }

  if (fatigue < 50) {
    return 'Recuperación parcial';
  }

  if (fatigue < 80) {
    return 'Fatigado';
  }

  return 'Necesita descanso';
}
