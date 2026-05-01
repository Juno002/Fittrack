import { useDeferredValue, useMemo, useState } from 'react';
import { Search, Settings2, Sparkles, Trophy, X } from 'lucide-react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ExerciseDetail } from '@/components/ExerciseDetail';
import { ExerciseVisual } from '@/components/exercise/ExerciseVisual';
import { HeaderActionButton } from '@/components/HeaderActionButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { formatMuscleGroup } from '@/lib/display';
import { buildGuidedRoutinePreset, type GuidedRoutinePresetId } from '@/lib/guidedWorkout';
import { getExerciseVisualMuscles } from '@/lib/exerciseVisuals';
import { useStoreData } from '@/hooks/useStoreData';
import {
  filterTemplatesByTrainingMode,
  getMovementModeLabel,
  getTrainingModeLabel,
  isHomeNoEquipmentMode,
} from '@/lib/trainingMode';
import { cn } from '@/lib/utils';
import { buildWorkoutLog } from '@/lib/workout';
import { useStore } from '@/store';
import { selectReadinessSummary } from '@/store/selectors';
import type { ExerciseDefinition, MuscleGroup, WorkoutTemplate } from '@/store/types';

interface TrainProps {
  onOpenWorkout: () => void;
  onOpenProfile: () => void;
}

const FILTERS: ('all' | MuscleGroup)[] = ['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'];

function formatMuscleSummary(muscles: MuscleGroup[]) {
  return muscles.map((muscle) => formatMuscleGroup(muscle)).join(' · ');
}

