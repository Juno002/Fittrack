import { Fragment } from 'react';
import { ChevronDown, Copy, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { ExerciseIcon } from '@/components/ExerciseIcon';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { WorkoutSetRow } from '@/features/workouts/WorkoutSetRow';
import { formatMuscleGroup } from '@/lib/display';
import { cn } from '@/lib/utils';
import type { WorkoutLog } from '@/store/types';

interface WorkoutLogCardProps {
  log: WorkoutLog;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleBodyweight: (checked: boolean) => void;
  onRemoveLog: () => void;
  onDuplicateLog: () => void;
  onAddSet: () => void;
  onUpdateSet: (setIndex: number, field: 'weight' | 'reps', value: number) => void;
  onRemoveSet: (setIndex: number) => void;
  onToggleSetCompleted: (setIndex: number) => void;
}

export function WorkoutLogCard({
  log,
  expanded,
  onToggleExpand,
  onToggleBodyweight,
  onRemoveLog,
  onDuplicateLog,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onToggleSetCompleted,
}: WorkoutLogCardProps) {
  const completedSetCount = log.sets.filter((set) => set.completed).length;

  return (
    <article className="app-panel overflow-hidden rounded-[2.5rem] shadow-xl">
      <div className="space-y-5 p-6">
        <div className="flex items-start gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onToggleExpand}
            className="flex size-14 shrink-0 items-center justify-center rounded-[1.5rem] bg-white/5 text-[#6EE7B7] transition-all hover:bg-white/10"
          >
            <ExerciseIcon name={log.iconName} className="size-7" />
          </motion.button>

          <button type="button" className="min-w-0 flex-1 text-left py-1" onClick={onToggleExpand}>
            <p className="truncate text-lg font-black tracking-tight text-white">{log.exerciseName}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
              {formatMuscleGroup(log.muscleGroup)} • {log.sets.length} {log.sets.length === 1 ? 'serie' : 'series'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-300">
                {log.isBodyweight ? 'Peso corporal' : 'Con carga'}
              </span>
              <span className="rounded-full border border-[#6EE7B7]/16 bg-[#6EE7B7]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#6EE7B7]">
                {completedSetCount}/{log.sets.length} completadas
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl text-zinc-600 hover:bg-white/5 hover:text-white"
              onClick={(e) => { e.stopPropagation(); onDuplicateLog(); }}
            >
              <Copy className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl text-zinc-600 hover:bg-red-500/10 hover:text-red-400"
              onClick={(e) => { e.stopPropagation(); onRemoveLog(); }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-black/10 px-4 py-3 text-left transition-colors hover:bg-black/20"
        >
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              id={`bodyweight-${log.id}`}
              checked={log.isBodyweight}
              onCheckedChange={(checked) => onToggleBodyweight(Boolean(checked))}
              className="border-zinc-700 data-[state=checked]:bg-[#6EE7B7] data-[state=checked]:border-[#6EE7B7]"
            />
            <Label htmlFor={`bodyweight-${log.id}`} className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
              Peso corporal
            </Label>
          </div>

          <ChevronDown className={cn('size-4 text-zinc-600 transition-transform duration-300', expanded && 'rotate-180')} />
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-2">
                {log.sets.map((set, setIndex) => (
                  <Fragment key={`${log.id}-${setIndex}`}>
                    <WorkoutSetRow
                      set={set}
                      setIndex={setIndex}
                      isBodyweight={log.isBodyweight}
                      onToggleComplete={() => onToggleSetCompleted(setIndex)}
                      onChange={(field, value) => onUpdateSet(setIndex, field, value)}
                      onRemove={() => onRemoveSet(setIndex)}
                    />
                  </Fragment>
                ))}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="h-14 w-full rounded-2xl border border-dashed border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:bg-[#6EE7B7]/5 hover:text-[#6EE7B7] hover:border-[#6EE7B7]/20 transition-all flex items-center justify-center gap-2"
                  onClick={onAddSet}
                >
                  <Plus className="size-4" />
                  Añadir serie
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}

