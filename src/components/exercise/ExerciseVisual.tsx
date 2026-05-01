import type { ComponentType, SVGProps } from 'react';

import { ExerciseIcon } from '@/components/ExerciseIcon';
import {
  getExerciseVisualAsset,
  resolveExerciseVisualMatch,
  type ExerciseAsset,
} from '@/lib/exerciseVisuals';
import { cn } from '@/lib/utils';
import type { ExerciseIconName, ExerciseVisualKey, MuscleGroup } from '@/store/types';

interface ExerciseVisualProps {
  visualKey?: ExerciseVisualKey | null;
  variant?: 'thumbnail' | 'detail' | 'movement' | 'active';
  muscles?: MuscleGroup[];
  className?: string;
  pose?: 'main' | 'start' | 'end';
  exerciseId?: string;
  exerciseName?: string;
  muscleGroup?: MuscleGroup;
  iconName?: ExerciseIconName;
}

const VARIANT_FRAME_CLASS = {
  thumbnail: 'aspect-[5/3] rounded-[1.6rem] p-3',
  detail: 'aspect-[16/9] rounded-[2rem] p-4 sm:p-6',
  movement: 'aspect-[4/3] rounded-[1.5rem] p-3',
  active: 'aspect-[16/10] rounded-[2.4rem] p-5 sm:p-6',
} as const;

const VARIANT_CANVAS_CLASS = {
  thumbnail: 'shadow-[0_18px_34px_rgba(0,0,0,0.18)]',
  detail: 'shadow-[0_28px_60px_rgba(0,0,0,0.24)]',
  movement: 'shadow-[0_18px_34px_rgba(0,0,0,0.16)]',
  active: 'shadow-[0_30px_64px_rgba(110,231,183,0.14)]',
} as const;

function renderExerciseAsset(asset: ExerciseAsset, AssetComponentClass: string) {
  if (asset.type === 'path') {
    return (
      <img
        src={asset.src}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={AssetComponentClass}
      />
    );
  }

  const Component = asset.component as ComponentType<SVGProps<SVGSVGElement>>;
  return <Component aria-hidden="true" className={AssetComponentClass} focusable="false" />;
}

export function ExerciseVisual({
  visualKey,
  variant = 'thumbnail',
  muscles,
  className,
  pose = 'main',
  exerciseId,
  exerciseName,
  muscleGroup,
  iconName,
}: ExerciseVisualProps) {
  const resolvedMuscleGroup = muscleGroup ?? muscles?.[0];
  const subject = {
    visualKey,
    id: exerciseId,
    name: exerciseName,
    muscleGroup: resolvedMuscleGroup,
    iconName,
  };
  const match = resolveExerciseVisualMatch(subject);
  const asset = getExerciseVisualAsset(subject, pose);
  const ariaLabel = exerciseName
    ? `Visual de ${exerciseName}`
    : match?.kind === 'visual'
      ? `Visual de ${match.definition.label}`
      : 'Visual de ejercicio';

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn(
        'relative isolate overflow-hidden border border-white/6 bg-[linear-gradient(180deg,rgba(18,27,41,0.98)_0%,rgba(8,15,26,0.96)_100%)]',
        VARIANT_FRAME_CLASS[variant],
        VARIANT_CANVAS_CLASS[variant],
        className,
      )}
    >
      <div className="absolute inset-x-4 top-0 h-20 rounded-full bg-[radial-gradient(circle,rgba(110,231,183,0.24)_0%,rgba(110,231,183,0.04)_55%,transparent_72%)] blur-2xl" />
      <div className="absolute bottom-0 right-4 h-16 w-24 rounded-full bg-[radial-gradient(circle,rgba(122,185,255,0.18)_0%,rgba(122,185,255,0.04)_58%,transparent_76%)] blur-2xl" />
      <div className="absolute inset-[1px] rounded-[inherit] border border-white/4" />

      <div className="relative flex h-full w-full items-center justify-center">
        {asset ? (
          renderExerciseAsset(asset, 'h-full w-full object-contain')
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#6EE7B7]">
            <ExerciseIcon name={match?.kind === 'legacy-icon' ? match.iconName : iconName ?? 'Activity'} className="size-10" />
          </div>
        )}
      </div>
    </div>
  );
}
