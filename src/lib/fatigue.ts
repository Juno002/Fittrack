import { differenceInHours, endOfWeek, startOfWeek } from 'date-fns';

import {
  ACUTE_FATIGUE_WINDOW_HOURS,
  getAgeRecoveryPenaltyHours,
  getBodyweightLoadFactor,
  getSleepRecoveryPenaltyHours,
  getRollingSleepSummary,
  RECOVERY_MUSCLE_GROUP_ORDER,
} from '@/lib/recoveryModel';
import { getTrackedSetCount } from '@/lib/workout';
import type { MuscleGroup, SleepLog, UserProfile, WorkoutSession } from '@/store/types';

export const RECOVERY_HOURS = 48;
export const BASE_RECOVERY_PER_HOUR = 100 / RECOVERY_HOURS;

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

interface DetailedContribution extends FatigueContribution {
  muscleGroup: MuscleGroup;
  sourceMuscleGroup: MuscleGroup;
  hoursSince: number;
  weighting: number;
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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export function getSleepModifier(sleepLogs: SleepLog[], referenceDate = new Date()) {
  const summary = getRollingSleepSummary(sleepLogs, referenceDate);
  if (summary.daysLogged === 0 || summary.averageHours === null || summary.averageQuality === null) {
    return 1;
  }

  if (summary.averageHours < 6 || summary.averageQuality < 55) {
    return 0.6;
  }

  if (summary.averageHours < 7 || summary.averageQuality < 70) {
    return 0.8;
  }

  return 1;
}

function getLocalFatiguePhaseMultiplier(hoursElapsed: number, totalRecoveryHours: number) {
  if (hoursElapsed < 0 || hoursElapsed >= totalRecoveryHours) {
    return 0;
  }

  if (hoursElapsed < 48) {
    return 1;
  }

  if (hoursElapsed < 72) {
    return 0.75;
  }

  if (hoursElapsed < 96) {
    return 0.45;
  }

  return 0.2;
}

export function getVolumeModifier(sets: number) {
  if (sets <= 3) {
    return 0.75;
  }

  if (sets <= 6) {
    return 1;
  }

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

function buildSessionMuscleSets(session: WorkoutSession, profile: UserProfile) {
  const setsByMuscle = { ...EMPTY_RECORDS };

  session.logs.forEach((log) => {
    const trackedSets = getTrackedSetCount(log);
    const bodyweightFactor = log.isBodyweight ? getBodyweightLoadFactor(profile.weight) : 1;
    const effectiveSets = trackedSets * bodyweightFactor;
    setsByMuscle[log.muscleGroup] += effectiveSets;

    const secondaryTargets = SECONDARY_MUSCLES[log.muscleGroup];
    if (!secondaryTargets) {
      return;
    }

    (Object.entries(secondaryTargets) as Array<[MuscleGroup, number]>).forEach(([targetMuscle, weighting]) => {
      setsByMuscle[targetMuscle] += effectiveSets * weighting;
    });
  });

  return setsByMuscle;
}

function getTotalRecoveryHours({
  muscleGroup,
  sessionMuscleSets,
  profile,
  sleepLogs,
  referenceDate,
}: {
  muscleGroup: MuscleGroup;
  sessionMuscleSets: Record<MuscleGroup, number>;
  profile: UserProfile;
  sleepLogs: SleepLog[];
  referenceDate: Date;
}) {
  const baseHours = BASE_RECOVERY_HOURS[muscleGroup];
  const volumeModifier = getVolumeModifier(sessionMuscleSets[muscleGroup]);
  const agePenalty = getAgeRecoveryPenaltyHours(profile.age);
  const sleepPenalty = getSleepRecoveryPenaltyHours(sleepLogs, referenceDate);

  return (baseHours * volumeModifier) + agePenalty + sleepPenalty;
}

function buildDetailedContributions({
  sessions,
  sleepLogs,
  profile,
  referenceDate,
}: Required<FatigueInputs>) {
  const contributions: DetailedContribution[] = [];

  sessions.forEach((session) => {
    const hoursSince = differenceInHours(referenceDate, new Date(session.performedAt));
    if (hoursSince < 0 || hoursSince > ACUTE_FATIGUE_WINDOW_HOURS) {
      return;
    }

    const sessionMuscleSets = buildSessionMuscleSets(session, profile);

    session.logs.forEach((log) => {
      const trackedSets = getTrackedSetCount(log);
      if (trackedSets <= 0) {
        return;
      }

      const bodyweightFactor = log.isBodyweight ? getBodyweightLoadFactor(profile.weight) : 1;
      const targetEntries: Array<[MuscleGroup, number]> = [
        [log.muscleGroup, 1],
        ...Object.entries(SECONDARY_MUSCLES[log.muscleGroup] ?? {}) as Array<[MuscleGroup, number]>,
      ];

      targetEntries.forEach(([targetMuscle, weighting]) => {
        const effectiveSets = trackedSets * bodyweightFactor * weighting;
        const totalRecoveryHours = getTotalRecoveryHours({
          muscleGroup: targetMuscle,
          sessionMuscleSets,
          profile,
          sleepLogs,
          referenceDate,
        });
        const remainingFraction = getLocalFatiguePhaseMultiplier(hoursSince, totalRecoveryHours);
        if (remainingFraction <= 0) {
          return;
        }

        const acuteFatigue = clamp((effectiveSets / (VOLUME_THRESHOLDS[targetMuscle].mrv * 0.4)) * 100, 0, 100);
        const fatigueContribution = acuteFatigue * remainingFraction;
        if (fatigueContribution <= 0) {
          return;
        }

        contributions.push({
          muscleGroup: targetMuscle,
          sourceMuscleGroup: log.muscleGroup,
          sessionName: session.name,
          performedAt: session.performedAt,
          exerciseName: log.exerciseName,
          sets: roundToSingleDecimal(effectiveSets),
          fatigueContribution: roundToSingleDecimal(fatigueContribution),
          hoursSince,
          weighting,
        });
      });
    });
  });

  return contributions;
}

export function calculateFatigue({
  sessions,
  sleepLogs,
  profile,
  referenceDate = new Date(),
}: FatigueInputs) {
  const fatigue = { ...EMPTY_RECORDS };

  buildDetailedContributions({
    sessions,
    sleepLogs,
    profile,
    referenceDate,
  }).forEach((contribution) => {
    fatigue[contribution.muscleGroup] += contribution.fatigueContribution;
  });

  RECOVERY_MUSCLE_GROUP_ORDER.forEach((muscleGroup) => {
    fatigue[muscleGroup] = clamp(fatigue[muscleGroup], 0, 100);
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
  inputs: FatigueInputs,
  muscleGroup: MuscleGroup,
) {
  return buildDetailedContributions({
    sessions: inputs.sessions,
    sleepLogs: inputs.sleepLogs,
    profile: inputs.profile,
    referenceDate: inputs.referenceDate ?? new Date(),
  })
    .filter((entry) => entry.muscleGroup === muscleGroup)
    .sort((left, right) => right.fatigueContribution - left.fatigueContribution)
    .map(({ muscleGroup: _muscleGroup, sourceMuscleGroup: _sourceMuscleGroup, hoursSince: _hoursSince, weighting: _weighting, ...entry }) => entry);
}

export function calculateWeeklyVolume(sessions: WorkoutSession[], referenceDate = new Date()) {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
  const volume = { ...EMPTY_RECORDS };

  sessions.forEach((session) => {
    const sessionDate = new Date(session.performedAt);
    if (sessionDate < weekStart || sessionDate > weekEnd) {
      return;
    }

    session.logs.forEach((log) => {
      const sets = getTrackedSetCount(log);
      volume[log.muscleGroup] += sets;

      const secondaryTargets = SECONDARY_MUSCLES[log.muscleGroup];
      if (!secondaryTargets) {
        return;
      }

      (Object.entries(secondaryTargets) as Array<[MuscleGroup, number]>).forEach(([targetMuscle, weighting]) => {
        volume[targetMuscle] += sets * weighting;
      });
    });
  });

  return volume;
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
    return 'Recuperacion parcial';
  }

  if (fatigue < 80) {
    return 'Fatigado';
  }

  return 'Necesita descanso';
}
