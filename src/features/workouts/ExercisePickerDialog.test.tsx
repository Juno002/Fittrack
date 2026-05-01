import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExercisePickerDialog } from '@/features/workouts/ExercisePickerDialog';
import { createInitialAppStoreData, useStore } from '@/store';

describe('ExercisePickerDialog visuals', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().hydrateAppStoreData(createInitialAppStoreData());
  });

  afterEach(() => {
    cleanup();
  });

  it('renders technical visuals in the list and expanded preview', async () => {
    const user = userEvent.setup();

    render(
      <ExercisePickerDialog
        open
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
        onCreateCustomExercise={vi.fn()}
      />,
    );

    expect(await screen.findByRole('img', { name: /visual de flexiones \(push-ups\)/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /flexiones \(push-ups\)/i }));

    expect(await screen.findByRole('button', { name: /añadir ahora/i })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /visual de flexiones \(push-ups\)/i }).length).toBeGreaterThan(1);
  });
});
