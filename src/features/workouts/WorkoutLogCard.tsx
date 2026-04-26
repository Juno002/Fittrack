import { ChevronDown, Copy, Plus, Trash2 } from 'lucide-react';

import { ExerciseIcon } from '@/components/ExerciseIcon';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { WorkoutSetRow } from '@/features/workouts/WorkoutSetRow';
import { cn } from '@/lib/utils';
import type { WorkoutLog } from '@/store/types';

interface WorkoutLogCardProps {
  key?: string;
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
  return (
    <article className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#121721]">
      <div className="space-y-5 p-6">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex size-14 shrink-0 items-center justify-center rounded-[1.5rem] bg-white/5 text-[#6EE7B7] transition-all hover:bg-white/10"
          >
            <ExerciseIcon name={log.iconName} className="size-7" />
          </button>

          <button type="button" className="min-w-0 flex-1 text-left" onClick={onToggleExpand}>
            <p className="truncate text-lg font-black tracking-tight text-white">{log.exerciseName}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
              {log.muscleGroup} • {log.sets.length} set{log.sets.length === 1 ? '' : 's'}
            </p>
          </button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl text-zinc-500 hover:bg-white/5 hover:text-white"
              onClick={onDuplicateLog}
            >
              <Copy className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
              onClick={onRemoveLog}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-black/10 px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <Checkbox
              id={`bodyweight-${log.id}`}
              checked={log.isBodyweight}
              onCheckedChange={(checked) => onToggleBodyweight(Boolean(checked))}
            />
            <Label htmlFor={`bodyweight-${log.id}`} className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
              Use bodyweight
            </Label>
          </div>

          <ChevronDown className={cn('size-4 text-zinc-600 transition-transform', expanded && 'rotate-180')} />
        </button>

        {expanded ? (
          <div className="space-y-3">
            {log.sets.map((set, setIndex) => (
              <WorkoutSetRow
                key={`${log.id}-${setIndex}`}
                set={set}
                setIndex={setIndex}
                isBodyweight={log.isBodyweight}
                onToggleComplete={() => onToggleSetCompleted(setIndex)}
                onChange={(field, value) => onUpdateSet(setIndex, field, value)}
                onRemove={() => onRemoveSet(setIndex)}
              />
            ))}

            <Button
              variant="ghost"
              className="h-12 w-full rounded-2xl bg-white/5 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 hover:bg-[#6EE7B7]/10 hover:text-[#6EE7B7]"
              onClick={onAddSet}
            >
              <Plus className="size-4" />
              Add set
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
