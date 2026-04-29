import { buildWorkoutLog, createWorkoutSet } from '@/lib/workout';
import type {
  DraftSession,
  ExerciseDefinition,
  MuscleGroup,
  WorkoutLog,
} from '@/store/types';

export type GuidedRoutinePresetId = 'upper' | 'lower' | 'core';

type GuidedStepTone = 'mint' | 'amber' | 'blue';

interface GuidedTimedStep {
  id: string;
  kind: 'warmup' | 'rest' | 'cooldown';
  title: string;
  subtitle: string;
  detail: string;
  durationSeconds: number;
  tone: GuidedStepTone;
}

interface GuidedMainStep {
  id: string;
  kind: 'main';
  title: string;
  subtitle: string;
  detail: string;
  logId: string;
  setIndex: number;
  totalSets: number;
  reps: number;
  weight: number;
  isBodyweight: boolean;
  muscleGroup: MuscleGroup;
}

export type GuidedWorkoutStep = GuidedTimedStep | GuidedMainStep;

export interface GuidedRoutinePreset {
  id: GuidedRoutinePresetId;
  name: string;
  description: string;
  chip: string;
  logs: WorkoutLog[];
}

interface RoutinePresetMeta {
  id: GuidedRoutinePresetId;
  name: string;
  description: string;
  chip: string;
  muscleGroups: MuscleGroup[];
  preferredIds: string[];
  keywords: string[];
  setCount: number;
  defaultReps: number;
}

interface GuidedFlowCopy {
  warmup: Array<Omit<GuidedTimedStep, 'id' | 'kind'>>;
  warmupRest: Omit<GuidedTimedStep, 'id' | 'kind'>;
  cooldown: Array<Omit<GuidedTimedStep, 'id' | 'kind'>>;
}

const UPPER_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms'];
const LOWER_MUSCLES: MuscleGroup[] = ['legs'];
const CORE_MUSCLES: MuscleGroup[] = ['core'];

