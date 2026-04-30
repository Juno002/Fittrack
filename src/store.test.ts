import { beforeEach, describe, expect, it } from 'vitest';

import { finalizeDraftSession } from '@/lib/workout';
import {
  createInitialAppStoreData,
  migratePersistedState,
  useStore,
} from '@/store';
import {
  selectDashboardCards,
  selectDaySummary,
  selectRecoveryCheckInByDay,
  selectTodayPlan,
} from '@/store/selectors';

describe('store migration', () => {
  it('migrates legacy persisted data and fills the new recovery defaults', () => {
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
      templates: [
        {
          id: 't1',
          name: 'Push template',
          logs: [
            {
              id: 'tl1',
              exerciseId: 'e1',
              sets: [{ reps: 10, weight: 0, completed: false }],
            },
          ],
        },
      ],
      foods: [
        {
          id: 'f1',
          dayKey: '2026-04-25',
          name: 'Avena',
          calories: 450,
          protein: 20,
          carbs: 55,
          fat: 12,
        },
      ],
      sleepLogs: [
        {
          id: 'sl1',
          dayKey: '2026-04-25',
          durationHours: 7.5,
          qualityScore: 82,
        },
      ],
      weightLogs: [
        {
          id: 'w1',
          dayKey: '2026-04-25',
          loggedAt: '2026-04-25T07:00:00.000Z',
          weight: 71,
        },
      ],
      recoveryCheckins: [
        {
          id: 'r1',
          dayKey: '2026-04-25',
          loggedAt: '2026-04-25T09:00:00.000Z',
          soreness: 7,
          energy: 0,
          stress: 4,
          notes: 'Muy cargado',
        },
      ],
      settings: {
        unitSystem: 'imperial',
        onboarded: true,
      },
      calorieGoal: 2400,
      macrosGoal: { protein: 180, carbs: 260, fat: 70 },
      profile: { name: 'Junior', age: 31, weight: 78, height: 182, gender: 'male' },
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
    expect(migrated.templates).toHaveLength(1);
    expect(migrated.foods).toHaveLength(1);
    expect(migrated.sleepLogs).toHaveLength(1);
    expect(migrated.weightLogs).toHaveLength(1);
    expect(migrated.recoveryCheckins[0]).toMatchObject({
      id: 'r1',
      soreness: 5,
      energy: 1,
      stress: 4,
      notes: 'Muy cargado',
    });
    expect(migrated.draftSession?.logs[0]?.muscleGroup).toBe('chest');
    expect(migrated.settings.connectedSignals).toEqual({ sleep: true, food: true, recovery: true });
    expect(migrated.settings.trainingSchedule).toEqual({ days: ['mon', 'wed', 'fri'], preferredTime: 'afternoon' });
    expect(migrated.settings.reminders).toEqual({ enabled: false, time: '18:30' });
    expect(migrated.profile.name).toBe('Junior');
    expect(migrated.profile.age).toBe(31);
  });
});

describe('recovery check-ins', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().hydrateAppStoreData(createInitialAppStoreData());
  });

  it('saves, replaces and deletes quick logs by day', () => {
    useStore.getState().saveRecoveryCheckIn({
      id: 'recovery-1',
      dayKey: '2026-04-29',
      soreness: 3,
      energy: 4,
      stress: 2,
      notes: 'Me siento bastante bien',
    });

    let checkIn = selectRecoveryCheckInByDay(useStore.getState(), '2026-04-29');
    expect(checkIn?.notes).toBe('Me siento bastante bien');

    useStore.getState().saveRecoveryCheckIn({
      id: 'recovery-2',
      dayKey: '2026-04-29',
      soreness: 2,
      energy: 5,
      stress: 1,
      notes: 'Mucho mejor',
    });

    expect(useStore.getState().recoveryCheckins).toHaveLength(1);
    checkIn = selectRecoveryCheckInByDay(useStore.getState(), '2026-04-29');
    expect(checkIn?.id).toBe('recovery-2');
    expect(checkIn?.energy).toBe(5);

    useStore.getState().deleteRecoveryCheckIn('recovery-2');
    expect(selectRecoveryCheckInByDay(useStore.getState(), '2026-04-29')).toBeNull();
  });
});

describe('daily planning selectors', () => {
  it('derives the current plan and exposes today quick log data', () => {
    const state = createInitialAppStoreData();
    state.settings.trainingSchedule = { days: ['wed'], preferredTime: 'morning' };
    state.recoveryCheckins = [
      {
        id: 'recovery-today',
        dayKey: '2026-04-29',
        loggedAt: '2026-04-29T09:00:00.000Z',
        soreness: 2,
        energy: 5,
        stress: 1,
        notes: 'Listo para moverme',
      },
    ];

    const referenceDate = new Date('2026-04-29T10:00:00.000Z');
    const todayPlan = selectTodayPlan(state, referenceDate);
    const daySummary = selectDaySummary(state, '2026-04-29');
    const dashboardCards = selectDashboardCards(state, referenceDate);

    expect(todayPlan.scheduledToday).toBe(true);
    expect(todayPlan.ctaLabel).toBe('Crear primera rutina');
    expect(todayPlan.tone).toBe('good');
    expect(todayPlan.steps.length).toBeGreaterThan(0);
    expect(daySummary.recoveryCheckIn?.notes).toBe('Listo para moverme');
    expect(dashboardCards.todaySummary.recoveryCheckIn?.energy).toBe(5);
  });

  it('stays neutral when the app has no training data yet', () => {
    const state = createInitialAppStoreData();
    state.settings.trainingSchedule = { days: ['wed'], preferredTime: 'morning' };

    const referenceDate = new Date('2026-04-29T10:00:00.000Z');
    const todayPlan = selectTodayPlan(state, referenceDate);
    const dashboardCards = selectDashboardCards(state, referenceDate);

    expect(dashboardCards.readiness.hasTrainingData).toBe(false);
    expect(dashboardCards.readiness.readiness).toBeLessThan(100);
    expect(todayPlan.title).toBe('Buen dia para empezar');
    expect(todayPlan.ctaLabel).toBe('Crear primera rutina');
    expect(dashboardCards.mapFocus.highestFatigueMuscle).toBeNull();
    expect(dashboardCards.mapFocus.title).toBe('Aún no hay carga acumulada');
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
