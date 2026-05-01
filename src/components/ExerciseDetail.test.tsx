import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExerciseDetail } from '@/components/ExerciseDetail';
import { createInitialAppStoreData, useStore } from '@/store';
import type { ExerciseDefinition } from '@/store/types';

const EXERCISE: ExerciseDefinition = {
  id: 'plank',
  name: 'Plancha (Plank)',
  muscleGroup: 'core',
  visualKey: 'plank',
  isBodyweight: true,
  mechanic: 'isometric',
  description: 'Mantén el cuerpo alineado y el abdomen activo.',
  formGuidance: ['Aprieta el core', 'No dejes caer la cadera'],
  iconName: 'Timer',
  source: 'legacy',
};

describe('ExerciseDetail visuals', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().hydrateAppStoreData(createInitialAppStoreData());
    vi.stubGlobal('open', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows the movement section and gracefully falls back when there is no end pose asset', async () => {
    render(
      <ExerciseDetail
        exercise={EXERCISE}
        open
        onOpenChange={() => {}}
        onAddWorkout={() => {}}
      />,
    );

    expect(await screen.findByText('Pose A a Pose B')).toBeInTheDocument();
    expect(screen.getByText('Postura base')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /visual de plancha \(plank\)/i })).toBeInTheDocument();
  });
});
