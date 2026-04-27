import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  Heart,
  MoreVertical,
  Play,
  Shield,
  XCircle,
} from 'lucide-react';

import { MuscleHighlight } from '@/components/MuscleHighlight';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useStoreData } from '@/hooks/useStoreData';
import { formatMuscleGroup } from '@/lib/display';
import {
  getMuscleStatusColor,
  getMuscleStatusLabel,
  getRecoveryStateLabel,
  getVolumeZoneLabel,
  selectExerciseProgression,
  selectMuscleStatuses,
} from '@/store/selectors';
import type { ExerciseDefinition } from '@/store/types';

interface ExerciseDetailProps {
  exercise: ExerciseDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWorkout: (exercise: ExerciseDefinition) => void;
}

export function ExerciseDetail({ exercise, open, onOpenChange, onAddWorkout }: ExerciseDetailProps) {
  const [activeTab, setActiveTab] = useState<'como' | 'errores' | 'progresiones' | 'video'>('como');
  const data = useStoreData();
  const muscleStatuses = useMemo(() => selectMuscleStatuses(data), [data]);
  const progression = useMemo(
    () => (exercise ? selectExerciseProgression(data, exercise) : null),
    [data, exercise],
  );

  if (!exercise) {
    return null;
  }

  const status = muscleStatuses[exercise.muscleGroup];
  const statusColor = getMuscleStatusColor(status);
  const statusLabel = getMuscleStatusLabel(status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!fixed !inset-0 !translate-x-0 !translate-y-0 !w-full !max-w-full !h-[100dvh] sm:!max-w-full !rounded-none !border-none !bg-[#080B11] !p-0 !flex !flex-col !gap-0 text-white ring-0 z-50"
      >
        <div className="flex shrink-0 items-center justify-between px-4 py-4 z-10 bg-[#080B11]">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10"
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="flex gap-2">
            <button className="flex size-10 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10">
              <Heart className="size-5" />
            </button>
            <button className="flex size-10 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10">
              <MoreVertical className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-32">
          <div className="px-6 flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-black">{exercise.name}</h1>
              <p className="mt-1 text-xs text-zinc-400">
                {formatMuscleGroup(exercise.muscleGroup)} • {exercise.mechanic === 'compound' ? 'Compuesto' : exercise.mechanic === 'isolation' ? 'Aislamiento' : exercise.isBodyweight ? 'Peso corporal' : 'Con peso'}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6EE7B7]">
                <span>{exercise.coachModeling === 'curated' ? 'MODELADO' : 'GENÉRICO'}</span>
                <div className="flex gap-0.5">
                  <div className="h-2 w-1.5 rounded-sm bg-[#6EE7B7]" />
                  <div className="h-2 w-1.5 rounded-sm bg-[#6EE7B7]" />
                  <div className="h-2 w-1.5 rounded-sm bg-white/20" />
                  <div className="h-2 w-1.5 rounded-sm bg-white/20" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/5 p-3 text-center min-w-[150px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Estado actual</p>
              <p className={`mt-2 text-lg font-black ${statusColor}`}>{statusLabel}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                {status.weeklySets.toFixed(1)} series • {getRecoveryStateLabel(status.acuteRecoveryState)}
              </p>
            </div>
          </div>

          <div className="px-6 mb-6">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2rem] border border-white/5 bg-[#121721] flex items-center justify-center p-4">
              <MuscleHighlight muscleGroup={exercise.muscleGroup} />
            </div>
          </div>

          <div className="px-6 grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-[1.75rem] border border-white/5 bg-white/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Volumen semanal</p>
              <p className="mt-2 text-lg font-black text-white">{getVolumeZoneLabel(status.volumeZone)}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/5 bg-white/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Recuperación aguda</p>
              <p className="mt-2 text-lg font-black text-white">{getRecoveryStateLabel(status.acuteRecoveryState)}</p>
            </div>
          </div>

          <div className="px-6 flex justify-between gap-2 mb-6">
            <div className="flex flex-col items-center text-center max-w-[100px]">
              <Shield className="size-6 text-[#6EE7B7] mb-2" />
              <p className="text-xs font-bold text-white mb-1">Técnica limpia</p>
              <p className="text-[10px] text-zinc-500 leading-tight">Mejor señal que perseguir solo más volumen.</p>
            </div>
            <div className="flex flex-col items-center text-center max-w-[100px]">
              <ArrowDown className="size-6 text-[#6EE7B7] mb-2" />
              <p className="text-xs font-bold text-white mb-1">Pico retardado</p>
              <p className="text-[10px] text-zinc-500 leading-tight">El daño periférico suele sentirse más entre 24 y 72h.</p>
            </div>
            <div className="flex flex-col items-center text-center max-w-[100px]">
              <ArrowUp className="size-6 text-[#6EE7B7] mb-2" />
              <p className="text-xs font-bold text-white mb-1">Progresión real</p>
              <p className="text-[10px] text-zinc-500 leading-tight">Si la variante te queda fácil, toca subir la demanda.</p>
            </div>
          </div>

          <div className="px-4">
            <div className="flex overflow-x-auto rounded-[2rem] bg-[#121721] p-1 no-scrollbar">
              {(['como', 'errores', 'progresiones', 'video'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`flex-shrink-0 flex-1 rounded-[1.75rem] py-2.5 px-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-[#6EE7B7] text-[#080B11]' : 'text-zinc-500 hover:text-white'}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'como' ? 'Cómo hacerlo' : tab === 'errores' ? 'Errores' : tab === 'progresiones' ? 'Progresiones' : 'Video'}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-6">
            {activeTab === 'como' && (
              <div className="space-y-6">
                {exercise.formGuidance && exercise.formGuidance.length > 0 ? (
                  exercise.formGuidance.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#6EE7B7]/20 text-[#6EE7B7] text-xs font-black">
                        {index + 1}
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{step}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-4">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#6EE7B7]/20 text-[#6EE7B7] text-xs font-black">1</div>
                    <p className="text-sm text-zinc-300 leading-relaxed">Sin instrucciones detalladas disponibles. Usa el video o la progresión para revisar el patrón.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'errores' && (
              <div className="space-y-6">
                {[
                  ['Desalineación del cuerpo', 'Evita encorvarte o perder tensión. La técnica degradada te roba señal útil y añade fatiga extra.'],
                  ['Rango incompleto', 'Si recortas el recorrido, también recortas el estímulo. Usa una variante más fácil antes de acortar el ROM.'],
                  ['Escalar antes de tiempo', 'Si todavía estás en pico retardado o alto volumen semanal, no confundas ganas con recuperación real.'],
                ].map(([title, body]) => (
                  <div key={title} className="flex gap-4 items-start">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-red-500/20 text-red-400">
                      <XCircle className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{title}</p>
                      <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'progresiones' && (
              <div className="space-y-4">
                {progression ? (
                  <>
                    {progression.shouldAdvance ? (
                      <div className="rounded-[1.75rem] border border-[#6EE7B7]/20 bg-[#6EE7B7]/10 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6EE7B7]">Siguiente paso</p>
                        <p className="mt-2 text-lg font-black text-white">
                          {progression.nextStep ? progression.nextStep.name : 'Último nivel del track'}
                        </p>
                        <p className="mt-1 text-sm text-zinc-300">
                          {progression.nextStep
                            ? 'Tu última sesión quedó fácil: superaste 12 reps en al menos 2 sets con esfuerzo bajo.'
                            : 'Ya estás en el techo del track. La siguiente progresión es más ROM, explosividad o trabajo unilateral controlado.'}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-[1.75rem] border border-white/5 bg-white/5 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Regla del track</p>
                        <p className="mt-2 text-sm text-zinc-300">
                          Cambia de variante cuando completes al menos 2 sets por encima de 12 reps con esfuerzo 3/5 o menor.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {progression.steps.map((step) => {
                        const isCurrent = step.step === progression.currentStep;
                        const isCompleted = step.step < progression.currentStep;
                        const isNext = progression.nextStep?.step === step.step;

                        return (
                          <div
                            key={`${step.trackId}-${step.step}`}
                            className={`flex items-center gap-4 rounded-[1.75rem] border p-4 ${isCurrent ? 'border-[#6EE7B7]/30 bg-[#6EE7B7]/10' : isNext ? 'border-amber-400/20 bg-amber-400/5' : 'border-white/5 bg-white/5'}`}
                          >
                            <div className={`flex size-10 items-center justify-center rounded-full text-xs font-black ${isCurrent ? 'bg-[#6EE7B7] text-[#080B11]' : isNext ? 'bg-amber-400 text-[#080B11]' : 'bg-white/10 text-zinc-400'}`}>
                              {step.step + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-black ${isCurrent ? 'text-[#6EE7B7]' : 'text-white'}`}>{step.name}</p>
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                                {isCurrent ? 'Actual' : isNext ? 'Siguiente' : isCompleted ? 'Superado' : 'Pendiente'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="rounded-[1.75rem] border border-dashed border-white/5 bg-white/5 px-5 py-8 text-center text-sm text-zinc-500">
                    Este ejercicio no pertenece a un track curado de progresión bodyweight todavía.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'video' && (
              <div className="flex flex-col items-center justify-center text-center py-6">
                <div className="size-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Play className="size-10 text-[#6EE7B7] ml-2" />
                </div>
                <p className="text-lg font-black text-white mb-2">¿Necesitas verlo en detalle?</p>
                <p className="text-sm text-zinc-400 mb-8 max-w-[250px] mx-auto">
                  Mira una demostración o busca la variante exacta que te toque progresar.
                </p>

                <Button
                  variant="outline"
                  className="h-14 rounded-[1.75rem] border-white/20 bg-transparent px-8 text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/5 hover:text-white"
                  onClick={() => {
                    if (exercise.videoUrl) {
                      window.open(exercise.videoUrl, '_blank');
                    } else {
                      window.open(`https://www.youtube.com/results?search_query=how+to+do+${encodeURIComponent(exercise.name)}+exercise`, '_blank');
                    }
                  }}
                >
                  Ver en YouTube <ExternalLink className="ml-2 size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#080B11] via-[#080B11]/90 to-transparent p-6 pt-12 pointer-events-none">
          <Button
            className="w-full h-14 rounded-[1.75rem] bg-[#6EE7B7] text-xs font-black uppercase tracking-[0.3em] text-[#080B11] hover:bg-[#5FE7B0] pointer-events-auto"
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
