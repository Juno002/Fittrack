import { differenceInSeconds } from 'date-fns';

import { toDayKey } from '@/lib/dates';
import type {
  DraftSession,
  DraftSessionSeed,
  ExerciseDefinition,
  WorkoutLog,
  WorkoutSession,
  WorkoutSet,
} from '@/store/types';

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createWorkoutSet(seed?: Partial<WorkoutSet>): WorkoutSet {
  return {
    reps: Math.max(0, seed?.reps ?? 8),
    weight: Math.max(0, seed?.weight ?? 0),
    completed: seed?.completed ?? false,
  };
}

export function sanitizeWorkoutSet(set: WorkoutSet) {
  return createWorkoutSet(set);
}

export function buildWorkoutLog(exercise: ExerciseDefinition): WorkoutLog {
  return {
    id: createId('log'),
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    muscleGroup: exercise.muscleGroup,
    iconName: exercise.iconName,
    sets: [createWorkoutSet({ reps: exercise.isBodyweight ? 10 : 8 })],
    isBodyweight: exercise.isBodyweight,
    mechanic: exercise.mechanic,
    secondaryTargets: { ...exercise.secondaryTargets },
    progressionTrackId: exercise.progressionTrackId,
    progressionStep: exercise.progressionStep,
    coachModeling: exercise.coachModeling,
  };
}

export function duplicateWorkoutLog(log: WorkoutLog): WorkoutLog {
  return {
    ...log,
    id: createId('log'),
    sets: log.sets.map((set) => ({ ...set })),
  };
}

export function createDraftSession(seed?: DraftSessionSeed): DraftSession {
  return {
    id: createId('draft'),
    name: seed?.name ?? '',
    startedAt: seed?.startedAt ?? new Date().toISOString(),
    logs: seed?.logs?.map((log) => ({
      ...log,
      sets: log.sets.map((set) => sanitizeWorkoutSet(set)),
    })) ?? [],
    restDurationSeconds: seed?.restDurationSeconds ?? 60,
    restTimerEndsAt: seed?.restTimerEndsAt ?? null,
  };
}

export function hasValidWorkoutSet(set: WorkoutSet) {
  return set.reps > 0;
}

export function hasValidWorkoutLog(log: WorkoutLog) {
  return log.sets.some(hasValidWorkoutSet);
}

export function getTrackedSets(log: WorkoutLog) {
  const completedSets = log.sets.filter((set) => set.completed);

  return completedSets.length > 0 ? completedSets : log.sets;
}

export function getTrackedSetCount(log: WorkoutLog) {
  return getTrackedSets(log).length;
}

export function getWorkoutLogRepTotal(log: WorkoutLog) {
  return getTrackedSets(log).reduce((total, set) => total + set.reps, 0);
}

export function getWorkoutLogLoadTotal(log: WorkoutLog) {
  return getTrackedSets(log).reduce((total, set) => total + (set.reps * set.weight), 0);
}

export function getWorkoutSessionSetTotal(session: Pick<WorkoutSession, 'logs'>) {
  return session.logs.reduce((total, log) => total + getTrackedSetCount(log), 0);
}

export function getWorkoutSessionRepTotal(session: Pick<WorkoutSession, 'logs'>) {
  return session.logs.reduce((total, log) => total + getWorkoutLogRepTotal(log), 0);
}

export function getWorkoutSessionLoadTotal(session: Pick<WorkoutSession, 'logs'>) {
  return session.logs.reduce((total, log) => total + getWorkoutLogLoadTotal(log), 0);
}

export function finalizeDraftSession(draftSession: DraftSession, effort: number) {
  const validLogs = draftSession.logs
    .map((log) => ({
      ...log,
      sets: log.sets
        .map((set) => sanitizeWorkoutSet(set))
        .filter(hasValidWorkoutSet),
    }))
    .filter((log) => log.sets.length > 0);

  if (validLogs.length === 0) {
    return null;
  }

  const performedAt = new Date().toISOString();

  return {
    id: createId('session'),
    name: draftSession.name.trim() || 'Training Session',
    performedAt,
    dayKey: toDayKey(performedAt),
    durationSeconds: clamp(
      differenceInSeconds(new Date(performedAt), new Date(draftSession.startedAt)),
      0,
      60 * 60 * 12,
    ),
    effort,
    logs: validLogs,
  };
}

/**
 * Estimates 1 Rep Max using Brzycki formula: weight / (1.0278 - 0.0278 * reps)
 * Only valid for reps > 0 and typically accurate up to 10-12 reps.
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  
  return weight / (1.0278 - (0.0278 * Math.min(10, reps)));
}
