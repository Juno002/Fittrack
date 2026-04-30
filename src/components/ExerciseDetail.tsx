import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowDown, ArrowUp, XCircle, Heart, MoreVertical, Play, ExternalLink, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useStoreData } from '@/hooks/useStoreData';
import { formatMuscleGroup } from '@/lib/display';
import { selectReadinessSummary } from '@/store/selectors';
import type { ExerciseDefinition } from '@/store/types';
import { MuscleHighlight } from '@/components/MuscleHighlight';

interface ExerciseDetailProps {
  exercise: ExerciseDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWorkout: (exercise: ExerciseDefinition) => void;
}

export function ExerciseDetail({ exercise, open, onOpenChange, onAddWorkout }: ExerciseDetailProps) {
  const [activeTab, setActiveTab] = useState<'como' | 'errores' | 'progresiones' | 'video'>('como');
  const data = useStoreData();
  
  const readiness = useMemo(() => selectReadinessSummary(data), [data]);
  const fatigue = readiness.localFatigue;
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  
  if (!exercise) return null;

  const exerciseFatigue = fatigue[exercise.muscleGroup] || 0;
  const isReady = readiness.readinessGate !== 'recover' && exerciseFatigue < 45;
  const readinessCaption = readiness.readinessGate === 'recover'
    ? 'Readiness global bajo'
    : isReady
      ? 'Listo para entrenar'
      : 'Requiere descanso';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false} 
        className="!fixed !inset-0 !translate-x-0 !translate-y-0 !w-full !max-w-full !h-[100dvh] sm:!max-w-full !rounded-none !border-none !bg-[#080B11] !p-0 !flex !flex-col !gap-0 text-white ring-0 z-50"
      >
        {/* Header */}
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pb-32">
          {/* Title Info */}
          <div className="px-6 flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-black">{exercise.name}</h1>
              <p className="mt-1 text-xs text-zinc-400">
                {formatMuscleGroup(exercise.muscleGroup)} • {exercise.mechanic === 'compound' ? 'Compuesto' : exercise.mechanic === 'isolation' ? 'Aislamiento' : exercise.isBodyweight ? 'Peso corporal' : 'Con peso'}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6EE7B7]">
                <span>PRINCIPIANTE</span>
                <div className="flex gap-0.5">
                  <div className="h-2 w-1.5 rounded-sm bg-[#6EE7B7]" />
                  <div className="h-2 w-1.5 rounded-sm bg-[#6EE7B7]" />
                  <div className="h-2 w-1.5 rounded-sm bg-white/20" />
                  <div className="h-2 w-1.5 rounded-sm bg-white/20" />
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl border border-white/5 bg-white/5 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Fatiga actual</p>
              <p className="mt-1 text-xl font-black text-white">{Math.round(exerciseFatigue)}%</p>
              <p className={`mt-1 text-[10px] font-bold uppercase tracking-[0.2em] ${isReady ? 'text-[#6EE7B7]' : 'text-red-400'}`}>
                {readinessCaption}
              </p>
            </div>
          </div>

          {readiness.readinessGate === 'recover' ? (
            <div className="mx-6 mb-6 rounded-[1.8rem] border border-[#F9B06E]/20 bg-[#F9B06E]/8 px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F9B06E]">Lectura global</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                Este musculo puede verse disponible localmente, pero tu readiness global esta bajo. Hoy conviene usarlo solo de forma suave o elegir recuperacion activa.
              </p>
            </div>
          ) : null}

          {/* Graphics Area */}
          <div className="px-6 mb-6">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2rem] border border-white/5 bg-[#121721] flex items-center justify-center p-4">
              <MuscleHighlight muscleGroup={exercise.muscleGroup} />
            </div>
          </div>

          {/* Quick Tips */}
          <div className="px-6 flex justify-between gap-2 mb-6">
            <div className="flex flex-col items-center text-center max-w-[100px]">
               <Shield className="size-6 text-[#6EE7B7] mb-2" />
               <p className="text-xs font-bold text-white mb-1">Cuerpo recto</p>
               <p className="text-[10px] text-zinc-500 leading-tight">Activa abdomen y glúteos</p>
            </div>
            <div className="flex flex-col items-center text-center max-w-[100px]">
               <ArrowDown className="size-6 text-[#6EE7B7] mb-2" />
               <p className="text-xs font-bold text-white mb-1">Baja controlado</p>
               <p className="text-[10px] text-zinc-500 leading-tight">Músculo en tensión</p>
            </div>
            <div className="flex flex-col items-center text-center max-w-[100px]">
               <ArrowUp className="size-6 text-[#6EE7B7] mb-2" />
               <p className="text-xs font-bold text-white mb-1">Empuja fuerte</p>
               <p className="text-[10px] text-zinc-500 leading-tight">Extensión sin bloquear</p>
            </div>
          </div>

          {/* Tabs Menu */}
          <div className="px-4">
            <div className="flex overflow-x-auto rounded-[2rem] bg-[#121721] p-1 no-scrollbar">
              <button 
                className={`flex-shrink-0 flex-1 rounded-[1.75rem] py-2.5 px-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'como' ? 'bg-[#6EE7B7] text-[#080B11]' : 'text-zinc-500 hover:text-white'}`}
                onClick={() => setActiveTab('como')}
              >
                Cómo hacerlo
              </button>
              <button 
                className={`flex-shrink-0 rounded-[1.75rem] py-2.5 px-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'errores' ? 'bg-[#6EE7B7] text-[#080B11]' : 'text-zinc-500 hover:text-white'}`}
                onClick={() => setActiveTab('errores')}
              >
                Errores
              </button>
              <button 
                className={`flex-shrink-0 rounded-[1.75rem] py-2.5 px-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'progresiones' ? 'bg-[#6EE7B7] text-[#080B11]' : 'text-zinc-500 hover:text-white'}`}
                onClick={() => setActiveTab('progresiones')}
              >
                Progresiones
              </button>
              <button 
                className={`flex-shrink-0 rounded-[1.75rem] py-2.5 px-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'video' ? 'bg-[#6EE7B7] text-[#080B11]' : 'text-zinc-500 hover:text-white'}`}
                onClick={() => setActiveTab('video')}
              >
                Video
              </button>
            </div>
          </div>

          {/* Tab Content */}
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
                  <p className="text-sm text-zinc-300 leading-relaxed">Sin instrucciones detalladas disponibles. Consulta el video para más guía.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'errores' && (
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-red-500/20 text-red-400 relative">
                  <XCircle className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Desalineación del cuerpo</p>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">Evita encorvarte o dejar caer la cadera. Mantén una línea recta constante.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-red-500/20 text-red-400 relative">
                  <XCircle className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Rango incompleto</p>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">Baja lo suficiente y no recortes el movimiento para obtener el estímulo completo.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-red-500/20 text-red-400 relative">
                  <XCircle className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Posición de extremidades</p>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">Mantén las articulaciones en posiciones seguras (~45° para codos o rodillas según aplique).</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progresiones' && (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">Más fácil</p>
                <div className="flex gap-4 items-center rounded-2xl bg-white/5 p-3 border border-transparent">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-zinc-500">
                    <ArrowDown className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Variante asistida</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Usa apoyo en rodillas o banda elástica.</p>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6EE7B7] mb-3">Actual</p>
                <div className="flex gap-4 items-center rounded-2xl bg-[#6EE7B7]/10 p-3 border border-[#6EE7B7]/30">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#6EE7B7]/20 text-[#6EE7B7]">
                    <Shield className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#6EE7B7]">{exercise.name}</p>
                    <p className="text-[10px] text-[#6EE7B7]/70 mt-1">Tu nivel actual.</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">Más difícil</p>
                <div className="flex gap-4 items-center rounded-2xl bg-white/5 p-3 border border-transparent mb-2">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-zinc-500">
                    <ArrowUp className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Variante con déficit</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Rango de movimiento extendido.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center rounded-2xl bg-white/5 p-3 border border-transparent">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-zinc-500">
                    <ArrowUp className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Variante explosiva/unilateral</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Aumenta la fuerza y tensión requerida.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="flex flex-col items-center justify-center text-center py-6">
              <div className="size-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Play className="size-10 text-[#6EE7B7] ml-2" />
              </div>
              <p className="text-lg font-black text-white mb-2">¿Necesitas verlo en detalle?</p>
              <p className="text-sm text-zinc-400 mb-8 max-w-[250px] mx-auto">
                El tutorial es opcional y externo. La app funciona offline aunque este recurso requiera internet.
              </p>
              
              <Button
                variant="outline"
                className="h-14 rounded-[1.75rem] border-white/20 bg-transparent px-8 text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/5 hover:text-white"
                disabled={isOffline}
                onClick={() => {
                  if (exercise.videoUrl) {
                    window.open(exercise.videoUrl, '_blank');
                  } else {
                    window.open(`https://www.youtube.com/results?search_query=how+to+do+${encodeURIComponent(exercise.name)}+exercise`, '_blank');
                  }
                }}
              >
                {isOffline ? 'SIN CONEXION' : 'VER TUTORIAL EXTERNO'} <ExternalLink className="ml-2 size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

        {/* Bottom CTA */}
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

