import { format } from 'date-fns';

import { parseDayKey } from '@/lib/dates';
import type { MuscleGroup } from '@/store/types';

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
};

export function formatMuscleGroup(muscleGroup: MuscleGroup) {
  return MUSCLE_LABELS[muscleGroup];
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
  return format(parseDayKey(dayKey), 'EEEE, MMM d');
}

export function formatClockLabel(value: string) {
  return format(new Date(value), 'HH:mm');
}
