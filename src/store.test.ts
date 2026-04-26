import { describe, expect, it } from 'vitest';

import { finalizeDraftSession } from '@/lib/workout';
import { migratePersistedState } from '@/store';

describe('store migration', () => {
  it('migrates legacy persisted sessions and active drafts to the new model', () => {
    const migrated = migratePersistedState({
      exercises: [
        {
          id: 'e1',
          name: 'Push-up',
          muscleGroup: 'chest',
          iconName: 'ArrowDown',
          isBodyweight: true,
        },
      ],
      sessions: [
        {
          id: 's1',
          date: '2026-04-25T14:00:00.000Z',
          name: 'Legacy session',
          durationSeconds: 900,
          logs: [
            {
              id: 'l1',
              exerciseId: 'e1',
              sets: [{ reps: 12, weight: 0, completed: true }],
            },
          ],
        },
      ],
      activeSession: {
        name: 'Open draft',
        startTime: Date.parse('2026-04-26T16:00:00.000Z'),
        logs: [
          {
            id: 'l2',
            exerciseId: 'e1',
            sets: [{ reps: 8, weight: 0 }],
          },
        ],
      },
    });

    expect(migrated.sessions[0]?.dayKey).toBe('2026-04-25');
    expect(migrated.sessions[0]?.logs[0]?.exerciseName).toBe('Push-up');
    expect(migrated.draftSession?.logs[0]?.muscleGroup).toBe('chest');
  });
});

describe('draft finalization', () => {
  it('rejects empty drafts and keeps only valid sets', () => {
    const session = finalizeDraftSession(
      {
        id: 'draft-1',
        name: 'Draft',
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
            sets: [
              { reps: 0, weight: 0, completed: false },
              { reps: 12, weight: 0, completed: true },
            ],
          },
        ],
      },
      4,
    );

    expect(session).not.toBeNull();
    expect(session?.logs[0]?.sets).toHaveLength(1);
    expect(session?.effort).toBe(4);
  });
});
