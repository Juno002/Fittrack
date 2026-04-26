import Model, { type IExerciseData, type Muscle } from 'react-body-highlighter';
import type { MuscleGroup } from '@/store/types';
import { cn } from '@/lib/utils';

export const MUSCLE_MAPPING: Record<MuscleGroup, Muscle[]> = {
  chest: ['chest'],
  back: ['trapezius', 'upper-back', 'lower-back'],
  legs: ['quadriceps', 'gluteal', 'hamstring', 'calves', 'adductor'],
  shoulders: ['front-deltoids', 'back-deltoids'],
  arms: ['biceps', 'triceps', 'forearm'],
  core: ['abs', 'obliques'],
};

interface MuscleHighlightProps {
  muscleGroup: MuscleGroup;
  className?: string;
}

export function MuscleHighlight({ muscleGroup, className }: MuscleHighlightProps) {
  const data: IExerciseData[] = [
    { name: 'Active Focus', muscles: MUSCLE_MAPPING[muscleGroup] }
  ];

  return (
    <div className={cn("flex items-center justify-center gap-6 rounded-[2rem] border border-white/5 bg-black/10 py-4", className)}>
      <div className="flex flex-col items-center">
        <Model
          data={data}
          style={{ width: '5rem', color: '#6EE7B7' }}
          type="anterior"
          highlightedColors={['#6EE7B7']}
        />
        <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500">Front</p>
      </div>
      <div className="flex flex-col items-center">
        <Model
          data={data}
          style={{ width: '5rem', color: '#6EE7B7' }}
          type="posterior"
          highlightedColors={['#6EE7B7']}
        />
        <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500">Back</p>
      </div>
    </div>
  );
}
