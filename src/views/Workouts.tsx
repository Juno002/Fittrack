import { differenceInSeconds } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Dumbbell, List, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { Button } from '@/components/ui/button';
import { ExercisePickerDialog } from '@/features/workouts/ExercisePickerDialog';
import { WorkoutFinishView } from '@/features/workouts/WorkoutFinishView';
import { WorkoutHeader } from '@/features/workouts/WorkoutHeader';
import { WorkoutLogCard } from '@/features/workouts/WorkoutLogCard';
import { WorkoutFocusView } from '@/features/workouts/WorkoutFocusView';
import { hasValidWorkoutLog } from '@/lib/workout';
import { useStore } from '@/store';

interface WorkoutsProps {
  onExit: () => void;
}

export function Workouts({ onExit }: WorkoutsProps) {
  const draftSession = useStore((state) => state.draftSession);
  const setDraftName = useStore((state) => state.setDraftName);
  const setDraftRestDuration = useStore((state) => state.setDraftRestDuration);
  const clearDraftRestTimer = useStore((state) => state.clearDraftRestTimer);
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
  
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [viewMode, setViewMode] = useState<'entrenar' | 'editar'>('entrenar');
  const [clock, setClock] = useState(() => Date.now());

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

  if (!draftSession) {
    return null;
  }

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
    <div className="flex h-[100dvh] flex-col bg-[#080B11] overflow-hidden">
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
        <div className="px-6 py-4 z-30">
          <div className="flex items-center rounded-[2rem] bg-white/5 p-1.5 relative w-fit mx-auto border border-white/5 shadow-2xl backdrop-blur-xl">
            <button
              className={`flex items-center justify-center gap-2 rounded-[1.5rem] px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${viewMode === 'entrenar' ? 'bg-[#6EE7B7] text-[#080B11] shadow-[0_10px_20px_rgba(110,231,183,0.2)]' : 'text-zinc-500 hover:text-white'}`}
              onClick={() => setViewMode('entrenar')}
            >
              <Dumbbell className="size-3.5" />
              ENTRENAR
            </button>
            <button
              className={`flex items-center justify-center gap-2 rounded-[1.5rem] px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${viewMode === 'editar' ? 'bg-[#6EE7B7] text-[#080B11] shadow-[0_10px_20px_rgba(110,231,183,0.2)]' : 'text-zinc-500 hover:text-white'}`}
              onClick={() => setViewMode('editar')}
            >
              <List className="size-3.5" />
              EDITAR
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {draftSession.logs.length === 0 ? (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full px-6 flex flex-col items-center justify-center"
            >
              <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-white/10 bg-[#121721]/50 p-10 text-center w-full max-w-sm">
                <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Plus className="size-10 text-zinc-500" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Sesión Vacía</p>
                <h2 className="mt-4 text-2xl font-black tracking-tight text-white leading-tight">Configura tu rutina</h2>
                <p className="mt-4 text-sm text-zinc-400 mb-8">
                  Añade movimientos del catálogo para empezar a trackear tu entrenamiento.
                </p>
                <Button
                  className="w-full h-16 rounded-[2rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] shadow-xl hover:scale-105 transition-transform"
                  onClick={() => setIsPickerOpen(true)}
                >
                  AÑADIR EJERCICIO
                </Button>
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
                restSeconds={restSeconds}
                onSkipRest={clearDraftRestTimer}
                onToggleSetCompleted={(logId, setIndex) => {
                  toggleDraftSetCompleted(logId, setIndex);
                }}
                onUpdateSet={(logId, setIndex, field, value) => updateDraftSet(logId, setIndex, { [field]: value })}
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
              className="h-full flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-6 pb-48 pt-2">
                <div className="space-y-4 max-w-lg mx-auto">
                  {draftSession.logs.map((log) => (
                    <WorkoutLogCard
                      key={log.id}
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
                  ))}
                </div>
              </div>
              
              <div className="absolute inset-x-0 bottom-0 z-40 p-6 pointer-events-none">
                <div className="max-w-md mx-auto w-full bg-[#080B11]/90 backdrop-blur-xl border border-white/10 rounded-[3rem] p-4 pointer-events-auto shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                  <div className="flex gap-3 mb-3">
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
                        const name = prompt('Nombre de la plantilla:', draftSession.name);
                        if (name) {
                          useStore.getState().saveTemplate(name, draftSession.logs);
                          alert('¡Plantilla guardada!');
                        }
                      }}
                    >
                      PLANTILLA
                    </Button>

                    <Button
                      variant="ghost"
                      className="flex-1 h-12 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500/10"
                      onClick={() => {
                        if (window.confirm('¿Descartar la sesión actual?')) {
                          discardDraftSession();
                          onExit();
                        }
                      }}
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
    </div>
  );
}
