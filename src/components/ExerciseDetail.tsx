import { useMemo } from 'react';
import { ArrowLeft, ExternalLink, Heart, MoreVertical, Play } from 'lucide-react';

import { ExerciseMovement } from '@/components/exercise/ExerciseMovement';
import { ExerciseVisual } from '@/components/exercise/ExerciseVisual';
import { MuscleHighlight } from '@/components/MuscleHighlight';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useStoreData } from '@/hooks/useStoreData';
import { formatMuscleGroup } from '@/lib/display';
import { getExerciseVisualMuscles } from '@/lib/exerciseVisuals';
import { getMovementModeLabel } from '@/lib/trainingMode';
import { cn } from '@/lib/utils';
import { selectReadinessSummary } from '@/store/selectors';
import type { ExerciseDefinition, MuscleGroup } from '@/store/types';

interface ExerciseDetailProps {
  exercise: ExerciseDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWorkout: (exercise: ExerciseDefinition) => void;
}

function formatMuscleList(muscles: MuscleGroup[]) {
  return muscles.map((muscle) => formatMuscleGroup(muscle)).join(' · ');
}

function getMechanicLabel(exercise: ExerciseDefinition, movementModeLabel: string) {
  switch (exercise.mechanic) {
    case 'compound':
      return 'Compuesto';
    case 'isolation':
      return 'Aislamiento';
    case 'isometric':
      return 'Isométrico';
    default:
      return movementModeLabel;
  }
}

