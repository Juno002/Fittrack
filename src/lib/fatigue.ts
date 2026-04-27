import { addHours, differenceInHours, isAfter, startOfWeek, subDays } from 'date-fns';

import { getTrackedSetCount, getTrackedSets } from '@/lib/workout';
import type { MuscleGroup, SleepLog, WorkoutLog, WorkoutSession, WorkoutSet } from '@/store/types';

export interface MRVThresholds {
  mev: number;
  mavMin: number;
  mavMax: number;
  mrv: number;
}

export type VolumeZone = 'below_mev' | 'optimal' | 'high' | 'over_mrv';
export type AcuteRecoveryState = 'early' | 'delayed_peak' | 'recovered';

export interface MuscleStatus {
  muscleGroup: MuscleGroup;
  weeklySets: number;
  thresholds: MRVThresholds;
  volumeZone: VolumeZone;
  acuteRecoveryState: AcuteRecoveryState;
  nextRecoveryAt: string | null;
  sleepWarning: boolean;
  performanceWarning: boolean;
  latestSessionAt: string | null;
}

export interface FatigueInputs {
  sessions: WorkoutSession[];
  sleepLogs: SleepLog[];
  referenceDate?: Date;
}

export interface FatigueContribution {
  sessionName: string;
  performedAt: string;
  exerciseName: string;
  sets: number;
  contributionType: 'primary' | 'secondary';
  acuteRecoveryState: AcuteRecoveryState;
  recoveryEndsAt: string | null;
}

const EMPTY_RECORDS: Record<MuscleGroup, number> = {
  chest: 0,
  back: 0,
  legs: 0,
  shoulders: 0,
  biceps: 0,
  triceps: 0,
  core: 0,
};

export const VOLUME_THRESHOLDS: Record<MuscleGroup, MRVThresholds> = {
  chest: { mev: 6, mavMin: 12, mavMax: 18, mrv: 22 },
  back: { mev: 8, mavMin: 14, mavMax: 20, mrv: 24 },
  legs: { mev: 6, mavMin: 12, mavMax: 18, mrv: 22 },
  shoulders: { mev: 6, mavMin: 12, mavMax: 16, mrv: 20 },
  biceps: { mev: 4, mavMin: 10, mavMax: 14, mrv: 18 },
  triceps: { mev: 4, mavMin: 10, mavMax: 12, mrv: 16 },
  core: { mev: 4, mavMin: 8, mavMax: 12, mrv: 16 },
};

export const BASE_RECOVERY_HOURS: Record<MuscleGroup, number> = {
  chest: 72,
  back: 72,
  legs: 72,
  shoulders: 48,
  biceps: 48,
  triceps: 48,
  core: 48,
};

function createEmptyRecord() {
  return { ...EMPTY_RECORDS };
}

function getVolumeZone(sets: number, thresholds: MRVThresholds): VolumeZone {
  if (sets > thresholds.mrv) {
    return 'over_mrv';
  }

  if (sets >= thresholds.mavMin) {
    return sets > thresholds.mavMax ? 'high' : 'optimal';
  }

  return sets >= thresholds.mev ? 'optimal' : 'below_mev';
}

function compareRecoveryState(left: AcuteRecoveryState, right: AcuteRecoveryState) {
  const rank: Record<AcuteRecoveryState, number> = {
    recovered: 0,
    early: 1,
    delayed_peak: 2,
  };

  return rank[left] - rank[right];
}

function getRecoveryWindowHours(muscleGroup: MuscleGroup, effectiveSets: number) {
  return BASE_RECOVERY_HOURS[muscleGroup] + (effectiveSets >= 7 ? 24 : 0);
}

function getAcuteRecoveryState(hoursSince: number, recoveryWindowHours: number): AcuteRecoveryState {
  if (hoursSince >= recoveryWindowHours) {
    return 'recovered';
  }

  return hoursSince < 24 ? 'early' : 'delayed_peak';
}

function buildSessionMuscleVolumes(session: WorkoutSession) {
  const effectiveSets = createEmptyRecord();

  session.logs.forEach((log) => {
    if (log.coachModeling === 'generic') {
      return;
    }

    const primarySets = getTrackedSetCount(log);
    effectiveSets[log.muscleGroup] += primarySets;

    Object.entries(log.secondaryTargets).forEach(([muscleGroup, fraction]) => {
      if (fraction) {
        effectiveSets[muscleGroup as MuscleGroup] += primarySets * fraction;
      }
    });
  });

  return effectiveSets;
}

function getBestWeightedSet(log: WorkoutLog): WorkoutSet | null {
  return getTrackedSets(log).reduce<WorkoutSet | null>((best, set) => {
    if (!best) {
      return set;
    }

    if (set.weight > best.weight) {
      return set;
    }

    if (set.weight === best.weight && set.reps > best.reps) {
      return set;
    }

    return best;
  }, null);
}

