import type {
  CoachModeling,
  CustomExercise,
  ExerciseCatalogEntry,
  ExerciseDefinition,
  ExerciseIconName,
  MuscleGroup,
  ProgressionTrackId,
  SecondaryTargets,
} from '@/store/types';

const FALLBACK_CREATED_AT = '2026-01-01T00:00:00.000Z';
const LEGACY_MUSCLE_GROUPS = new Set<MuscleGroup | 'arms'>([
  'chest',
  'back',
  'legs',
  'shoulders',
  'biceps',
  'triceps',
  'core',
  'arms',
]);

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
  biceps: 'Dumbbell',
  triceps: 'Activity',
  core: 'Timer',
};

interface ProgressionStepInfo {
  id: string;
  name: string;
  trackId: ProgressionTrackId;
  step: number;
}

type RawMuscleGroup = MuscleGroup | 'arms';

interface ExerciseSeed {
  id: string;
  name: string;
  muscleGroup: RawMuscleGroup;
  isBodyweight: boolean;
  mechanic: string | null;
  description?: string;
  formGuidance?: string[];
  videoUrl?: string;
  secondaryTargets?: SecondaryTargets;
  progressionTrackId?: ProgressionTrackId | null;
  progressionStep?: number | null;
  coachModeling?: CoachModeling;
}

const PROGRESSION_TRACKS: Record<ProgressionTrackId, ProgressionStepInfo[]> = {
  push: [
    { id: 'Wall_Push-Up', name: 'Wall Push-Up', trackId: 'push', step: 0 },
    { id: 'Knee_Push-Up', name: 'Knee Push-Up', trackId: 'push', step: 1 },
    { id: 'push-ups', name: 'Push-Ups', trackId: 'push', step: 2 },
    { id: 'Push-Ups_With_Feet_Elevated', name: 'Push-Ups With Feet Elevated', trackId: 'push', step: 3 },
    { id: 'Plyo_Push-up', name: 'Plyo Push-Up', trackId: 'push', step: 4 },
    { id: 'Single-Arm_Push-Up', name: 'Single-Arm Push-Up', trackId: 'push', step: 5 },
  ],
  squat: [
    { id: 'Chair_Squat', name: 'Chair Squat', trackId: 'squat', step: 0 },
    { id: 'Bodyweight_Squat', name: 'Bodyweight Squat', trackId: 'squat', step: 1 },
    { id: 'Step-up_with_Knee_Raise', name: 'Step-Up', trackId: 'squat', step: 2 },
    { id: 'Split_Squats', name: 'Split Squat', trackId: 'squat', step: 3 },
    { id: 'Freehand_Jump_Squat', name: 'Jump Squat', trackId: 'squat', step: 4 },
    { id: 'Pistol_Squat', name: 'Pistol Squat', trackId: 'squat', step: 5 },
  ],
  pull: [
    { id: 'Bodyweight_Mid_Row', name: 'Bodyweight Mid Row', trackId: 'pull', step: 0 },
    { id: 'Inverted_Row', name: 'Inverted Row', trackId: 'pull', step: 1 },
    { id: 'Chin-Up', name: 'Chin-Up', trackId: 'pull', step: 2 },
    { id: 'Wide-Grip_Rear_Pull-Up', name: 'Wide-Grip Pull-Up', trackId: 'pull', step: 3 },
    { id: 'One_Arm_Chin-Up', name: 'One Arm Chin-Up', trackId: 'pull', step: 4 },
  ],
};

const PROGRESSION_ALIASES: Record<string, { trackId: ProgressionTrackId; step: number }> = {
  'push-ups': { trackId: 'push', step: 2 },
  'pull-ups': { trackId: 'pull', step: 2 },
  squats: { trackId: 'squat', step: 1 },
};

const PROGRESSION_LOOKUP = new Map<string, { trackId: ProgressionTrackId; step: number; name: string }>(
  Object.values(PROGRESSION_TRACKS)
    .flat()
    .map((step) => [step.id, { trackId: step.trackId, step: step.step, name: step.name }]),
);