export function Train({ onOpenWorkout, onOpenProfile }: TrainProps) {
  const { exercises, isLoading } = useExerciseCatalog();
  const data = useStoreData();
  const trainingMode = data.settings.trainingMode;
  const bodyweightOnlyMode = isHomeNoEquipmentMode(trainingMode);
  const readiness = useMemo(() => selectReadinessSummary(data), [data]);
  const fatigue = readiness.localFatigue;
  const hasTrainingData = readiness.hasTrainingData;
  const draftSession = useStore((state) => state.draftSession);
  const startDraftSession = useStore((state) => state.startDraftSession);
  const addExerciseToDraft = useStore((state) => state.addExerciseToDraft);
  const deleteTemplate = useStore((state) => state.deleteTemplate);

  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition | null>(null);
  const [viewMode, setViewMode] = useState<'catalog' | 'templates'>('catalog');
  const [pendingRoutineStart, setPendingRoutineStart] = useState<
    | { type: 'preset'; id: GuidedRoutinePresetId }
    | { type: 'template'; id: string }
    | null
  >(null);
  const deferredQuery = useDeferredValue(searchQuery);
  const routinePresets = useMemo(
    () => (['upper', 'lower', 'core'] as GuidedRoutinePresetId[])
      .map((presetId) => buildGuidedRoutinePreset(exercises, presetId, data.sessions))
      .filter((preset) => preset.logs.length > 0),
    [data.sessions, exercises],
  );
  const visibleTemplates = useMemo(
    () => filterTemplatesByTrainingMode(data.templates, trainingMode),
    [data.templates, trainingMode],
  );

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
    if (draftSession && draftSession.logs.length > 0) {
      setPendingRoutineStart({ type: 'template', id: template.id });
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

  const handleStartPreset = (presetId: GuidedRoutinePresetId) => {
    const preset = routinePresets.find((entry) => entry.id === presetId);
    if (!preset) {
      return;
    }

    if (draftSession && draftSession.logs.length > 0) {
      setPendingRoutineStart({ type: 'preset', id: presetId });
      return;
    }

    startDraftSession({
      name: preset.name,
      logs: preset.logs,
    });
    onOpenWorkout();
  };

  const confirmPendingRoutineStart = () => {
    if (!pendingRoutineStart) {
      return;
    }

    if (pendingRoutineStart.type === 'preset') {
      const preset = routinePresets.find((entry) => entry.id === pendingRoutineStart.id);
      if (preset) {
        startDraftSession({
          name: preset.name,
          logs: preset.logs,
        });
        onOpenWorkout();
      }
    }

    if (pendingRoutineStart.type === 'template') {
      const template = data.templates.find((entry) => entry.id === pendingRoutineStart.id);
      if (template) {
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
      }
    }

    setPendingRoutineStart(null);
  };

  const handleFilterChange = (filter: (typeof FILTERS)[number]) => {
    setActiveFilter(filter);
    setSearchQuery('');
  };

  const readinessTip = readiness.confidence === 'low'
    ? 'El catalogo esta en modo base. Registra sueno o un quick log antes de elegir una sesion exigente.'
    : readiness.confidence === 'medium'
      ? 'Tu recomendacion es util, pero puede afinarse mas si registras senales recientes.'
      : readiness.readinessGate === 'recover'
        ? 'Aunque algun grupo parezca fresco, hoy el cuello de botella es global. Prioriza movilidad o trabajo muy controlado.'
        : 'Usa el catalogo para mover el foco hacia los grupos mas frescos y evitar lo que viene mas fatigado.';

  return (
    <div className="app-screen flex h-full flex-col overflow-hidden">
      <header className="px-6 pt-10 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#6EE7B7]">Entrena segun recuperacion</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Entrenar</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {bodyweightOnlyMode
                ? 'Todo lo que ves aqui esta filtrado para casa sin equipo, con foco en movimientos que si puedes hacer hoy.'
                : 'Usa catalogo, plantillas y tu score de recuperacion para construir la sesion correcta en vez de forzar la semana.'}
            </p>
          </div>

          <HeaderActionButton onClick={onOpenProfile} ariaLabel="Abrir ajustes">
            <Settings2 className="size-5" />
          </HeaderActionButton>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-[#6EE7B7]/16 bg-[#6EE7B7]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#6EE7B7]">
            {getTrainingModeLabel(trainingMode)}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <section className="app-panel rounded-[2.5rem] p-5">
          <div className="flex rounded-[1.6rem] bg-[#0b1320] p-1.5">
            <button
              type="button"
              onClick={() => setViewMode('catalog')}
              aria-pressed={viewMode === 'catalog'}
              className={cn(
                'flex-1 rounded-[1.3rem] py-3 text-[10px] font-black uppercase tracking-[0.28em] transition-all',
                viewMode === 'catalog' ? 'bg-[#6EE7B7] text-[#08111C]' : 'text-zinc-500 hover:text-white',
              )}
            >
              Catálogo
            </button>
            <button
              type="button"
              onClick={() => setViewMode('templates')}
              aria-pressed={viewMode === 'templates'}
              className={cn(
                'flex-1 rounded-[1.3rem] py-3 text-[10px] font-black uppercase tracking-[0.28em] transition-all',
                viewMode === 'templates' ? 'bg-[#6EE7B7] text-[#08111C]' : 'text-zinc-500 hover:text-white',
              )}
            >
              Plantillas
            </button>
          </div>

          {viewMode === 'catalog' ? (
            <>
              <div className="rounded-[2rem] border border-[#6EE7B7]/14 bg-[#6EE7B7]/8 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[1.35rem] bg-[#0b1320] text-[#6EE7B7]">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6EE7B7]">Rutinas guiadas</p>
                    <h2 className="mt-2 text-xl font-black tracking-tight text-white">Empieza por grupo muscular</h2>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                      Estas rutinas ya salen en modo guiado con calentamiento, bloque principal y enfriamiento automáticos.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {routinePresets.map((preset) => (
                    <article key={preset.id} className="app-panel-soft rounded-[1.8rem] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-black text-white">{preset.name}</p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#6EE7B7]">
                            {preset.chip}
                          </p>
                        </div>
                        <Button
                          className="h-10 rounded-[1.2rem] bg-[#6EE7B7] px-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#08111C] hover:bg-[#62e6b0]"
                          onClick={() => handleStartPreset(preset.id)}
                        >
                          Iniciar
                        </Button>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{preset.description}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {preset.logs.map((log) => (
                          <span
                            key={log.id}
                            className="rounded-full border border-white/6 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400"
                          >
                            {log.exerciseName}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="relative mt-5">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar ejercicio o grupo muscular..."
                  className="h-14 rounded-[1.6rem] border-none bg-[#0b1320] pl-11 text-base font-bold text-white placeholder:text-zinc-600"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    aria-label="Limpiar busqueda"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
                {FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    aria-pressed={activeFilter === filter}
                    onClick={() => handleFilterChange(filter)}
                    className={cn(
                      'shrink-0 rounded-[1.25rem] border px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] transition-all',
                      activeFilter === filter
                        ? 'border-transparent bg-white text-[#08111C]'
                        : 'border-white/8 bg-[#0b1320] text-zinc-500 hover:text-white',
                    )}
                  >
                    {filter === 'all' ? 'Todos' : formatMuscleGroup(filter)}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                {isLoading ? (
                  <div className="rounded-[1.8rem] border border-dashed border-white/8 bg-[#0b1320] px-4 py-10 text-center text-sm text-zinc-500">
                    Cargando catálogo...
                  </div>
                ) : (
                  filteredExercises.map((exercise) => {
                    const exerciseFatigue = fatigue[exercise.muscleGroup] || 0;
                    const { primaryMuscles } = getExerciseVisualMuscles({
                      visualKey: exercise.visualKey,
                      id: exercise.id,
                      name: exercise.name,
                      muscleGroup: exercise.muscleGroup,
                      iconName: exercise.iconName,
                    });
                    const primaryLabel = primaryMuscles.length > 0
                      ? formatMuscleSummary(primaryMuscles)
                      : formatMuscleGroup(exercise.muscleGroup);
                    const statusLabel = !hasTrainingData
                      ? 'Base'
                      : readiness.readinessGate === 'recover' && exerciseFatigue < 45
                        ? 'Global bajo'
                      : exerciseFatigue >= 70
                        ? 'Recupera'
                        : exerciseFatigue >= 45
                          ? 'Moderado'
                          : 'Listo';
                    const statusClass = !hasTrainingData
                      ? 'text-zinc-400'
                      : readiness.readinessGate === 'recover' && exerciseFatigue < 45
                        ? 'text-[#F9B06E]'
                      : exerciseFatigue >= 70
                        ? 'text-[#F97373]'
                        : exerciseFatigue >= 45
                          ? 'text-[#F9B06E]'
                          : 'text-[#6EE7B7]';

                    return (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => setSelectedExercise(exercise)}
                        className="app-panel-soft flex w-full items-start gap-4 rounded-[1.9rem] p-4 text-left transition-all hover:border-white/12"
                      >
                        <div className="w-28 shrink-0">
                          <ExerciseVisual
                            visualKey={exercise.visualKey}
                            variant="thumbnail"
                            exerciseId={exercise.id}
                            exerciseName={exercise.name}
                            muscleGroup={exercise.muscleGroup}
                            iconName={exercise.iconName}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="truncate text-sm font-black text-white">{exercise.name}</p>
                              <p className="mt-1 text-[11px] font-semibold text-zinc-300">
                                {primaryLabel}
                              </p>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-300">
                              {exercise.mechanic === 'compound'
                                ? 'Compuesto'
                                : exercise.mechanic === 'isolation'
                                  ? 'Aislamiento'
                                  : exercise.mechanic === 'isometric'
                                    ? 'Isométrico'
                                    : 'Movimiento'}
                            </span>
                            <span className="rounded-full border border-[#6EE7B7]/14 bg-[#6EE7B7]/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#6EE7B7]">
                              {getMovementModeLabel(exercise.isBodyweight, trainingMode)}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="h-2 flex-1 rounded-full bg-white/6">
                              <div
                                className={`h-full rounded-full ${exerciseFatigue >= 70 ? 'bg-[#F97373]' : exerciseFatigue >= 45 ? 'bg-[#F9B06E]' : 'bg-[#6EE7B7]'}`}
                                style={{ width: `${Math.max(8, Math.round(exerciseFatigue))}%` }}
                              />
                            </div>
                            <span className="ml-3 text-sm font-black text-white">{Math.round(exerciseFatigue)}%</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="mt-5 space-y-3">
              {visibleTemplates.length === 0 ? (
                <div className="space-y-4">
                  <div className="rounded-[1.9rem] border border-dashed border-white/8 bg-[#0b1320] px-5 py-12 text-center">
                    <Trophy className="mx-auto size-8 text-zinc-700" />
                    <h2 className="mt-4 text-xl font-black text-white">Sin plantillas guardadas</h2>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                      {data.templates.length > 0
                        ? 'Tus plantillas actuales usan equipo o carga externa. Cambia el modo en Perfil si quieres volver a verlas.'
                        : 'Guarda una sesion completa como plantilla y aparecera aqui lista para repetir.'}
                    </p>
                  </div>

                  <section className="space-y-3">
                    <div className="px-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Inicio rapido</p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Rutinas guiadas disponibles</h2>
                    </div>

                    {routinePresets.map((preset) => (
                      <article key={preset.id} className="app-panel-soft rounded-[1.8rem] p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-black text-white">{preset.name}</p>
                            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#6EE7B7]">
                              {preset.chip}
                            </p>
                          </div>
                          <Button
                            className="h-10 rounded-[1.2rem] bg-[#6EE7B7] px-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#08111C] hover:bg-[#62e6b0]"
                            onClick={() => handleStartPreset(preset.id)}
                          >
                            Iniciar
                          </Button>
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{preset.description}</p>
                      </article>
                    ))}
                  </section>
                </div>
              ) : (
                visibleTemplates.map((template) => (
                  <article key={template.id} className="app-panel-soft rounded-[1.9rem] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-black text-white">{template.name}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                          {template.logs.length} ejercicios
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteTemplate(template.id)}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-red-400"
                      >
                        Eliminar
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {template.logs.map((log) => (
                        <span
                          key={log.id}
                          className="rounded-full border border-white/6 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400"
                        >
                          {log.exerciseName}
                        </span>
                      ))}
                    </div>

                    <Button
                      className="mt-5 h-12 w-full rounded-[1.4rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.28em] text-[#08111C] hover:bg-[#62e6b0]"
                      onClick={() => handleStartTemplate(template)}
                    >
                      Iniciar rutina
                    </Button>
                  </article>
                ))
              )}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-[2.5rem] border border-[#6EE7B7]/14 bg-[#6EE7B7]/8 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-[1.35rem] bg-[#0b1320] text-[#6EE7B7]">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6EE7B7]">Tip de readiness</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                {readinessTip}
              </p>
            </div>
          </div>
        </section>
      </div>

      <ExerciseDetail
        exercise={selectedExercise}
        open={selectedExercise !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExercise(null);
          }
        }}
        onAddWorkout={handleAddWorkout}
      />

      <ConfirmDialog
        open={pendingRoutineStart !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRoutineStart(null);
          }
        }}
        title="Reemplazar borrador actual"
        description="Ya tienes una sesión en progreso. Si continúas, la rutina nueva sustituirá el borrador actual."
        confirmLabel="Reemplazar rutina"
        tone="danger"
        onConfirm={confirmPendingRoutineStart}
      />
    </div>
  );
}
