import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { parseDayKey } from '@/lib/dates';
import type { MuscleGroup, PreferredTrainingTime, TrainingDay } from '@/store/types';

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  legs: 'Piernas',
  shoulders: 'Hombros',
  arms: 'Brazos',
  core: 'Core',
};

export function formatMuscleGroup(muscleGroup: MuscleGroup) {
  return MUSCLE_LABELS[muscleGroup];
}

export const TRAINING_DAY_LABELS: Record<TrainingDay, string> = {
  mon: 'Lun',
  tue: 'Mar',
  wed: 'Mié',
  thu: 'Jue',
  fri: 'Vie',
  sat: 'Sáb',
  sun: 'Dom',
};

export const PREFERRED_TIME_LABELS: Record<PreferredTrainingTime, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening: 'Noche',
};

export function formatTrainingDay(day: TrainingDay) {
  return TRAINING_DAY_LABELS[day];
}

export function formatTrainingDays(days: TrainingDay[]) {
  if (days.length === 0) {
    return 'Sin días seleccionados';
  }

  return days.map((day) => formatTrainingDay(day)).join(' · ');
}

export function formatPreferredTrainingTime(value: PreferredTrainingTime) {
  return PREFERRED_TIME_LABELS[value];
}

export function capitalizeText(value: string) {
  if (!value) {
    return value;
  }

  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatDayHeading(dayKey: string) {
  return capitalizeText(format(parseDayKey(dayKey), "EEEE, d 'de' MMMM", { locale: es }));
}

export function formatClockLabel(value: string) {
  return format(new Date(value), 'HH:mm', { locale: es });
}