Object.entries(PROGRESSION_ALIASES).forEach(([id, value]) => {
  const canonical = PROGRESSION_TRACKS[value.trackId][value.step];
  PROGRESSION_LOOKUP.set(id, { ...value, name: canonical.name });
});

const CURATED_LIBRARY_ENTRIES: ExerciseSeed[] = [
  {
    id: 'Wall_Push-Up',
    name: 'Wall Push-Up',
    muscleGroup: 'chest',
    isBodyweight: true,
    mechanic: 'compound',
    description: 'Variante inicial de flexión con una inclinación muy favorable para aprender la línea corporal y el empuje.',
  },
  {
    id: 'Knee_Push-Up',
    name: 'Knee Push-Up',
    muscleGroup: 'chest',
    isBodyweight: true,
    mechanic: 'compound',
    description: 'Flexión asistida desde rodillas para progresar hacia la flexión completa manteniendo patrón técnico similar.',
  },
  {
    id: 'Pistol_Squat',
    name: 'Pistol Squat',
    muscleGroup: 'legs',
    isBodyweight: true,
    mechanic: 'compound',
    description: 'Sentadilla a una pierna que eleva al máximo la demanda de fuerza, control y movilidad.',
  },
];

const BICEPS_ISOLATION_PATTERN = /\b(bicep|curl|curls|hammer|preacher|concentration|drag curl|reverse curl|wrist curl|finger curls)\b/i;
const TRICEPS_ISOLATION_PATTERN = /\b(tricep|triceps|pushdown|skullcrusher|kickback|extension|body tricep press)\b/i;
const CHEST_COMPOUND_PATTERN = /\b(bench press|floor press|board press|pin press|jm press|chest throw|close-grip .*press|close grip .*press|one arm floor press|reverse band bench press)\b/i;
const BACK_COMPOUND_PATTERN = /\b(chin-up|chin up|pull-up|pull up|row|rows)\b/i;
const TRICEPS_COMPOUND_PATTERN = /\b(bench dip|parallel bar dip|ring dip|ring dips|close-grip push-up|close grip push-up|triceps position|dips - triceps version|dip machine)\b/i;
const CHEST_DIP_PATTERN = /\b(dips - chest version)\b/i;

function cloneSecondaryTargets(secondaryTargets?: SecondaryTargets): SecondaryTargets {
  return { ...(secondaryTargets ?? {}) };
}

function toIdentifier(id: string, name: string) {
  return `${id} ${name}`.toLowerCase();
}

function isSupportedMuscleGroup(value: unknown): value is RawMuscleGroup {
  return typeof value === 'string' && LEGACY_MUSCLE_GROUPS.has(value as RawMuscleGroup);
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.map((entry) => String(entry));
}

function getDefaultSecondaryTargets(
  muscleGroup: MuscleGroup,
  mechanic: string | null,
  identifier: string,
): SecondaryTargets {
  if (muscleGroup === 'chest' && mechanic === 'compound') {
    return { triceps: 0.5, shoulders: 0.25 };
  }

  if (muscleGroup === 'back' && mechanic === 'compound') {
    return { biceps: 0.5 };
  }

  if (muscleGroup === 'shoulders' && mechanic === 'compound') {
    return { triceps: 0.25 };
  }

  if (
    muscleGroup === 'triceps' &&
    mechanic === 'compound' &&
    (TRICEPS_COMPOUND_PATTERN.test(identifier) || CHEST_COMPOUND_PATTERN.test(identifier) || identifier.includes('dip'))
  ) {
    return { chest: 0.25, shoulders: 0.25 };
  }

  return {};
}