function isUnderperforming(latestLog: WorkoutLog, previousLog: WorkoutLog) {
  if (latestLog.isBodyweight || previousLog.isBodyweight) {
    const latestBest = Math.max(...getTrackedSets(latestLog).map((set) => set.reps), 0);
    const previousBest = Math.max(...getTrackedSets(previousLog).map((set) => set.reps), 0);
    return latestBest < previousBest;
  }

  const latestBest = getBestWeightedSet(latestLog);
  const previousBest = getBestWeightedSet(previousLog);

  if (!latestBest || !previousBest) {
    return false;
  }

  return latestBest.weight < previousBest.weight
    || (latestBest.weight === previousBest.weight && latestBest.reps < previousBest.reps);
}

function getPerformanceWarnings(sessions: WorkoutSession[], referenceDate: Date) {
  const warnings = Object.fromEntries(
    (Object.keys(EMPTY_RECORDS) as MuscleGroup[]).map((muscleGroup) => [muscleGroup, false]),
  ) as Record<MuscleGroup, boolean>;

  const recentSessions = [...sessions]
    .filter((session) => differenceInHours(referenceDate, new Date(session.performedAt)) <= 24 * 21)
    .sort((left, right) => right.performedAt.localeCompare(left.performedAt));

  const exercisePairs = new Map<string, Array<{ session: WorkoutSession; log: WorkoutLog }>>();

  recentSessions.forEach((session) => {
    session.logs.forEach((log) => {
      if (log.coachModeling === 'generic') {
        return;
      }

      const existing = exercisePairs.get(log.exerciseId) ?? [];
      if (existing.length < 2) {
        exercisePairs.set(log.exerciseId, [...existing, { session, log }]);
      }
    });
  });

  exercisePairs.forEach((entries) => {
    if (entries.length < 2) {
      return;
    }

    const [latest, previous] = entries;
    if (isUnderperforming(latest.log, previous.log)) {
      warnings[latest.log.muscleGroup] = true;
    }
  });

  return warnings;
}

export function calculateWeeklyVolume(sessions: WorkoutSession[], referenceDate = new Date()) {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const volume = createEmptyRecord();

  sessions.forEach((session) => {
    const sessionDate = new Date(session.performedAt);
    if (!isAfter(sessionDate, weekStart) && sessionDate.getTime() !== weekStart.getTime()) {
      return;
    }

    const sessionVolumes = buildSessionMuscleVolumes(session);
    (Object.keys(volume) as MuscleGroup[]).forEach((muscleGroup) => {
      volume[muscleGroup] += sessionVolumes[muscleGroup];
    });
  });

  return volume;
}

export function getSleepRecoveryWarning(sleepLogs: SleepLog[], referenceDate = new Date()) {
  const recentLogs = sleepLogs.filter((log) => new Date(log.loggedAt) >= subDays(referenceDate, 3));
  if (recentLogs.length === 0) {
    return false;
  }

  const averageHours = recentLogs.reduce((total, log) => total + log.durationHours, 0) / recentLogs.length;
  return averageHours < 7;
}

export function buildMuscleStatuses({
  sessions,
  sleepLogs,
  referenceDate = new Date(),
}: FatigueInputs) {
  const weeklyVolume = calculateWeeklyVolume(sessions, referenceDate);
  const performanceWarnings = getPerformanceWarnings(sessions, referenceDate);
  const sleepWarning = getSleepRecoveryWarning(sleepLogs, referenceDate);
  const statuses = Object.fromEntries(
    (Object.keys(EMPTY_RECORDS) as MuscleGroup[]).map((muscleGroup) => [
      muscleGroup,
      {
        muscleGroup,
        weeklySets: Number(weeklyVolume[muscleGroup].toFixed(2)),
        thresholds: VOLUME_THRESHOLDS[muscleGroup],
        volumeZone: getVolumeZone(weeklyVolume[muscleGroup], VOLUME_THRESHOLDS[muscleGroup]),
        acuteRecoveryState: 'recovered' as AcuteRecoveryState,
        nextRecoveryAt: null,
        sleepWarning,
        performanceWarning: performanceWarnings[muscleGroup],
        latestSessionAt: null,
      } satisfies MuscleStatus,
    ]),
  ) as Record<MuscleGroup, MuscleStatus>;

  sessions.forEach((session) => {
    const sessionPerformedAt = new Date(session.performedAt);
    const hoursSince = differenceInHours(referenceDate, sessionPerformedAt);
    if (hoursSince < 0) {
      return;
    }

    const sessionVolumes = buildSessionMuscleVolumes(session);
    (Object.keys(sessionVolumes) as MuscleGroup[]).forEach((muscleGroup) => {
      const effectiveSets = sessionVolumes[muscleGroup];
      if (effectiveSets <= 0) {
        return;
      }

      const recoveryWindowHours = getRecoveryWindowHours(muscleGroup, effectiveSets);
      const acuteRecoveryState = getAcuteRecoveryState(hoursSince, recoveryWindowHours);
      const recoveryEndsAt = addHours(sessionPerformedAt, recoveryWindowHours).toISOString();
      const current = statuses[muscleGroup];

      if (
        current.acuteRecoveryState === 'recovered'
        || compareRecoveryState(acuteRecoveryState, current.acuteRecoveryState) > 0
      ) {
        current.acuteRecoveryState = acuteRecoveryState;
      }

      if (!current.nextRecoveryAt || recoveryEndsAt > current.nextRecoveryAt) {
        current.nextRecoveryAt = acuteRecoveryState === 'recovered' ? current.nextRecoveryAt : recoveryEndsAt;
      }

      if (!current.latestSessionAt || session.performedAt > current.latestSessionAt) {
        current.latestSessionAt = session.performedAt;
      }
    });
  });

  return statuses;
}

