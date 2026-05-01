import { describe, expect, it } from 'vitest';

import { resolveExerciseVisualMatch } from '@/lib/exerciseVisuals';

describe('exercise visual resolution', () => {
  it('prioritizes explicit visualKey over catalog and alias matches', () => {
    const match = resolveExerciseVisualMatch({
      id: 'Plank',
      name: 'Push-Up Wide',
      muscleGroup: 'core',
      visualKey: 'push-up',
    });

    expect(match?.kind).toBe('visual');
    expect(match?.kind === 'visual' ? match.visualKey : null).toBe('push-up');
    expect(match?.source).toBe('explicit');
  });

  it('prioritizes catalog visualKey over alias resolution', () => {
    const match = resolveExerciseVisualMatch({
      id: 'Plank',
      name: 'Push-Up Wide',
      muscleGroup: 'core',
    });

    expect(match?.kind).toBe('visual');
    expect(match?.kind === 'visual' ? match.visualKey : null).toBe('plank');
    expect(match?.source).toBe('catalog');
  });

  it('resolves known aliases by id or name', () => {
    const match = resolveExerciseVisualMatch({
      id: 'custom-wide-push',
      name: 'Pushups',
      muscleGroup: 'chest',
    });

    expect(match?.kind).toBe('visual');
    expect(match?.kind === 'visual' ? match.visualKey : null).toBe('push-up');
    expect(match?.source).toBe('alias');
  });

  it('falls back to muscleGroup when there is no visual match', () => {
    const match = resolveExerciseVisualMatch({
      id: 'Barbell_Row',
      name: 'Barbell Row',
      muscleGroup: 'back',
    });

    expect(match?.kind).toBe('muscle-fallback');
    expect(match?.source).toBe('muscle-group');
  });

  it('falls back to the legacy icon when there is no visual or muscle fallback', () => {
    const match = resolveExerciseVisualMatch({
      id: 'legacy-unknown',
      name: 'Legacy Unknown',
      iconName: 'Timer',
    });

    expect(match?.kind).toBe('legacy-icon');
    expect(match?.source).toBe('legacy-icon');
  });
});
