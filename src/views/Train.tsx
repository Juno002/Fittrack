import { useDeferredValue, useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';

import { ExerciseDetail } from '@/components/ExerciseDetail';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { useStoreData } from '@/hooks/useStoreData';
import { formatMuscleGroup } from '@/lib/display';
import { resolveExerciseCoach } from '@/lib/exerciseCoach';
import { cn } from '@/lib/utils';
import { buildWorkoutLog } from '@/lib/workout';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store';
import { selectFatigueSummary } from '@/store/selectors';
import type { ExerciseDefinition, MuscleGroup, WorkoutTemplate } from '@/store/types';

interface TrainProps {
  onOpenWorkout: () => void;
}

const FILTERS: ('all' | MuscleGroup)[] = ['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'];

function getDifficultyClasses(difficulty: string) {
  if (difficulty === 'Elite') {
    return 'border-red-400/20 bg-red-400/10 text-red-100';
  }

  if (difficulty === 'Advanced') {
    return 'border-amber-400/20 bg-amber-400/10 text-amber-100';
  }

  if (difficulty === 'Intermediate') {
    return 'border-[#6EE7B7]/20 bg-[#6EE7B7]/10 text-[#C8FFE8]';
  }

  return 'border-white/10 bg-white/5 text-zinc-300';
}

export function Train({ onOpenWorkout }: TrainProps) {
  const { exercises, isLoading } = useExerciseCatalog();
  const data = useStoreData();
  const fatigue = useMemo(() => selectFatigueSummary(data), [data]);
  const draftSession = useStore((state) => state.draftSession);
  const startDraftSession = useStore((state) => state.startDraftSession);
  const addExerciseToDraft = useStore((state) => state.addExerciseToDraft);
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition | null>(null);
  const [viewMode, setViewMode] = useState<'catalog' | 'templates'>('catalog');
  const deferredQuery = useDeferredValue(searchQuery);

  const filteredExercises = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return exercises
      .filter((exercise) => (activeFilter === 'all' ? true : exercise.muscleGroup === activeFilter))
      .map((exercise) => ({
        exercise,
        coach: resolveExerciseCoach(exercise),
      }))
      .filter(({ exercise, coach }) => {
        if (!normalizedQuery) {
          return true;
        }

        return [
          exercise.name,
          exercise.muscleGroup,
          coach.summary,
          ...coach.searchTerms,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      });
  }, [activeFilter, deferredQuery, exercises]);

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
    if (draftSession && !window.confirm('Iniciar una plantilla descartará tu borrador actual. ¿Continuar?')) {
      return;
    }

    const freshLogs = template.logs.map((log) => ({
      ...log,
      id: crypto.randomUUID(),
      sets: log.sets.map((set) => ({ ...set, completed: false })),
    }));

    startDraftSession({
      name: template.name,
      logs: freshLogs,
    });
    onOpenWorkout();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080B11]">
      <header className="px-6 pt-10 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Biblioteca</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Bodyweight Coach</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
          Solo movimientos sin equipo, con progresiones claras y tecnica visual para abrir y entrenar donde sea.
        </p>
      </header>

      <div className="px-4 pb-4">
        <section className="rounded-[2.5rem] border border-white/5 bg-[radial-gradient(circle_at_top_right,_rgba(110,231,183,0.14),_transparent_45%),linear-gradient(165deg,_rgba(18,23,33,1),_rgba(8,11,17,1))] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Sin gimnasio</p>
              <p className="mt-2 text-xl font-black text-white">Tu cuerpo es el equipo</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Aprende la tecnica, evita errores y progresa por niveles sin pensar demasiado.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-[#6EE7B7]/15 bg-[#6EE7B7]/10 px-4 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8FFE8]">Curados</p>
              <p className="mt-1 text-2xl font-black text-white">{exercises.length}</p>
            </div>
          </div>
        </section>
      </div>

      <div className="flex px-6 pb-4">
        <div className="flex w-full rounded-2xl bg-[#121721] p-1">
          <button
            type="button"
            className={cn(
              'flex-1 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-[0.25em] transition-all',
              viewMode === 'catalog' ? 'bg-[#6EE7B7] text-[#080B11]' : 'text-zinc-500 hover:text-white',
            )}
            onClick={() => setViewMode('catalog')}
          >
            Ejercicios
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-[0.25em] transition-all',
              viewMode === 'templates' ? 'bg-[#6EE7B7] text-[#080B11]' : 'text-zinc-500 hover:text-white',
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
              placeholder="Busca push-up, squat, plank..."
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
                Cargando ejercicios bodyweight...
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="flex h-[45vh] flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-white/5 bg-[#121721] px-6 text-center">
                <p className="text-lg font-black text-white">No encontramos ese movimiento</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  Prueba por nombre, musculo o una progresion como push-up o squat.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExercises.map(({ exercise, coach }) => {
                  const exerciseFatigue = fatigue[exercise.muscleGroup];
                  const statusLabel = exerciseFatigue >= 70 ? 'Recupera primero' : exerciseFatigue >= 45 ? 'Carga moderada' : 'Buen momento';

                  return (
                    <button
                      key={exercise.id}
                      type="button"
                      className="w-full rounded-[2.25rem] border border-white/5 bg-[#121721] p-5 text-left transition-all hover:border-[#6EE7B7]/25 hover:bg-[#151c29]"
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-[#6EE7B7]">
                          <ExerciseIcon name={exercise.iconName} className="size-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-black text-white">{exercise.name}</p>
                            <span className={`rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] ${getDifficultyClasses(coach.difficulty)}`}>
                              {coach.difficulty}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{coach.summary}</p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-300">
                              {formatMuscleGroup(exercise.muscleGroup)}
                            </span>
                            <span className="rounded-full border border-[#6EE7B7]/15 bg-[#6EE7B7]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8FFE8]">
                              Sin equipo
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-300">
                              {statusLabel}
                            </span>
                          </div>
                        </div>
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
                Guarda tus sesiones favoritas para repetirlas rapido cuando ya sabes que te funciona.
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
                    {template.logs.map((log) => (
                      <p key={log.id} className="text-sm text-zinc-400">
                        <span className="font-bold text-zinc-300">{log.sets.length}x</span> {log.exerciseName}
                      </p>
                    ))}
                  </div>

                  <button
                    className="h-12 w-full rounded-[1.5rem] bg-[#6EE7B7]/10 text-[10px] font-black uppercase tracking-[0.3em] text-[#6EE7B7] hover:bg-[#6EE7B7]/20"
                    onClick={() => handleStartTemplate(template)}
                  >
                    Iniciar rutina
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
