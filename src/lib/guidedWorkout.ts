import { differenceInDays } from 'date-fns';

import { DEFAULT_REST_DURATION_SECONDS } from '@/lib/recoveryModel';
import { buildWorkoutLog, createWorkoutSet, getTrackedSets } from '@/lib/workout';
import type {
  DraftSession,
  ExerciseDefinition,
  MuscleGroup,
  WorkoutLog,
  WorkoutSession,
} from '@/store/types';

export type GuidedRoutinePresetId = 'upper' | 'lower' | 'core';
export type GuidedStepVisualKey =
  | 'arm-circles'
  | 'chest-opener'
  | 'child-pose'
  | 'glute-release'
  | 'hamstrings-ankles'
  | 'opposite-limbs-floor'
  | 'shoulder-circles'
  | 'torso-rotation'
  | 'upper-back-release';

type GuidedStepTone = 'mint' | 'amber' | 'blue';

interface GuidedTimedStep {
  id: string;
  kind: 'warmup' | 'transition' | 'rest' | 'cooldown';
  title: string;
  subtitle: string;
  detail: string;
  cues: string[];
  visualKey?: GuidedStepVisualKey;
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
  defaultReps: number;
}

interface GuidedFlowCopy {
  warmup: Array<Omit<GuidedTimedStep, 'id' | 'kind'>>;
  transition: Omit<GuidedTimedStep, 'id' | 'kind'>;
  cooldown: Array<Omit<GuidedTimedStep, 'id' | 'kind'>>;
}

const UPPER_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms'];
const LOWER_MUSCLES: MuscleGroup[] = ['legs'];
const CORE_MUSCLES: MuscleGroup[] = ['core'];

