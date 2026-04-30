import { describe, expect, it } from 'vitest';

import {
  filterExercisesByTrainingMode,
  filterTemplatesByTrainingMode,
  getMovementModeLabel,
  isExerciseCompatibleWithTrainingMode,
} from '@/lib/trainingMode';
import type { ExerciseDefinition, WorkoutTemplate } from '@/store/types';

const exercise = (overrides: Partial<ExerciseDefinition>): ExerciseDefinition => ({
  id: 'push-ups',
  name: 'Flexiones',
  muscleGroup: 'chest',
  isBodyweight: true,
  mechanic: 'compound',
  iconName: 'ArrowDown',
  source: 'catalog',
  ...overrides,
});

describe('training mode helpers', () => {
  it('keeps only compatible bodyweight movements in home-no-equipment mode', () => {
    const catalog = [
      exercise({ id: 'push-ups', name: 'Flexiones' }),
      exercise({ id: 'pull-ups', name: 'Dominadas' }),
      exercise({ id: 'dumbbell-press', name: 'Press con mancuernas', isBodyweight: false }),
    ];

    expect(filterExercisesByTrainingMode(catalog, 'home-no-equipment')).toEqual([
      catalog[0],
    ]);
  });

  it('hides templates that depend on weighted or setup-heavy logs', () => {
    const templates: WorkoutTemplate[] = [
      {
        id: 'ok',
        name: 'Casa',
        createdAt: '2026-04-30T10:00:00.000Z',
        logs: [
          {
            id: 'log-1',
            exerciseId: 'push-ups',
            exerciseName: 'Flexiones',
            muscleGroup: 'chest',
            iconName: 'ArrowDown',
            isBodyweight: true,
            sets: [{ reps: 10, weight: 0, completed: false }],
          },
        ],
      },
      {
        id: 'blocked',
        name: 'Barra',
        createdAt: '2026-04-30T10:00:00.000Z',
        logs: [
          {
            id: 'log-2',
            exerciseId: 'pull-ups',
            exerciseName: 'Dominadas',
            muscleGroup: 'back',
            iconName: 'ArrowUp',
            isBodyweight: true,
            sets: [{ reps: 6, weight: 0, completed: false }],
          },
        ],
      },
    ];

    expect(filterTemplatesByTrainingMode(templates, 'home-no-equipment')).toEqual([
      templates[0],
    ]);
  });

  it('uses no-equipment copy when the mode is locked to home', () => {
    expect(isExerciseCompatibleWithTrainingMode(exercise({ id: 'dips', name: 'Fondos' }), 'home-no-equipment')).toBe(false);
    expect(getMovementModeLabel(true, 'home-no-equipment')).toBe('Sin equipo');
    expect(getMovementModeLabel(false, 'general')).toBe('Carga externa');
  });
});
