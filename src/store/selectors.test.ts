import { describe, expect, it } from 'vitest';

import { STARTER_EXERCISES } from '@/lib/exercises';
import { createInitialAppStoreData, type AppStoreData } from '@/store';
import { selectExerciseProgression } from '@/store/selectors';
import type { WorkoutSession } from '@/store/types';
import { toDayKey } from '@/lib/dates';

function createSession(performedAt: string): WorkoutSession {
  const pushUps = STARTER_EXERCISES.find((exercise) => exercise.id === 'push-ups');
  if (!pushUps) {
    throw new Error('Starter push-ups exercise is required for progression tests.');
  }

  return {
    id: 'session-push',
    name: 'Push progression',
    performedAt,
    dayKey: toDayKey(performedAt),
    durationSeconds: 1200,
    effort: 3,
    logs: [
      {
        id: 'log-push',
        exerciseId: pushUps.id,
        exerciseName: pushUps.name,
        muscleGroup: pushUps.muscleGroup,
        iconName: pushUps.iconName,
        isBodyweight: pushUps.isBodyweight,
        mechanic: pushUps.mechanic,
        secondaryTargets: { ...pushUps.secondaryTargets },
        progressionTrackId: pushUps.progressionTrackId,
        progressionStep: pushUps.progressionStep,
        coachModeling: pushUps.coachModeling,
        sets: [
          { reps: 13, weight: 0, completed: true },
          { reps: 14, weight: 0, completed: true },
        ],
      },
    ],
  };
}

describe('selectors progression', () => {
  it('unlocks the next bodyweight progression step after easy 12+ rep work', () => {
    const pushUps = STARTER_EXERCISES.find((exercise) => exercise.id === 'push-ups');
    if (!pushUps) {
      throw new Error('Starter push-ups exercise is required for progression tests.');
    }

    const state: AppStoreData = {
      ...createInitialAppStoreData(),
      sessions: [createSession('2026-04-27T12:00:00.000Z')],
    };

    const progression = selectExerciseProgression(state, pushUps);

    expect(progression).not.toBeNull();
    expect(progression?.shouldAdvance).toBe(true);
    expect(progression?.nextStep?.name).toBe('Push-Ups With Feet Elevated');
  });
});