const ROUTINE_PRESET_META: RoutinePresetMeta[] = [
  {
    id: 'upper',
    name: 'Rutina tren superior',
    description: 'Empuje y tiron de base con progresion hacia variantes mas exigentes sin salirte del trabajo casero.',
    chip: 'Guiada',
    muscleGroups: ['chest', 'back', 'shoulders', 'arms'],
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
    keywords: ['push-up', 'pushup', 'row', 'press', 'dip', 'triceps', 'pulldown', 'decline push', 'incline push'],
    defaultReps: 10,
  },
  {
    id: 'lower',
    name: 'Rutina tren inferior',
    description: 'Piernas y gluteos con sentadillas, zancadas, puentes y variantes estables para progresar.',
    chip: 'Guiada',
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
    keywords: ['squat', 'lunge', 'bridge', 'glute', 'hip raise', 'deadlift', 'hinge', 'split squat'],
    defaultReps: 12,
  },
  {
    id: 'core',
    name: 'Rutina core',
    description: 'Zona media con repeticiones controladas, isometricos y variantes que escalan sin romper la tecnica.',
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
    keywords: ['dead bug', 'crunch', 'sit-up', 'leg raise', 'flutter', 'hip raise', 'mountain climber', 'plank', 'hollow'],
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
          subtitle: 'Sube rodillas y mueve brazos sin perder el ritmo.',
          detail: 'Busca ritmo y respiracion estable antes de cargar las piernas.',
          cues: [
            'Sube una rodilla a la vez hasta donde te salga cómodo.',
            'Mueve los brazos al mismo ritmo, sin tensar el cuello.',
            'Respira parejo y mantén el pecho erguido.',
          ],
          durationSeconds: 60,
          tone: 'mint',
        },
        {
          title: 'Sentadilla corta con apertura',
          subtitle: 'Baja un poco, abre rodillas y vuelve a subir con control.',
          detail: 'Abre rango sin forzar y prepara tobillos, caderas y rodillas.',
          cues: [
            'Separa los pies al ancho de los hombros.',
            'Baja solo un poco, con los talones pegados al suelo.',
            'Sube despacio y deja que las rodillas sigan la línea de los pies.',
          ],
          durationSeconds: 60,
          tone: 'blue',
        },
        {
          title: 'Puente de gluteos suave',
          subtitle: 'Eleva la cadera y despierta gluteos y parte trasera de las piernas.',
          detail: 'Piensa en control, no en velocidad ni altura máxima.',
          cues: [
            'Acuéstate con rodillas dobladas y pies apoyados.',
            'Aprieta gluteos y sube la cadera despacio.',
            'Baja con control, sin dejarte caer.',
          ],
          durationSeconds: 60,
          tone: 'mint',
        },
      ],
      transition: {
        title: 'Prepárate para empezar',
        subtitle: 'Respira, planta tu postura y entra al primer ejercicio.',
        detail: 'En breve empieza la primera serie del bloque principal.',
        cues: [
          'Suelta hombros y mandibula.',
          'Planta los pies como los usaras en la primera serie.',
          'Haz una respiracion larga y repasa el primer movimiento.',
        ],
        durationSeconds: 60,
        tone: 'amber',
      },
      cooldown: [
        {
          title: 'Descarga de gluteos',
          subtitle: 'Cruza una pierna y abre la cadera con suavidad.',
          detail: 'Mantén respiraciones largas y deja que baje el pulso.',
          cues: [
            'Cruza el tobillo sobre la rodilla contraria.',
            'Mantén la espalda larga sin encorvarte.',
            'Respira lento y evita forzar el estiramiento.',
          ],
          visualKey: 'glute-release',
          durationSeconds: 60,
          tone: 'blue',
        },
        {
          title: 'Isquios y tobillos',
          subtitle: 'Flexion suave y movilidad final.',
          detail: 'Busca alivio, no profundidad extrema.',
          cues: [
            'Flexiona un poco las rodillas para quitar tension lumbar.',
            'Inclina el torso solo hasta sentir un tiron suave.',
            'Mueve tobillos y pies mientras bajas pulsaciones.',
          ],
          visualKey: 'hamstrings-ankles',
          durationSeconds: 60,
          tone: 'mint',
        },
      ],
    };
  }

  if (category === 'core') {
    return {
      warmup: [
        {
          title: 'Respira y aprieta el abdomen',
          subtitle: 'Inhala, exhala y deja el abdomen firme antes de empezar.',
          detail: 'Usa la respiración para preparar el centro sin tensar cuello ni hombros.',
          cues: [
            'Toma aire por la nariz llenando pecho y abdomen.',
            'Suelta el aire despacio por la boca.',
            'Al final de la exhalación, aprieta suavemente el abdomen.',
          ],
          durationSeconds: 60,
          tone: 'mint',
        },
        {
          title: 'Gato-vaca suave',
          subtitle: 'Redondea y arquea la espalda poco a poco.',
          detail: 'Mueve la columna con calma y sin forzar el cuello.',
          cues: [
            'Apoya manos y rodillas en una posición cómoda.',
            'Redondea la espalda hacia arriba y luego abre el pecho.',
            'Mueve la columna despacio, sin forzar el cuello.',
          ],
          durationSeconds: 60,
          tone: 'blue',
        },
        {
          title: 'Brazos y piernas opuestos en suelo',
          subtitle: 'Desde el suelo, alarga un brazo y la pierna contraria sin mover la cintura.',
          detail: 'Piensa en estabilidad y control antes que en velocidad.',
          cues: [
            'Acuéstate boca arriba con rodillas dobladas y brazos extendidos hacia el techo.',
            'Extiende un brazo y la pierna contraria despacio.',
            'Vuelve al centro y cambia de lado sin arquear la espalda.',
          ],
          visualKey: 'opposite-limbs-floor',
          durationSeconds: 60,
          tone: 'mint',
        },
      ],
      transition: {
        title: 'Prepárate para empezar',
        subtitle: 'Acomoda manos y espalda antes del primer ejercicio.',
        detail: 'Deja el abdomen activo y entra con control al bloque principal.',
        cues: [
          'Suelta el aire y vuelve a apretar suavemente el abdomen.',
          'Acomoda manos, espalda y apoyo antes de empezar.',
          'Piensa en control, no en velocidad.',
        ],
        durationSeconds: 60,
        tone: 'amber',
      },
      cooldown: [
        {
          title: 'Rotacion suave',
          subtitle: 'Afloja el tronco y libera tension.',
          detail: 'Respira profundo mientras la zona media baja revoluciones.',
          cues: [
            'Deja caer las rodillas o gira el tronco sin dolor.',
            'Mantén hombros relajados y cuello largo.',
            'Haz la exhalacion mas larga que la inhalacion.',
          ],
          visualKey: 'torso-rotation',
          durationSeconds: 60,
          tone: 'blue',
        },
        {
          title: 'Postura del nino',
          subtitle: 'Alarga espalda y caja toracica.',
          detail: 'Quédate quieto y termina largo.',
          cues: [
            'Lleva gluteos hacia talones sin colapsar hombros.',
            'Estira brazos al frente o a los lados.',
            'Respira hacia la espalda baja y costillas.',
          ],
          visualKey: 'child-pose',
          durationSeconds: 60,
          tone: 'mint',
        },
      ],
    };
  }

  return {
    warmup: [
      {
        title: 'Circulos de brazos',
        subtitle: 'Abre hombros y pecho con circulos amplios y suaves.',
        detail: 'Hazlos amplios y fluidos, sin tensar el cuello.',
        cues: [
          'Empieza con circulos pequeños y ve ampliándolos.',
          'Haz unas repeticiones hacia delante y otras hacia atrás.',
          'Mantén los hombros lejos de las orejas.',
        ],
        visualKey: 'arm-circles',
        durationSeconds: 60,
        tone: 'mint',
      },
      {
        title: 'Circulos de hombros',
        subtitle: 'Lleva los hombros hacia atrás y adelante para soltar la parte alta.',
        detail: 'Piensa en soltar hombros y espalda alta antes del bloque principal.',
        cues: [
          'Sube los hombros, llévalos atrás y bájalos despacio.',
          'Haz luego el mismo recorrido hacia delante.',
          'Mueve solo hombros y espalda alta, sin apretar el cuello.',
        ],
        visualKey: 'shoulder-circles',
        durationSeconds: 60,
        tone: 'blue',
      },
      {
        title: 'Prueba el movimiento',
        subtitle: 'Haz unas repeticiones suaves del ejercicio que viene.',
        detail: 'Prepara articulaciones y ritmo antes del bloque principal.',
        cues: [
          'Repite el gesto del primer ejercicio, pero más lento.',
          'Usa menos rango si todavía te sientes rígido.',
          'Piensa en postura y control, no en cansarte.',
        ],
        durationSeconds: 60,
        tone: 'mint',
      },
    ],
    transition: {
      title: 'Prepárate para empezar',
      subtitle: 'Suelta tension y entra suave al primer ejercicio.',
      detail: 'Ajusta la postura de salida antes de empezar la primera serie.',
      cues: [
        'Afloja munecas, hombros y cuello.',
        'Abre el pecho y acomoda la postura de salida.',
        'Haz una repeticion de prueba si la necesitas.',
      ],
      durationSeconds: 60,
      tone: 'amber',
    },
    cooldown: [
      {
        title: 'Apertura de pecho',
        subtitle: 'Descomprime hombros y parte frontal del torso.',
        detail: 'Mantén claviculas abiertas y baja la respiracion.',
        cues: [
          'Entrelaza manos o abre brazos detras del cuerpo con suavidad.',
          'Eleva esternon sin arquear la zona lumbar.',
          'Sostén la postura mientras exhalas lento.',
        ],
        visualKey: 'chest-opener',
        durationSeconds: 60,
        tone: 'blue',
      },
      {
        title: 'Espalda alta',
        subtitle: 'Abraza el frente y redondea suave.',
        detail: 'Suelta cuello y termina largo.',
        cues: [
          'Abraza hombros o estira brazos al frente.',
          'Separa escapulas redondeando la parte alta de la espalda.',
          'Deja que la respiracion vaya bajando el pulso.',
        ],
        visualKey: 'upper-back-release',
        durationSeconds: 60,
        tone: 'mint',
      },
    ],
  };
}

