import * as React from 'react';
import { useMemo, useState } from 'react';
import { ArrowRight, Trophy, Activity } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStoreData } from '@/hooks/useStoreData';
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { selectExerciseHistory } from '@/store/selectors';
import { cn } from '@/lib/utils';
import { formatDayKey } from '@/lib/dates';

interface ExerciseProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultExerciseId?: string;
}

export function ExerciseProgressDialog({ open, onOpenChange, defaultExerciseId }: ExerciseProgressDialogProps) {
  const storeData = useStoreData();
  const { exercises } = useExerciseCatalog({ respectTrainingMode: false });
  const [metricMode, setMetricMode] = useState<'totalReps' | 'maxReps'>('maxReps');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  const loggedExerciseIds = useMemo(() => {
    const ids = new Set<string>();
    storeData.sessions.forEach((session) => {
      session.logs.forEach((log) => {
        ids.add(log.exerciseId);
      });
    });
    return Array.from(ids);
  }, [storeData.sessions]);

  const exerciseOptions = useMemo(() => {
    return loggedExerciseIds
      .map((id) => exercises.find((e) => e.id === id))
      .filter((e) => e !== undefined)
      .sort((a, b) => a!.name.localeCompare(b!.name));
  }, [loggedExerciseIds, exercises]);

  // Set default exercise if empty
  React.useEffect(() => {
    if (open && !selectedExerciseId) {
      if (defaultExerciseId && loggedExerciseIds.includes(defaultExerciseId)) {
        setSelectedExerciseId(defaultExerciseId);
      } else if (exerciseOptions.length > 0) {
        setSelectedExerciseId(exerciseOptions[0]!.id);
      }
    }
  }, [open, selectedExerciseId, defaultExerciseId, loggedExerciseIds, exerciseOptions]);

  const history = useMemo(() => {
    if (!selectedExerciseId) return [];
    // Sort chronologically
    return selectExerciseHistory(storeData, selectedExerciseId)
      .sort((a, b) => a.performedAt.localeCompare(b.performedAt))
      .slice(-15); // Show last 15 sessions
  }, [storeData, selectedExerciseId]);

  const maxChartValue = useMemo(() => {
    if (history.length === 0) return 1;
    return Math.max(...history.map((h) => h[metricMode]), 1);
  }, [history, metricMode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#07101A] text-white border-white/10 sm:max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Progreso por Ejercicio</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Revisa tu evolución histórica de repeticiones.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Seleccionar ejercicio
            </label>
            <div className="relative">
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-white/10 bg-[#0f1724] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#6EE7B7]"
              >
                {exerciseOptions.map((ex) => (
                  <option key={ex!.id} value={ex!.id}>
                    {ex!.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                <ArrowRight className="size-4 rotate-90 text-zinc-500" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMetricMode('maxReps')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-black transition-colors',
                metricMode === 'maxReps'
                  ? 'bg-white/10 text-[#6EE7B7]'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Trophy className="size-3.5" />
              Récord (Serie Max)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('totalReps')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-black transition-colors',
                metricMode === 'totalReps'
                  ? 'bg-white/10 text-[#6EE7B7]'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Activity className="size-3.5" />
              Volumen Total
            </button>
          </div>

          {history.length > 0 ? (
            <div className="rounded-[2.4rem] border border-white/5 bg-[#0f1724] p-5">
              <div className="flex h-[220px] items-end justify-between gap-2 overflow-x-auto pb-2">
                {history.map((entry, idx) => {
                  const value = entry[metricMode];
                  const heightPercentage = Math.max(8, (value / maxChartValue) * 100);
                  const isLatest = idx === history.length - 1;

                  return (
                    <div key={entry.dayKey} className="flex flex-col items-center gap-3 shrink-0" style={{ width: '12%' }}>
                      <div
                        role="progressbar"
                        className="flex h-40 w-full items-end justify-center rounded-full bg-[#07101A] p-1"
                      >
                        <div
                          className={cn(
                            'w-full rounded-full transition-all duration-700',
                            isLatest ? 'bg-[#6EE7B7]' : 'bg-[#6EE7B7]/40'
                          )}
                          style={{ height: `${heightPercentage}%` }}
                        />
                      </div>
                      <div className="text-center w-full">
                        <p className={cn(
                          "text-[9px] font-bold uppercase tracking-wider truncate w-full",
                          isLatest ? "text-[#6EE7B7]" : "text-zinc-500"
                        )}>
                          {formatDayKey(entry.dayKey, 'dd/MM')}
                        </p>
                        <p className="mt-1 text-[10px] font-bold text-zinc-300">
                          {value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center">
              <Activity className="mx-auto size-8 text-zinc-600 mb-3" />
              <p className="text-sm font-bold text-zinc-400">Sin historial suficiente</p>
              <p className="mt-1 text-xs text-zinc-500">Registra este ejercicio en tus sesiones para ver tu evolución aquí.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
