import { BODYWEIGHT_EXERCISES } from '@/data/bodyweightExercises';
import type {
  CustomExercise,
  ExerciseCatalogEntry,
  ExerciseDefinition,
  ExerciseIconName,
  MuscleGroup,
} from '@/store/types';

const FALLBACK_CREATED_AT = '2026-01-01T00:00:00.000Z';

const LEGACY_ICON_NAMES = new Set<ExerciseIconName>([
  'Accessibility',
  'Activity',
  'ArrowDown',
  'ArrowUp',
  'Dumbbell',
  'Flame',
  'Footprints',
  'Timer',
]);

const MUSCLE_ICON_MAP: Record<MuscleGroup, ExerciseIconName> = {
  chest: 'ArrowDown',
  back: 'ArrowUp',
  legs: 'Footprints',
  shoulders: 'Flame',
  arms: 'Dumbbell',
  core: 'Timer',
};

const STARTER_IDS = new Set([
  'wall-push-up',
  'push-up',
  'bodyweight-squat',
  'reverse-lunge',
  'plank',
  'superman-hold',
]);

let catalogPromise: Promise<ExerciseCatalogEntry[]> | null = null;

export function getExerciseIconName(muscleGroup: MuscleGroup, preferredIcon?: string) {
  if (preferredIcon && LEGACY_ICON_NAMES.has(preferredIcon as ExerciseIconName)) {
    return preferredIcon as ExerciseIconName;
  }

  return MUSCLE_ICON_MAP[muscleGroup];
}

export function toExerciseDefinition(
  entry: ExerciseCatalogEntry,
  source: ExerciseDefinition['source'] = 'catalog',
) {
  return {
    ...entry,
    iconName: getExerciseIconName(entry.muscleGroup),
    source,
  } satisfies ExerciseDefinition;
}

export const STARTER_EXERCISES: CustomExercise[] = BODYWEIGHT_EXERCISES
  .filter((exercise) => STARTER_IDS.has(exercise.id))
  .map((exercise) => ({
    ...toExerciseDefinition(exercise, 'legacy'),
    createdAt: FALLBACK_CREATED_AT,
  }));

export async function loadExerciseCatalog() {
  if (!catalogPromise) {
    catalogPromise = Promise.resolve(BODYWEIGHT_EXERCISES);
  }

  return catalogPromise;
}

export async function loadExerciseLibrary(customExercises: CustomExercise[]) {
  const catalogEntries = await loadExerciseCatalog();
  const visibleCustomExercises = customExercises.filter((exercise) => exercise.isBodyweight && exercise.noEquipment !== false);
  const customIds = new Set(visibleCustomExercises.map((exercise) => exercise.id));
  const catalogExercises = catalogEntries
    .filter((exercise) => exercise.noEquipment !== false && !customIds.has(exercise.id))
    .map((exercise) => toExerciseDefinition(exercise));

  return [...visibleCustomExercises, ...catalogExercises];
}
