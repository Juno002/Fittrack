import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { dayKeyToIso, toDayKey } from '@/lib/dates';
import { getExerciseIconName, STARTER_EXERCISES } from '@/lib/exercises';
import {
  buildWorkoutLog,
  createDraftSession,
  createWorkoutSet,
  duplicateWorkoutLog,
  finalizeDraftSession as buildFinalSession,
} from '@/lib/workout';
import type {
  CustomExercise,
  DraftSession,
  DraftSessionSeed,
  ExerciseDefinition,
  FoodEntry,
  MacroGoal,
  SleepLog,
  UserProfile,
  WorkoutLog,
  WorkoutSession,
  WorkoutSet,
  WorkoutTemplate,
  BodyWeightLog,
} from '@/store/types';

export type {
  CustomExercise,
  DraftSession,
  DraftSessionSeed,
  ExerciseCatalogEntry,
  ExerciseDefinition,
  ExerciseIconName,
  FoodEntry,
  MacroGoal,
  MuscleGroup,
  SleepLog,
  UserProfile,
  WorkoutLog,
  WorkoutSession,
  WorkoutSet,
} from '@/store/types';

export const STORAGE_KEY = 'fittrack-storage';
const STORAGE_VERSION = 2;
const MUSCLE_GROUPS = new Set(['chest', 'back', 'legs', 'shoulders', 'arms', 'core']);

const DEFAULT_PROFILE: UserProfile = {
  age: 25,
  weight: 70,
  height: 175,
  gender: 'male',
};

const DEFAULT_MACROS: MacroGoal = {
  protein: 150,
  carbs: 200,
  fat: 65,
};

export interface AppStoreData {
  customExercises: CustomExercise[];
  sessions: WorkoutSession[];
  templates: WorkoutTemplate[];
  foods: FoodEntry[];
  sleepLogs: SleepLog[];
  weightLogs: BodyWeightLog[];
  settings: {
    unitSystem: 'metric' | 'imperial';
    onboarded: boolean;
  };
  calorieGoal: number;
  macrosGoal: MacroGoal;
  profile: UserProfile;
  draftSession: DraftSession | null;
}

interface AppActions {
  saveCustomExercise: (exercise: Omit<CustomExercise, 'createdAt' | 'source' | 'iconName'> & Partial<Pick<CustomExercise, 'createdAt' | 'iconName'>>) => ExerciseDefinition;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<AppStoreData['settings']>) => void;
  logBodyWeight: (weight: number) => void;
  setCalorieGoal: (goal: number) => void;
  setMacrosGoal: (goal: MacroGoal) => void;
  saveFoodEntry: (entry: Omit<FoodEntry, 'consumedAt'> & { consumedAt?: string }) => void;
  deleteFoodEntry: (id: string) => void;
  saveSleepLog: (entry: Omit<SleepLog, 'loggedAt'> & { loggedAt?: string }) => void;
  deleteSleepLog: (id: string) => void;
  startDraftSession: (seed?: DraftSessionSeed) => void;
  discardDraftSession: () => void;
  setDraftName: (name: string) => void;
  setDraftRestDuration: (seconds: number) => void;
  clearDraftRestTimer: () => void;
  addExerciseToDraft: (exercise: ExerciseDefinition) => void;
  duplicateDraftLog: (logId: string) => void;
  removeDraftLog: (logId: string) => void;
  toggleDraftLogBodyweight: (logId: string, isBodyweight: boolean) => void;
  addSetToDraftLog: (logId: string) => void;
  updateDraftSet: (logId: string, setIndex: number, changes: Partial<WorkoutSet>) => void;
  removeDraftSet: (logId: string, setIndex: number) => void;
  toggleDraftSetCompleted: (logId: string, setIndex: number) => void;
  finalizeDraftSession: (effort: number) => WorkoutSession | null;
  deleteSession: (id: string) => void;
  saveTemplate: (name: string, logs: WorkoutLog[]) => void;
  deleteTemplate: (id: string) => void;
}

