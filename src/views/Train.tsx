import { useDeferredValue, useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';

import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { useStoreData } from '@/hooks/useStoreData';
import { formatMuscleGroup } from '@/lib/display';
import { buildWorkoutLog } from '@/lib/workout';
import { useStore } from '@/store';
import { selectFatigueSummary } from '@/store/selectors';
import type { ExerciseDefinition, MuscleGroup, WorkoutTemplate } from '@/store/types';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ExerciseDetail } from '@/components/ExerciseDetail';

interface TrainProps {
  onOpenWorkout: () => void;
}

const FILTERS: ('all' | MuscleGroup)[] = ['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'];

export function Train({ onOpenWorkout }: TrainProps) {
  const { exercises, isLoading } = useExerciseCatalog();
  const data = useStoreData();
  const fatigue = useMemo(
    () => selectFatigueSummary(data),
    [data],
  );
  const draftSession = useStore((state) => state.draftSession);
  const startDraftSession = useStore((state) => state.startDraftSession);
  const addExerciseToDraft = useStore((state) => state.addExerciseToDraft);
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition | null>(null);
  const deferredQuery = useDeferredValue(searchQuery);

  const filteredExercises = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return exercises.filter((exercise) => {
      if (activeFilter !== 'all' && exercise.muscleGroup !== activeFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        exercise.name.toLowerCase().includes(normalizedQuery) ||
        exercise.muscleGroup.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeFilter, deferredQuery, exercises]);

  const handleSelectExercise = (exercise: ExerciseDefinition) => {
    setSelectedExercise(exercise);
  };

  const handleAddWorkout = (exercise: ExerciseDefinition) => {
    if (draftSession) {
      addExerciseToDraft(exercise);
      onOpenWorkout();
      return;
    }

    startDraftSession({
      name: `Foco: ${exercise.name}`,
      logs: [buildWorkoutLog(exercise)],
    });
    onOpenWorkout();
  };

  const handleStartTemplate = (template: WorkoutTemplate) => {
    if (draftSession) {
      if (!window.confirm('Iniciar una plantilla descartará tu borrador actual. ¿Continuar?')) return;
    }
    
    // Copy the logs and reset their IDs to prevent reusing IDs in new sessions
    const freshLogs = template.logs.map(log => ({
      ...log,
      id: crypto.randomUUID(),
      sets: log.sets.map(set => ({ ...set, completed: false }))
    }));

    startDraftSession({
      name: template.name,
      logs: freshLogs,
    });
    onOpenWorkout();
  };

  const [viewMode, setViewMode] = useState<'catalog' | 'templates'>('catalog');

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080B11]">
      <header className="px-6 pt-10 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Entrenar</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Ejercicios & Rutinas</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Explora movimientos, mira tutoriales visuales o inicia tus plantillas guardadas.
        </p>
      </header>

      <div className="flex px-6 pb-4">
        <div className="flex w-full rounded-2xl bg-[#121721] p-1">
          <button
            type="button"
            className={cn(
              'flex-1 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-[0.25em] transition-all',
              viewMode === 'catalog' ? 'bg-[#6EE7B7] text-[#080B11]' : 'text-zinc-500 hover:text-white'
            )}
            onClick={() => setViewMode('catalog')}
          >
            Catálogo
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-[0.25em] transition-all',
              viewMode === 'templates' ? 'bg-[#6EE7B7] text-[#080B11]' : 'text-zinc-500 hover:text-white'
            )}
            onClick={() => setViewMode('templates')}
          >
            Plantillas ({data.templates.length})
          </button>
        </div>
      </div>

      {viewMode === 'catalog' ? (
        <>
          <div className="px-6 pb-4">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar ejercicios..."
              className="h-14 rounded-[1.75rem] border-none bg-[#121721] px-5 text-base font-bold text-white placeholder:text-zinc-700"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto px-6 pb-4 no-scrollbar">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={cn(
                  'shrink-0 rounded-2xl border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] transition-all',
                  activeFilter === filter
                    ? 'border-[#6EE7B7] bg-[#6EE7B7]/10 text-[#6EE7B7]'
                    : 'border-transparent bg-white/5 text-zinc-500 hover:border-white/5 hover:text-zinc-300',
                )}
                onClick={() => setActiveFilter(filter)}
              >
                {filter === 'all' ? 'Todos' : formatMuscleGroup(filter)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-32">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-zinc-500">
                Cargando catálogo...
              </div>
            ) : (
              <div className="space-y-2">
                {filteredExercises.map((exercise) => {
                  const exerciseFatigue = fatigue[exercise.muscleGroup];
                  const statusLabel = exerciseFatigue >= 70 ? 'Recupera primero' : exerciseFatigue >= 45 ? 'Fatiga moderada' : 'Listo';

                  return (
                    <button
                      key={exercise.id}
                      type="button"
                      className="flex w-full items-center gap-4 rounded-[2rem] border border-white/5 bg-[#121721] p-5 text-left transition-all hover:border-[#6EE7B7]/30 hover:bg-[#151c29]"
                      onClick={() => handleSelectExercise(exercise)}
                    >
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-[#6EE7B7]">
                        <ExerciseIcon name={exercise.iconName} className="size-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-white">{exercise.name}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                          {formatMuscleGroup(exercise.muscleGroup)} • {exercise.isBodyweight ? 'Peso corporal' : 'Con peso'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Fatiga</p>
                        <p className="mt-1 text-sm font-black text-white">{Math.round(exerciseFatigue)}%</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#6EE7B7]">{statusLabel}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-32">
          {data.templates.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-white/5 bg-[#121721] px-5 py-16 text-center">
              <Trophy className="mb-4 size-10 text-zinc-700" />
              <h2 className="text-xl font-black text-white">Sin plantillas aún</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Guarda tus entrenamientos favoritos como plantillas para repetirlos fácilmente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.templates.map((template) => (
                <div key={template.id} className="rounded-[2.5rem] border border-white/5 bg-[#121721] p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-black text-white">{template.name}</h3>
                    <button 
                      onClick={() => useStore.getState().deleteTemplate(template.id)}
                      className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400 hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  </div>
                  
                  <div className="mb-6 space-y-1">
                    {template.logs.map(log => (
                      <p key={log.id} className="text-sm text-zinc-400">
                        <span className="font-bold text-zinc-300">{log.sets.length}x</span> {log.exerciseName}
                      </p>
                    ))}
                  </div>

                  <button
                    className="h-12 w-full rounded-[1.5rem] bg-[#6EE7B7]/10 text-[10px] font-black uppercase tracking-[0.3em] text-[#6EE7B7] hover:bg-[#6EE7B7]/20"
                    onClick={() => handleStartTemplate(template)}
                  >
                    Iniciar Rutina
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ExerciseDetail
        exercise={selectedExercise}
        open={selectedExercise !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedExercise(null);
        }}
        onAddWorkout={handleAddWorkout}
      />
    </div>
  );
}
