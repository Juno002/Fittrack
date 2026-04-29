export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EXERCISE_ICON_NAMES = [
  'Accessibility',
  'Activity',
  'ArrowDown',
  'ArrowUp',
  'Dumbbell',
  'Flame',
  'Footprints',
  'Timer',
] as const;

export type ExerciseIconName = (typeof EXERCISE_ICON_NAMES)[number];

export const TRAINING_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type TrainingDay = (typeof TRAINING_DAYS)[number];

export const PREFERRED_TRAINING_TIMES = ['morning', 'afternoon', 'evening'] as const;
export type PreferredTrainingTime = (typeof PREFERRED_TRAINING_TIMES)[number];

export interface ExerciseCatalogEntry {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isBodyweight: boolean;
  mechanic: string | null;
  description?: string;
  formGuidance?: string[];
  videoUrl?: string;
}

export interface ExerciseDefinition extends ExerciseCatalogEntry {
  iconName: ExerciseIconName;
  source: 'catalog' | 'custom' | 'legacy';
}

export interface CustomExercise extends ExerciseDefinition {
  createdAt: string;
}

export interface WorkoutSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  iconName: ExerciseIconName;
  sets: WorkoutSet[];
  isBodyweight: boolean;
}

export interface DraftSession {
  id: string;
  name: string;
  startedAt: string;
  logs: WorkoutLog[];
  restDurationSeconds: number;
  restTimerEndsAt: string | null;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  createdAt: string;
  logs: WorkoutLog[];
}

export interface WorkoutSession {
  id: string;
  name: string;
  performedAt: string;
  dayKey: string;
  durationSeconds: number;
  effort: number;
  logs: WorkoutLog[];
}

export interface UserProfile {
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female' | 'other';
}

export interface MacroGoal {
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodEntry {
  id: string;
  dayKey: string;
  consumedAt: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SleepLog {
  id: string;
  dayKey: string;
  loggedAt: string;
  durationHours: number;
  qualityScore: number;
}

export interface BodyWeightLog {
  id: string;
  dayKey: string;
  loggedAt: string;
  weight: number;
}

export interface RecoveryCheckIn {
  id: string;
  dayKey: string;
  loggedAt: string;
  soreness: number;
  energy: number;
  stress: number;
  notes: string;
}

export interface ConnectedSignals {
  sleep: boolean;
  food: boolean;
  recovery: boolean;
}

export interface TrainingSchedule {
  days: TrainingDay[];
  preferredTime: PreferredTrainingTime;
}

export interface ReminderSettings {
  enabled: boolean;
  time: string;
}

export interface AppSettings {
  unitSystem: 'metric' | 'imperial';
  onboarded: boolean;
  defaultRestDuration?: number;
  connectedSignals: ConnectedSignals;
  trainingSchedule: TrainingSchedule;
  reminders: ReminderSettings;
}

export interface DraftSessionSeed {
  name?: string;
  startedAt?: string;
  logs?: WorkoutLog[];
  restDurationSeconds?: number;
  restTimerEndsAt?: string | null;
}
