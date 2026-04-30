import { startTransition, useEffect, useState } from 'react';

import { loadExerciseLibrary } from '@/lib/exercises';
import { filterExercisesByTrainingMode } from '@/lib/trainingMode';
import { useStore } from '@/store';
import type { ExerciseDefinition } from '@/store/types';

interface UseExerciseCatalogOptions {
  respectTrainingMode?: boolean;
}

export function useExerciseCatalog(options: UseExerciseCatalogOptions = {}) {
  const respectTrainingMode = options.respectTrainingMode ?? true;
  const customExercises = useStore((state) => state.customExercises);
  const trainingMode = useStore((state) => state.settings.trainingMode);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>(() => (
    respectTrainingMode
      ? filterExercisesByTrainingMode(customExercises, trainingMode)
      : customExercises
  ));
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
          setExercises(
            respectTrainingMode
              ? filterExercisesByTrainingMode(catalog, trainingMode)
              : catalog,
          );
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
  }, [customExercises, respectTrainingMode, trainingMode]);

  return {
    exercises,
    isLoading,
  };
}
