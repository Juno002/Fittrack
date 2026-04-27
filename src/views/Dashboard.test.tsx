import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { STARTER_EXERCISES } from '@/lib/exercises';
import { createInitialAppStoreData, useStore } from '@/store';
import { Dashboard } from '@/views/Dashboard';

vi.mock('@/hooks/useExerciseCatalog', () => ({
  useExerciseCatalog: () => ({
    exercises: STARTER_EXERCISES,
    isLoading: false,
  }),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    useStore.setState(createInitialAppStoreData());
  });

  it('renders the zone-based coach UI without legacy fatigue percentages', () => {
    const pushUps = STARTER_EXERCISES.find((exercise) => exercise.id === 'push-ups');
    if (!pushUps) {
      throw new Error('Starter push-ups exercise is required for dashboard test.');
    }

    useStore.setState({
      customExercises: STARTER_EXERCISES,
      sessions: [
        {
          id: 'session-dashboard',
          name: 'Push Day',
          performedAt: '2026-04-27T08:00:00.000Z',
          dayKey: '2026-04-27',
          durationSeconds: 1800,
          effort: 3,
          logs: [
            {
              id: 'log-dashboard',
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
                { reps: 10, weight: 0, completed: true },
                { reps: 10, weight: 0, completed: true },
              ],
            },
          ],
        },
      ],
    });

    render(<Dashboard onOpenWorkout={vi.fn()} />);

    expect(screen.getByText(/coach científico/i)).toBeInTheDocument();
    expect(screen.getByText(/estados musculares/i)).toBeInTheDocument();
    expect(screen.queryByText(/% fatiga/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/% preparación/i)).not.toBeInTheDocument();
  });
});
