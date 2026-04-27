import { describe, expect, it } from 'vitest';

import { getNextProgressionStep, normalizeExerciseValue } from '@/lib/exercises';

describe('exercise normalization', () => {
  it('maps legacy arm isolation exercises to biceps', () => {
    const exercise = normalizeExerciseValue({
      id: 'Hammer_Curl',
      name: 'Hammer Curl',
      muscleGroup: 'arms',
      isBodyweight: false,
      mechanic: 'isolation',
    });

    expect(exercise?.muscleGroup).toBe('biceps');
    expect(exercise?.coachModeling).toBe('curated');
  });

  it('reclassifies mis-primarized bench work to chest with indirect volume', () => {
    const exercise = normalizeExerciseValue({
      id: 'Bench_Press_-_Powerlifting',
      name: 'Bench Press - Powerlifting',
      muscleGroup: 'arms',
      isBodyweight: false,
      mechanic: 'compound',
    });

    expect(exercise?.muscleGroup).toBe('chest');
    expect(exercise?.secondaryTargets).toEqual({ triceps: 0.5, shoulders: 0.25 });
    expect(exercise?.coachModeling).toBe('curated');
  });

  it('marks ambiguous legacy arm entries as generic', () => {
    const exercise = normalizeExerciseValue({
      id: 'Odd_Arm_Move',
      name: 'Odd Arm Move',
      muscleGroup: 'arms',
      isBodyweight: false,
      mechanic: 'isolation',
    });

    expect(exercise?.muscleGroup).toBe('biceps');
    expect(exercise?.coachModeling).toBe('generic');
  });

  it('attaches curated bodyweight progression metadata', () => {
    const exercise = normalizeExerciseValue({
      id: 'push-ups',
      name: 'Push-Ups',
      muscleGroup: 'chest',
      isBodyweight: true,
      mechanic: 'compound',
    });

    expect(exercise?.progressionTrackId).toBe('push');
    expect(exercise?.progressionStep).toBe(2);
    expect(getNextProgressionStep('push', 2)?.name).toBe('Push-Ups With Feet Elevated');
  });
});
