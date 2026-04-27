import { describe, expect, it } from 'vitest';

import { toDayKey } from '@/lib/dates';
import {
  buildMuscleStatuses,
  calculateWeeklyVolume,
  getFatigueBreakdown,
  type FatigueInputs,
} from '@/lib/fatigue';
import type { ExerciseDefinition, ExerciseIconName, MuscleGroup, SleepLog, WorkoutLog, WorkoutSession } from '@/store/types';

function createExercise(overrides: Partial<ExerciseDefinition> = {}): ExerciseDefinition {
  const muscleGroup = overrides.muscleGroup ?? 'chest';
  const iconNameByMuscle: Record<MuscleGroup, ExerciseIconName> = {
    chest: 'ArrowDown',
    back: 'ArrowUp',
    legs: 'Footprints',
    shoulders: 'Flame',
    biceps: 'Dumbbell',
    triceps: 'Activity',
    core: 'Timer',
  };

  return {
    id: overrides.id ?? `exercise-${muscleGroup}`,
    name: overrides.name ?? `Exercise ${muscleGroup}`,
    muscleGroup,
    iconName: overrides.iconName ?? iconNameByMuscle[muscleGroup],
    isBodyweight: overrides.isBodyweight ?? false,
    mechanic: overrides.mechanic ?? 'compound',
    secondaryTargets: overrides.secondaryTargets ?? {},
    progressionTrackId: overrides.progressionTrackId ?? null,
    progressionStep: overrides.progressionStep ?? null,
    coachModeling: overrides.coachModeling ?? 'curated',
    source: overrides.source ?? 'catalog',
    description: overrides.description,
    formGuidance: overrides.formGuidance,
    videoUrl: overrides.videoUrl,
  };
}

function createLog(exercise: ExerciseDefinition, setCount: number, reps = 8, weight = 0): WorkoutLog {
  return {
    id: `log-${exercise.id}-${setCount}-${reps}-${weight}`,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    muscleGroup: exercise.muscleGroup,
    iconName: exercise.iconName,
    isBodyweight: exercise.isBodyweight,
    mechanic: exercise.mechanic,
    secondaryTargets: { ...exercise.secondaryTargets },
    progressionTrackId: exercise.progressionTrackId,
    progressionStep: exercise.progressionStep,
    coachModeling: exercise.coachModeling,
    sets: Array.from({ length: setCount }, () => ({
      reps,
      weight,
      completed: true,
    })),
  };
}

function createSession(name: string, performedAt: string, logs: WorkoutLog[], effort = 3): WorkoutSession {
  return {
    id: `session-${name}-${performedAt}`,
    name,
    performedAt,
    dayKey: toDayKey(performedAt),
    durationSeconds: 1800,
    effort,
    logs,
  };
}

function hoursAgo(referenceDate: Date, hours: number) {
  return new Date(referenceDate.getTime() - (hours * 60 * 60 * 1000)).toISOString();
}

function buildInputs(referenceDate: Date, sessions: WorkoutSession[], sleepLogs: SleepLog[] = []): FatigueInputs {
  return { referenceDate, sessions, sleepLogs };
}