export function getFatigueBreakdown(
  { sessions, referenceDate = new Date() }: FatigueInputs,
  muscleGroup: MuscleGroup,
) {
  const breakdown: FatigueContribution[] = [];

  [...sessions]
    .sort((left, right) => right.performedAt.localeCompare(left.performedAt))
    .forEach((session) => {
      const sessionDate = new Date(session.performedAt);
      const hoursSince = differenceInHours(referenceDate, sessionDate);
      if (hoursSince < 0 || hoursSince > 24 * 10) {
        return;
      }

      const sessionVolumes = buildSessionMuscleVolumes(session);
      const effectiveSets = sessionVolumes[muscleGroup];
      if (effectiveSets <= 0) {
        return;
      }

      const recoveryWindowHours = getRecoveryWindowHours(muscleGroup, effectiveSets);
      const acuteRecoveryState = getAcuteRecoveryState(hoursSince, recoveryWindowHours);
      const recoveryEndsAt = hoursSince >= recoveryWindowHours
        ? null
        : addHours(sessionDate, recoveryWindowHours).toISOString();

      session.logs.forEach((log) => {
        if (log.coachModeling === 'generic') {
          return;
        }

        const trackedSets = getTrackedSetCount(log);
        const primarySets = log.muscleGroup === muscleGroup ? trackedSets : 0;
        const secondarySets = log.secondaryTargets[muscleGroup] ? trackedSets * (log.secondaryTargets[muscleGroup] ?? 0) : 0;
        const contributionSets = primarySets || secondarySets;
        if (!contributionSets) {
          return;
        }

        breakdown.push({
          sessionName: session.name,
          performedAt: session.performedAt,
          exerciseName: log.exerciseName,
          sets: Number(contributionSets.toFixed(2)),
          contributionType: primarySets ? 'primary' : 'secondary',
          acuteRecoveryState,
          recoveryEndsAt,
        });
      });
    });

  return breakdown;
}

export function getMuscleStatusColor(status: MuscleStatus) {
  if (status.volumeZone === 'over_mrv' || status.performanceWarning) {
    return 'text-red-400';
  }

  if (status.acuteRecoveryState === 'delayed_peak' || status.volumeZone === 'high') {
    return 'text-orange-400';
  }

  if (status.acuteRecoveryState === 'early') {
    return 'text-amber-300';
  }

  return 'text-[#6EE7B7]';
}

export function getMuscleStatusTone(status: MuscleStatus) {
  if (status.volumeZone === 'over_mrv' || status.performanceWarning) {
    return 'danger' as const;
  }

  if (status.acuteRecoveryState !== 'recovered' || status.volumeZone === 'high' || status.sleepWarning) {
    return 'warn' as const;
  }

  return 'good' as const;
}

export function getMuscleStatusLabel(status: MuscleStatus) {
  if (status.volumeZone === 'over_mrv') {
    return 'Sobre MRV';
  }

  if (status.performanceWarning) {
    return 'Rendimiento cae';
  }

  if (status.acuteRecoveryState === 'delayed_peak') {
    return 'Pico retardado';
  }

  if (status.acuteRecoveryState === 'early') {
    return 'Recuperando';
  }

  if (status.volumeZone === 'high') {
    return 'Volumen alto';
  }

  if (status.volumeZone === 'below_mev') {
    return 'Bajo MEV';
  }

  return 'Óptimo';
}

export function getRecoveryStateLabel(state: AcuteRecoveryState) {
  if (state === 'early') {
    return 'Recuperando';
  }

  if (state === 'delayed_peak') {
    return 'Pico retardado';
  }

  return 'Recuperado';
}

export function getVolumeZoneLabel(zone: VolumeZone) {
  if (zone === 'over_mrv') {
    return 'Sobre MRV';
  }

  if (zone === 'high') {
    return 'Volumen alto';
  }

  if (zone === 'below_mev') {
    return 'Bajo MEV';
  }

  return 'Zona óptima';
}

export function getMuscleStatusIntensity(status: MuscleStatus) {
  if (status.volumeZone === 'over_mrv' || status.performanceWarning) {
    return 4;
  }

  if (status.acuteRecoveryState === 'delayed_peak' || status.volumeZone === 'high') {
    return 3;
  }

  if (status.acuteRecoveryState === 'early') {
    return 2;
  }

  return 1;
}
