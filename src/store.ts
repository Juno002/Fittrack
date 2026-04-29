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
  AppSettings,
  BodyWeightLog,
  ConnectedSignals,
  CustomExercise,
  DraftSession,
  DraftSessionSeed,
  ExerciseDefinition,
  FoodEntry,
  MacroGoal,
  PreferredTrainingTime,
  RecoveryCheckIn,
  ReminderSettings,
  SleepLog,
  TrainingDay,
  TrainingSchedule,
  UserProfile,
  WorkoutLog,
  WorkoutSession,
  WorkoutSet,
  WorkoutTemplate,
} from '@/store/types';
import { MUSCLE_GROUPS, TRAINING_DAYS } from '@/store/types';

export type {
  AppSettings,
  BodyWeightLog,
  ConnectedSignals,
  CustomExercise,
  DraftSession,
  DraftSessionSeed,
  ExerciseCatalogEntry,
  ExerciseDefinition,
  ExerciseIconName,
  FoodEntry,
  MacroGoal,
  MuscleGroup,
  PreferredTrainingTime,
  RecoveryCheckIn,
  ReminderSettings,
  SleepLog,
  TrainingDay,
  TrainingSchedule,
  UserProfile,
  WorkoutLog,
  WorkoutSession,
  WorkoutSet,
} from '@/store/types';

export const STORAGE_KEY = 'fittrack-storage';
const STORAGE_VERSION = 4;
const MUSCLE_GROUP_SET = new Set(MUSCLE_GROUPS);
const TRAINING_DAY_SET = new Set<TrainingDay>(TRAINING_DAYS);

const DEFAULT_PROFILE: UserProfile = {
  name: '',
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

const DEFAULT_CONNECTED_SIGNALS: ConnectedSignals = {
  sleep: true,
  food: true,
  recovery: true,
};

const DEFAULT_TRAINING_SCHEDULE: TrainingSchedule = {
  days: ['mon', 'wed', 'fri'],
  preferredTime: 'afternoon',
};

const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: false,
  time: '18:30',
};

const DEFAULT_SETTINGS: AppSettings = {
  unitSystem: 'metric',
  onboarded: false,
  defaultRestDuration: 60,
  connectedSignals: DEFAULT_CONNECTED_SIGNALS,
  trainingSchedule: DEFAULT_TRAINING_SCHEDULE,
  reminders: DEFAULT_REMINDERS,
};

function createDefaultSettings(): AppSettings {
  return {
    unitSystem: DEFAULT_SETTINGS.unitSystem,
    onboarded: DEFAULT_SETTINGS.onboarded,
    defaultRestDuration: DEFAULT_SETTINGS.defaultRestDuration,
    connectedSignals: { ...DEFAULT_SETTINGS.connectedSignals },
    trainingSchedule: {
      days: [...DEFAULT_SETTINGS.trainingSchedule.days],
      preferredTime: DEFAULT_SETTINGS.trainingSchedule.preferredTime,
    },
    reminders: { ...DEFAULT_SETTINGS.reminders },
  };
}

export interface AppStoreData {
  customExercises: CustomExercise[];
  sessions: WorkoutSession[];
  templates: WorkoutTemplate[];
  foods: FoodEntry[];
  sleepLogs: SleepLog[];
  weightLogs: BodyWeightLog[];
  recoveryCheckins: RecoveryCheckIn[];
  settings: AppSettings;
  calorieGoal: number;
  macrosGoal: MacroGoal;
  profile: UserProfile;
  draftSession: DraftSession | null;
}

