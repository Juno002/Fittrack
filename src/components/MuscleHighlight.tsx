import Model, { type ExtendedBodyPart, type Slug } from '@mjcdev/react-body-highlighter';
import type { MuscleGroup } from '@/store/types';
import { cn } from '@/lib/utils';

export const MUSCLE_MAPPING: Record<MuscleGroup, Slug[]> = {
  chest: ['chest'],
  back: ['trapezius', 'upper-back', 'lower-back'],
  legs: ['quadriceps', 'gluteal', 'hamstring', 'calves', 'adductors'],
  shoulders: ['deltoids'],
  arms: ['biceps', 'triceps', 'forearm'],
  core: ['abs', 'obliques'],
};

interface MuscleHighlightProps {
  muscleGroup: MuscleGroup;
  className?: string;
}

export function MuscleHighlight({ muscleGroup, className }: MuscleHighlightProps) {
  const data: ExtendedBodyPart[] = MUSCLE_MAPPING[muscleGroup].map(slug => ({
    slug,
    intensity: 1,
  }));

  return (
    <div className={cn("flex items-center justify-center gap-6 rounded-[2rem] border border-white/5 bg-black/10 py-4", className)}>
      <div className="flex flex-col items-center">
        <div className="w-20 [&>svg]:w-full [&>svg]:h-auto text-[#6EE7B7]">
          <Model
            data={data}
            side="front"
            colors={['#6EE7B7']}
            border="#252529"
          />
        </div>
        <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500">Front</p>
      </div>
      <div className="flex flex-col items-center">
        <div className="w-20 [&>svg]:w-full [&>svg]:h-auto text-[#6EE7B7]">
          <Model
            data={data}
            side="back"
            colors={['#6EE7B7']}
            border="#252529"
          />
        </div>
        <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500">Back</p>
      </div>
    </div>
  );
}
