import { useDeferredValue, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { MuscleHighlight } from '@/components/MuscleHighlight';
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { formatMuscleGroup } from '@/lib/display';
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
  const [equipmentFilter, setEquipmentFilter] = useState<'all' | 'bodyweight' | 'weighted'>('all');
  const [mechanicFilter, setMechanicFilter] = useState<'all' | 'compound' | 'isolation'>('all');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('chest');
  const [customBodyweight, setCustomBodyweight] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(searchQuery);

  const filteredExercises = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return exercises
      .filter((exercise) => (activeFilter === 'all' ? true : exercise.muscleGroup === activeFilter))
      .filter((exercise) => {
        if (equipmentFilter === 'bodyweight') return exercise.isBodyweight;
        if (equipmentFilter === 'weighted') return !exercise.isBodyweight;
        return true;
      })
      .filter((exercise) => {
        if (mechanicFilter === 'compound') return exercise.mechanic === 'compound';
        if (mechanicFilter === 'isolation') return exercise.mechanic === 'isolation';
        return true;
      })
      .filter((exercise) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          exercise.name.toLowerCase().includes(normalizedSearch) ||
          exercise.muscleGroup.toLowerCase().includes(normalizedSearch)
        );
      })
      .slice(0, 80);
  }, [activeFilter, equipmentFilter, mechanicFilter, deferredSearch, exercises]);

  const resetCustomForm = () => {
    setCustomName('');
    setCustomMuscle('chest');
    setCustomBodyweight(false);
    setShowCustomForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-h-[90dvh] w-full max-w-2xl overflow-hidden rounded-[2.75rem] border-white/5 bg-[#121721] p-0 text-white flex flex-col",
        "h-full sm:h-[85vh]"
      )}>
        <DialogHeader className="px-8 pt-8 pb-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">
                {showCustomForm ? 'Crear ejercicio' : 'Añadir ejercicio'}
              </DialogTitle>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                {showCustomForm ? 'Se guardará en tu biblioteca' : 'Catálogo compartido'}
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
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-8 pb-8 no-scrollbar">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Nombre del ejercicio</Label>
              <Input
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="Ej: Press inclinado"
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

            <button
              type="button"
              className={cn(
                'rounded-[1.5rem] border px-4 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all',
                customBodyweight
                  ? 'border-[#6EE7B7] bg-[#6EE7B7]/10 text-[#6EE7B7]'
                  : 'border-white/5 bg-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-200',
              )}
              onClick={() => setCustomBodyweight((current) => !current)}
            >
              {customBodyweight ? 'Ejercicio corporal' : 'Ejercicio con peso'}
            </button>

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
                    isBodyweight: customBodyweight,
                    mechanic: null,
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
              <div className="flex items-center gap-3 rounded-[1.75rem] bg-[#1A202C] px-5 py-4">
                <Search className="size-5 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar ejercicios..."
                  className="border-none bg-transparent p-0 text-lg font-bold text-white placeholder:text-zinc-700 focus-visible:ring-0"
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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
                
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  <div className="flex gap-2 border-r border-white/10 pr-3 mr-1">
                    {(['all', 'bodyweight', 'weighted'] as const).map((filter) => (
                      <button
                        key={`eq-${filter}`}
                        type="button"
                        className={cn(
                          'shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all',
                          equipmentFilter === filter
                            ? 'bg-white/10 text-white'
                            : 'bg-transparent text-zinc-500 hover:text-zinc-300',
                        )}
                        onClick={() => setEquipmentFilter(filter)}
                      >
                        {filter === 'all' ? 'Equipo' : filter === 'bodyweight' ? 'Corporal' : 'Pesas'}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {(['all', 'compound', 'isolation'] as const).map((filter) => (
                      <button
                        key={`mech-${filter}`}
                        type="button"
                        className={cn(
                          'shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all',
                          mechanicFilter === filter
                            ? 'bg-white/10 text-white'
                            : 'bg-transparent text-zinc-500 hover:text-zinc-300',
                        )}
                        onClick={() => setMechanicFilter(filter)}
                      >
                        {filter === 'all' ? 'Tipo' : filter === 'compound' ? 'Compuesto' : 'Aislamiento'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-8 no-scrollbar">
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
                  {filteredExercises.map((exercise) => {
                    const isExpanded = expandedExerciseId === exercise.id;
                    return (
                      <div
                        key={exercise.id}
                        className={cn(
                          "overflow-hidden rounded-[2rem] border transition-all",
                          isExpanded ? "border-white/10 bg-[#1A202C]" : "border-transparent bg-white/5 hover:bg-white/10"
                        )}
                      >
                        <button
                          type="button"
                          className="flex w-full items-center justify-between p-5 text-left"
                          onClick={() => setExpandedExerciseId(isExpanded ? null : exercise.id)}
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-[#6EE7B7]">
                              <ExerciseIcon name={exercise.iconName} className="size-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-base font-black text-white">{exercise.name}</p>
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                                {formatMuscleGroup(exercise.muscleGroup)} • {exercise.isBodyweight ? 'Peso corporal' : 'Con peso'}
                              </p>
                            </div>
                          </div>

                          <div className={cn(
                            "flex size-8 items-center justify-center rounded-full bg-white/5 text-zinc-500 transition-all",
                            isExpanded ? "bg-[#6EE7B7] text-[#080B11] rotate-45" : ""
                          )}>
                            <Plus className="size-4" />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 pt-2">
                             <MuscleHighlight 
                               muscleGroup={exercise.muscleGroup} 
                               className="mb-4 bg-black/40 border-none" 
                             />
                            <div className="space-y-4 rounded-2xl bg-black/20 p-4 mb-4 text-sm text-zinc-400">
                              {exercise.description ? (
                                <p>{exercise.description}</p>
                              ) : (
                                <p className="italic text-zinc-500">Sin descripción disponible.</p>
                              )}
                              
                              {exercise.formGuidance && exercise.formGuidance.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-2">Técnica</p>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {exercise.formGuidance.map((tip, idx) => (
                                      <li key={idx}>{tip}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {exercise.videoUrl && (
                                <a 
                                  href={exercise.videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center text-[#6EE7B7] hover:underline"
                                >
                                  Ver demostración externa
                                </a>
                              )}
                            </div>

                            <Button
                              className="h-14 w-full rounded-[1.75rem] bg-[#6EE7B7] text-[12px] font-black uppercase tracking-[0.3em] text-[#080B11] shadow-[0_10px_30px_rgba(110,231,183,0.2)] hover:bg-[#5FE7B0] hover:scale-[1.02] transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(exercise);
                                onOpenChange(false);
                                setExpandedExerciseId(null);
                              }}
                            >
                              AÑADIR AHORA
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