interface AppActions {
  saveCustomExercise: (exercise: Omit<CustomExercise, 'createdAt' | 'source' | 'iconName'> & Partial<Pick<CustomExercise, 'createdAt' | 'iconName'>>) => ExerciseDefinition;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  logBodyWeight: (weight: number) => void;
  setCalorieGoal: (goal: number) => void;
  setMacrosGoal: (goal: MacroGoal) => void;
  saveFoodEntry: (entry: Omit<FoodEntry, 'consumedAt'> & { consumedAt?: string }) => void;
  deleteFoodEntry: (id: string) => void;
  saveSleepLog: (entry: Omit<SleepLog, 'loggedAt'> & { loggedAt?: string }) => void;
  deleteSleepLog: (id: string) => void;
  saveRecoveryCheckIn: (entry: Omit<RecoveryCheckIn, 'loggedAt'> & { loggedAt?: string }) => void;
  deleteRecoveryCheckIn: (id: string) => void;
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
  hydrateAppStoreData: (data: Partial<AppStoreData>) => void;
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
    recoveryCheckins: [],
    settings: createDefaultSettings(),
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

function normalizeWorkoutLog(
  rawLog: unknown,
  exerciseIndex: Map<string, { name: string; muscleGroup: string; iconName?: string; isBodyweight?: boolean }>,
): WorkoutLog | null {
  if (!rawLog || typeof rawLog !== 'object') {
    return null;
  }

  const legacyLog = rawLog as Record<string, unknown>;
  const exerciseId = typeof legacyLog.exerciseId === 'string' ? legacyLog.exerciseId : 'exercise';
  const exercise = exerciseIndex.get(exerciseId);
  const muscleGroup = MUSCLE_GROUP_SET.has(exercise?.muscleGroup as typeof MUSCLE_GROUPS[number])
    ? (exercise?.muscleGroup as WorkoutLog['muscleGroup'])
    : 'core';

  return {
    id: typeof legacyLog.id === 'string' ? legacyLog.id : `log-${exerciseId}`,
    exerciseId,
    exerciseName: typeof legacyLog.exerciseName === 'string'
      ? legacyLog.exerciseName
      : exercise?.name ?? exerciseId.replace(/_/g, ' '),
    muscleGroup,
    iconName: typeof legacyLog.iconName === 'string'
      ? (legacyLog.iconName as WorkoutLog['iconName'])
      : getExerciseIconName(muscleGroup, exercise?.iconName),
    isBodyweight: typeof legacyLog.isBodyweight === 'boolean' ? legacyLog.isBodyweight : Boolean(exercise?.isBodyweight),
    sets: Array.isArray(legacyLog.sets)
      ? legacyLog.sets.map((set) => createWorkoutSet(set as Partial<WorkoutSet>))
      : [],
  };
}

function normalizeSession(
  rawSession: unknown,
  exerciseIndex: Map<string, { name: string; muscleGroup: string; iconName?: string; isBodyweight?: boolean }>,
): WorkoutSession | null {
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

function normalizeTemplate(
  rawTemplate: unknown,
  exerciseIndex: Map<string, { name: string; muscleGroup: string; iconName?: string; isBodyweight?: boolean }>,
): WorkoutTemplate | null {
  if (!rawTemplate || typeof rawTemplate !== 'object') {
    return null;
  }

  const template = rawTemplate as Record<string, unknown>;
  const logs = Array.isArray(template.logs)
    ? template.logs
        .map((log) => normalizeWorkoutLog(log, exerciseIndex))
        .filter((log): log is WorkoutLog => log !== null)
    : [];

  return {
    id: typeof template.id === 'string' ? template.id : crypto.randomUUID(),
    name: typeof template.name === 'string' ? template.name : 'Plantilla',
    createdAt: typeof template.createdAt === 'string' ? template.createdAt : new Date().toISOString(),
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
    name: typeof entry.name === 'string' ? entry.name : 'Comida',
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

function clampCheckInScore(value: unknown, fallback = 3) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(5, Math.max(1, Math.round(value)));
}

function normalizeRecoveryCheckIn(rawEntry: unknown): RecoveryCheckIn | null {
  if (!rawEntry || typeof rawEntry !== 'object') {
    return null;
  }

  const entry = rawEntry as Record<string, unknown>;
  const dayKey = typeof entry.dayKey === 'string'
    ? entry.dayKey
    : typeof entry.loggedAt === 'string'
      ? toDayKey(entry.loggedAt)
      : toDayKey();

  return {
    id: typeof entry.id === 'string' ? entry.id : `recovery-${dayKey}`,
    dayKey,
    loggedAt: typeof entry.loggedAt === 'string' ? entry.loggedAt : dayKeyToIso(dayKey, 9),
    soreness: clampCheckInScore(entry.soreness),
    energy: clampCheckInScore(entry.energy),
    stress: clampCheckInScore(entry.stress),
    notes: typeof entry.notes === 'string' ? entry.notes : '',
  };
}

function normalizeWeightLog(rawEntry: unknown): BodyWeightLog | null {
  if (!rawEntry || typeof rawEntry !== 'object') {
    return null;
  }

  const entry = rawEntry as Record<string, unknown>;
  if (typeof entry.weight !== 'number') {
    return null;
  }

  const dayKey = typeof entry.dayKey === 'string'
    ? entry.dayKey
    : typeof entry.loggedAt === 'string'
      ? toDayKey(entry.loggedAt)
      : toDayKey();

  return {
    id: typeof entry.id === 'string' ? entry.id : `weight-${dayKey}`,
    dayKey,
    loggedAt: typeof entry.loggedAt === 'string' ? entry.loggedAt : dayKeyToIso(dayKey, 7),
    weight: entry.weight,
  };
}

function normalizeConnectedSignals(value: unknown): ConnectedSignals {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_CONNECTED_SIGNALS };
  }

  const signals = value as Partial<Record<keyof ConnectedSignals, unknown>>;
  return {
    sleep: typeof signals.sleep === 'boolean' ? signals.sleep : DEFAULT_CONNECTED_SIGNALS.sleep,
    food: typeof signals.food === 'boolean' ? signals.food : DEFAULT_CONNECTED_SIGNALS.food,
    recovery: typeof signals.recovery === 'boolean' ? signals.recovery : DEFAULT_CONNECTED_SIGNALS.recovery,
  };
}

function normalizePreferredTrainingTime(value: unknown): PreferredTrainingTime {
  return value === 'morning' || value === 'afternoon' || value === 'evening'
    ? value
    : DEFAULT_TRAINING_SCHEDULE.preferredTime;
}

function normalizeTrainingSchedule(value: unknown): TrainingSchedule {
  if (!value || typeof value !== 'object') {
    return {
      days: [...DEFAULT_TRAINING_SCHEDULE.days],
      preferredTime: DEFAULT_TRAINING_SCHEDULE.preferredTime,
    };
  }

  const schedule = value as Record<string, unknown>;
  const days = Array.isArray(schedule.days)
    ? schedule.days.filter((day): day is TrainingDay => typeof day === 'string' && TRAINING_DAY_SET.has(day as TrainingDay))
    : DEFAULT_TRAINING_SCHEDULE.days;

  return {
    days: days.length > 0 ? Array.from(new Set(days)) : [...DEFAULT_TRAINING_SCHEDULE.days],
    preferredTime: normalizePreferredTrainingTime(schedule.preferredTime),
  };
}

function normalizeReminders(value: unknown): ReminderSettings {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_REMINDERS };
  }

  const reminders = value as Record<string, unknown>;
  return {
    enabled: typeof reminders.enabled === 'boolean' ? reminders.enabled : DEFAULT_REMINDERS.enabled,
    time: typeof reminders.time === 'string' ? reminders.time : DEFAULT_REMINDERS.time,
  };
}