const ROUTINE_PRESET_META: RoutinePresetMeta[] = [
  {
    id: 'upper',
    name: 'Rutina tren superior',
    description: 'Empuje de pecho, hombro y brazos con variantes de peso corporal.',
    chip: 'Sin equipo',
    muscleGroups: ['chest', 'shoulders', 'arms'],
    preferredIds: [
      'push-ups',
      'Pushups',
      'Push-Up_Wide',
      'Push-Ups_-_Close_Triceps_Position',
      'Close-Grip_Push-Up_off_of_a_Dumbbell',
      'Clock_Push-Up',
      'Decline_Push-Up',
      'Incline_Push-Up_Close-Grip',
    ],
    keywords: ['push-up', 'pushup', 'close-grip', 'triceps', 'clock push', 'decline push', 'incline push'],
    setCount: 2,
    defaultReps: 10,
  },
  {
    id: 'lower',
    name: 'Rutina tren inferior',
    description: 'Piernas y glúteos con sentadillas, zancadas y bisagra simple.',
    chip: 'Bodyweight',
    muscleGroups: ['legs'],
    preferredIds: [
      'squats',
      'Bodyweight_Squat',
      'Chair_Squat',
      'lunges',
      'Bodyweight_Walking_Lunge',
      'Crossover_Reverse_Lunge',
      'Butt_Lift_Bridge',
      'Single_Leg_Glute_Bridge',
    ],
    keywords: ['squat', 'lunge', 'bridge', 'glute', 'hip raise'],
    setCount: 2,
    defaultReps: 12,
  },
  {
    id: 'core',
    name: 'Rutina core',
    description: 'Zona media con repeticiones controladas y sin pedir peso.',
    chip: 'Guiada',
    muscleGroups: ['core'],
    preferredIds: [
      'Dead_Bug',
      'dead-bug',
      'plank',
      'Crunches',
      '3_4_Sit-Up',
      'Cross-Body_Crunch',
      'Flutter_Kicks',
      'Front_Leg_Raises',
      'Bent-Knee_Hip_Raise',
    ],
    keywords: ['dead bug', 'crunch', 'sit-up', 'leg raise', 'flutter', 'hip raise', 'mountain climber'],
    setCount: 2,
    defaultReps: 14,
  },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[_()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferWorkoutCategory(logs: WorkoutLog[]): GuidedRoutinePresetId {
  const counts = logs.reduce(
    (summary, log) => {
      if (CORE_MUSCLES.includes(log.muscleGroup)) {
        summary.core += 1;
      } else if (LOWER_MUSCLES.includes(log.muscleGroup)) {
        summary.lower += 1;
      } else if (UPPER_MUSCLES.includes(log.muscleGroup)) {
        summary.upper += 1;
      }

      return summary;
    },
    { upper: 0, lower: 0, core: 0 },
  );

  if (counts.core > 0 && counts.upper === 0 && counts.lower === 0) {
    return 'core';
  }

  if (counts.lower >= counts.upper && counts.lower >= counts.core) {
    return 'lower';
  }

  return 'upper';
}

function getGuidedFlowCopy(category: GuidedRoutinePresetId): GuidedFlowCopy {
  if (category === 'lower') {
    return {
      warmup: [
        {
          title: 'Marcha activa',
          subtitle: 'Eleva rodillas y mueve brazos con ritmo.',
          detail: 'Respira por la nariz y suelta caderas. La pantalla avanzará sola.',
          durationSeconds: 35,
          tone: 'mint',
        },
        {
          title: 'Movilidad de cadera',
          subtitle: 'Sentadilla parcial y apertura de cadera.',
          detail: 'Busca rango cómodo, no velocidad. Mantén el tronco largo.',
          durationSeconds: 35,
          tone: 'blue',
        },
      ],
      warmupRest: {
        title: 'Respira y prepárate',
        subtitle: 'En breve empieza la parte principal.',
        detail: 'Toma aire, suelta tensión y prepara tu primera serie.',
        durationSeconds: 20,
        tone: 'amber',
      },
      cooldown: [
        {
          title: 'Estiramiento de glúteo',
          subtitle: 'Cruza una pierna y abre la cadera con suavidad.',
          detail: 'Mantén la respiración larga y deja que baje el pulso.',
          durationSeconds: 35,
          tone: 'blue',
        },
        {
          title: 'Descarga de isquios',
          subtitle: 'Flexión suave con rodillas blandas.',
          detail: 'No rebotes. Busca una sensación ligera de alivio.',
          durationSeconds: 35,
          tone: 'mint',
        },
      ],
    };
  }

  if (category === 'core') {
    return {
      warmup: [
        {
          title: 'Respiración con abdomen activo',
          subtitle: 'Activa la zona media antes de empezar.',
          detail: 'Inhala profundo, exhala largo y lleva el ombligo hacia dentro.',
          durationSeconds: 30,
          tone: 'mint',
        },
        {
          title: 'Movilidad columna',
          subtitle: 'Gato-vaca suave y controlado.',
          detail: 'Mueve la espalda segmento a segmento, sin forzar el cuello.',
          durationSeconds: 35,
          tone: 'blue',
        },
      ],
      warmupRest: {
        title: 'Centro listo',
        subtitle: 'Empieza el bloque principal en breve.',
        detail: 'Mantén abdomen activo y hombros relajados.',
        durationSeconds: 18,
        tone: 'amber',
      },
      cooldown: [
        {
          title: 'Rotación suave',
          subtitle: 'Deja que el tronco se afloje.',
          detail: 'Respira profundo mientras sueltas la tensión del core.',
          durationSeconds: 30,
          tone: 'blue',
        },
        {
          title: 'Postura del niño',
          subtitle: 'Alarga espalda y caja torácica.',
          detail: 'Quédate quieto y deja que el ritmo baje solo.',
          durationSeconds: 35,
          tone: 'mint',
        },
      ],
    };
  }

  return {
    warmup: [
      {
        title: 'Círculos de brazos',
        subtitle: 'Abre hombros y pecho antes de empujar.',
        detail: 'Hazlos amplios y fluidos. La pantalla avanzará sola.',
        durationSeconds: 30,
        tone: 'mint',
      },
      {
        title: 'Activación escapular',
        subtitle: 'Protrae y retrae hombros con control.',
        detail: 'Piensa en preparar hombros, pecho y brazos para la primera serie.',
        durationSeconds: 35,
        tone: 'blue',
      },
    ],
    warmupRest: {
      title: 'Ajusta respiración',
      subtitle: 'En breve inicia el ejercicio principal.',
      detail: 'Sacude brazos y entra al primer bloque con control.',
      durationSeconds: 20,
      tone: 'amber',
    },
    cooldown: [
      {
        title: 'Apertura de pecho',
        subtitle: 'Descomprime hombros y parte frontal del torso.',
        detail: 'Mantén clavículas abiertas y baja la respiración.',
        durationSeconds: 35,
        tone: 'blue',
      },
      {
        title: 'Estiramiento de espalda alta',
        subtitle: 'Abraza el frente y redondea suave.',
        detail: 'Quédate quieto, suelta cuello y termina largo.',
        durationSeconds: 35,
        tone: 'mint',
      },
    ],
  };
}

function scoreExerciseForPreset(exercise: ExerciseDefinition, preset: RoutinePresetMeta) {
  if (!exercise.isBodyweight || exercise.mechanic === 'isometric') {
    return -1;
  }

  const normalizedId = normalizeText(exercise.id);
  const normalizedName = normalizeText(exercise.name);
  const haystack = `${normalizedId} ${normalizedName}`;

  let score = 0;

  if (preset.preferredIds.some((preferredId) => normalizeText(preferredId) === normalizedId)) {
    score += 160;
  }

  if (preset.muscleGroups.includes(exercise.muscleGroup)) {
    score += 80;
  }

  if (exercise.mechanic === 'compound') {
    score += 40;
  }

  if (exercise.source === 'legacy') {
    score += 12;
  }

  if (preset.keywords.some((keyword) => haystack.includes(normalizeText(keyword)))) {
    score += 60;
  }

  if (preset.id === 'core' && exercise.mechanic === 'isolation') {
    score += 25;
  }

  return score;
}

function dedupeExercises(exercises: ExerciseDefinition[]) {
  const seen = new Set<string>();

  return exercises.filter((exercise) => {
    if (seen.has(exercise.id)) {
      return false;
    }

    seen.add(exercise.id);
    return true;
  });
}

export function buildGuidedRoutinePreset(
  exercises: ExerciseDefinition[],
  presetId: GuidedRoutinePresetId,
): GuidedRoutinePreset {
  const preset = ROUTINE_PRESET_META.find((entry) => entry.id === presetId);
  if (!preset) {
    throw new Error(`Unknown routine preset: ${presetId}`);
  }

  const rankedExercises = dedupeExercises(exercises)
    .map((exercise) => ({
      exercise,
      score: scoreExerciseForPreset(exercise, preset),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.exercise.name.localeCompare(right.exercise.name);
    });

  const selectedExercises = rankedExercises.slice(0, 3).map((entry) => entry.exercise);

  const logs = selectedExercises.map((exercise) => {
    const log = buildWorkoutLog(exercise);

    log.sets = Array.from({ length: preset.setCount }, () => createWorkoutSet({
      reps: preset.defaultReps,
      weight: 0,
    }));

    return log;
  });

  return {
    id: preset.id,
    name: preset.name,
    description: preset.description,
    chip: preset.chip,
    logs,
  };
}

export function buildGuidedWorkoutSteps(draftSession: DraftSession): GuidedWorkoutStep[] {
  if (draftSession.logs.length === 0) {
    return [];
  }

  const category = inferWorkoutCategory(draftSession.logs);
  const copy = getGuidedFlowCopy(category);
  const steps: GuidedWorkoutStep[] = [];

  copy.warmup.forEach((step, index) => {
    steps.push({
      id: `warmup-${index}`,
      kind: 'warmup',
      ...step,
    });
  });

  steps.push({
    id: 'warmup-rest',
    kind: 'rest',
    ...copy.warmupRest,
  });

  const mainSteps = draftSession.logs.flatMap((log) =>
    log.sets.map((set, setIndex) => ({
      id: `main-${log.id}-${setIndex}`,
      kind: 'main' as const,
      title: log.exerciseName,
      subtitle: `${setIndex + 1} de ${log.sets.length} · ${formatMuscleGroupLabel(log.muscleGroup)}`,
      detail: log.isBodyweight
        ? 'No necesitas registrar peso. Haz las repeticiones y pulsa cuando termines.'
        : 'Sigue la carga objetivo y marca la serie al terminar.',
      logId: log.id,
      setIndex,
      totalSets: log.sets.length,
      reps: set.reps,
      weight: set.weight,
      isBodyweight: log.isBodyweight,
      muscleGroup: log.muscleGroup,
    }))
  );

  mainSteps.forEach((step, index) => {
    steps.push(step);

    if (index < mainSteps.length - 1) {
      steps.push({
        id: `rest-${index}`,
        kind: 'rest',
        title: 'Descanso guiado',
        subtitle: 'Respira, suelta tensión y prepárate.',
        detail: `Siguiente: ${mainSteps[index + 1]?.title ?? 'siguiente bloque'}`,
        durationSeconds: draftSession.restDurationSeconds,
        tone: 'amber',
      });
    }
  });

  copy.cooldown.forEach((step, index) => {
    steps.push({
      id: `cooldown-${index}`,
      kind: 'cooldown',
      ...step,
    });
  });

  return steps;
}

function formatMuscleGroupLabel(muscleGroup: MuscleGroup) {
  switch (muscleGroup) {
    case 'arms':
      return 'Brazos';
    case 'back':
      return 'Espalda';
    case 'chest':
      return 'Pecho';
    case 'core':
      return 'Core';
    case 'legs':
      return 'Piernas';
    case 'shoulders':
      return 'Hombros';
    default:
      return muscleGroup;
  }
}
