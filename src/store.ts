import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isBodyweight?: boolean;
  iconName?: string;
}

export interface WorkoutSet {
  reps: number;
  weight: number; // 0 for bodyweight
  completed?: boolean;
}

export interface WorkoutLog {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
  isBodyweight?: boolean;
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO string
  name: string;
  logs: WorkoutLog[];
  durationSeconds?: number;
}

export interface UserProfile {
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female' | 'other';
}

export interface FoodEntry {

  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string; // YYYY-MM-DD
}

export interface SleepLog {
  id: string;
  date: string; // YYYY-MM-DD
  durationHours: number;
  qualityScore: number; // 0-100
  phases?: {
    awake: number;
    light: number;
    deep: number;
    rem: number;
  };
}

interface AppState {
  exercises: Exercise[];
  sessions: WorkoutSession[];
  foods: FoodEntry[];
  sleepLogs: SleepLog[];
  calorieGoal: number;
  macrosGoal: { protein: number; carbs: number; fat: number; };
  profile: UserProfile;

  activeSession: {
    logs: WorkoutLog[];
    name: string;
    startTime: number | null;
  } | null;

  addSession: (session: WorkoutSession) => void;
  deleteSession: (id: string) => void;
  addFood: (food: FoodEntry) => void;
  deleteFood: (id: string) => void;
  addSleepLog: (log: SleepLog) => void;
  deleteSleepLog: (id: string) => void;
  setCalorieGoal: (goal: number) => void;
  setMacrosGoal: (goal: { protein: number; carbs: number; fat: number }) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  addExercise: (exercise: Exercise) => void;
  setActiveSession: (session: { logs: WorkoutLog[]; name: string; startTime: number | null } | null) => void;
  updateActiveSessionLogs: (logs: WorkoutLog[]) => void;
}

const defaultExercises: Exercise[] = [
  { id: 'e1', name: 'Flexiones (Push-ups)', muscleGroup: 'chest', isBodyweight: true, iconName: 'ArrowDown' },
  { id: 'e2', name: 'Dominadas (Pull-ups)', muscleGroup: 'back', isBodyweight: true, iconName: 'ArrowUp' },
  { id: 'e3', name: 'Sentadillas (Squats)', muscleGroup: 'legs', isBodyweight: true, iconName: 'Accessibility' },
  { id: 'e4', name: 'Zancadas (Lunges)', muscleGroup: 'legs', isBodyweight: true, iconName: 'Footprints' },
  { id: 'e5', name: 'Plancha (Plank)', muscleGroup: 'core', isBodyweight: true, iconName: 'Timer' },
  { id: 'e6', name: 'Fondos (Dips)', muscleGroup: 'arms', isBodyweight: true, iconName: 'ArrowDown' },
  { id: 'e7', name: 'Pino contra pared (Wall Handstand)', muscleGroup: 'shoulders', isBodyweight: true, iconName: 'ArrowUp' },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      exercises: defaultExercises,
      sessions: [],
      foods: [],
      sleepLogs: [],
      calorieGoal: 2000,
      macrosGoal: { protein: 150, carbs: 200, fat: 65 },
      profile: { age: 25, weight: 70, height: 175, gender: 'male' },
      activeSession: null,
      
      addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
      deleteSession: (id) => set((state) => ({ sessions: state.sessions.filter(s => s.id !== id) })),
      addFood: (food) => set((state) => ({ foods: [...state.foods, food] })),
      deleteFood: (id) => set((state) => ({ foods: state.foods.filter(f => f.id !== id) })),
      addSleepLog: (log) => set((state) => ({ sleepLogs: [...state.sleepLogs, log] })),
      deleteSleepLog: (id) => set((state) => ({ sleepLogs: state.sleepLogs.filter(s => s.id !== id) })),
      setCalorieGoal: (goal) => set({ calorieGoal: goal }),
      setMacrosGoal: (goal) => set({ macrosGoal: goal }),
      updateProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } })),
      addExercise: (exercise) => set((state) => ({ exercises: [...state.exercises, exercise] })),
      setActiveSession: (session) => set({ activeSession: session }),
      updateActiveSessionLogs: (logs) => set((state) => ({ 
        activeSession: state.activeSession ? { ...state.activeSession, logs } : null 
      })),
    }),
    {
      name: 'fittrack-storage',
    }
  )
);