function scoreExerciseForPreset(exercise: ExerciseDefinition, preset: RoutinePresetMeta) {
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

  if (exercise.isBodyweight) {
    score += 24;
  } else {
    score += 10;
  }

  if (exercise.mechanic === 'isometric') {
    score += preset.id === 'core' ? 30 : 8;
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

function hasProgressionSignal(log: WorkoutLog, session: WorkoutSession) {
  if (session.effort > 3) {
    return false;
  }

  const trackedSets = getTrackedSets(log);
  return trackedSets.length > 0 && trackedSets.every((set) => set.reps > 12);
}

function getProgressionHits(exerciseId: string, recentSessions: WorkoutSession[]) {
  return recentSessions.filter((session) => {
    const log = session.logs.find((entry) => entry.exerciseId === exerciseId);
    return log ? hasProgressionSignal(log, session) : false;
  }).length;
}

function getPresetSetCount(exerciseId: string, recentSessions: WorkoutSession[]) {
  const progressionHits = getProgressionHits(exerciseId, recentSessions);
  if (progressionHits >= 4) {
    return 4;
  }

  if (progressionHits >= 2) {
    return 3;
  }

  return 2;
}

function getRecentSessions(sessions: WorkoutSession[], referenceDate = new Date()) {
  return sessions.filter((session) => differenceInDays(referenceDate, new Date(session.performedAt)) <= 14);
}

export function buildGuidedRoutinePreset(
  exercises: ExerciseDefinition[],
  presetId: GuidedRoutinePresetId,
  recentSessions: WorkoutSession[] = [],
  referenceDate = new Date(),
): GuidedRoutinePreset {
  const preset = ROUTINE_PRESET_META.find((entry) => entry.id === presetId);
  if (!preset) {
    throw new Error(`Unknown routine preset: ${presetId}`);
  }

  const recent = getRecentSessions(recentSessions, referenceDate);
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
    const setCount = getPresetSetCount(exercise.id, recent);

    log.sets = Array.from({ length: setCount }, () => createWorkoutSet({
      reps: preset.defaultReps,
      weight: exercise.isBodyweight ? 0 : 8,
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
    id: 'transition-0',
    kind: 'transition',
    ...copy.transition,
  });

  const mainSteps = draftSession.logs.flatMap((log) =>
    log.sets.map((set, setIndex) => ({
      id: `main-${log.id}-${setIndex}`,
      kind: 'main' as const,
      title: log.exerciseName,
      subtitle: `${setIndex + 1} de ${log.sets.length} · ${formatMuscleGroupLabel(log.muscleGroup)}`,
      detail: log.isBodyweight
        ? 'No necesitas registrar peso. Completa las repeticiones con tecnica limpia y marca la serie al terminar.'
        : 'Sigue la carga objetivo, mantén el control y registra la serie al terminar.',
      logId: log.id,
      setIndex,
      totalSets: log.sets.length,
      reps: set.reps,
      weight: set.weight,
      isBodyweight: log.isBodyweight,
      muscleGroup: log.muscleGroup,
    })),
  );

  mainSteps.forEach((step, index) => {
    steps.push(step);

    if (index < mainSteps.length - 1) {
      steps.push({
        id: `rest-${index}`,
        kind: 'rest',
        title: 'Descanso guiado',
        subtitle: 'Respira, suelta tension y prepara la siguiente serie.',
        detail: `Siguiente: ${mainSteps[index + 1]?.title ?? 'siguiente bloque'}`,
        cues: [
          'Camina un poco o sacude brazos y piernas.',
          'Respira por nariz y alarga la exhalacion.',
          'Repasa la tecnica de la siguiente serie.',
        ],
        durationSeconds: draftSession.restDurationSeconds || DEFAULT_REST_DURATION_SECONDS,
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
