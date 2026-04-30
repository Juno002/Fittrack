import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WorkoutFocusView } from '@/features/workouts/WorkoutFocusView';
import type { DraftSession } from '@/store/types';

const DRAFT_SESSION: DraftSession = {
  id: 'draft-1',
  name: 'Upper routine',
  startedAt: '2026-04-29T10:00:00.000Z',
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
      sets: [{ reps: 10, weight: 0, completed: false }],
    },
  ],
};

function findTimerValue(value: number) {
  return screen.getAllByText((_, node) => node?.textContent === `${value}s`).at(-1);
}

describe('WorkoutFocusView timer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps counting down while the session clock updates from the parent', () => {
    vi.useFakeTimers();

    const advanceSpy = vi.fn();
    const onAdvanceGuidedStep = () => advanceSpy();
    const baseProps = {
      draftSession: DRAFT_SESSION,
      guidedStepIndex: 0,
      onAdvanceGuidedStep,
      onClearStoredRest: vi.fn(),
      onToggleSetCompleted: vi.fn(),
      onFinish: vi.fn(),
      onGoToEdit: vi.fn(),
    };

    const { rerender } = render(
      <WorkoutFocusView
        {...baseProps}
        elapsedSeconds={0}
      />,
    );

    expect(findTimerValue(60)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    rerender(
      <WorkoutFocusView
        {...baseProps}
        elapsedSeconds={1}
      />,
    );

    expect(findTimerValue(59)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    rerender(
      <WorkoutFocusView
        {...baseProps}
        elapsedSeconds={2}
      />,
    );

    expect(findTimerValue(58)).toBeInTheDocument();
  });

  it('renders the local guided visual when the current step has a visual match', () => {
    render(
      <WorkoutFocusView
        draftSession={DRAFT_SESSION}
        elapsedSeconds={0}
        guidedStepIndex={0}
        onAdvanceGuidedStep={vi.fn()}
        onClearStoredRest={vi.fn()}
        onToggleSetCompleted={vi.fn()}
        onFinish={vi.fn()}
        onGoToEdit={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('img', { name: /guia visual de circulos de brazos/i }).length).toBeGreaterThan(0);
  });

  it('shows preparation semantics for the transition step', () => {
    render(
      <WorkoutFocusView
        draftSession={DRAFT_SESSION}
        elapsedSeconds={60}
        guidedStepIndex={3}
        onAdvanceGuidedStep={vi.fn()}
        onClearStoredRest={vi.fn()}
        onToggleSetCompleted={vi.fn()}
        onFinish={vi.fn()}
        onGoToEdit={vi.fn()}
      />,
    );

    expect(screen.getByText('PREPARACIÓN')).toBeInTheDocument();
    expect(screen.getByText('Prepárate para empezar')).toBeInTheDocument();
    expect(screen.queryByText('DESCANSO')).not.toBeInTheDocument();
  });
});
