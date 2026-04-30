import type {
  ExerciseDefinition,
  TrainingMode,
  WorkoutLog,
  WorkoutTemplate,
} from '@/store/types';

const HOME_NO_EQUIPMENT_MODE: TrainingMode = 'home-no-equipment';

const EXTERNAL_SETUP_KEYWORDS = [
  'captain chair',
  'chin up',
  'chin-up',
  'dip',
  'hanging',
  'inverted row',
  'muscle up',
  'muscle-up',
  'pull up',
  'pull-up',
  'ring',
  'roman chair',
  'suspension',
  'trx',
];

function normalizeModeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[_()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function requiresExternalSetup(label: string) {
  const normalizedLabel = normalizeModeText(label);
  return EXTERNAL_SETUP_KEYWORDS.some((keyword) => normalizedLabel.includes(keyword));
}

function isNoEquipmentBodyweight(label: string, isBodyweight: boolean) {
  return isBodyweight && !requiresExternalSetup(label);
}

export function isHomeNoEquipmentMode(mode: TrainingMode) {
  return mode === HOME_NO_EQUIPMENT_MODE;
}

export function getTrainingModeLabel(mode: TrainingMode) {
  return isHomeNoEquipmentMode(mode) ? 'Casa sin equipo' : 'Flexible';
}

export function getMovementModeLabel(isBodyweight: boolean, mode: TrainingMode) {
  if (isBodyweight) {
    return isHomeNoEquipmentMode(mode) ? 'Sin equipo' : 'Peso corporal';
  }

  return 'Carga externa';
}

export function isExerciseCompatibleWithTrainingMode(
  exercise: Pick<ExerciseDefinition, 'id' | 'name' | 'isBodyweight'>,
  mode: TrainingMode,
) {
  if (!isHomeNoEquipmentMode(mode)) {
    return true;
  }

  return isNoEquipmentBodyweight(`${exercise.id} ${exercise.name}`, exercise.isBodyweight);
}

export function isWorkoutLogCompatibleWithTrainingMode(
  log: Pick<WorkoutLog, 'exerciseId' | 'exerciseName' | 'isBodyweight'>,
  mode: TrainingMode,
) {
  if (!isHomeNoEquipmentMode(mode)) {
    return true;
  }

  return isNoEquipmentBodyweight(`${log.exerciseId} ${log.exerciseName}`, log.isBodyweight);
}

export function filterExercisesByTrainingMode(exercises: ExerciseDefinition[], mode: TrainingMode) {
  return exercises.filter((exercise) => isExerciseCompatibleWithTrainingMode(exercise, mode));
}

export function filterTemplatesByTrainingMode(templates: WorkoutTemplate[], mode: TrainingMode) {
  return templates.filter((template) =>
    template.logs.every((log) => isWorkoutLogCompatibleWithTrainingMode(log, mode)),
  );
}
