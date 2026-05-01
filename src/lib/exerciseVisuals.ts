import type { FC, SVGProps } from 'react';

import {
  ArmsFallbackVisual,
  BackFallbackVisual,
  ChestFallbackVisual,
  CoreFallbackVisual,
  LegsFallbackVisual,
  ShouldersFallbackVisual,
} from '@/components/exercise/FallbackMuscleVisuals';
import dipEndSrc from '@/assets/exercises/dip-end.svg';
import dipStartSrc from '@/assets/exercises/dip-start.svg';
import dipSrc from '@/assets/exercises/dip.svg';
import lungeSrc from '@/assets/exercises/lunge.svg';
import plankSrc from '@/assets/exercises/plank.svg';
import pullUpEndSrc from '@/assets/exercises/pull-up-end.svg';
import pullUpStartSrc from '@/assets/exercises/pull-up-start.svg';
import pullUpSrc from '@/assets/exercises/pull-up.svg';
import pushUpEndSrc from '@/assets/exercises/push-up-end.svg';
import pushUpStartSrc from '@/assets/exercises/push-up-start.svg';
import pushUpSrc from '@/assets/exercises/push-up.svg';
import squatEndSrc from '@/assets/exercises/squat-end.svg';
import squatStartSrc from '@/assets/exercises/squat-start.svg';
import squatSrc from '@/assets/exercises/squat.svg';
import wallHandstandSrc from '@/assets/exercises/wall-handstand.svg';
import type { ExerciseIconName, ExerciseVisualKey, MuscleGroup } from '@/store/types';

export type ExerciseAsset =
  | { type: 'svg-component'; component: FC<SVGProps<SVGSVGElement>> }
  | { type: 'path'; src: string };

export interface ExerciseVisualDefinition {
  label: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  asset: ExerciseAsset;
  startAsset?: ExerciseAsset;
  endAsset?: ExerciseAsset;
}

export interface ExerciseVisualSubject {
  visualKey?: ExerciseVisualKey | null;
  id?: string | null;
  name?: string | null;
  muscleGroup?: MuscleGroup | null;
  iconName?: ExerciseIconName | null;
}

export type ExerciseVisualMatch =
  | {
      kind: 'visual';
      source: 'explicit' | 'catalog' | 'alias';
      visualKey: ExerciseVisualKey;
      definition: ExerciseVisualDefinition;
      primaryMuscles: MuscleGroup[];
      secondaryMuscles: MuscleGroup[];
    }
  | {
      kind: 'muscle-fallback';
      source: 'muscle-group';
      muscleGroup: MuscleGroup;
      asset: ExerciseAsset;
      primaryMuscles: MuscleGroup[];
      secondaryMuscles: MuscleGroup[];
    }
  | {
      kind: 'legacy-icon';
      source: 'legacy-icon';
      iconName: ExerciseIconName;
      primaryMuscles: MuscleGroup[];
      secondaryMuscles: MuscleGroup[];
    };

const svgPath = (src: string): ExerciseAsset => ({ type: 'path', src });

export const EXERCISE_VISUALS: Record<ExerciseVisualKey, ExerciseVisualDefinition> = {
  'push-up': {
    label: 'Push-up',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['arms', 'core'],
    asset: svgPath(pushUpSrc),
    startAsset: svgPath(pushUpStartSrc),
    endAsset: svgPath(pushUpEndSrc),
  },
  'pull-up': {
    label: 'Pull-up',
    primaryMuscles: ['back'],
    secondaryMuscles: ['arms', 'core'],
    asset: svgPath(pullUpSrc),
    startAsset: svgPath(pullUpStartSrc),
    endAsset: svgPath(pullUpEndSrc),
  },
  squat: {
    label: 'Squat',
    primaryMuscles: ['legs'],
    secondaryMuscles: ['core'],
    asset: svgPath(squatSrc),
    startAsset: svgPath(squatStartSrc),
    endAsset: svgPath(squatEndSrc),
  },
  lunge: {
    label: 'Lunge',
    primaryMuscles: ['legs'],
    secondaryMuscles: ['core'],
    asset: svgPath(lungeSrc),
  },
  plank: {
    label: 'Plank',
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders'],
    asset: svgPath(plankSrc),
  },
  dip: {
    label: 'Dip',
    primaryMuscles: ['arms'],
    secondaryMuscles: ['chest', 'shoulders'],
    asset: svgPath(dipSrc),
    startAsset: svgPath(dipStartSrc),
    endAsset: svgPath(dipEndSrc),
  },
  'wall-handstand': {
    label: 'Wall Handstand',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['core'],
    asset: svgPath(wallHandstandSrc),
  },
};

