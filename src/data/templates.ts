import { WorkoutSession, MuscleGroup } from '@/store';

export interface WorkoutTemplate {
  id: string;
  name: string;
  durationMinutes: number;
  description: string;
  targetMuscles: MuscleGroup[];
  // we can mock the exercise IDs. Actually, better to just use predefined exercise details
  tags: string[];
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 't1',
    name: 'Upper Body Power',
    durationMinutes: 45,
    description: 'A complete upper body routine focusing on push and pull mechanics.',
    targetMuscles: ['chest', 'back', 'shoulders', 'arms'],
    tags: ['Hypertrophy', 'Strength'],
  },
  {
    id: 't2',
    name: 'Core & Mobility',
    durationMinutes: 20,
    description: 'Quick core burner and full body mobility.',
    targetMuscles: ['core'],
    tags: ['Recovery', 'Abs'],
  },
  {
    id: 't3',
    name: 'Leg Day Blast',
    durationMinutes: 50,
    description: 'Lower body focused workout to build strength and size.',
    targetMuscles: ['legs'],
    tags: ['Lower Body', 'Strength'],
  },
  {
    id: 't4',
    name: 'Full Body HIIT',
    durationMinutes: 30,
    description: 'High intensity interval training hitting every major muscle group.',
    targetMuscles: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'],
    tags: ['Cardio', 'HIIT'],
  }
];
