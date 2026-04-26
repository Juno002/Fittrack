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

export const EXERCISE_DIFFICULTIES = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Elite',
  'Custom',
] as const;

export type ExerciseDifficulty = (typeof EXERCISE_DIFFICULTIES)[number];

export const EXERCISE_DEMO_KEYS = [
  'push_up',
  'pike_push_up',
  'squat',
  'lunge',
  'plank',
  'dead_bug',
  'hollow_hold',
  'leg_raise',
  'mountain_climber',
  'superman',
  'jump_squat',
  'burpee',
  'bear_crawl',
  'crab_walk',
] as const;

export type ExerciseDemoKey = (typeof EXERCISE_DEMO_KEYS)[number];

export interface ExerciseProgression {
  easier?: string[];
  current: string;
  harder?: string[];
}

export interface ExerciseCatalogEntry {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isBodyweight: boolean;
  mechanic: string | null;
  difficulty?: ExerciseDifficulty;
  summary?: string;
  coachNote?: string;
  cues?: string[];
  instructions?: string[];
  mistakes?: string[];
  progression?: ExerciseProgression;
  youtubeQuery?: string;
  demoKey?: ExerciseDemoKey;
  noEquipment?: boolean;
  searchTerms?: string[];
  images?: string[];
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

export interface DraftSessionSeed {
  name?: string;
  startedAt?: string;
  logs?: WorkoutLog[];
  restDurationSeconds?: number;
  restTimerEndsAt?: string | null;
}
