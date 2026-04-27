import { differenceInHours, subDays, startOfWeek, isAfter } from 'date-fns';

import { getTrackedSetCount } from '@/lib/workout';
import type { MuscleGroup, SleepLog, UserProfile, WorkoutSession } from '@/store/types';

export const RECOVERY_HOURS = 48; // legacy export, not really used linearly anymore
export const BASE_RECOVERY_PER_HOUR = 100 / RECOVERY_HOURS; // legacy

interface FatigueInputs {
  sessions: WorkoutSession[];
  sleepLogs: SleepLog[];
  profile: UserProfile;
  referenceDate?: Date;
}

const EMPTY_RECORDS: Record<MuscleGroup, number> = {
  chest: 0,
  back: 0,
  legs: 0,
  shoulders: 0,
  arms: 0,
  core: 0,
};

interface MRVThresholds {
  mev: number;
  mavMin: number;
  mavMax: number;
  mrv: number;
}

export const VOLUME_THRESHOLDS: Record<MuscleGroup, MRVThresholds> = {
  chest: { mev: 6, mavMin: 12, mavMax: 18, mrv: 22 },
  back: { mev: 8, mavMin: 14, mavMax: 20, mrv: 24 },
  legs: { mev: 6, mavMin: 12, mavMax: 18, mrv: 22 },
  shoulders: { mev: 6, mavMin: 12, mavMax: 16, mrv: 20 },
  arms: { mev: 4, mavMin: 10, mavMax: 14, mrv: 18 },
  core: { mev: 4, mavMin: 10, mavMax: 14, mrv: 18 },
};

const SECONDARY_MUSCLES: Partial<Record<MuscleGroup, Partial<Record<MuscleGroup, number>>>> = {
  chest: { arms: 0.5, shoulders: 0.25 },
  back: { arms: 0.5, shoulders: 0.25 },
  shoulders: { arms: 0.25, chest: 0.25 },
  legs: { core: 0.25 },
};

export const BASE_RECOVERY_HOURS: Record<MuscleGroup, number> = {
  chest: 72,
  back: 72,
  legs: 72,
  shoulders: 48,
  arms: 48,
  core: 48,
};

export function getSleepModifier(sleepLogs: SleepLog[], referenceDate = new Date()) {
  const recentLogs = sleepLogs.filter((log) => new Date(log.loggedAt) >= subDays(referenceDate, 3));
  const averageHours = recentLogs.length > 0
    ? recentLogs.reduce((total, log) => total + log.durationHours, 0) / recentLogs.length
    : 8;
  
  if (averageHours < 6) return 0.6;
  if (averageHours < 7) return 0.8;
  return 1.0;
}

// Fase 1 (0-24h): recuperación rápida ~60% del total
// Fase 2 (24-72h): recuperación lenta ~40% restante
export function calcRecovery(hoursElapsed: number, totalHours: number) {
  if (totalHours <= 0) return 1;
  if (hoursElapsed >= totalHours) return 1;
  const midpoint = totalHours * 0.33; // 24h aprox para 72h
  if (hoursElapsed <= midpoint) {
    return (hoursElapsed / midpoint) * 0.6;
  } else {
    return 0.6 + ((hoursElapsed - midpoint) / (totalHours - midpoint)) * 0.4;
  }
}

export function getVolumeModifier(sets: number) {
  if (sets <= 3) return 0.75;
  if (sets <= 6) return 1.0;
  return 1.5;
}

export function getEffectiveMRV(muscle: MuscleGroup, modifier: number) {
  const base = VOLUME_THRESHOLDS[muscle];
  return {
    mev: base.mev * modifier,
    mavMin: base.mavMin * modifier,
    mavMax: base.mavMax * modifier,
    mrv: base.mrv * modifier,
  };
}

export function calculateFatigue({
  sessions,
  sleepLogs: _sleepLogs,
  profile: _profile,
  referenceDate = new Date(),
}: FatigueInputs) {
  const fatigue = { ...EMPTY_RECORDS };
  
  sessions.forEach((session) => {
    const hoursSince = differenceInHours(referenceDate, new Date(session.performedAt));
    if (hoursSince < 0 || hoursSince > 120) return; // ignore sessions older than 5 days for acute fatigue

    const sessionSets: Record<MuscleGroup, number> = { ...EMPTY_RECORDS };

    session.logs.forEach((log) => {
      const sets = getTrackedSetCount(log);
      sessionSets[log.muscleGroup] += sets;
      
      // Secondary muscles
      const secondary = SECONDARY_MUSCLES[log.muscleGroup];
      if (secondary) {
        for (const [secMuscle, fraction] of Object.entries(secondary)) {
          sessionSets[secMuscle as MuscleGroup] += sets * (fraction as number);
        }
      }
    });

    (Object.keys(sessionSets) as MuscleGroup[]).forEach((muscleGroup) => {
      const sets = sessionSets[muscleGroup];
      if (sets === 0) return;

      const baseHours = BASE_RECOVERY_HOURS[muscleGroup];
      const volumeModifier = getVolumeModifier(sets);
      const totalHours = baseHours * volumeModifier;

      const recoveryFraction = calcRecovery(hoursSince, totalHours);
      const remainingFraction = Math.max(0, 1 - recoveryFraction);
      
      // Acute fatigue logic: max 100 per muscle total, mapped roughly from sets vs MRV
      // We assume MRV equates to roughly 100% fatigue if done in one session, though impossible.
      // Let's say 1/3 of MRV adds 50% acute fatigue.
      const mrv = VOLUME_THRESHOLDS[muscleGroup].mrv;
      const acuteAdded = (sets / (mrv * 0.4)) * 100;

      fatigue[muscleGroup] += acuteAdded * remainingFraction;
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
  _inputs: FatigueInputs,
  _muscleGroup: MuscleGroup,
) {
  // We mock this slightly as breakdown by exercise is harder with secondary muscles.
  return [] as FatigueContribution[]; // keeping simple for now, or to fix later if needed
}

export function calculateWeeklyVolume(sessions: WorkoutSession[], referenceDate = new Date()) {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const volume = { ...EMPTY_RECORDS };

  sessions.forEach((session) => {
    const sessionDate = new Date(session.performedAt);
    if (!isAfter(sessionDate, weekStart) && sessionDate.getTime() !== weekStart.getTime()) {
      return;
    }

    session.logs.forEach((log) => {
      const sets = getTrackedSetCount(log);
      volume[log.muscleGroup] += sets;
      
      const secondary = SECONDARY_MUSCLES[log.muscleGroup];
      if (secondary) {
        for (const [secMuscle, fraction] of Object.entries(secondary)) {
          volume[secMuscle as MuscleGroup] += sets * (fraction as number);
        }
      }
    });
  });

  return volume;
}

export function getRecoveryColor(fatigue: number) {
  if (fatigue < 20) return 'bg-emerald-500';
  if (fatigue < 50) return 'bg-amber-400';
  if (fatigue < 80) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getRecoveryText(fatigue: number) {
  if (fatigue < 20) return 'Listo para entrenar';
  if (fatigue < 50) return 'Recuperación parcial';
  if (fatigue < 80) return 'Fatigado';
  return 'Necesita descanso';
}
