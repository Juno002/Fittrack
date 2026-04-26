import { startTransition, useEffect, useState } from 'react';

import { loadExerciseLibrary } from '@/lib/exercises';
import { useStore } from '@/store';
import type { ExerciseDefinition } from '@/store/types';

export function useExerciseCatalog() {
  const customExercises = useStore((state) => state.customExercises);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>(customExercises);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    loadExerciseLibrary(customExercises)
      .then((catalog) => {
        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setExercises(catalog);
        });
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [customExercises]);

  return {
    exercises,
    isLoading,
  };
}
