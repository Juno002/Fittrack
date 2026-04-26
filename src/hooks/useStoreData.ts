import { useMemo } from 'react';

import { useStore, type AppStoreData } from '@/store';

/**
 * Returns a stable `AppStoreData` object built from individual store selectors.
 *
 * Zustand selectors that return primitives or existing references are safe
 * with React 19's `useSyncExternalStore`.  Wrapping them in a single `useMemo`
 * lets derived selectors (which create new objects) run outside `useStore`
 * without triggering an infinite‑render loop.
 */
export function useStoreData(): AppStoreData {
  const customExercises = useStore((state) => state.customExercises);
  const sessions = useStore((state) => state.sessions);
  const foods = useStore((state) => state.foods);
  const sleepLogs = useStore((state) => state.sleepLogs);
  const templates = useStore((state) => state.templates);
  const weightLogs = useStore((state) => state.weightLogs);
  const settings = useStore((state) => state.settings);
  const calorieGoal = useStore((state) => state.calorieGoal);
  const macrosGoal = useStore((state) => state.macrosGoal);
  const profile = useStore((state) => state.profile);
  const draftSession = useStore((state) => state.draftSession);

  return useMemo<AppStoreData>(
    () => ({ customExercises, sessions, templates, weightLogs, settings, foods, sleepLogs, calorieGoal, macrosGoal, profile, draftSession }),
    [customExercises, sessions, templates, weightLogs, settings, foods, sleepLogs, calorieGoal, macrosGoal, profile, draftSession],
  );
}
