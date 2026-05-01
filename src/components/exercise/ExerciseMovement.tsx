import { ArrowRight } from 'lucide-react';

import { ExerciseVisual } from '@/components/exercise/ExerciseVisual';
import { resolveExerciseVisualMatch } from '@/lib/exerciseVisuals';
import { cn } from '@/lib/utils';
import type { ExerciseIconName, ExerciseVisualKey, MuscleGroup } from '@/store/types';

interface ExerciseMovementProps {
  visualKey?: ExerciseVisualKey | null;
  className?: string;
  exerciseId?: string;
  exerciseName?: string;
  muscleGroup?: MuscleGroup;
  iconName?: ExerciseIconName;
}

export function ExerciseMovement({
  visualKey,
  className,
  exerciseId,
  exerciseName,
  muscleGroup,
  iconName,
}: ExerciseMovementProps) {
  const subject = {
    visualKey,
    id: exerciseId,
    name: exerciseName,
    muscleGroup,
    iconName,
  };
  const match = resolveExerciseVisualMatch(subject);
  const hasPosePair = match?.kind === 'visual' && Boolean(match.definition.startAsset || match.definition.endAsset);

  return (
    <section className={cn('rounded-[2rem] border border-white/6 bg-[#0b1320]/88 p-4 shadow-[0_20px_46px_rgba(0,0,0,0.18)]', className)}>
      {hasPosePair ? (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div>
            <ExerciseVisual
              {...subject}
              variant="movement"
              pose="start"
            />
            <p className="mt-3 text-center text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Inicio</p>
          </div>

          <div className="flex items-center justify-center text-zinc-500">
            <ArrowRight className="size-5" />
          </div>

          <div>
            <ExerciseVisual
              {...subject}
              variant="movement"
              pose="end"
            />
            <p className="mt-3 text-center text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Final</p>
          </div>
        </div>
      ) : (
        <div>
          <ExerciseVisual
            {...subject}
            variant="detail"
            className="aspect-[16/8] p-4"
          />
          <p className="mt-3 text-center text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Postura base</p>
        </div>
      )}
    </section>
  );
}