function resolveLegacyArmsMuscleGroup(seed: ExerciseSeed) {
  const identifier = toIdentifier(seed.id, seed.name);

  if (BICEPS_ISOLATION_PATTERN.test(identifier)) {
    return { muscleGroup: 'biceps' as const, coachModeling: 'curated' as const };
  }

  if (TRICEPS_ISOLATION_PATTERN.test(identifier)) {
    return { muscleGroup: 'triceps' as const, coachModeling: 'curated' as const };
  }

  if (CHEST_DIP_PATTERN.test(identifier) || CHEST_COMPOUND_PATTERN.test(identifier)) {
    return { muscleGroup: 'chest' as const, coachModeling: 'curated' as const };
  }

  if (BACK_COMPOUND_PATTERN.test(identifier)) {
    return { muscleGroup: 'back' as const, coachModeling: 'curated' as const };
  }

  if (TRICEPS_COMPOUND_PATTERN.test(identifier)) {
    return { muscleGroup: 'triceps' as const, coachModeling: 'curated' as const };
  }

  if (seed.mechanic === 'isolation') {
    return { muscleGroup: 'biceps' as const, coachModeling: 'generic' as const };
  }

  return { muscleGroup: 'triceps' as const, coachModeling: 'generic' as const };
}

function getProgressionMetadata(id: string) {
  const track = PROGRESSION_LOOKUP.get(id);

  return {
    progressionTrackId: track?.trackId ?? null,
    progressionStep: track?.step ?? null,
  };
}

function enrichExerciseSeed(seed: ExerciseSeed): ExerciseCatalogEntry {
  const legacyArmsResolution = seed.muscleGroup === 'arms' ? resolveLegacyArmsMuscleGroup(seed) : null;
  const resolvedMuscleGroup = legacyArmsResolution?.muscleGroup ?? seed.muscleGroup;
  const coachModeling = seed.coachModeling ?? legacyArmsResolution?.coachModeling ?? 'curated';
  const progression = getProgressionMetadata(seed.id);
  const identifier = toIdentifier(seed.id, seed.name);
  const finalMuscleGroup = resolvedMuscleGroup as MuscleGroup;
  const secondaryTargets = cloneSecondaryTargets(
    seed.secondaryTargets ?? getDefaultSecondaryTargets(finalMuscleGroup, seed.mechanic, identifier),
  );

  return {
    id: seed.id,
    name: seed.name,
    muscleGroup: finalMuscleGroup,
    isBodyweight: seed.isBodyweight,
    mechanic: seed.mechanic,
    description: seed.description,
    formGuidance: seed.formGuidance,
    videoUrl: seed.videoUrl,
    secondaryTargets,
    progressionTrackId: seed.progressionTrackId ?? progression.progressionTrackId,
    progressionStep: seed.progressionStep ?? progression.progressionStep,
    coachModeling,
  };
}

function createCustomExercise(seed: ExerciseSeed): CustomExercise {
  const exercise = enrichExerciseSeed(seed);

  return {
    ...exercise,
    iconName: getExerciseIconName(exercise.muscleGroup),
    source: 'legacy',
    createdAt: FALLBACK_CREATED_AT,
  };
}