const CATALOG_VISUAL_KEY_BY_ID: Record<string, ExerciseVisualKey> = {
  'Band_Assisted_Pull-Up': 'pull-up',
  Bench_Dips: 'dip',
  Bodyweight_Squat: 'squat',
  Bodyweight_Walking_Lunge: 'lunge',
  Chair_Squat: 'squat',
  'Clock_Push-Up': 'push-up',
  'Decline_Push-Up': 'push-up',
  'Dips_-_Chest_Version': 'dip',
  'Dips_-_Triceps_Version': 'dip',
  'Incline_Push-Up': 'push-up',
  'Incline_Push-Up_Medium': 'push-up',
  Parallel_Bar_Dip: 'dip',
  Plank: 'plank',
  Pullups: 'pull-up',
  'Push-Up_Wide': 'push-up',
  'Push-Ups_-_Close_Triceps_Position': 'push-up',
};

const VISUAL_ALIAS_BY_LOOKUP: Record<string, ExerciseVisualKey> = {
  'band assisted pull up': 'pull-up',
  'bench dips': 'dip',
  'bodyweight squat': 'squat',
  'bodyweight walking lunge': 'lunge',
  'chair squat': 'squat',
  'clock push up': 'push-up',
  'decline push up': 'push-up',
  'dip machine': 'dip',
  dips: 'dip',
  'dips chest version': 'dip',
  'dips triceps version': 'dip',
  'incline push up': 'push-up',
  'incline push up close grip': 'push-up',
  'incline push up medium': 'push-up',
  'incline push up wide': 'push-up',
  lunges: 'lunge',
  plank: 'plank',
  'parallel bar dip': 'dip',
  'pull ups': 'pull-up',
  'pull up': 'pull-up',
  'push up': 'push-up',
  'push up wide': 'push-up',
  'push ups': 'push-up',
  'push ups close triceps position': 'push-up',
  'push-ups': 'push-up',
  'pushup': 'push-up',
  'pushups': 'push-up',
  'pullups': 'pull-up',
  'pull-ups': 'pull-up',
  'squats': 'squat',
  squat: 'squat',
  'walking lunge': 'lunge',
  'wall handstand': 'wall-handstand',
  'wall-handstand': 'wall-handstand',
};

const MUSCLE_FALLBACKS: Record<MuscleGroup, ExerciseAsset> = {
  chest: { type: 'svg-component', component: ChestFallbackVisual },
  back: { type: 'svg-component', component: BackFallbackVisual },
  legs: { type: 'svg-component', component: LegsFallbackVisual },
  shoulders: { type: 'svg-component', component: ShouldersFallbackVisual },
  arms: { type: 'svg-component', component: ArmsFallbackVisual },
  core: { type: 'svg-component', component: CoreFallbackVisual },
};

