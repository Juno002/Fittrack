import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppStoreData } from '@/store';

function createPersistedState(overrides: Partial<AppStoreData> = {}): AppStoreData {
  return {
    customExercises: [],
    sessions: [],
    templates: [],
    foods: [],
    sleepLogs: [],
    weightLogs: [],
    recoveryCheckins: [],
    calorieGoal: 2000,
    macrosGoal: { protein: 150, carbs: 200, fat: 65 },
    settings: {
      unitSystem: 'metric',
      onboarded: true,
      defaultRestDuration: 75,
      connectedSignals: { sleep: true, food: true, recovery: true },
      trainingSchedule: { days: ['mon', 'wed', 'fri'], preferredTime: 'afternoon' },
      reminders: { enabled: false, time: '18:30' },
    },
    profile: { name: 'Junior', age: 25, weight: 70, height: 175, gender: 'male' },
    draftSession: null,
    ...overrides,
  };
}

async function loadFreshModules() {
  vi.resetModules();
  const [{ default: App }, { useStore }] = await Promise.all([import('@/App'), import('@/store')]);
  return { App, useStore };
}

async function loadFreshOnboarding() {
  vi.resetModules();
  const [{ Onboarding }, { useStore }] = await Promise.all([import('@/views/Onboarding'), import('@/store')]);
  return { Onboarding, useStore };
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    cleanup();
  });

  it('completes onboarding and persists the local setup', async () => {
    const user = userEvent.setup();
    const { Onboarding, useStore } = await loadFreshOnboarding();
    useStore.getState().hydrateAppStoreData({
      ...createPersistedState(),
      profile: { name: '', age: 25, weight: 70, height: 175, gender: 'male' },
      weightLogs: [],
      settings: {
        ...createPersistedState().settings,
        onboarded: false,
      },
    });

    render(<Onboarding />);

    await user.click(await screen.findByRole('button', { name: /empezar/i }));
    await user.type(await screen.findByRole('textbox', { name: 'Nombre' }), 'Junior');

    for (let step = 0; step < 4; step += 1) {
      await user.click(await screen.findByRole('button', { name: /siguiente/i }));
    }

    await user.click(await screen.findByRole('button', { name: /entrar a inicio/i }));

    expect(useStore.getState().settings.onboarded).toBe(true);
    expect(useStore.getState().profile.name).toBe('Junior');
    expect(useStore.getState().weightLogs).toHaveLength(1);
  }, 15000);

  it('shows the five-tab shell, saves a quick log and exposes profile backup actions', async () => {
    const user = userEvent.setup();
    const { App, useStore } = await loadFreshModules();
    useStore.getState().hydrateAppStoreData(createPersistedState());

    render(<App />);

    await screen.findByRole('heading', { name: 'Hoy' });
    expect(screen.getByRole('button', { name: 'Inicio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mapa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrenar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Progreso' })).toBeInTheDocument();

    await user.type(screen.getByRole('textbox'), 'Rodillas frescas');
    const quickLogButtons = screen.getAllByRole('button', { name: /guardar quick log/i });
    await user.click(quickLogButtons[0]!);

    await waitFor(() => {
      expect(useStore.getState().recoveryCheckins).toHaveLength(1);
    });
    expect(await screen.findByText('Guardado ✓')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Registro' }));
    expect(await screen.findByText('Rodillas frescas')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Inicio' }));
    await user.click(screen.getByRole('button', { name: /abrir ajustes/i }));

    expect(await screen.findByRole('button', { name: /exportar backup/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /importar backup/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inicio' })).toBeInTheDocument();

    const ageInput = screen.getByRole('spinbutton', { name: 'Edad' });
    await user.clear(ageInput);
    await user.type(ageInput, '29');
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(useStore.getState().profile.age).toBe(29);
    expect(await screen.findByText('Guardado ✓')).toBeInTheDocument();
  });

  it('opens an existing draft session with its saved name intact', async () => {
    const draftState = createPersistedState({
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
            sets: [{ reps: 10, weight: 0, completed: false }],
          },
        ],
      },
    });

    const user = userEvent.setup();
    const { App, useStore } = await loadFreshModules();
    useStore.getState().hydrateAppStoreData(draftState);

    render(<App />);

    await user.click(await screen.findByRole('button', { name: /editar/i }));
    expect(await screen.findByDisplayValue('Reloaded draft')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /finalizar/i })).toBeInTheDocument();
  });
});