describe('fatigue model', () => {
  it('counts indirect weekly volume from secondary muscles', () => {
    const referenceDate = new Date('2026-04-29T12:00:00.000Z');
    const benchPress = createExercise({
      id: 'bench-press',
      name: 'Bench Press',
      muscleGroup: 'chest',
      secondaryTargets: { triceps: 0.5, shoulders: 0.25 },
    });
    const sessions = [
      createSession('Push Day', hoursAgo(referenceDate, 12), [createLog(benchPress, 4, 8, 60)]),
    ];

    const weeklyVolume = calculateWeeklyVolume(sessions, referenceDate);

    expect(weeklyVolume.chest).toBe(4);
    expect(weeklyVolume.triceps).toBe(2);
    expect(weeklyVolume.shoulders).toBe(1);
  });

  it('keeps sleep as a qualitative warning without changing MRV math', () => {
    const referenceDate = new Date('2026-04-29T12:00:00.000Z');
    const benchPress = createExercise({
      id: 'bench-press',
      name: 'Bench Press',
      muscleGroup: 'chest',
      secondaryTargets: { triceps: 0.5, shoulders: 0.25 },
    });
    const sessions = [
      createSession('Heavy Push', hoursAgo(referenceDate, 24), [createLog(benchPress, 16, 8, 60)]),
    ];
    const sleepLogs: SleepLog[] = [
      { id: 'sleep-1', dayKey: '2026-04-27', loggedAt: '2026-04-27T07:00:00.000Z', durationHours: 6, qualityScore: 3 },
      { id: 'sleep-2', dayKey: '2026-04-28', loggedAt: '2026-04-28T07:00:00.000Z', durationHours: 6.5, qualityScore: 3 },
      { id: 'sleep-3', dayKey: '2026-04-29', loggedAt: '2026-04-29T07:00:00.000Z', durationHours: 6, qualityScore: 2 },
    ];

    const statuses = buildMuscleStatuses(buildInputs(referenceDate, sessions, sleepLogs));

    expect(statuses.chest.volumeZone).toBe('optimal');
    expect(statuses.chest.thresholds.mrv).toBe(22);
    expect(statuses.chest.sleepWarning).toBe(true);
  });

  it('uses discrete acute recovery windows and extends high-volume sessions by 24h', () => {
    const referenceDate = new Date('2026-04-29T12:00:00.000Z');
    const chest = createExercise({ id: 'bench-press', muscleGroup: 'chest' });
    const biceps = createExercise({ id: 'curl', muscleGroup: 'biceps', mechanic: 'isolation' });
    const shoulders = createExercise({ id: 'press', muscleGroup: 'shoulders' });
    const highVolumeChest = createExercise({ id: 'bench-marathon', muscleGroup: 'chest' });
    const sessions = [
      createSession('Chest Peak', hoursAgo(referenceDate, 30), [createLog(chest, 4, 8, 60)]),
      createSession('Arm Day', hoursAgo(referenceDate, 20), [createLog(biceps, 4, 12, 0)]),
      createSession('Shoulder Day', hoursAgo(referenceDate, 50), [createLog(shoulders, 4, 10, 25)]),
      createSession('Chest Marathon', hoursAgo(referenceDate, 80), [createLog(highVolumeChest, 7, 8, 55)]),
    ];

    const statuses = buildMuscleStatuses(buildInputs(referenceDate, sessions));

    expect(statuses.biceps.acuteRecoveryState).toBe('early');
    expect(statuses.shoulders.acuteRecoveryState).toBe('recovered');
    expect(statuses.chest.acuteRecoveryState).toBe('delayed_peak');
    expect(statuses.chest.nextRecoveryAt).toBe('2026-05-01T06:00:00.000Z');
  });

  it('flags weighted performance regressions by muscle', () => {
    const referenceDate = new Date('2026-04-29T12:00:00.000Z');
    const benchPress = createExercise({
      id: 'bench-press',
      name: 'Bench Press',
      muscleGroup: 'chest',
      secondaryTargets: { triceps: 0.5, shoulders: 0.25 },
    });
    const sessions = [
      createSession('Latest Push', hoursAgo(referenceDate, 24), [createLog(benchPress, 3, 6, 55)], 4),
      createSession('Previous Push', hoursAgo(referenceDate, 96), [createLog(benchPress, 3, 8, 60)], 3),
    ];

    const statuses = buildMuscleStatuses(buildInputs(referenceDate, sessions));

    expect(statuses.chest.performanceWarning).toBe(true);
  });

  it('flags bodyweight performance regressions by muscle', () => {
    const referenceDate = new Date('2026-04-29T12:00:00.000Z');
    const pushUps = createExercise({
      id: 'push-ups',
      name: 'Push-Ups',
      muscleGroup: 'chest',
      isBodyweight: true,
      secondaryTargets: { triceps: 0.5, shoulders: 0.25 },
    });
    const sessions = [
      createSession('Latest Bodyweight', hoursAgo(referenceDate, 24), [createLog(pushUps, 3, 12, 0)], 4),
      createSession('Previous Bodyweight', hoursAgo(referenceDate, 72), [createLog(pushUps, 3, 15, 0)], 3),
    ];

    const statuses = buildMuscleStatuses(buildInputs(referenceDate, sessions));

    expect(statuses.chest.performanceWarning).toBe(true);
  });

  it('returns a real fatigue breakdown including indirect contributors', () => {
    const referenceDate = new Date('2026-04-29T12:00:00.000Z');
    const benchPress = createExercise({
      id: 'bench-press',
      name: 'Bench Press',
      muscleGroup: 'chest',
      secondaryTargets: { triceps: 0.5, shoulders: 0.25 },
    });
    const sessions = [
      createSession('Push Day', hoursAgo(referenceDate, 12), [createLog(benchPress, 4, 8, 60)]),
    ];

    const breakdown = getFatigueBreakdown(buildInputs(referenceDate, sessions), 'triceps');

    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]).toMatchObject({
      exerciseName: 'Bench Press',
      sets: 2,
      contributionType: 'secondary',
      acuteRecoveryState: 'early',
    });
  });
});
