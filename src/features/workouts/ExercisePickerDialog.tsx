import { useDeferredValue, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { formatMuscleGroup } from '@/lib/display';
import { resolveExerciseCoach } from '@/lib/exerciseCoach';
import { cn } from '@/lib/utils';
import type { ExerciseDefinition, MuscleGroup } from '@/store/types';

interface ExercisePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercise: ExerciseDefinition) => void;
  onCreateCustomExercise: (exercise: {
    id: string;
    name: string;
    muscleGroup: MuscleGroup;
    isBodyweight: boolean;
    mechanic: string | null;
    noEquipment?: boolean;
    searchTerms?: string[];
  }) => void;
}

const FILTERS = ['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'] as const;

export function ExercisePickerDialog({
  open,
  onOpenChange,
  onSelect,
  onCreateCustomExercise,
}: ExercisePickerDialogProps) {
  const { exercises, isLoading } = useExerciseCatalog();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('all');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('chest');
  const deferredSearch = useDeferredValue(searchQuery);

  const filteredExercises = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return exercises
      .filter((exercise) => (activeFilter === 'all' ? true : exercise.muscleGroup === activeFilter))
      .map((exercise) => ({
        exercise,
        coach: resolveExerciseCoach(exercise),
      }))
      .filter(({ exercise, coach }) => {
        if (!normalizedSearch) {
          return true;
        }

        return [exercise.name, exercise.muscleGroup, coach.summary, ...coach.searchTerms].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );
      })
      .slice(0, 80);
  }, [activeFilter, deferredSearch, exercises]);

  const resetCustomForm = () => {
    setCustomName('');
    setCustomMuscle('chest');
    setShowCustomForm(false);
  };

  const totalCuratedCount = exercises.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-w-2xl flex-col overflow-hidden rounded-[2.75rem] border-white/5 bg-[#121721] p-0 text-white">
        <DialogHeader className="shrink-0 px-8 pt-8 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">
                {showCustomForm ? 'Crear movimiento' : 'Añadir ejercicio'}
              </DialogTitle>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                {showCustomForm ? 'Se guardara en tu biblioteca personal' : 'Biblioteca bodyweight curada'}
              </p>
            </div>

            <Button
              variant="ghost"
              className="rounded-2xl text-[10px] font-bold uppercase tracking-[0.25em] text-[#6EE7B7] hover:bg-[#6EE7B7]/10 hover:text-[#6EE7B7]"
              onClick={() => setShowCustomForm((current) => !current)}
            >
              {showCustomForm ? 'Ver catálogo' : 'Ejercicio propio'}
            </Button>
          </div>
        </DialogHeader>

        {showCustomForm ? (
          <div className="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto px-8 pb-8 no-scrollbar">
            <div className="rounded-[2rem] border border-[#6EE7B7]/15 bg-[#6EE7B7]/10 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8FFE8]">Sin equipo</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                Todo movimiento que crees aqui se guardara como ejercicio de peso corporal para entrenar donde sea.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Nombre del movimiento</Label>
              <Input
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="Ej: Push-Up pausado"
                className="h-16 rounded-[1.75rem] border-none bg-[#1A202C] px-6 text-lg font-black text-white"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Músculo principal</Label>
              <div className="grid grid-cols-2 gap-3">
                {FILTERS.filter((muscle) => muscle !== 'all').map((muscle) => (
                  <button
                    key={muscle}
                    type="button"
                    className={cn(
                      'rounded-[1.5rem] border px-4 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all',
                      customMuscle === muscle
                        ? 'border-[#6EE7B7] bg-[#6EE7B7]/10 text-[#6EE7B7]'
                        : 'border-white/5 bg-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-200',
                    )}
                    onClick={() => setCustomMuscle(muscle)}
                  >
                    {formatMuscleGroup(muscle)}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/5 bg-white/5 px-4 py-4 text-sm font-bold uppercase tracking-[0.2em] text-zinc-300">
              Siempre sin equipo
            </div>

            <div className="mt-auto grid gap-3 md:grid-cols-2">
              <Button
                variant="ghost"
                className="h-14 rounded-[1.75rem] text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 hover:bg-white/5 hover:text-white"
                onClick={resetCustomForm}
              >
                Cancelar
              </Button>
              <Button
                className="h-14 rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] hover:bg-[#5FE7B0]"
                disabled={!customName.trim()}
                onClick={() => {
                  onCreateCustomExercise({
                    id: `custom-${customName.trim().toLowerCase().replace(/\s+/g, '-')}`,
                    name: customName.trim(),
                    muscleGroup: customMuscle,
                    isBodyweight: true,
                    mechanic: null,
                    noEquipment: true,
                    searchTerms: [customName.trim().toLowerCase()],
                  });
                  resetCustomForm();
                  onOpenChange(false);
                }}
              >
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 px-8 pb-4 shrink-0">
              <div className="rounded-[2rem] border border-white/5 bg-[radial-gradient(circle_at_top_right,_rgba(110,231,183,0.14),_transparent_45%),linear-gradient(165deg,_rgba(18,23,33,1),_rgba(8,11,17,1))] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Bodyweight coach</p>
                    <p className="mt-2 text-lg font-black text-white">Solo movimientos sin equipo</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      Busca por tecnica, musculo o progresion y monta tu sesion sin salir de casa.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[#6EE7B7]/15 bg-[#6EE7B7]/10 px-4 py-3 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8FFE8]">Disponibles</p>
                    <p className="mt-1 text-2xl font-black text-white">{totalCuratedCount}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[1.75rem] bg-[#1A202C] px-5 py-4">
                <Search className="size-5 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Busca push-up, squat, plank..."
                  className="border-none bg-transparent p-0 text-lg font-bold text-white placeholder:text-zinc-700 focus-visible:ring-0"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
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
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-8 no-scrollbar">
              {isLoading ? (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-zinc-500">
                  Cargando catálogo...
                </div>
              ) : filteredExercises.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 rounded-[2rem] border border-dashed border-white/5 bg-white/5 text-center">
                  <Search className="size-10 text-zinc-700" />
                  <p className="text-sm font-semibold text-zinc-400">Sin resultados.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredExercises.map(({ exercise, coach }) => (
                    <button
                      key={exercise.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-[2rem] border border-transparent bg-white/5 p-5 text-left transition-all hover:border-white/5 hover:bg-white/10"
                      onClick={() => {
                        onSelect(exercise);
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-[#6EE7B7]">
                          <ExerciseIcon name={exercise.iconName} className="size-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-black text-white">{exercise.name}</p>
                            <span className="rounded-full border border-[#6EE7B7]/20 bg-[#6EE7B7]/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.25em] text-[#C8FFE8]">
                              {coach.difficulty}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{coach.summary}</p>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                            {formatMuscleGroup(exercise.muscleGroup)} • Sin equipo
                          </p>
                        </div>
                      </div>

                      <div className="flex size-8 items-center justify-center rounded-full bg-white/5 text-zinc-500 transition-all group-hover:bg-[#6EE7B7] group-hover:text-[#080B11]">
                        <Plus className="size-4" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
