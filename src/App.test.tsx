import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
    vi.resetModules();
  });

  it('resumes a persisted draft session after reload', async () => {
    localStorage.setItem('fittrack-storage', JSON.stringify({
      state: {
        customExercises: [],
        sessions: [],
        foods: [],
        sleepLogs: [],
        calorieGoal: 2000,
        macrosGoal: { protein: 150, carbs: 200, fat: 65 },
        settings: { unitSystem: 'metric', onboarded: true },
        weightLogs: [],
        templates: [],
        profile: { age: 25, weight: 70, height: 175, gender: 'male' },
        draftSession: {
          id: 'draft-1',
          name: 'Reloaded draft',
          startedAt: '2026-04-26T15:00:00.000Z',
          restDurationSeconds: 60,
          restTimerEndsAt: null,
          logs: [
            {
              id: 'log-1',
              exerciseId: 'push-up',
              exerciseName: 'Push-up',
              muscleGroup: 'chest',
              iconName: 'ArrowDown',
              isBodyweight: true,
              mechanic: 'compound',
              secondaryTargets: { triceps: 0.5, shoulders: 0.25 },
              progressionTrackId: null,
              progressionStep: null,
              coachModeling: 'curated',
              sets: [{ reps: 10, weight: 0, completed: false }],
            },
          ],
        },
      },
      version: 2,
    }));

    const { default: App } = await import('@/App');
    render(<App />);

    expect(await screen.findByDisplayValue('Reloaded draft')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /finalizar/i })).toBeInTheDocument();
  });
});
