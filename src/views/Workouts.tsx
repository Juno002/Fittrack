import { differenceInSeconds } from 'date-fns';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Bookmark, Dumbbell, List, Sparkles, Target } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ExercisePickerDialog } from '@/features/workouts/ExercisePickerDialog';
import { WorkoutFinishView } from '@/features/workouts/WorkoutFinishView';
import { WorkoutHeader } from '@/features/workouts/WorkoutHeader';
import { WorkoutLogCard } from '@/features/workouts/WorkoutLogCard';
import { WorkoutFocusView } from '@/features/workouts/WorkoutFocusView';
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { useStoreData } from '@/hooks/useStoreData';
import { formatMuscleGroup } from '@/lib/display';
import { buildGuidedRoutinePreset, type GuidedRoutinePresetId } from '@/lib/guidedWorkout';
import { hasValidWorkoutLog } from '@/lib/workout';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import type { WorkoutTemplate } from '@/store/types';

interface WorkoutsProps {
  onExit: () => void;
}

function RoutineStarterCard({
  title,
  chip,
  description,
  exercises,
  onStart,
}: {
  title: string;
  chip: string;
  description: string;
  exercises: string[];
  onStart: () => void;
}) {
  return (
    <article className="app-panel-soft rounded-[2rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">{title}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#6EE7B7]">{chip}</p>
        </div>
        <Button
          className="h-10 rounded-[1.2rem] bg-[#6EE7B7] px-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#08111C] hover:bg-[#62e6b0]"
          onClick={onStart}
        >
          Empezar
        </Button>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {exercises.slice(0, 4).map((exercise) => (
          <span
            key={exercise}
            className="rounded-full border border-white/6 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400"
          >
            {exercise}
          </span>
        ))}
      </div>
    </article>
  );
}

function TemplateStarterCard({
  template,
  onStart,
}: {
  template: WorkoutTemplate;
  onStart: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onStart}
      className="app-panel-soft flex w-full items-start justify-between gap-4 rounded-[1.9rem] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/12"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-white">{template.name}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
          {template.logs.length} ejercicios
        </p>
      </div>
      <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">
        Usar
      </span>
    </button>
  );
}

function SessionStatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="app-metric-tile rounded-[1.8rem] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-black leading-none text-white">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500">{detail}</p>
    </div>
  );
}

