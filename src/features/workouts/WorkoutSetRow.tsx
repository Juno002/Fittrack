import { CheckCircle2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

import { useStoreData } from '@/hooks/useStoreData';
import { getDisplayWeight, getStorageWeight } from '@/lib/units';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { WorkoutSet } from '@/store/types';

interface WorkoutSetRowProps {
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
    <motion.div 
      initial={false}
      animate={{
        backgroundColor: set.completed ? 'rgba(110, 231, 183, 0.05)' : 'rgba(0, 0, 0, 0.1)',
        borderColor: set.completed ? 'rgba(110, 231, 183, 0.2)' : 'rgba(255, 255, 255, 0.05)',
      }}
      className={cn(
        'relative flex items-center gap-3 rounded-[1.75rem] border px-4 py-3 transition-all'
      )}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        type="button"
        onClick={onToggleComplete}
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-[1.25rem] transition-all duration-300',
          set.completed
            ? 'bg-[#6EE7B7] text-[#080B11] shadow-[0_10px_20px_rgba(110,231,183,0.2)]'
            : 'bg-white/5 text-zinc-600 hover:bg-white/10 hover:text-white',
        )}
      >
        <CheckCircle2 className={cn("size-6 transition-transform duration-500", set.completed && "rotate-[360deg]")} />
      </motion.button>

      <div className="w-10 shrink-0 text-center">
        <span className={cn(
          "text-[9px] font-black uppercase tracking-[0.2em] transition-all",
          set.completed ? "text-[#6EE7B7]" : "text-zinc-600"
        )}>
          S{setIndex + 1}
        </span>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3 relative">
        {!isBodyweight ? (
          <div className="relative">
            <Input
              type="number"
              min={0}
              inputMode="decimal"
              value={getDisplayWeight(set.weight, unitSystem)}
              onChange={(event) => onChange('weight', getStorageWeight(Number(event.target.value), unitSystem))}
              className={cn(
                "h-12 rounded-2xl border-none px-4 text-center text-lg font-black focus-visible:ring-1 focus-visible:ring-[#6EE7B7]/50 transition-all",
                set.completed ? "bg-transparent text-white/30" : "bg-white/5 text-white"
              )}
            />
            <span className={cn(
              "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold uppercase tracking-[0.2em] transition-all",
              set.completed ? "text-zinc-700" : "text-zinc-600"
            )}>
              {unitSystem === 'metric' ? 'kg' : 'lb'}
            </span>
          </div>
        ) : (
          <div className={cn(
            "flex items-center justify-center rounded-2xl px-4 text-[9px] font-black uppercase tracking-[0.2em] transition-all h-12",
            set.completed ? "bg-transparent text-zinc-700" : "bg-white/5 text-zinc-600"
          )}>
            BW
          </div>
        )}

        <div className="relative">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={set.reps}
            onChange={(event) => onChange('reps', Number(event.target.value))}
            className={cn(
              "h-12 rounded-2xl border-none px-4 text-center text-lg font-black focus-visible:ring-1 focus-visible:ring-[#6EE7B7]/50 transition-all",
               set.completed ? "bg-transparent text-white/30" : "bg-white/5 text-white"
            )}
          />
          <span className={cn(
            "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold uppercase tracking-[0.2em] transition-all",
            set.completed ? "text-zinc-700" : "text-zinc-600"
          )}>
            reps
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-2xl p-2 text-zinc-800 transition-colors hover:text-red-500 active:scale-90"
      >
        <Trash2 className="size-4" />
      </button>
    </motion.div>
  );
}