function normalizeVisualLookup(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[_()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cloneMuscles(muscles: readonly MuscleGroup[]) {
  return [...muscles];
}

function resolveAliasVisualKey(id?: string | null, name?: string | null): ExerciseVisualKey | undefined {
  const candidates = [id, name]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => normalizeVisualLookup(value));

  return candidates.find((candidate) => VISUAL_ALIAS_BY_LOOKUP[candidate])
    ? VISUAL_ALIAS_BY_LOOKUP[candidates.find((candidate) => VISUAL_ALIAS_BY_LOOKUP[candidate])!]
    : undefined;
}

export function getCatalogVisualKeyById(id?: string | null): ExerciseVisualKey | undefined {
  if (!id) {
    return undefined;
  }

  return CATALOG_VISUAL_KEY_BY_ID[id];
}

export function isExerciseVisualKey(value: unknown): value is ExerciseVisualKey {
  return typeof value === 'string' && Object.hasOwn(EXERCISE_VISUALS, value);
}

export function resolveExerciseVisualKeySource(
  subject: ExerciseVisualSubject,
): { source: 'explicit' | 'catalog' | 'alias'; visualKey: ExerciseVisualKey } | null {
  if (isExerciseVisualKey(subject.visualKey)) {
    return { source: 'explicit', visualKey: subject.visualKey };
  }

  const catalogVisualKey = getCatalogVisualKeyById(subject.id);
  if (catalogVisualKey) {
    return { source: 'catalog' as const, visualKey: catalogVisualKey };
  }

  const aliasVisualKey = resolveAliasVisualKey(subject.id, subject.name);
  if (aliasVisualKey) {
    return { source: 'alias' as const, visualKey: aliasVisualKey };
  }

  return null;
}

export function resolveExerciseVisualKeyCandidate(subject: ExerciseVisualSubject): ExerciseVisualKey | undefined {
  return resolveExerciseVisualKeySource(subject)?.visualKey;
}

export function resolveExerciseVisualMatch(subject: ExerciseVisualSubject): ExerciseVisualMatch | null {
  const resolvedVisual = resolveExerciseVisualKeySource(subject);
  if (resolvedVisual) {
    const definition = EXERCISE_VISUALS[resolvedVisual.visualKey];
    return {
      kind: 'visual',
      source: resolvedVisual.source,
      visualKey: resolvedVisual.visualKey,
      definition,
      primaryMuscles: cloneMuscles(definition.primaryMuscles),
      secondaryMuscles: cloneMuscles(definition.secondaryMuscles),
    };
  }

  if (subject.muscleGroup) {
    return {
      kind: 'muscle-fallback',
      source: 'muscle-group',
      muscleGroup: subject.muscleGroup,
      asset: MUSCLE_FALLBACKS[subject.muscleGroup],
      primaryMuscles: [subject.muscleGroup],
      secondaryMuscles: [],
    };
  }

  if (subject.iconName) {
    return {
      kind: 'legacy-icon',
      source: 'legacy-icon',
      iconName: subject.iconName,
      primaryMuscles: [],
      secondaryMuscles: [],
    };
  }

  return null;
}

export function getExerciseVisualAsset(
  subject: ExerciseVisualSubject,
  pose: 'main' | 'start' | 'end' = 'main',
) {
  const match = resolveExerciseVisualMatch(subject);

  if (!match || match.kind === 'legacy-icon') {
    return null;
  }

  if (match.kind === 'muscle-fallback') {
    return match.asset;
  }

  if (pose === 'start') {
    return match.definition.startAsset ?? match.definition.asset;
  }

  if (pose === 'end') {
    return match.definition.endAsset ?? match.definition.asset;
  }

  return match.definition.asset;
}

export function getExerciseVisualMuscles(subject: ExerciseVisualSubject) {
  const match = resolveExerciseVisualMatch(subject);

  if (!match) {
    return {
      primaryMuscles: subject.muscleGroup ? [subject.muscleGroup] : [],
      secondaryMuscles: [] as MuscleGroup[],
    };
  }

  return {
    primaryMuscles: cloneMuscles(match.primaryMuscles),
    secondaryMuscles: cloneMuscles(match.secondaryMuscles),
  };
}
