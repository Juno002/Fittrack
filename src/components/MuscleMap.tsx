import { useMemo, useState } from 'react';
import { Activity, Clock } from 'lucide-react';
import Model, { type Slug, type ExtendedBodyPart } from '@mjcdev/react-body-highlighter';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStoreData } from '@/hooks/useStoreData';
import { formatClockLabel } from '@/lib/display';
import { cn } from '@/lib/utils';
import { selectMuscleBreakdown } from '@/store/selectors';
import type { MuscleGroup } from '@/store/types';

interface MuscleMapProps {
  fatigue: Record<MuscleGroup, number>;
  className?: string;
}

const MUSCLE_MAPPING: Record<MuscleGroup, Slug[]> = {
  chest: ['chest'],
  back: ['upper-back', 'lower-back', 'trapezius'],
  legs: ['quadriceps', 'hamstring', 'gluteal', 'calves'],
  shoulders: ['deltoids'],
  arms: ['biceps', 'triceps', 'forearm'],
  core: ['abs', 'obliques'],
};

export function MuscleMap({ fatigue, className }: MuscleMapProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const storeData = useStoreData();
  const breakdown = useMemo(() => {
    if (!selectedMuscle) return [];
    return selectMuscleBreakdown(storeData, selectedMuscle);
  }, [storeData, selectedMuscle]);

  const modelData = useMemo(() => {
    const data: ExtendedBodyPart[] = [];
    (Object.entries(fatigue) as [MuscleGroup, number][]).forEach(([muscleGroup, value]) => {
      const intensity = value === 0 ? 1 : value < 20 ? 2 : value < 60 ? 3 : 4;
      MUSCLE_MAPPING[muscleGroup].forEach((slug) => {
        data.push({ slug, intensity });
      });
    });
    return data;
  }, [fatigue]);

  const handleModelClick = (payload: ExtendedBodyPart) => {
    const foundGroup = (Object.keys(MUSCLE_MAPPING) as MuscleGroup[]).find((group) => (
      payload.slug ? MUSCLE_MAPPING[group].includes(payload.slug) : false
    ));

    if (foundGroup) {
      setSelectedMuscle(foundGroup);
    }
  };

  return (
    <div className={cn('flex h-full w-full flex-col items-center', className)}>
      <div className="flex h-full w-full items-center justify-center gap-6">
        {(['front', 'back'] as const).map((view) => (
          <div key={view} className="flex h-full flex-col items-center justify-center">
            <div className="w-32 h-64 [&>svg]:w-full [&>svg]:h-full">
              <Model
                data={modelData}
                onBodyPartClick={handleModelClick}
                side={view}
                colors={['#2a2d31', '#10b981', '#fb923c', '#ef4444']}
                border="#252529"
              />
            </div>
            <div className="mt-2 rounded-md border border-white/5 bg-[#252529] px-2 py-1">
              <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-zinc-400">
                {view === 'front' ? 'Front' : 'Back'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(selectedMuscle)} onOpenChange={(open) => !open && setSelectedMuscle(null)}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-white/5 bg-[#121721] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
              <Activity className="size-6 text-[#6EE7B7]" />
              {selectedMuscle ? `${selectedMuscle} breakdown` : 'Muscle breakdown'}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto py-4 pr-1">
            {breakdown.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-white/5 bg-white/5 px-5 py-10 text-center text-sm text-zinc-500">
                No recent sessions are contributing to this muscle group yet.
              </div>
            ) : (
              breakdown.map((item) => (
                <article key={`${item.performedAt}-${item.exerciseName}`} className="rounded-[2rem] border border-white/5 bg-black/10 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-white">{item.exerciseName}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                        {item.sessionName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#6EE7B7]">+{Math.round(item.fatigueContribution)}%</p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">fatigue</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                    <span className="flex items-center gap-2">
                      <Clock className="size-3" />
                      {formatClockLabel(item.performedAt)}
                    </span>
                    <span>{item.sets} tracked sets</span>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="rounded-[2rem] border border-[#6EE7B7]/20 bg-[#6EE7B7]/10 px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6EE7B7]">Current fatigue</p>
            <p className="mt-2 text-2xl font-black text-white">
              {selectedMuscle ? Math.round(fatigue[selectedMuscle]) : 0}%
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
