import { AnimatePresence, motion } from 'motion/react';
import { Activity, ArrowRight, CheckCircle, Pause, Play, SkipForward, Timer as TimerIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { ExerciseIcon } from '@/components/ExerciseIcon';
import { Button } from '@/components/ui/button';
import { GuidedStepVisual } from '@/features/workouts/GuidedStepVisual';
import { formatMuscleGroup } from '@/lib/display';
import { cn } from '@/lib/utils';
import { buildGuidedWorkoutSteps } from '@/lib/guidedWorkout';
import type { DraftSession } from '@/store/types';

interface WorkoutFocusViewProps {
  draftSession: DraftSession;
  elapsedSeconds: number;
  guidedStepIndex: number;
  onAdvanceGuidedStep: () => void;
  onClearStoredRest: () => void;
  onToggleSetCompleted: (logId: string, setIndex: number) => void;
  onFinish: () => void;
  onGoToEdit: () => void;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getTimedStepToneClass(kind: 'warmup' | 'transition' | 'rest' | 'cooldown') {
  switch (kind) {
    case 'warmup':
      return 'text-[#6EE7B7]';
    case 'cooldown':
      return 'text-[#7AB9FF]';
    case 'transition':
    case 'rest':
      return 'text-[#F9B06E]';
  }
}

function getTimedStepLabel(kind: 'warmup' | 'transition' | 'rest' | 'cooldown') {
  switch (kind) {
    case 'warmup':
      return 'CALENTAMIENTO';
    case 'transition':
      return 'PREPARACIÓN';
    case 'rest':
      return 'DESCANSO';
    case 'cooldown':
      return 'ENFRIAMIENTO';
  }
}

function getTimedStepCueDotClass(kind: 'warmup' | 'transition' | 'rest' | 'cooldown') {
  switch (kind) {
    case 'cooldown':
      return 'bg-[#7AB9FF]';
    case 'transition':
    case 'rest':
      return 'bg-[#F9B06E]';
    case 'warmup':
      return 'bg-[#6EE7B7]';
  }
}

function getStepPreviewLabel(step: ReturnType<typeof buildGuidedWorkoutSteps>[number] | null) {
  if (!step) {
    return 'Fin del bloque';
  }

  if (step.kind === 'main') {
    return step.title;
  }

  switch (step.kind) {
    case 'warmup':
      return 'Calentamiento';
    case 'transition':
      return 'Preparación';
    case 'rest':
      return 'Descanso';
    case 'cooldown':
      return 'Enfriamiento';
  }
}

export function WorkoutFocusView({
  draftSession,
  elapsedSeconds,
  guidedStepIndex,
  onAdvanceGuidedStep,
  onClearStoredRest,
  onToggleSetCompleted,
  onFinish,
  onGoToEdit,
}: WorkoutFocusViewProps) {
  const guidedSteps = useMemo(() => buildGuidedWorkoutSteps(draftSession), [draftSession]);
  const currentStep = guidedStepIndex < guidedSteps.length ? guidedSteps[guidedStepIndex] : null;
  const isGuidedFlowComplete = guidedSteps.length > 0 && guidedStepIndex >= guidedSteps.length;
  const currentStepNumber = currentStep ? guidedStepIndex + 1 : guidedSteps.length;
  const nextStep = currentStep ? guidedSteps[guidedStepIndex + 1] ?? null : null;

  const [remainingSeconds, setRemainingSeconds] = useState(
    currentStep && currentStep.kind !== 'main' ? currentStep.durationSeconds : 0,
  );
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!currentStep || currentStep.kind === 'main') {
      setRemainingSeconds(0);
      setIsPaused(false);
      return;
    }

    setRemainingSeconds(currentStep.durationSeconds);
    setIsPaused(false);
  }, [currentStep]);

  useEffect(() => {
    if (!currentStep || currentStep.kind === 'main' || isPaused || remainingSeconds <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [currentStep, isPaused, onAdvanceGuidedStep, remainingSeconds]);

  useEffect(() => {
    if (!currentStep || currentStep.kind === 'main' || remainingSeconds > 0) {
      return;
    }

    onAdvanceGuidedStep();
  }, [currentStep, onAdvanceGuidedStep, remainingSeconds]);

  useEffect(() => {
    if (!currentStep || currentStep.kind !== 'main') {
      return;
    }

    const log = draftSession.logs.find((entry) => entry.id === currentStep.logId);
    const set = log?.sets[currentStep.setIndex];

    if (set?.completed) {
      onAdvanceGuidedStep();
    }
  }, [currentStep, draftSession.logs, onAdvanceGuidedStep]);

  const progress = guidedSteps.length === 0
    ? 0
    : ((isGuidedFlowComplete ? guidedSteps.length : guidedStepIndex) / guidedSteps.length) * 100;

  if (isGuidedFlowComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-full flex-col items-center justify-center p-8 text-center"
      >
        <div className="relative mb-8 text-[#6EE7B7]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="flex size-24 items-center justify-center rounded-full bg-[#6EE7B7]/20"
          >
            <CheckCircle className="size-12 text-[#6EE7B7]" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 -z-10 rounded-full bg-[#6EE7B7]/10"
          />
        </div>

        <h2 className="mb-2 text-3xl font-black tracking-tight text-white">Enfriamiento completo</h2>
        <p className="mb-10 max-w-xs text-zinc-400">
          Terminaste calentamiento, bloque principal y cierre. Ahora guarda el esfuerzo para registrar la sesión.
        </p>

        <div className="mb-8 grid w-full max-w-sm grid-cols-2 gap-3">
          <div className="rounded-[1.8rem] border border-white/8 bg-white/5 px-4 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Tiempo total</p>
            <p className="mt-2 text-2xl font-black text-white">{formatTime(elapsedSeconds)}</p>
          </div>
          <div className="rounded-[1.8rem] border border-white/8 bg-white/5 px-4 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Bloques</p>
            <p className="mt-2 text-2xl font-black text-white">{guidedSteps.length}</p>
          </div>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-4">
          <Button
            className="h-16 w-full rounded-[2rem] bg-[#6EE7B7] text-[12px] font-black uppercase tracking-[0.2em] text-[#080B11] shadow-[0_20px_50px_rgba(110,231,183,0.3)] transition-transform hover:scale-105"
            onClick={onFinish}
          >
            GUARDAR RESULTADOS
          </Button>
          <Button
            variant="ghost"
            className="h-14 w-full rounded-[2rem] text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white"
            onClick={onGoToEdit}
          >
            REVISAR SESIÓN
          </Button>
        </div>
      </motion.div>
    );
  }

  if (!currentStep) {
    return null;
  }

  const toneClass = currentStep.kind === 'main' ? 'text-white' : getTimedStepToneClass(currentStep.kind);

  const timerCircleClass = currentStep.kind === 'warmup'
    ? 'text-[#6EE7B7]'
    : currentStep.kind === 'cooldown'
      ? 'text-[#7AB9FF]'
      : 'text-[#F9B06E]';

  if (currentStep.kind !== 'main') {
    const elapsedRatio = currentStep.durationSeconds === 0
      ? 1
      : 1 - (remainingSeconds / currentStep.durationSeconds);
    const nextLabel = getStepPreviewLabel(nextStep);
    const pauseLabel = isPaused ? 'Continuar' : 'Pausar';
    const hasVisual = Boolean(currentStep.visualKey);

    return (
      <motion.div
        key={currentStep.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex h-full flex-col overflow-y-auto p-6"
      >
        <div className="relative flex flex-1 flex-col items-center justify-start py-6">
          <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-white/5 opacity-20" />

          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em]', toneClass, 'border-current/20 bg-white/5')}>
              {getTimedStepLabel(currentStep.kind)}
            </span>
            <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
              Paso {currentStepNumber} de {guidedSteps.length}
            </span>
            <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
              Sesión {formatTime(elapsedSeconds)}
            </span>
          </div>

          <div className="relative mb-10 flex items-center justify-center">
            <svg className={cn('-rotate-90', hasVisual ? 'size-56' : 'size-64')}>
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="4"
                className="text-white/5"
              />
              <motion.circle
                cx="128"
                cy="128"
                r="120"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="753.98"
                animate={{ strokeDashoffset: 753.98 * elapsedRatio }}
                transition={{ duration: 0.25, ease: 'linear' }}
                className={timerCircleClass}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('font-black tracking-tighter text-white tabular-nums', hasVisual ? 'text-7xl' : 'text-8xl')}>
                {remainingSeconds}
                <span className="ml-1 text-2xl text-zinc-500">s</span>
              </span>
            </div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-sm rounded-[2.6rem] border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl"
          >
            {currentStep.visualKey ? (
              <GuidedStepVisual
                visualKey={currentStep.visualKey}
                title={currentStep.title}
                className="mb-5"
              />
            ) : null}
            <h2 className="text-2xl font-black tracking-tight text-white">{currentStep.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{currentStep.subtitle}</p>
            <p className="mt-4 text-xs leading-relaxed text-zinc-500">{currentStep.detail}</p>
          </motion.div>

          <div className="mt-4 w-full max-w-sm rounded-[1.9rem] border border-white/8 bg-[#0b1320]/88 px-4 py-4 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Como hacerlo</p>
            <div className="mt-3 space-y-2">
              {currentStep.cues.map((cue) => (
                <div key={cue} className="flex items-start gap-3">
                  <span className={cn('mt-1 size-2 shrink-0 rounded-full', getTimedStepCueDotClass(currentStep.kind))} />
                  <p className="text-sm leading-relaxed text-zinc-300">{cue}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 w-full max-w-sm rounded-[1.9rem] border border-white/8 bg-[#0b1320]/88 px-4 py-4 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Siguiente</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-white">{nextLabel}</p>
              <ArrowRight className="size-4 text-zinc-500" />
            </div>
          </div>

          <div className="mt-4 flex w-full max-w-sm gap-3">
            <Button
              variant="outline"
              className="h-14 flex-1 rounded-[1.6rem] border-white/10 bg-[#0b1320] text-[10px] font-black uppercase tracking-[0.22em] text-white hover:bg-white/5 hover:text-white"
              onClick={() => setIsPaused((current) => !current)}
            >
              {isPaused ? <Play className="mr-2 size-4" /> : <Pause className="mr-2 size-4" />}
              {pauseLabel}
            </Button>
            <Button
              variant="outline"
              className="h-14 flex-1 rounded-[1.6rem] border-white/10 bg-[#0b1320] text-[10px] font-black uppercase tracking-[0.22em] text-white hover:bg-white/5 hover:text-white"
              onClick={() => {
                setIsPaused(false);
                onClearStoredRest();
                onAdvanceGuidedStep();
              }}
            >
              <SkipForward className="mr-2 size-4" />
              Saltar
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080B11]">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="size-2 animate-pulse rounded-full bg-[#6EE7B7]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6EE7B7]">GUIADO</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <TimerIcon className="size-3.5 text-zinc-500" />
            <span className="text-sm font-black tracking-tight tabular-nums">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white backdrop-blur-md"
            onClick={onGoToEdit}
            aria-label="Editar sesión"
          >
            <Activity className="size-5" />
          </motion.button>
        </div>
      </div>

      <div className="flex h-1.5 w-full items-center overflow-hidden bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 50 }}
          className="h-full bg-[#6EE7B7] shadow-[0_0_15px_rgba(110,231,183,0.5)]"
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 pb-32 pt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="flex w-full flex-col items-center"
          >
            <div className="group relative mb-10">
              <div className="absolute inset-0 scale-150 rounded-full bg-[#6EE7B7]/20 opacity-10 blur-[60px] transition-opacity group-hover:opacity-30" />
              <div className="relative flex size-36 items-center justify-center rounded-[3rem] border border-white/10 bg-white/5 text-white shadow-inner">
                <ExerciseIcon name={draftSession.logs.find((entry) => entry.id === currentStep.logId)?.iconName ?? 'Activity'} className="size-20" />
              </div>
            </div>

            <div className="mb-8 w-full px-4 text-center">
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full border border-[#6EE7B7]/18 bg-[#6EE7B7]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#6EE7B7]">
                  Bloque principal
                </span>
                <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
                  Paso {currentStepNumber} de {guidedSteps.length}
                </span>
                <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
                  {formatMuscleGroup(currentStep.muscleGroup)}
                </span>
              </div>
              <h2 className="mb-4 text-4xl font-black leading-[1.1] tracking-tight text-white text-balance">
                {currentStep.title}
              </h2>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-400">
                {currentStep.subtitle}
              </p>
            </div>

            <div className="w-full space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Objetivo</p>
                  <div className="flex items-end gap-2">
                    <span className="text-6xl font-black tracking-tighter text-white">{currentStep.reps}</span>
                    <span className="pb-2 text-lg font-black text-zinc-500">reps</span>
                  </div>
                </div>

                <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Contexto</p>
                  <div className="space-y-3">
                    <div className="rounded-[1.5rem] border border-[#6EE7B7]/18 bg-[#6EE7B7]/8 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6EE7B7]">Modo</p>
                      <p className="mt-1 text-sm font-black text-white">
                        {currentStep.isBodyweight ? 'Peso corporal · sin equipo' : `${currentStep.weight} kg`}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-[#0f1724] px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Serie</p>
                      <p className="mt-1 text-sm font-black text-white">
                        {currentStep.setIndex + 1} de {currentStep.totalSets}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-[#0f1724] px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Sesión</p>
                      <p className="mt-1 text-sm font-black text-white">{formatTime(elapsedSeconds)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {nextStep ? (
                <div className="rounded-[2rem] border border-white/10 bg-[#0f1724] px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Después de este bloque</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-white">
                      {nextStep.kind === 'main'
                        ? nextStep.title
                        : nextStep.kind === 'transition'
                          ? 'Preparación automática'
                          : nextStep.kind === 'rest'
                            ? 'Descanso automático'
                            : nextStep.kind === 'cooldown'
                              ? 'Enfriamiento automático'
                              : 'Siguiente calentamiento'}
                    </p>
                    <ArrowRight className="size-4 text-zinc-500" />
                  </div>
                </div>
              ) : null}

              <motion.button
                whileTap={{ scale: 0.97 }}
                className="relative flex h-20 w-full shrink-0 items-center justify-center overflow-hidden rounded-[3.5rem] bg-[#6EE7B7] text-base font-black uppercase tracking-[0.26em] text-[#080B11] shadow-[0_20px_60px_rgba(110,231,183,0.3)] transition-all group"
                onClick={() => {
                  onToggleSetCompleted(currentStep.logId, currentStep.setIndex);
                  onClearStoredRest();
                  onAdvanceGuidedStep();
                }}
              >
                <div className="absolute inset-0 translate-y-full bg-white/30 transition-transform duration-500 group-hover:translate-y-0" />
                <span className="relative z-10 flex items-center gap-3">
                  Terminé mis repeticiones
                  <CheckCircle className="size-6" />
                </span>
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