export const STARTER_EXERCISES: CustomExercise[] = [
  createCustomExercise({
    id: 'push-ups',
    name: 'Flexiones (Push-ups)',
    muscleGroup: 'chest',
    isBodyweight: true,
    mechanic: 'compound',
    description: 'Un ejercicio clásico y fundamental de peso corporal enfocado principalmente en el pecho, tríceps y deltoides frontales.',
    formGuidance: [
      'Mantén el núcleo apretado y el cuerpo en línea recta',
      'Desciende hasta que el pecho roce el suelo',
      'Extiende completamente los codos en la fase de empuje',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
  }),
  createCustomExercise({
    id: 'pull-ups',
    name: 'Dominadas (Pull-ups)',
    muscleGroup: 'back',
    isBodyweight: true,
    mechanic: 'compound',
    description: 'Ejercicio de tirón con peso corporal para construir la espalda y acumular volumen indirecto en bíceps.',
    formGuidance: [
      'Usa un agarre prono ligeramente más ancho que los hombros',
      'Retrae las escápulas y tira hacia tu pecho',
      'Desciende de forma controlada hasta la extensión completa',
    ],
  }),
  createCustomExercise({
    id: 'squats',
    name: 'Sentadillas (Squats)',
    muscleGroup: 'legs',
    isBodyweight: true,
    mechanic: 'compound',
  }),
  createCustomExercise({
    id: 'lunges',
    name: 'Zancadas (Lunges)',
    muscleGroup: 'legs',
    isBodyweight: true,
    mechanic: 'compound',
  }),
  createCustomExercise({
    id: 'plank',
    name: 'Plancha (Plank)',
    muscleGroup: 'core',
    isBodyweight: true,
    mechanic: 'isometric',
  }),
  createCustomExercise({
    id: 'dips',
    name: 'Fondos (Dips)',
    muscleGroup: 'triceps',
    isBodyweight: true,
    mechanic: 'compound',
  }),
  createCustomExercise({
    id: 'wall-handstand',
    name: 'Pino contra pared (Wall Handstand)',
    muscleGroup: 'shoulders',
    isBodyweight: true,
    mechanic: 'isometric',
  }),
];

let catalogPromise: Promise<ExerciseCatalogEntry[]> | null = null;

export function getExerciseIconName(muscleGroup: MuscleGroup, preferredIcon?: string) {
  if (preferredIcon && LEGACY_ICON_NAMES.has(preferredIcon as ExerciseIconName)) {
    return preferredIcon as ExerciseIconName;
  }

  return MUSCLE_ICON_MAP[muscleGroup];
}

export function getProgressionTrackSteps(trackId: ProgressionTrackId) {
  return PROGRESSION_TRACKS[trackId];
}

export function getProgressionStepInfo(trackId: ProgressionTrackId, step: number) {
  return PROGRESSION_TRACKS[trackId].find((entry) => entry.step === step) ?? null;
}

export function getNextProgressionStep(trackId: ProgressionTrackId, step: number) {
  return getProgressionStepInfo(trackId, step + 1);
}

export function normalizeExerciseValue(
  value: Record<string, unknown>,
  source: ExerciseDefinition['source'] = 'catalog',
): ExerciseDefinition | null {
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !isSupportedMuscleGroup(value.muscleGroup)
  ) {
    return null;
  }

  const enriched = enrichExerciseSeed({
    id: value.id,
    name: value.name,
    muscleGroup: value.muscleGroup,
    isBodyweight: Boolean(value.isBodyweight),
    mechanic: typeof value.mechanic === 'string' ? value.mechanic : null,
    description: typeof value.description === 'string' ? value.description : undefined,
    formGuidance: toStringArray(value.formGuidance),
    videoUrl: typeof value.videoUrl === 'string' ? value.videoUrl : undefined,
    secondaryTargets: value.secondaryTargets && typeof value.secondaryTargets === 'object'
      ? cloneSecondaryTargets(value.secondaryTargets as SecondaryTargets)
      : undefined,
    progressionTrackId:
      value.progressionTrackId === 'push' || value.progressionTrackId === 'squat' || value.progressionTrackId === 'pull'
        ? value.progressionTrackId
        : undefined,
    progressionStep: typeof value.progressionStep === 'number' ? value.progressionStep : undefined,
    coachModeling: value.coachModeling === 'generic' ? 'generic' : undefined,
  });

  return {
    ...enriched,
    iconName: getExerciseIconName(enriched.muscleGroup, typeof value.iconName === 'string' ? value.iconName : undefined),
    source,
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
      const rawEntries = Array.isArray(module.default) ? module.default : [];
      const parsed = rawEntries
        .map((entry) => normalizeExerciseValue(entry as Record<string, unknown>, 'catalog'))
        .filter((entry): entry is ExerciseDefinition => entry !== null)
        .map((entry) => ({
          id: entry.id,
          name: entry.name,
          muscleGroup: entry.muscleGroup,
          isBodyweight: entry.isBodyweight,
          mechanic: entry.mechanic,
          description: entry.description,
          formGuidance: entry.formGuidance,
          videoUrl: entry.videoUrl,
          secondaryTargets: cloneSecondaryTargets(entry.secondaryTargets),
          progressionTrackId: entry.progressionTrackId,
          progressionStep: entry.progressionStep,
          coachModeling: entry.coachModeling,
        } satisfies ExerciseCatalogEntry));

      const curated = CURATED_LIBRARY_ENTRIES.map(enrichExerciseSeed);
      const curatedIds = new Set(curated.map((entry) => entry.id));

      return [...curated, ...parsed.filter((entry) => !curatedIds.has(entry.id))];
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
