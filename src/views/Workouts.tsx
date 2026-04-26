import { differenceInSeconds } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ExercisePickerDialog } from '@/features/workouts/ExercisePickerDialog';
import { WorkoutFinishView } from '@/features/workouts/WorkoutFinishView';
import { WorkoutHeader } from '@/features/workouts/WorkoutHeader';
import { WorkoutLogCard } from '@/features/workouts/WorkoutLogCard';
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
    <div className="flex h-full flex-col bg-[#080B11]">
      <WorkoutHeader
        sessionName={draftSession.name}
        elapsedSeconds={elapsedSeconds}
        restSeconds={restSeconds}
        restDurationSeconds={draftSession.restDurationSeconds}
        onSessionNameChange={setDraftName}
        onExit={onExit}
        onSkipRest={clearDraftRestTimer}
        onRestDurationChange={setDraftRestDuration}
      />

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {draftSession.logs.length === 0 ? (
          <div className="mt-6 flex h-[40vh] flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-white/5 bg-[#121721] px-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">No exercises yet</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Build the session from real movements</h2>
            <p className="mt-3 max-w-sm text-sm text-zinc-400">
              Add exercises from the shared catalog or create a custom one. The draft will survive reloads automatically.
            </p>
            <Button
              className="mt-6 h-14 rounded-[1.75rem] bg-[#6EE7B7] px-6 text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] hover:bg-[#5FE7B0]"
              onClick={() => setIsPickerOpen(true)}
            >
              Add first movement
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
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
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-md flex-col gap-3 bg-gradient-to-t from-[#080B11] via-[#080B11] px-6 pb-8 pt-6">
        <div className="flex gap-3">
          <Button
            className="h-16 flex-1 rounded-[2rem] bg-white text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] shadow-2xl transition-all hover:bg-white/90"
            onClick={() => setIsPickerOpen(true)}
          >
            Add movement
          </Button>
          <Button
            className="h-16 rounded-[2rem] bg-[#6EE7B7] px-8 text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] shadow-xl shadow-emerald-500/20 hover:bg-[#5FE7B0]"
            disabled={validLogCount === 0}
            onClick={() => setIsFinishing(true)}
          >
            Finish
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 h-12 rounded-[1.75rem] text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 hover:bg-white/5 hover:text-[#6EE7B7]"
            onClick={() => {
              const name = prompt('Template name:', draftSession.name);
              if (name) {
                useStore.getState().saveTemplate(name, draftSession.logs);
                alert('Template saved!');
              }
            }}
          >
            Save as template
          </Button>

          <Button
            variant="ghost"
            className="flex-1 h-12 rounded-[1.75rem] text-[10px] font-bold uppercase tracking-[0.25em] text-red-500 hover:bg-red-500/10 hover:text-red-400"
            onClick={() => {
              if (window.confirm('Discard the current draft session?')) {
                discardDraftSession();
                onExit();
              }
            }}
          >
            Discard
          </Button>
        </div>
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
