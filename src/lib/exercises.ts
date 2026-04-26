import type {
  CustomExercise,
  ExerciseCatalogEntry,
  ExerciseDefinition,
  ExerciseIconName,
  MuscleGroup,
} from '@/store/types';

const FALLBACK_CREATED_AT = '2026-01-01T00:00:00.000Z';

export const STARTER_EXERCISES: CustomExercise[] = [
  {
    id: 'push-ups',
    name: 'Flexiones (Push-ups)',
    muscleGroup: 'chest',
    isBodyweight: true,
    mechanic: 'compound',
    iconName: 'ArrowDown',
    source: 'legacy',
    createdAt: FALLBACK_CREATED_AT,
  },
  {
    id: 'pull-ups',
    name: 'Dominadas (Pull-ups)',
    muscleGroup: 'back',
    isBodyweight: true,
    mechanic: 'compound',
    iconName: 'ArrowUp',
    source: 'legacy',
    createdAt: FALLBACK_CREATED_AT,
  },
  {
    id: 'squats',
    name: 'Sentadillas (Squats)',
    muscleGroup: 'legs',
    isBodyweight: true,
    mechanic: 'compound',
    iconName: 'Accessibility',
    source: 'legacy',
    createdAt: FALLBACK_CREATED_AT,
  },
  {
    id: 'lunges',
    name: 'Zancadas (Lunges)',
    muscleGroup: 'legs',
    isBodyweight: true,
    mechanic: 'compound',
    iconName: 'Footprints',
    source: 'legacy',
    createdAt: FALLBACK_CREATED_AT,
  },
  {
    id: 'plank',
    name: 'Plancha (Plank)',
    muscleGroup: 'core',
    isBodyweight: true,
    mechanic: 'isometric',
    iconName: 'Timer',
    source: 'legacy',
    createdAt: FALLBACK_CREATED_AT,
  },
  {
    id: 'dips',
    name: 'Fondos (Dips)',
    muscleGroup: 'arms',
    isBodyweight: true,
    mechanic: 'compound',
    iconName: 'ArrowDown',
    source: 'legacy',
    createdAt: FALLBACK_CREATED_AT,
  },
  {
    id: 'wall-handstand',
    name: 'Pino contra pared (Wall Handstand)',
    muscleGroup: 'shoulders',
    isBodyweight: true,
    mechanic: 'isometric',
    iconName: 'ArrowUp',
    source: 'legacy',
    createdAt: FALLBACK_CREATED_AT,
  },
];

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

let catalogPromise: Promise<ExerciseCatalogEntry[]> | null = null;

function isMuscleGroup(value: unknown): value is MuscleGroup {
  return typeof value === 'string' && value in MUSCLE_ICON_MAP;
}

export function getExerciseIconName(muscleGroup: MuscleGroup, preferredIcon?: string) {
  if (preferredIcon && LEGACY_ICON_NAMES.has(preferredIcon as ExerciseIconName)) {
    return preferredIcon as ExerciseIconName;
  }

  return MUSCLE_ICON_MAP[muscleGroup];
}

function sanitizeCatalogEntry(value: Record<string, unknown>): ExerciseCatalogEntry | null {
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !isMuscleGroup(value.muscleGroup)
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    muscleGroup: value.muscleGroup,
    isBodyweight: Boolean(value.isBodyweight),
    mechanic: typeof value.mechanic === 'string' ? value.mechanic : null,
  };
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

export async function loadExerciseCatalog() {
  if (!catalogPromise) {
    catalogPromise = import('@/data/parsedExercises.json').then((module) => {
      const entries = Array.isArray(module.default) ? module.default : [];

      return entries
        .map((entry) => sanitizeCatalogEntry(entry as Record<string, unknown>))
        .filter((entry): entry is ExerciseCatalogEntry => entry !== null);
    });
  }

  return catalogPromise;
}

export async function loadExerciseLibrary(customExercises: CustomExercise[]) {
  const catalogEntries = await loadExerciseCatalog();
  const customIds = new Set(customExercises.map((exercise) => exercise.id));
  const catalogExercises = catalogEntries
    .filter((exercise) => !customIds.has(exercise.id))
    .map((exercise) => toExerciseDefinition(exercise));

  return [...customExercises, ...catalogExercises];
}