export type AppState = AppStoreData & AppActions;

export function createInitialAppStoreData(): AppStoreData {
  return {
    customExercises: STARTER_EXERCISES,
    sessions: [],
    templates: [],
    foods: [],
    sleepLogs: [],
    weightLogs: [],
    settings: {
      unitSystem: 'metric',
      onboarded: false,
    },
    calorieGoal: 2000,
    macrosGoal: DEFAULT_MACROS,
    profile: DEFAULT_PROFILE,
    draftSession: null,
  };
}

function createLegacyExerciseIndex(rawExercises: unknown) {
  const index = new Map<string, { name: string; muscleGroup: string; iconName?: string; isBodyweight?: boolean }>();

  if (!Array.isArray(rawExercises)) {
    return index;
  }

  rawExercises.forEach((exercise) => {
    if (!exercise || typeof exercise !== 'object') {
      return;
    }

    const rawExercise = exercise as Record<string, unknown>;
    if (typeof rawExercise.id !== 'string' || typeof rawExercise.name !== 'string' || typeof rawExercise.muscleGroup !== 'string') {
      return;
    }

    index.set(rawExercise.id, {
      name: rawExercise.name,
      muscleGroup: rawExercise.muscleGroup,
      iconName: typeof rawExercise.iconName === 'string' ? rawExercise.iconName : undefined,
      isBodyweight: Boolean(rawExercise.isBodyweight),
    });
  });

  return index;
}

function isMacroGoal(value: unknown): value is MacroGoal {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const goal = value as Record<string, unknown>;
  return typeof goal.protein === 'number' && typeof goal.carbs === 'number' && typeof goal.fat === 'number';
}

function normalizeWorkoutLog(rawLog: unknown, exerciseIndex: Map<string, { name: string; muscleGroup: string; iconName?: string; isBodyweight?: boolean }>): WorkoutLog | null {
  if (!rawLog || typeof rawLog !== 'object') {
    return null;
  }

  const legacyLog = rawLog as Record<string, unknown>;
  const exerciseId = typeof legacyLog.exerciseId === 'string' ? legacyLog.exerciseId : 'exercise';
  const exercise = exerciseIndex.get(exerciseId);
  const muscleGroup = MUSCLE_GROUPS.has(exercise?.muscleGroup ?? '')
    ? exercise!.muscleGroup as WorkoutLog['muscleGroup']
    : 'core';

  return {
    id: typeof legacyLog.id === 'string' ? legacyLog.id : `log-${exerciseId}`,
    exerciseId,
    exerciseName: typeof legacyLog.exerciseName === 'string'
      ? legacyLog.exerciseName
      : exercise?.name ?? exerciseId.replace(/_/g, ' '),
    muscleGroup,
    iconName: typeof legacyLog.iconName === 'string'
      ? legacyLog.iconName as WorkoutLog['iconName']
      : getExerciseIconName(muscleGroup, exercise?.iconName),
    isBodyweight: typeof legacyLog.isBodyweight === 'boolean' ? legacyLog.isBodyweight : Boolean(exercise?.isBodyweight),
    sets: Array.isArray(legacyLog.sets)
      ? legacyLog.sets.map((set) => createWorkoutSet(set as Partial<WorkoutSet>))
      : [],
  };
}

function normalizeSession(rawSession: unknown, exerciseIndex: Map<string, { name: string; muscleGroup: string; iconName?: string; isBodyweight?: boolean }>): WorkoutSession | null {
  if (!rawSession || typeof rawSession !== 'object') {
    return null;
  }

  const legacySession = rawSession as Record<string, unknown>;
  const performedAt = typeof legacySession.performedAt === 'string'
    ? legacySession.performedAt
    : typeof legacySession.date === 'string'
      ? legacySession.date
      : new Date().toISOString();
  const effort = typeof legacySession.effort === 'number' ? legacySession.effort : 3;
  const logs = Array.isArray(legacySession.logs)
    ? legacySession.logs
        .map((log) => normalizeWorkoutLog(log, exerciseIndex))
        .filter((log): log is WorkoutLog => log !== null)
    : [];

  return {
    id: typeof legacySession.id === 'string' ? legacySession.id : `session-${performedAt}`,
    name: typeof legacySession.name === 'string' ? legacySession.name : 'Training Session',
    performedAt,
    dayKey: typeof legacySession.dayKey === 'string' ? legacySession.dayKey : toDayKey(performedAt),
    durationSeconds: typeof legacySession.durationSeconds === 'number' ? legacySession.durationSeconds : 0,
    effort,
    logs,
  };
}