function normalizeSettings(value: unknown): AppSettings {
  const defaults = createDefaultSettings();

  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const settings = value as Record<string, unknown>;
  return {
    unitSystem: settings.unitSystem === 'imperial' ? 'imperial' : defaults.unitSystem,
    onboarded: typeof settings.onboarded === 'boolean' ? settings.onboarded : defaults.onboarded,
    defaultRestDuration: typeof settings.defaultRestDuration === 'number'
      ? Math.max(15, settings.defaultRestDuration)
      : defaults.defaultRestDuration,
    connectedSignals: normalizeConnectedSignals(settings.connectedSignals),
    trainingSchedule: normalizeTrainingSchedule(settings.trainingSchedule),
    reminders: normalizeReminders(settings.reminders),
  };
}

function normalizeUserProfile(value: unknown): UserProfile {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_PROFILE };
  }

  const profile = value as Record<string, unknown>;
  return {
    name: typeof profile.name === 'string' ? profile.name : DEFAULT_PROFILE.name,
    age: typeof profile.age === 'number' ? profile.age : DEFAULT_PROFILE.age,
    weight: typeof profile.weight === 'number' ? profile.weight : DEFAULT_PROFILE.weight,
    height: typeof profile.height === 'number' ? profile.height : DEFAULT_PROFILE.height,
    gender: profile.gender === 'female' || profile.gender === 'other' || profile.gender === 'male'
      ? profile.gender
      : DEFAULT_PROFILE.gender,
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
        !MUSCLE_GROUP_SET.has(value.muscleGroup as typeof MUSCLE_GROUPS[number])
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
  const templates = Array.isArray(rawState.templates)
    ? rawState.templates
        .map((template) => normalizeTemplate(template, exerciseIndex))
        .filter((template): template is WorkoutTemplate => template !== null)
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
  const weightLogs = Array.isArray(rawState.weightLogs)
    ? rawState.weightLogs
        .map(normalizeWeightLog)
        .filter((entry): entry is BodyWeightLog => entry !== null)
    : [];
  const recoveryCheckins = Array.isArray(rawState.recoveryCheckins)
    ? rawState.recoveryCheckins
        .map(normalizeRecoveryCheckIn)
        .filter((entry): entry is RecoveryCheckIn => entry !== null)
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
        : defaults.settings.defaultRestDuration,
      restTimerEndsAt: typeof legacyDraft.restTimerEndsAt === 'string' ? legacyDraft.restTimerEndsAt : null,
    });
  })();

  return {
    customExercises,
    sessions,
    templates,
    foods,
    sleepLogs,
    weightLogs,
    recoveryCheckins,
    settings: normalizeSettings(rawState.settings),
    calorieGoal: typeof rawState.calorieGoal === 'number' ? rawState.calorieGoal : defaults.calorieGoal,
    macrosGoal: isMacroGoal(rawState.macrosGoal) ? rawState.macrosGoal : defaults.macrosGoal,
    profile: normalizeUserProfile(rawState.profile),
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
          settings: {
            ...state.settings,
            ...settings,
            connectedSignals: {
              ...state.settings.connectedSignals,
              ...settings.connectedSignals,
            },
            trainingSchedule: settings.trainingSchedule
              ? {
                  ...state.settings.trainingSchedule,
                  ...settings.trainingSchedule,
                  days: settings.trainingSchedule.days ?? state.settings.trainingSchedule.days,
                }
              : state.settings.trainingSchedule,
            reminders: {
              ...state.settings.reminders,
              ...settings.reminders,
            },
          },
        })),

      logBodyWeight: (weight) =>
        set((state) => {
          const todayKey = toDayKey(new Date());
          const existing = state.weightLogs.find((log) => log.dayKey === todayKey);
          const nextEntry: BodyWeightLog = existing
            ? { ...existing, weight, loggedAt: new Date().toISOString() }
            : {
                id: crypto.randomUUID(),
                dayKey: todayKey,
                loggedAt: new Date().toISOString(),
                weight,
              };

          return {
            weightLogs: [
              nextEntry,
              ...state.weightLogs.filter((log) => log.dayKey !== todayKey && log.id !== nextEntry.id),
            ].sort((left, right) => right.loggedAt.localeCompare(left.loggedAt)),
            profile: { ...state.profile, weight },
          };
        }),

      setCalorieGoal: (goal) => set({ calorieGoal: goal }),
      setMacrosGoal: (goal) => set({ macrosGoal: goal }),

      saveFoodEntry: (entry) =>
        set((state) => ({
          foods: state.foods
            .filter((food) => food.id !== entry.id)
            .concat({
              ...entry,
              consumedAt: entry.consumedAt ?? dayKeyToIso(entry.dayKey, 12),
            })
            .sort((left, right) => right.consumedAt.localeCompare(left.consumedAt)),
        })),

      deleteFoodEntry: (id) => set((state) => ({ foods: state.foods.filter((food) => food.id !== id) })),

      saveSleepLog: (entry) =>
        set((state) => ({
          sleepLogs: state.sleepLogs
            .filter((log) => log.id !== entry.id)
            .concat({
              ...entry,
              loggedAt: entry.loggedAt ?? dayKeyToIso(entry.dayKey, 8),
            })
            .sort((left, right) => right.dayKey.localeCompare(left.dayKey)),
        })),

      deleteSleepLog: (id) => set((state) => ({ sleepLogs: state.sleepLogs.filter((log) => log.id !== id) })),

      saveRecoveryCheckIn: (entry) =>
        set((state) => ({
          recoveryCheckins: state.recoveryCheckins
            .filter((checkIn) => checkIn.id !== entry.id && checkIn.dayKey !== entry.dayKey)
            .concat({
              ...entry,
              loggedAt: entry.loggedAt ?? new Date().toISOString(),
              soreness: clampCheckInScore(entry.soreness),
              energy: clampCheckInScore(entry.energy),
              stress: clampCheckInScore(entry.stress),
              notes: entry.notes ?? '',
            })
            .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt)),
        })),

      deleteRecoveryCheckIn: (id) =>
        set((state) => ({ recoveryCheckins: state.recoveryCheckins.filter((checkIn) => checkIn.id !== id) })),

      startDraftSession: (seed) =>
        set((state) => ({
          draftSession: createDraftSession({
            ...seed,
            restDurationSeconds: seed?.restDurationSeconds ?? state.settings.defaultRestDuration ?? 60,
          }),
        })),

      discardDraftSession: () => set({ draftSession: null }),

      setDraftName: (name) =>
        set((state) => ({
          draftSession: state.draftSession ? { ...state.draftSession, name } : state.draftSession,
        })),

      setDraftRestDuration: (seconds) =>
        set((state) => ({
          settings: { ...state.settings, defaultRestDuration: Math.max(15, seconds) },
          draftSession: state.draftSession
            ? { ...state.draftSession, restDurationSeconds: Math.max(15, seconds) }
            : state.draftSession,
        })),

      clearDraftRestTimer: () =>
        set((state) => ({
          draftSession: state.draftSession ? { ...state.draftSession, restTimerEndsAt: null } : state.draftSession,
        })),

      addExerciseToDraft: (exercise) =>
        set((state) => ({
          draftSession: state.draftSession
            ? {
                ...state.draftSession,
                logs: [...state.draftSession.logs, buildWorkoutLog(exercise)],
              }
            : createDraftSession({
                logs: [buildWorkoutLog(exercise)],
                restDurationSeconds: state.settings.defaultRestDuration ?? 60,
              }),
        })),

      duplicateDraftLog: (logId) =>
        set((state) => ({
          draftSession: state.draftSession
            ? {
                ...state.draftSession,
                logs: state.draftSession.logs.flatMap((log) => (log.id === logId ? [log, duplicateWorkoutLog(log)] : [log])),
              }
            : state.draftSession,
        })),

      removeDraftLog: (logId) =>
        set((state) => ({
          draftSession: state.draftSession
            ? {
                ...state.draftSession,
                logs: state.draftSession.logs.filter((log) => log.id !== logId),
              }
            : state.draftSession,
        })),

      toggleDraftLogBodyweight: (logId, isBodyweight) =>
        set((state) => ({
          draftSession: state.draftSession
            ? {
                ...state.draftSession,
                logs: state.draftSession.logs.map((log) => (log.id === logId ? { ...log, isBodyweight } : log)),
              }
            : state.draftSession,
        })),

      addSetToDraftLog: (logId) =>
        set((state) => ({
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

      updateDraftSet: (logId, setIndex, changes) =>
        set((state) => ({
          draftSession: state.draftSession
            ? {
                ...state.draftSession,
                logs: state.draftSession.logs.map((log) => {
                  if (log.id !== logId) {
                    return log;
                  }

                  return {
                    ...log,
                    sets: log.sets.map((set, index) => (index === setIndex ? createWorkoutSet({ ...set, ...changes }) : set)),
                  };
                }),
              }
            : state.draftSession,
        })),

      removeDraftSet: (logId, setIndex) =>
        set((state) => ({
          draftSession: state.draftSession
            ? {
                ...state.draftSession,
                logs: state.draftSession.logs.map((log) => (
                  log.id === logId ? { ...log, sets: log.sets.filter((_, index) => index !== setIndex) } : log
                )),
              }
            : state.draftSession,
        })),

      toggleDraftSetCompleted: (logId, setIndex) =>
        set((state) => {
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

      saveTemplate: (name, logs) =>
        set((state) => {
          const sourceLogs = logs.length > 0 ? logs : state.draftSession?.logs ?? [];
          if (sourceLogs.length === 0) {
            return state;
          }

          const templateLogs = sourceLogs.map((log) => ({
            ...log,
            id: crypto.randomUUID(),
            sets: log.sets.map((set) => ({ ...set, completed: false })),
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
          templates: state.templates.filter((template) => template.id !== id),
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
        templates: state.templates,
        foods: state.foods,
        sleepLogs: state.sleepLogs,
        weightLogs: state.weightLogs,
        recoveryCheckins: state.recoveryCheckins,
        settings: state.settings,
        calorieGoal: state.calorieGoal,
        macrosGoal: state.macrosGoal,
        profile: state.profile,
        draftSession: state.draftSession,
      }),
      migrate: (persistedState) => migratePersistedState(persistedState),
    },
  ),
);
