import React, { useMemo, useState } from 'react';
import { Play, Plus, ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MuscleHighlight } from '@/components/MuscleHighlight';
import { useStoreData } from '@/hooks/useStoreData';
import { formatMuscleGroup } from '@/lib/display';
import { formatWeight } from '@/lib/units';
import { selectExerciseHistory } from '@/store/selectors';
import type { ExerciseDefinition } from '@/store/types';

interface ExerciseDetailProps {
  exercise: ExerciseDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWorkout: (exercise: ExerciseDefinition) => void;
}

export function ExerciseDetail({ exercise, open, onOpenChange, onAddWorkout }: ExerciseDetailProps) {
  const data = useStoreData();
  const [showInstructions, setShowInstructions] = useState(false);
  const history = useMemo(() => {
    if (!exercise) return [];
    return selectExerciseHistory(data, exercise.id);
  }, [data, exercise]);

  const maxWeightEver = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.max(...history.map(h => h.maxWeight));
  }, [history]);

  const max1RMEver = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.max(...history.map(h => h.estimated1RM));
  }, [history]);

  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[2.5rem] border-white/5 bg-[#121721] text-white">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-[#6EE7B7]">
              {/* Fallback to simple icon or text if ExerciseIcon isn't available here easily */}
              <span className="font-bold">💪</span>
            </div>
            <div className="text-left">
              <DialogTitle className="text-xl font-black tracking-tight">{exercise.name}</DialogTitle>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                {formatMuscleGroup(exercise.muscleGroup)} • {exercise.isBodyweight ? 'Bodyweight' : 'Weighted'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <MuscleHighlight muscleGroup={exercise.muscleGroup} />

          <Button
            variant="outline"
            className="w-full h-12 rounded-[1.5rem] border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => window.open(`https://www.youtube.com/results?search_query=how+to+do+${encodeURIComponent(exercise.name)}+exercise`, '_blank')}
          >
            <Play className="mr-2 h-4 w-4 text-[#6EE7B7]" />
            Ver Video Tutorial
          </Button>

          {exercise.instructions && exercise.instructions.length > 0 && (
            <div className="rounded-[2rem] border border-white/5 bg-black/10 p-4 transition-all">
              <button
                className="flex w-full items-center justify-between"
                onClick={() => setShowInstructions((s) => !s)}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                  Instrucciones Paso a Paso
                </p>
                {showInstructions ? (
                  <ChevronUp className="h-4 w-4 text-zinc-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                )}
              </button>
              {showInstructions && (
                <div className="mt-4 space-y-3 border-t border-white/5 pt-3">
                  {exercise.instructions.map((step, index) => (
                    <div key={index} className="flex gap-3 text-sm text-zinc-300">
                      <span className="font-black text-[#6EE7B7]">{index + 1}.</span>
                      <p className="leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[2rem] border border-white/5 bg-black/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">All Time Best</p>
              <p className="mt-1 text-2xl font-black text-[#6EE7B7]">{maxWeightEver > 0 ? formatWeight(maxWeightEver, data.settings.unitSystem) : '--'}</p>
            </div>
            <div className="rounded-[2rem] border border-white/5 bg-black/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Est. 1RM</p>
              <p className="mt-1 text-2xl font-black text-white">{max1RMEver > 0 ? formatWeight(max1RMEver, data.settings.unitSystem) : '--'}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-3">Progression History</p>
            {history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/5 bg-black/10 px-5 py-6 text-center text-sm text-zinc-500">
                No logs found for this exercise yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {history.slice().reverse().map((entry, index) => (
                  <div key={index} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                    <span className="text-xs font-bold text-zinc-400">
                      {new Date(entry.performedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">{entry.maxWeight > 0 ? formatWeight(entry.maxWeight, data.settings.unitSystem) : 'Bodyweight'}</p>
                      <p className="text-[10px] text-zinc-500">Vol: {entry.totalVolume}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-2">
          <Button
            className="w-full h-14 rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] hover:bg-[#5FE7B0]"
            onClick={() => {
              onAddWorkout(exercise);
              onOpenChange(false);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add to Workout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