function normalizeFoodEntry(rawEntry: unknown): FoodEntry | null {
  if (!rawEntry || typeof rawEntry !== 'object') {
    return null;
  }

  const entry = rawEntry as Record<string, unknown>;
  const dayKey = typeof entry.dayKey === 'string'
    ? entry.dayKey
    : typeof entry.date === 'string'
      ? entry.date
      : toDayKey();

  return {
    id: typeof entry.id === 'string' ? entry.id : `food-${dayKey}`,
    dayKey,
    consumedAt: typeof entry.consumedAt === 'string' ? entry.consumedAt : dayKeyToIso(dayKey, 12),
    name: typeof entry.name === 'string' ? entry.name : 'Meal',
    calories: typeof entry.calories === 'number' ? entry.calories : 0,
    protein: typeof entry.protein === 'number' ? entry.protein : 0,
    carbs: typeof entry.carbs === 'number' ? entry.carbs : 0,
    fat: typeof entry.fat === 'number' ? entry.fat : 0,
  };
}

function normalizeSleepLog(rawEntry: unknown): SleepLog | null {
  if (!rawEntry || typeof rawEntry !== 'object') {
    return null;
  }

  const entry = rawEntry as Record<string, unknown>;
  const dayKey = typeof entry.dayKey === 'string'
    ? entry.dayKey
    : typeof entry.date === 'string'
      ? entry.date
      : toDayKey();

  return {
    id: typeof entry.id === 'string' ? entry.id : `sleep-${dayKey}`,
    dayKey,
    loggedAt: typeof entry.loggedAt === 'string' ? entry.loggedAt : dayKeyToIso(dayKey, 8),
    durationHours: typeof entry.durationHours === 'number' ? entry.durationHours : 0,
    qualityScore: typeof entry.qualityScore === 'number' ? entry.qualityScore : 0,
  };
}

function normalizeCustomExercises(rawExercises: unknown): CustomExercise[] {
  if (!Array.isArray(rawExercises)) {
    return STARTER_EXERCISES;
  }

  const normalized = rawExercises
    .map((exercise) => {
      if (!exercise || typeof exercise !== 'object') {
        return null;
      }

      const value = exercise as Record<string, unknown>;
      if (
        typeof value.id !== 'string' ||
        typeof value.name !== 'string' ||
        typeof value.muscleGroup !== 'string' ||
        !MUSCLE_GROUPS.has(value.muscleGroup)
      ) {
        return null;
      }

      return {
        id: value.id,
        name: value.name,
        muscleGroup: value.muscleGroup as CustomExercise['muscleGroup'],
        isBodyweight: Boolean(value.isBodyweight),
        mechanic: typeof value.mechanic === 'string' ? value.mechanic : null,
        iconName: getExerciseIconName(value.muscleGroup as CustomExercise['muscleGroup'], typeof value.iconName === 'string' ? value.iconName : undefined),
        source: value.source === 'custom' ? 'custom' : 'legacy',
        createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
      } as CustomExercise;
    })
    .filter((exercise): exercise is CustomExercise => exercise !== null);

  return normalized.length > 0 ? normalized : STARTER_EXERCISES;
}