export function ExerciseDetail({ exercise, open, onOpenChange, onAddWorkout }: ExerciseDetailProps) {
  const data = useStoreData();
  const readiness = useMemo(() => selectReadinessSummary(data), [data]);
  const fatigue = readiness.localFatigue;
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  if (!exercise) {
    return null;
  }

  const movementModeLabel = getMovementModeLabel(exercise.isBodyweight, data.settings.trainingMode);
  const mechanicLabel = getMechanicLabel(exercise, movementModeLabel);
  const exerciseFatigue = fatigue[exercise.muscleGroup] || 0;
  const isReady = readiness.readinessGate !== 'recover' && exerciseFatigue < 45;
  const readinessCaption = readiness.readinessGate === 'recover'
    ? 'Readiness global bajo'
    : isReady
      ? 'Listo para entrenar'
      : 'Requiere descanso';
  const { primaryMuscles, secondaryMuscles } = getExerciseVisualMuscles({
    visualKey: exercise.visualKey,
    id: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    iconName: exercise.iconName,
  });
  const primaryVisualMuscle = primaryMuscles[0] ?? exercise.muscleGroup;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!fixed !inset-0 !translate-x-0 !translate-y-0 !flex !h-[100dvh] !w-full !max-w-full !flex-col !gap-0 !rounded-none !border-none !bg-[#080B11] !p-0 text-white ring-0"
      >
        <div className="flex shrink-0 items-center justify-between bg-[#080B11] px-4 py-4">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full bg-white/5 text-white transition-colors hover:bg-white/10"
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="flex gap-2">
            <button className="flex size-10 items-center justify-center rounded-full bg-white/5 text-white transition-colors hover:bg-white/10">
              <Heart className="size-5" />
            </button>
            <button className="flex size-10 items-center justify-center rounded-full bg-white/5 text-white transition-colors hover:bg-white/10">
              <MoreVertical className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-32">
          <div className="px-6 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">{exercise.name}</h1>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {formatMuscleGroup(exercise.muscleGroup)} · {mechanicLabel}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#6EE7B7]/18 bg-[#6EE7B7]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#6EE7B7]">
                    {movementModeLabel}
                  </span>
                  <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-300">
                    {primaryMuscles.length > 0 ? formatMuscleList(primaryMuscles) : formatMuscleGroup(exercise.muscleGroup)}
                  </span>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/6 bg-white/5 px-4 py-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Fatiga actual</p>
                <p className="mt-2 text-2xl font-black text-white">{Math.round(exerciseFatigue)}%</p>
                <p className={cn(
                  'mt-1 text-[10px] font-black uppercase tracking-[0.24em]',
                  isReady ? 'text-[#6EE7B7]' : 'text-[#F97373]',
                )}>
                  {readinessCaption}
                </p>
              </div>
            </div>

            {readiness.readinessGate === 'recover' ? (
              <div className="mt-5 rounded-[1.8rem] border border-[#F9B06E]/20 bg-[#F9B06E]/8 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F9B06E]">Lectura global</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                  Hoy conviene bajar un poco el ritmo. Puedes usar este ejercicio, pero con técnica muy limpia y sin buscar agotarte.
                </p>
              </div>
            ) : null}
          </div>

          <section className="px-6">
            <ExerciseVisual
              visualKey={exercise.visualKey}
              variant="detail"
              exerciseId={exercise.id}
              exerciseName={exercise.name}
              muscleGroup={exercise.muscleGroup}
              iconName={exercise.iconName}
            />
          </section>

          <section className="px-6 pt-8">
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Movimiento</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Pose A a Pose B</h2>
            </div>

            <ExerciseMovement
              visualKey={exercise.visualKey}
              exerciseId={exercise.id}
              exerciseName={exercise.name}
              muscleGroup={exercise.muscleGroup}
              iconName={exercise.iconName}
            />
          </section>

          <section className="px-6 pt-8">
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Músculos trabajados</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Carga principal y secundaria</h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-[2rem] border border-white/6 bg-[#0b1320]/88 p-4">
                <MuscleHighlight muscleGroup={primaryVisualMuscle} className="border-none bg-transparent py-0" />
              </div>

              <div className="rounded-[2rem] border border-white/6 bg-[#0b1320]/88 p-4">
                <div className="rounded-[1.5rem] border border-[#6EE7B7]/14 bg-[#6EE7B7]/8 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#6EE7B7]">Primario</p>
                  <p className="mt-2 text-sm font-black text-white">
                    {primaryMuscles.length > 0 ? formatMuscleList(primaryMuscles) : formatMuscleGroup(exercise.muscleGroup)}
                  </p>
                </div>

                <div className="mt-3 rounded-[1.5rem] border border-[#7AB9FF]/14 bg-[#7AB9FF]/8 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#7AB9FF]">Secundario</p>
                  <p className="mt-2 text-sm font-black text-white">
                    {secondaryMuscles.length > 0 ? formatMuscleList(secondaryMuscles) : 'Sin secundarios curados en este visual'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="px-6 pt-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Descripción</p>
            <div className="mt-3 rounded-[2rem] border border-white/6 bg-[#0b1320]/88 px-5 py-5">
              <p className="text-sm leading-relaxed text-zinc-200">
                {exercise.description ?? 'Sin descripción disponible por ahora. Usa el visual y la guía técnica para ejecutar el movimiento con control.'}
              </p>
            </div>
          </section>

          <section className="px-6 pt-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Técnica y tips</p>
            <div className="mt-3 rounded-[2rem] border border-white/6 bg-[#0b1320]/88 px-5 py-5">
              <div className="space-y-4">
                {(exercise.formGuidance && exercise.formGuidance.length > 0 ? exercise.formGuidance : [
                  'Sin guía técnica detallada todavía. Mantén rango de movimiento controlado y postura estable.',
                ]).map((tip, index) => (
                  <div key={`${exercise.id}-tip-${index}`} className="flex gap-3">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#6EE7B7]/18 text-[11px] font-black text-[#6EE7B7]">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-200">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="px-6 pb-8 pt-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Tutorial externo</p>
            <div className="mt-3 rounded-[2rem] border border-white/6 bg-[#0b1320]/88 px-5 py-5">
              <p className="text-sm leading-relaxed text-zinc-300">
                Si quieres ver una demostración paso a paso, puedes abrir un recurso externo. La app sigue funcionando offline aunque este enlace no lo haga.
              </p>
              <Button
                variant="outline"
                className="mt-5 h-12 rounded-[1.4rem] border-white/12 bg-transparent px-5 text-[10px] font-black uppercase tracking-[0.26em] text-white hover:bg-white/5 hover:text-white"
                disabled={isOffline}
                onClick={() => {
                  if (exercise.videoUrl) {
                    window.open(exercise.videoUrl, '_blank');
                  } else {
                    window.open(`https://www.youtube.com/results?search_query=how+to+do+${encodeURIComponent(exercise.name)}+exercise`, '_blank');
                  }
                }}
              >
                <Play className="mr-2 size-4" />
                {isOffline ? 'Sin conexión' : 'Ver tutorial'}
                <ExternalLink className="ml-2 size-4" />
              </Button>
            </div>
          </section>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#080B11] via-[#080B11]/92 to-transparent p-6 pt-12">
          <Button
            className="pointer-events-auto h-14 w-full rounded-[1.75rem] bg-[#6EE7B7] text-xs font-black uppercase tracking-[0.28em] text-[#080B11] hover:bg-[#5FE7B0]"
            onClick={() => {
              onAddWorkout(exercise);
              onOpenChange(false);
            }}
          >
            + Agregar a mi rutina
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
