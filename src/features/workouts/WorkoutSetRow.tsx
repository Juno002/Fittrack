import { CheckCircle2, Trash2 } from 'lucide-react';

import { useStoreData } from '@/hooks/useStoreData';
import { getDisplayWeight, getStorageWeight } from '@/lib/units';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { WorkoutSet } from '@/store/types';

interface WorkoutSetRowProps {
  key?: string;
  set: WorkoutSet;
  setIndex: number;
  isBodyweight: boolean;
  onToggleComplete: () => void;
  onChange: (field: 'weight' | 'reps', value: number) => void;
  onRemove: () => void;
}

export function WorkoutSetRow({
  set,
  setIndex,
  isBodyweight,
  onToggleComplete,
  onChange,
  onRemove,
}: WorkoutSetRowProps) {
  const data = useStoreData();
  const unitSystem = data.settings.unitSystem;
  
  return (
    <div className={cn('flex items-center gap-3 rounded-[1.75rem] border border-white/5 bg-black/10 px-4 py-3 transition-all', set.completed && 'opacity-60')}>
      <button
        type="button"
        onClick={onToggleComplete}
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-2xl transition-all',
          set.completed
            ? 'bg-[#6EE7B7] text-[#080B11] shadow-lg shadow-emerald-500/20'
            : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white',
        )}
      >
        <CheckCircle2 className="size-5" />
      </button>

      <div className="w-12 shrink-0 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
        Set {setIndex + 1}
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3">
        {!isBodyweight ? (
          <label className="relative">
            <Input
              type="number"
              min={0}
              inputMode="decimal"
              value={getDisplayWeight(set.weight, unitSystem)}
              onChange={(event) => onChange('weight', getStorageWeight(Number(event.target.value), unitSystem))}
              className="h-12 rounded-2xl border-none bg-white/5 px-4 text-center text-lg font-black text-white focus-visible:ring-1 focus-visible:ring-[#6EE7B7]/50"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">
              {unitSystem === 'metric' ? 'kg' : 'lb'}
            </span>
          </label>
        ) : (
          <div className="flex items-center justify-center rounded-2xl bg-white/5 px-4 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
            Bodyweight
          </div>
        )}

        <label className="relative">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={set.reps}
            onChange={(event) => onChange('reps', Number(event.target.value))}
            className="h-12 rounded-2xl border-none bg-white/5 px-4 text-center text-lg font-black text-white focus-visible:ring-1 focus-visible:ring-[#6EE7B7]/50"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">
            reps
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-2xl p-2 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