export function migratePersistedState(persistedState: unknown): AppStoreData {
  const defaults = createInitialAppStoreData();

  if (!persistedState || typeof persistedState !== 'object') {
    return defaults;
  }

  const rawState = persistedState as Record<string, unknown>;
  const exerciseIndex = createLegacyExerciseIndex(rawState.exercises);
  const customExercises = normalizeCustomExercises(rawState.customExercises ?? rawState.exercises);
  customExercises.forEach((exercise) => {
    exerciseIndex.set(exercise.id, {
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      iconName: exercise.iconName,
      isBodyweight: exercise.isBodyweight,
    });
  });

  const sessions = Array.isArray(rawState.sessions)
    ? rawState.sessions
        .map((session) => normalizeSession(session, exerciseIndex))
        .filter((session): session is WorkoutSession => session !== null)
    : [];
  const foods = Array.isArray(rawState.foods)
    ? rawState.foods
        .map(normalizeFoodEntry)
        .filter((entry): entry is FoodEntry => entry !== null)
    : [];
  const sleepLogs = Array.isArray(rawState.sleepLogs)
    ? rawState.sleepLogs
        .map(normalizeSleepLog)
        .filter((entry): entry is SleepLog => entry !== null)
    : [];
  const draftSessionSource = rawState.draftSession ?? rawState.activeSession;
  const draftSession = (() => {
    if (!draftSessionSource || typeof draftSessionSource !== 'object') {
      return null;
    }

    const legacyDraft = draftSessionSource as Record<string, unknown>;
    const logs = Array.isArray(legacyDraft.logs)
      ? legacyDraft.logs
          .map((log) => normalizeWorkoutLog(log, exerciseIndex))
          .filter((log): log is WorkoutLog => log !== null)
      : [];

    return createDraftSession({
      name: typeof legacyDraft.name === 'string' ? legacyDraft.name : '',
      startedAt: typeof legacyDraft.startedAt === 'string'
        ? legacyDraft.startedAt
        : typeof legacyDraft.startTime === 'number'
          ? new Date(legacyDraft.startTime).toISOString()
          : new Date().toISOString(),
      logs,
      restDurationSeconds: typeof legacyDraft.restDurationSeconds === 'number'
        ? legacyDraft.restDurationSeconds
        : 60,
      restTimerEndsAt: typeof legacyDraft.restTimerEndsAt === 'string' ? legacyDraft.restTimerEndsAt : null,
    });
  })();

  return {
    customExercises,
    sessions,
    foods,
    sleepLogs,
    templates: Array.isArray(rawState.templates) ? rawState.templates : defaults.templates,
    weightLogs: Array.isArray(rawState.weightLogs) ? rawState.weightLogs : defaults.weightLogs,
    settings: rawState.settings && typeof rawState.settings === 'object' 
      ? { ...defaults.settings, ...rawState.settings }
      : defaults.settings,
    calorieGoal: typeof rawState.calorieGoal === 'number' ? rawState.calorieGoal : defaults.calorieGoal,
    macrosGoal: isMacroGoal(rawState.macrosGoal) ? rawState.macrosGoal : defaults.macrosGoal,
    profile: {
      ...defaults.profile,
      ...(rawState.profile && typeof rawState.profile === 'object' ? rawState.profile as Partial<UserProfile> : {}),
    },
    draftSession,
  };
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...createInitialAppStoreData(),

      saveCustomExercise: (exerciseInput) => {
        const exercise = {
          id: exerciseInput.id,
          name: exerciseInput.name,
          muscleGroup: exerciseInput.muscleGroup,
          isBodyweight: exerciseInput.isBodyweight,
          mechanic: exerciseInput.mechanic,
          iconName: exerciseInput.iconName ?? getExerciseIconName(exerciseInput.muscleGroup),
          source: 'custom',
          createdAt: exerciseInput.createdAt ?? new Date().toISOString(),
        } satisfies CustomExercise;

        set((state) => ({
          customExercises: state.customExercises.some((entry) => entry.id === exercise.id)
            ? state.customExercises.map((entry) => (entry.id === exercise.id ? exercise : entry))
            : [exercise, ...state.customExercises],
        }));

        return exercise;
      },

      updateProfile: (profile) =>
        set((state) => ({
          profile: { ...state.profile, ...profile },
        })),
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
      logBodyWeight: (weight) => set((state) => {
        const todayKey = toDayKey(new Date());
        const existing = state.weightLogs.find(l => l.dayKey === todayKey);
        
        const newLogs = [...state.weightLogs];
        if (existing) {
          existing.weight = weight;
        } else {
          newLogs.push({
            id: crypto.randomUUID(),
            dayKey: todayKey,
            loggedAt: new Date().toISOString(),
            weight,
          });
        }
        
        // Also update profile
        return {
          weightLogs: newLogs,
          profile: { ...state.profile, weight },
        };
      }),
      setCalorieGoal: (goal) => set({ calorieGoal: goal }),
      setMacrosGoal: (goal) => set({ macrosGoal: goal }),

      saveFoodEntry: (entry) => set((state) => ({
        foods: state.foods
          .filter((food) => food.id !== entry.id)
          .concat({
            ...entry,
            consumedAt: entry.consumedAt ?? dayKeyToIso(entry.dayKey, 12),
          })
          .sort((left, right) => right.consumedAt.localeCompare(left.consumedAt)),
      })),
      deleteFoodEntry: (id) => set((state) => ({ foods: state.foods.filter((food) => food.id !== id) })),

      saveSleepLog: (entry) => set((state) => ({
        sleepLogs: state.sleepLogs
          .filter((log) => log.id !== entry.id)
          .concat({
            ...entry,
            loggedAt: entry.loggedAt ?? dayKeyToIso(entry.dayKey, 8),
          })
          .sort((left, right) => right.dayKey.localeCompare(left.dayKey)),
      })),
      deleteSleepLog: (id) => set((state) => ({ sleepLogs: state.sleepLogs.filter((log) => log.id !== id) })),

      startDraftSession: (seed) => set({ draftSession: createDraftSession(seed) }),
      discardDraftSession: () => set({ draftSession: null }),
      setDraftName: (name) => set((state) => ({
        draftSession: state.draftSession ? { ...state.draftSession, name } : state.draftSession,
      })),
      setDraftRestDuration: (seconds) => set((state) => ({
        draftSession: state.draftSession
          ? { ...state.draftSession, restDurationSeconds: Math.max(15, seconds) }
          : state.draftSession,
      })),
      clearDraftRestTimer: () => set((state) => ({
        draftSession: state.draftSession ? { ...state.draftSession, restTimerEndsAt: null } : state.draftSession,
      })),
      addExerciseToDraft: (exercise) => set((state) => ({
        draftSession: state.draftSession
          ? {
              ...state.draftSession,
              logs: [...state.draftSession.logs, buildWorkoutLog(exercise)],
            }
          : createDraftSession({ logs: [buildWorkoutLog(exercise)] }),
      })),
      duplicateDraftLog: (logId) => set((state) => ({
        draftSession: state.draftSession
          ? {
              ...state.draftSession,
              logs: state.draftSession.logs.flatMap((log) => (
                log.id === logId ? [log, duplicateWorkoutLog(log)] : [log]
              )),
            }
          : state.draftSession,
      })),
      removeDraftLog: (logId) => set((state) => ({
        draftSession: state.draftSession
          ? {
              ...state.draftSession,
              logs: state.draftSession.logs.filter((log) => log.id !== logId),
            }
          : state.draftSession,
      })),
      toggleDraftLogBodyweight: (logId, isBodyweight) => set((state) => ({
        draftSession: state.draftSession
          ? {
              ...state.draftSession,
              logs: state.draftSession.logs.map((log) => (
                log.id === logId ? { ...log, isBodyweight } : log
              )),
            }
          : state.draftSession,
      })),
      addSetToDraftLog: (logId) => set((state) => ({
        draftSession: state.draftSession
          ? {
              ...state.draftSession,
              logs: state.draftSession.logs.map((log) => {
                if (log.id !== logId) {
                  return log;
                }

                const lastSet = log.sets[log.sets.length - 1];

                return {
                  ...log,
                  sets: [
                    ...log.sets,
                    createWorkoutSet({
                      reps: lastSet?.reps ?? (log.isBodyweight ? 10 : 8),
                      weight: log.isBodyweight ? 0 : lastSet?.weight ?? 0,
                    }),
                  ],
                };
              }),
            }
          : state.draftSession,
      })),
      updateDraftSet: (logId, setIndex, changes) => set((state) => ({
        draftSession: state.draftSession
          ? {
              ...state.draftSession,
              logs: state.draftSession.logs.map((log) => {
                if (log.id !== logId) {
                  return log;
                }

                return {
                  ...log,
                  sets: log.sets.map((set, index) => (
                    index === setIndex ? createWorkoutSet({ ...set, ...changes }) : set
                  )),
                };
              }),
            }
          : state.draftSession,
      })),
      removeDraftSet: (logId, setIndex) => set((state) => ({
        draftSession: state.draftSession
          ? {
              ...state.draftSession,
              logs: state.draftSession.logs.map((log) => (
                log.id === logId
                  ? { ...log, sets: log.sets.filter((_, index) => index !== setIndex) }
                  : log
              )),
            }
          : state.draftSession,
      })),
      toggleDraftSetCompleted: (logId, setIndex) => set((state) => {
        if (!state.draftSession) {
          return { draftSession: state.draftSession };
        }

        let restTimerEndsAt = state.draftSession.restTimerEndsAt;

        const logs = state.draftSession.logs.map((log) => {
          if (log.id !== logId) {
            return log;
          }

          return {
            ...log,
            sets: log.sets.map((set, index) => {
              if (index !== setIndex) {
                return set;
              }

              const completed = !set.completed;

              if (completed) {
                restTimerEndsAt = new Date(Date.now() + (state.draftSession?.restDurationSeconds ?? 60) * 1000).toISOString();
              }

              return { ...set, completed };
            }),
          };
        });

        return {
          draftSession: {
            ...state.draftSession,
            logs,
            restTimerEndsAt,
          },
        };
      }),
      finalizeDraftSession: (effort) => {
        let finalSession: WorkoutSession | null = null;

        set((state) => {
          if (!state.draftSession) {
            return state;
          }

          finalSession = buildFinalSession(state.draftSession, effort);
          if (!finalSession) {
            return state;
          }

          return {
            draftSession: null,
            sessions: [finalSession, ...state.sessions].sort((left, right) => right.performedAt.localeCompare(left.performedAt)),
          };
        });

        return finalSession;
      },
      deleteSession: (id) => set((state) => ({ sessions: state.sessions.filter((session) => session.id !== id) })),
      saveTemplate: (name) => set((state) => {
        if (!state.draftSession) return state;
        // Strip completed state and ids from logs for the template
        const templateLogs = state.draftSession.logs.map(log => ({
          ...log,
          id: crypto.randomUUID(),
          sets: log.sets.map(set => ({ ...set, completed: false }))
        }));
        const newTemplate: WorkoutTemplate = {
          id: crypto.randomUUID(),
          name,
          createdAt: new Date().toISOString(),
          logs: templateLogs,
        };
        return { templates: [newTemplate, ...state.templates] };
      }),
      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),
      hydrateAppStoreData: (data) => set(data),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        customExercises: state.customExercises,
        sessions: state.sessions,
        templates: state.templates || [],
        foods: state.foods,
        sleepLogs: state.sleepLogs,
        weightLogs: state.weightLogs || [],
        settings: state.settings || { unitSystem: 'metric' },
        calorieGoal: state.calorieGoal,
        macrosGoal: state.macrosGoal,
        profile: state.profile,
        draftSession: state.draftSession,
      }),
      migrate: (persistedState) => migratePersistedState(persistedState),
    },
  ),
);
