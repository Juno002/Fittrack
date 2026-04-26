import { describe, expect, it } from 'vitest';

import { createInitialAppStoreData, type AppStoreData } from '@/store';
import { selectExerciseHistory, selectReadinessSummary, selectWeeklyMomentumSummary } from '@/store/selectors';
import type { MuscleGroup, WorkoutSession } from '@/store/types';

function createSession({
  id,
  performedAt,
  muscleGroup,
  setCount,
  reps = 10,
}: {
  id: string;
  performedAt: string;
  muscleGroup: MuscleGroup;
  setCount: number;
  reps?: number;
}): WorkoutSession {
  return {
    id,
    name: `Session ${id}`,
    performedAt,
    dayKey: performedAt.slice(0, 10),
    durationSeconds: 1800,
    effort: 3,
    logs: [
      {
        id: `log-${id}`,
        exerciseId: `exercise-${muscleGroup}`,
        exerciseName: `${muscleGroup} movement`,
        muscleGroup,
        iconName: 'Dumbbell',
        isBodyweight: true,
        sets: Array.from({ length: setCount }, () => ({
          reps,
          weight: 0,
          completed: true,
        })),
      },
    ],
  };
}

function buildState(overrides?: Partial<AppStoreData>): AppStoreData {
  return {
    ...createInitialAppStoreData(),
    settings: {
      unitSystem: 'metric',
      onboarded: true,
    },
    ...overrides,
  };
}

describe('selectReadinessSummary', () => {
  it('returns a baseline full-body recommendation when there is no training history', () => {
    const summary = selectReadinessSummary(buildState(), new Date('2026-04-26T12:00:00.000Z'));

    expect(summary.focusLabel).toBe('Cuerpo completo');
    expect(summary.sessionModeLabel).toBe('Sesión base');
    expect(summary.suggestedExerciseCount).toBe(3);
    expect(summary.hasTrainingHistory).toBe(false);
  });

  it('flags high local fatigue and steers the recommendation away from that muscle group', () => {
    const state = buildState({
      sessions: [
        createSession({
          id: 'legs-recent',
          performedAt: '2026-04-26T08:00:00.000Z',
          muscleGroup: 'legs',
          setCount: 6,
        }),
        createSession({
          id: 'arms-older',
          performedAt: '2026-04-24T08:00:00.000Z',
          muscleGroup: 'arms',
          setCount: 3,
        }),
      ],
      sleepLogs: [
        {
          id: 'sleep-1',
          dayKey: '2026-04-26',
          loggedAt: '2026-04-26T07:00:00.000Z',
          durationHours: 8,
          qualityScore: 82,
        },
      ],
    });

    const summary = selectReadinessSummary(state, new Date('2026-04-26T12:00:00.000Z'));

    expect(summary.sessionModeLabel).toBe('Sesión inteligente');
    expect(summary.riskLabel).toContain('Piernas');
    expect(summary.recommendedMuscles).not.toContain('legs');
    expect(summary.hasTrainingHistory).toBe(true);
  });
});

describe('selectWeeklyMomentumSummary', () => {
  it('summarizes sessions, volume delta, and average sleep for the current week', () => {
    const state = buildState({
      sessions: [
        createSession({
          id: 'current-a',
          performedAt: '2026-04-21T10:00:00.000Z',
          muscleGroup: 'back',
          setCount: 3,
          reps: 10,
        }),
        createSession({
          id: 'current-b',
          performedAt: '2026-04-24T10:00:00.000Z',
          muscleGroup: 'chest',
          setCount: 3,
          reps: 10,
        }),
        createSession({
          id: 'previous-a',
          performedAt: '2026-04-14T10:00:00.000Z',
          muscleGroup: 'legs',
          setCount: 2,
          reps: 10,
        }),
      ],
      sleepLogs: [
        {
          id: 'sleep-a',
          dayKey: '2026-04-21',
          loggedAt: '2026-04-21T07:00:00.000Z',
          durationHours: 7,
          qualityScore: 78,
        },
        {
          id: 'sleep-b',
          dayKey: '2026-04-24',
          loggedAt: '2026-04-24T07:00:00.000Z',
          durationHours: 8,
          qualityScore: 84,
        },
      ],
    });

    const momentum = selectWeeklyMomentumSummary(state, new Date('2026-04-26T12:00:00.000Z'));

    expect(momentum.summary).toBe('2/4 sesiones');
    expect(momentum.detail).toBe('+200% volumen');
    expect(momentum.averageSleepHours).toBe(7.5);
  });
});

describe('selectExerciseHistory', () => {
  it('tracks bodyweight progress from reps even when the exercise has no load', () => {
    const state = buildState({
      sessions: [
        {
          id: 'push-day-a',
          name: 'Push day A',
          performedAt: '2026-04-20T10:00:00.000Z',
          dayKey: '2026-04-20',
          durationSeconds: 1200,
          effort: 3,
          logs: [
            {
              id: 'log-push-a',
              exerciseId: 'push-up',
              exerciseName: 'Push-Up',
              muscleGroup: 'chest',
              iconName: 'Dumbbell',
              isBodyweight: true,
              sets: [
                { reps: 12, weight: 0, completed: true },
                { reps: 10, weight: 0, completed: true },
                { reps: 8, weight: 0, completed: false },
              ],
            },
          ],
        },
        {
          id: 'push-day-b',
          name: 'Push day B',
          performedAt: '2026-04-23T10:00:00.000Z',
          dayKey: '2026-04-23',
          durationSeconds: 1400,
          effort: 4,
          logs: [
            {
              id: 'log-push-b',
              exerciseId: 'push-up',
              exerciseName: 'Push-Up',
              muscleGroup: 'chest',
              iconName: 'Dumbbell',
              isBodyweight: true,
              sets: [
                { reps: 14, weight: 0, completed: false },
                { reps: 11, weight: 0, completed: false },
              ],
            },
          ],
        },
      ],
    });

    const history = selectExerciseHistory(state, 'push-up');

    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({
      totalReps: 22,
      bestReps: 12,
      totalVolume: 0,
    });
    expect(history[1]).toMatchObject({
      totalReps: 25,
      bestReps: 14,
      totalVolume: 0,
    });
  });
});