export function Workouts({ onExit }: WorkoutsProps) {
  const storeData = useStoreData();
  const { exercises } = useExerciseCatalog();
  const draftSession = useStore((state) => state.draftSession);
  const setDraftName = useStore((state) => state.setDraftName);
  const setDraftRestDuration = useStore((state) => state.setDraftRestDuration);
  const clearDraftRestTimer = useStore((state) => state.clearDraftRestTimer);
  const startDraftSession = useStore((state) => state.startDraftSession);
  const addExerciseToDraft = useStore((state) => state.addExerciseToDraft);
  const duplicateDraftLog = useStore((state) => state.duplicateDraftLog);
  const removeDraftLog = useStore((state) => state.removeDraftLog);
  const toggleDraftLogBodyweight = useStore((state) => state.toggleDraftLogBodyweight);
  const addSetToDraftLog = useStore((state) => state.addSetToDraftLog);
  const updateDraftSet = useStore((state) => state.updateDraftSet);
  const removeDraftSet = useStore((state) => state.removeDraftSet);
  const toggleDraftSetCompleted = useStore((state) => state.toggleDraftSetCompleted);
  const finalizeDraftSession = useStore((state) => state.finalizeDraftSession);
  const discardDraftSession = useStore((state) => state.discardDraftSession);
  const saveCustomExercise = useStore((state) => state.saveCustomExercise);
  const saveTemplate = useStore((state) => state.saveTemplate);

  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [viewMode, setViewMode] = useState<'entrenar' | 'editar'>('entrenar');
  const [guidedStepIndex, setGuidedStepIndex] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savedTemplateName, setSavedTemplateName] = useState<string | null>(null);

  const routinePresets = useMemo(
    () => (['upper', 'lower', 'core'] as GuidedRoutinePresetId[])
      .map((presetId) => buildGuidedRoutinePreset(exercises, presetId))
      .filter((preset) => preset.logs.length > 0),
    [exercises],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClock(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!draftSession) {
      return;
    }

    setExpandedLogs((current) => {
      const nextState = { ...current };

      draftSession.logs.forEach((log) => {
        if (!(log.id in nextState)) {
          nextState[log.id] = true;
        }
      });

      return nextState;
    });
  }, [draftSession]);

  useEffect(() => {
    setGuidedStepIndex(0);
  }, [draftSession?.id]);

  useEffect(() => {
    if (!savedTemplateName) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSavedTemplateName(null);
    }, 2400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [savedTemplateName]);

  const elapsedSeconds = draftSession
    ? Math.max(0, differenceInSeconds(new Date(clock), new Date(draftSession.startedAt)))
    : 0;
  const restSeconds = draftSession?.restTimerEndsAt
    ? Math.max(0, differenceInSeconds(new Date(draftSession.restTimerEndsAt), new Date(clock)))
    : 0;
  const validLogCount = useMemo(
    () => draftSession?.logs.filter(hasValidWorkoutLog).length ?? 0,
    [draftSession],
  );

  const sessionSummary = useMemo(() => {
    if (!draftSession) {
      return {
        totalSets: 0,
        completedSets: 0,
        primaryMuscles: [] as string[],
        bodyweightLogs: 0,
      };
    }

    const totalSets = draftSession.logs.reduce((total, log) => total + log.sets.length, 0);
    const completedSets = draftSession.logs.reduce(
      (total, log) => total + log.sets.filter((set) => set.completed).length,
      0,
    );
    const primaryMuscles = Array.from(
      new Set(draftSession.logs.map((log) => formatMuscleGroup(log.muscleGroup))),
    ).slice(0, 3);

    return {
      totalSets,
      completedSets,
      primaryMuscles,
      bodyweightLogs: draftSession.logs.filter((log) => log.isBodyweight).length,
    };
  }, [draftSession]);

  const playAlert = () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.5);

      gain.gain.setValueAtTime(0.1, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(context.destination);

      osc.start();
      osc.stop(context.currentTime + 0.5);
    } catch {
      // Ignore audio errors
    }
  };

  useEffect(() => {
    if (draftSession?.restTimerEndsAt && restSeconds === 0) {
      playAlert();
      clearDraftRestTimer();
    }
  }, [clearDraftRestTimer, draftSession?.restTimerEndsAt, restSeconds]);

  const handleAdvanceGuidedStep = useCallback(() => {
    setGuidedStepIndex((current) => current + 1);
  }, []);

  if (!draftSession) {
    return null;
  }

  const handleStartTemplate = (template: WorkoutTemplate) => {
    const freshLogs = template.logs.map((log) => ({
      ...log,
      id: crypto.randomUUID(),
      sets: log.sets.map((set) => ({ ...set, completed: false })),
    }));

    startDraftSession({
      name: template.name,
      logs: freshLogs,
    });
    setViewMode('entrenar');
  };

  const handleStartPreset = (presetId: GuidedRoutinePresetId) => {
    const preset = routinePresets.find((entry) => entry.id === presetId);
    if (!preset) {
      return;
    }

    startDraftSession({
      name: preset.name,
      logs: preset.logs,
    });
    setViewMode('entrenar');
  };

  const handleSaveTemplate = () => {
    const normalizedName = templateName.trim();
    if (!normalizedName) {
      return;
    }

    saveTemplate(normalizedName, draftSession.logs);
    setSavedTemplateName(normalizedName);
    setIsTemplateDialogOpen(false);
  };

  if (isFinishing) {
    return (
      <WorkoutFinishView
        logs={draftSession.logs}
        elapsedSeconds={elapsedSeconds}
        onBack={() => setIsFinishing(false)}
        onFinish={(effort) => {
          const session = finalizeDraftSession(effort);
          if (session) {
            onExit();
          }
        }}
      />
    );
  }

  return (
    <div className="app-screen flex h-[100dvh] flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {draftSession.logs.length > 0 && viewMode === 'editar' && (
          <motion.div
            key="header-editor"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="z-20"
          >
            <WorkoutHeader
              sessionName={draftSession.name}
              elapsedSeconds={elapsedSeconds}
              restSeconds={restSeconds}
              restDurationSeconds={draftSession.restDurationSeconds}
              onSessionNameChange={setDraftName}
              onExit={onExit}
              onSkipRest={clearDraftRestTimer}
              onRestDurationChange={setDraftRestDuration}
              hideRestTimer={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {draftSession.logs.length > 0 && (
        <div className="z-30 px-6 py-4">
          <div className="relative mx-auto flex w-fit items-center rounded-[2rem] border border-white/5 bg-white/5 p-1.5 shadow-2xl backdrop-blur-xl">
            <button
              className={cn(
                'flex items-center justify-center gap-2 rounded-[1.5rem] px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300',
                viewMode === 'entrenar'
                  ? 'bg-[#6EE7B7] text-[#080B11] shadow-[0_10px_20px_rgba(110,231,183,0.2)]'
                  : 'text-zinc-500 hover:text-white',
              )}
              onClick={() => setViewMode('entrenar')}
            >
              <Dumbbell className="size-3.5" />
              ENTRENAR
            </button>
            <button
              className={cn(
                'flex items-center justify-center gap-2 rounded-[1.5rem] px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300',
                viewMode === 'editar'
                  ? 'bg-[#6EE7B7] text-[#080B11] shadow-[0_10px_20px_rgba(110,231,183,0.2)]'
                  : 'text-zinc-500 hover:text-white',
              )}
              onClick={() => setViewMode('editar')}
            >
              <List className="size-3.5" />
              EDITAR
            </button>
          </div>
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {draftSession.logs.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full overflow-y-auto px-6 pb-20 pt-4"
            >
              <div className="mx-auto max-w-lg space-y-4">
                <section className="app-panel rounded-[3rem] p-6 text-center">
                  <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-white/5">
                    <Target className="size-10 text-[#6EE7B7]" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Crear rutina</p>
                  <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white">
                    Empieza sin partir de cero
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                    Elige una rutina guiada por grupo muscular, arranca desde una plantilla guardada o construye la sesión ejercicio por ejercicio.
                  </p>
                </section>

                <section className="space-y-3">
                  <div className="px-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Rutinas guiadas</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Tren superior, inferior y core</h3>
                  </div>

                  {routinePresets.map((preset) => (
                    <div key={preset.id}>
                      <RoutineStarterCard
                        title={preset.name}
                        chip={preset.chip}
                        description={preset.description}
                        exercises={preset.logs.map((log) => log.exerciseName)}
                        onStart={() => handleStartPreset(preset.id)}
                      />
                    </div>
                  ))}
                </section>

                {storeData.templates.length > 0 ? (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-4 px-1">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Plantillas</p>
                        <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Rutinas guardadas</h3>
                      </div>
                      <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
                        {storeData.templates.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {storeData.templates.slice(0, 3).map((template) => (
                        <div key={template.id}>
                          <TemplateStarterCard
                            template={template}
                            onStart={() => handleStartTemplate(template)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="app-panel-soft rounded-[2.2rem] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Constructor manual</p>
                      <h3 className="mt-2 text-xl font-black tracking-tight text-white">Añade un ejercicio propio o del catálogo</h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                        Ideal si quieres mezclar movimientos o diseñar una variante más personalizada.
                      </p>
                    </div>
                    <Sparkles className="mt-1 size-5 text-[#6EE7B7]" />
                  </div>

                  <Button
                    className="mt-5 h-16 w-full rounded-[2rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] shadow-xl transition-transform hover:scale-[1.01]"
                    onClick={() => setIsPickerOpen(true)}
                  >
                    AÑADIR EJERCICIO
                  </Button>
                </section>
              </div>
            </motion.div>
          ) : viewMode === 'entrenar' ? (
            <motion.div
              key="view-focus"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="h-full"
            >
              <WorkoutFocusView
                draftSession={draftSession}
                elapsedSeconds={elapsedSeconds}
                guidedStepIndex={guidedStepIndex}
                onAdvanceGuidedStep={handleAdvanceGuidedStep}
                onClearStoredRest={clearDraftRestTimer}
                onToggleSetCompleted={(logId, setIndex) => {
                  toggleDraftSetCompleted(logId, setIndex);
                }}
                onFinish={() => setIsFinishing(true)}
                onGoToEdit={() => setViewMode('editar')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="view-editor"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="flex h-full flex-col"
            >
              <div className="flex-1 overflow-y-auto px-6 pb-52 pt-2">
                <div className="mx-auto max-w-lg space-y-4">
                  <section className="app-panel rounded-[2.5rem] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Editor de rutina</p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{draftSession.name || 'Sesión sin nombre'}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                          Ajusta series, repeticiones y estructura antes de volver al modo guiado.
                        </p>
                      </div>
                      <div className="rounded-[1.6rem] border border-[#6EE7B7]/16 bg-[#6EE7B7]/10 px-4 py-3 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6EE7B7]">Ejercicios</p>
                        <p className="mt-2 text-3xl font-black text-white">{draftSession.logs.length}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <SessionStatTile
                        label="Series"
                        value={String(sessionSummary.totalSets)}
                        detail={`${sessionSummary.completedSets} completadas hasta ahora`}
                      />
                      <SessionStatTile
                        label="Corporal"
                        value={String(sessionSummary.bodyweightLogs)}
                        detail="Bloques usando peso corporal"
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {sessionSummary.primaryMuscles.map((muscle) => (
                        <span
                          key={muscle}
                          className="rounded-full border border-white/8 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-300"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>

                    {savedTemplateName ? (
                      <div className="mt-4 rounded-[1.7rem] border border-[#6EE7B7]/18 bg-[#6EE7B7]/10 px-4 py-3 text-sm font-bold text-white">
                        Plantilla guardada: {savedTemplateName}
                      </div>
                    ) : null}
                  </section>

                  {draftSession.logs.map((log) => (
                    <Fragment key={log.id}>
                      <WorkoutLogCard
                        log={log}
                        expanded={expandedLogs[log.id] ?? false}
                        onToggleExpand={() => setExpandedLogs((current) => ({ ...current, [log.id]: !current[log.id] }))}
                        onToggleBodyweight={(checked) => toggleDraftLogBodyweight(log.id, checked)}
                        onRemoveLog={() => removeDraftLog(log.id)}
                        onDuplicateLog={() => duplicateDraftLog(log.id)}
                        onAddSet={() => addSetToDraftLog(log.id)}
                        onUpdateSet={(setIndex, field, value) => updateDraftSet(log.id, setIndex, { [field]: value })}
                        onRemoveSet={(setIndex) => removeDraftSet(log.id, setIndex)}
                        onToggleSetCompleted={(setIndex) => toggleDraftSetCompleted(log.id, setIndex)}
                      />
                    </Fragment>
                  ))}
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 p-6">
                <div className="app-panel pointer-events-auto mx-auto w-full max-w-md rounded-[3rem] p-4">
                  <div className="mb-3 flex gap-3">
                    <Button
                      className="h-16 flex-1 rounded-[2rem] bg-white text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] shadow-2xl transition-all hover:bg-white/90"
                      onClick={() => setIsPickerOpen(true)}
                    >
                      AÑADIR
                    </Button>
                    <Button
                      className="h-16 flex-1 rounded-[2rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] shadow-xl shadow-emerald-500/20 hover:bg-[#5FE7B0]"
                      disabled={validLogCount === 0}
                      onClick={() => setIsFinishing(true)}
                    >
                      FINALIZAR
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1 h-12 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:bg-white/5"
                      onClick={() => {
                        setTemplateName(draftSession.name || 'Mi rutina');
                        setIsTemplateDialogOpen(true);
                      }}
                    >
                      <Bookmark className="mr-2 size-4" />
                      PLANTILLA
                    </Button>

                    <Button
                      variant="ghost"
                      className="flex-1 h-12 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500/10"
                      onClick={() => setIsDiscardDialogOpen(true)}
                    >
                      DESCARTAR
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-sm rounded-[2.5rem] border-white/6 bg-[#101827] p-6 text-white">
          <DialogHeader className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Guardar plantilla</p>
            <DialogTitle className="text-2xl font-black tracking-tight text-white">Reutiliza esta rutina</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <label htmlFor="template-name" className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
              Nombre
            </label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder="Ej: Tren superior suave"
              className="h-14 rounded-[1.5rem] border-none bg-[#0b1320] px-4 text-lg font-black text-white"
            />
          </div>

          <div className="mt-6 grid gap-3">
            <Button
              className="h-14 rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#08111C] hover:bg-[#62e6b0]"
              disabled={!templateName.trim()}
              onClick={handleSaveTemplate}
            >
              Guardar plantilla
            </Button>
            <Button
              variant="ghost"
              className="h-12 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 hover:bg-white/5 hover:text-white"
              onClick={() => setIsTemplateDialogOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ExercisePickerDialog
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        onSelect={(exercise) => {
          addExerciseToDraft(exercise);
        }}
        onCreateCustomExercise={(exercise) => {
          const customExercise = saveCustomExercise(exercise);
          addExerciseToDraft(customExercise);
        }}
      />

      <ConfirmDialog
        open={isDiscardDialogOpen}
        onOpenChange={setIsDiscardDialogOpen}
        title="Descartar sesión actual"
        description="Perderás el borrador de esta rutina y sus cambios pendientes. La sesión guardada no se podrá recuperar."
        confirmLabel="Descartar sesión"
        tone="danger"
        onConfirm={() => {
          discardDraftSession();
          setIsDiscardDialogOpen(false);
          onExit();
        }}
      />
    </div>
  );
}
