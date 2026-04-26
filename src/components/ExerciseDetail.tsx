import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, PlayCircle, Plus } from 'lucide-react';

import { ExerciseMotionPreview } from '@/components/ExerciseMotionPreview';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatMuscleGroup } from '@/lib/display';
import { resolveExerciseCoach } from '@/lib/exerciseCoach';
import { selectExerciseHistory } from '@/store/selectors';
import { useStoreData } from '@/hooks/useStoreData';
import type { ExerciseDefinition } from '@/store/types';

interface ExerciseDetailProps {
  exercise: ExerciseDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWorkout: (exercise: ExerciseDefinition) => void;
}

type DetailTab = 'how' | 'mistakes' | 'progression' | 'video';

function getDifficultyClasses(difficulty: string) {
  if (difficulty === 'Elite') {
    return 'border-red-400/20 bg-red-400/10 text-red-100';
  }

  if (difficulty === 'Advanced') {
    return 'border-amber-400/20 bg-amber-400/10 text-amber-100';
  }

  if (difficulty === 'Intermediate') {
    return 'border-[#6EE7B7]/20 bg-[#6EE7B7]/10 text-[#C8FFE8]';
  }

  return 'border-white/10 bg-white/5 text-zinc-300';
}

export function ExerciseDetail({ exercise, open, onOpenChange, onAddWorkout }: ExerciseDetailProps) {
  const data = useStoreData();
  const [activeTab, setActiveTab] = useState<DetailTab>('how');

  useEffect(() => {
    if (open) {
      setActiveTab('how');
    }
  }, [exercise?.id, open]);

  const history = useMemo(() => {
    if (!exercise) return [];
    return selectExerciseHistory(data, exercise.id);
  }, [data, exercise]);

  const coach = useMemo(() => {
    if (!exercise) return null;
    return resolveExerciseCoach(exercise);
  }, [exercise]);

  const progressSnapshot = useMemo(() => {
    const sessionsLogged = history.length;
    const bestSetReps = history.reduce((best, entry) => Math.max(best, entry.bestReps), 0);
    const totalTrackedReps = history.reduce((total, entry) => total + entry.totalReps, 0);

    return {
      sessionsLogged,
      bestSetReps,
      totalTrackedReps,
      recent: [...history].reverse().slice(0, 4),
    };
  }, [history]);

  if (!exercise || !coach) return null;

  const openYoutube = () => {
    window.open(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(coach.youtubeQuery)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-w-md flex-col overflow-hidden rounded-[2.75rem] border-white/5 bg-[#121721] p-0 text-white">
        <DialogHeader className="shrink-0 border-b border-white/5 px-6 pt-6 pb-4">
          <div className="space-y-4 text-left">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Ejercicio</p>
              <DialogTitle className="mt-2 text-3xl font-black tracking-tight text-white">{exercise.name}</DialogTitle>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-300">
                {formatMuscleGroup(exercise.muscleGroup)}
              </span>
              <span className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] ${getDifficultyClasses(coach.difficulty)}`}>
                {coach.difficulty}
              </span>
              <span className="rounded-full border border-[#6EE7B7]/15 bg-[#6EE7B7]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8FFE8]">
                {coach.noEquipment ? 'Sin equipo' : 'Peso corporal'}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28">
          <section className="mt-4">
            <ExerciseMotionPreview demoKey={coach.demoKey} />
            <p className="mt-4 text-center text-sm font-semibold text-zinc-300">{coach.coachNote}</p>
          </section>

          <section className="mt-4 rounded-[2rem] border border-white/5 bg-black/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Que trabaja</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{coach.summary}</p>
          </section>

          <section className="mt-4 flex flex-wrap gap-2">
            {coach.cues.map((cue) => (
              <span
                key={cue}
                className="rounded-full border border-white/5 bg-[#161b25] px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-200"
              >
                {cue}
              </span>
            ))}
          </section>

          <section className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-[1.75rem] border border-white/5 bg-black/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Sesiones</p>
              <p className="mt-2 text-2xl font-black text-white">{progressSnapshot.sessionsLogged}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/5 bg-black/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Mejor serie</p>
              <p className="mt-2 text-2xl font-black text-[#6EE7B7]">{progressSnapshot.bestSetReps || '--'}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/5 bg-black/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Reps totales</p>
              <p className="mt-2 text-2xl font-black text-white">{progressSnapshot.totalTrackedReps || '--'}</p>
            </div>
          </section>

          <section className="mt-5">
            <div className="grid grid-cols-4 gap-2 rounded-[1.75rem] bg-[#0F141D] p-2">
              {(['how', 'mistakes', 'progression', 'video'] as DetailTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-[1.25rem] px-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    activeTab === tab
                      ? 'bg-[#6EE7B7] text-[#080B11]'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {tab === 'how' ? 'Como' : tab === 'mistakes' ? 'Errores' : tab === 'progression' ? 'Progresion' : 'Video'}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-[2rem] border border-white/5 bg-[#111722] p-5">
              {activeTab === 'how' ? (
                <div className="space-y-4">
                  {coach.instructions.map((step, index) => (
                    <div key={step} className="flex gap-4">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#6EE7B7]/10 text-xs font-black text-[#6EE7B7]">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-zinc-300">{step}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeTab === 'mistakes' ? (
                <div className="space-y-3">
                  {coach.mistakes.map((mistake) => (
                    <div key={mistake} className="rounded-[1.5rem] border border-red-400/10 bg-red-400/5 px-4 py-4 text-sm font-semibold text-zinc-200">
                      {mistake}
                    </div>
                  ))}
                </div>
              ) : null}

              {activeTab === 'progression' ? (
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-white/5 bg-black/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Mas facil</p>
                    <div className="mt-2 space-y-2">
                      {(coach.progression.easier?.length ? coach.progression.easier : ['Aun no hay una version mas simple registrada.']).map((item) => (
                        <p key={item} className="text-sm font-semibold text-zinc-300">{item}</p>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-[#6EE7B7]/20 bg-[#6EE7B7]/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8FFE8]">Actual</p>
                    <p className="mt-2 text-lg font-black text-white">{coach.progression.current}</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/5 bg-black/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Mas desafiante</p>
                    <div className="mt-2 space-y-2">
                      {(coach.progression.harder?.length ? coach.progression.harder : ['Primero consolida esta version con tecnica limpia.']).map((item) => (
                        <p key={item} className="text-sm font-semibold text-zinc-300">{item}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === 'video' ? (
                <div className="text-center">
                  <PlayCircle className="mx-auto h-12 w-12 text-[#6EE7B7]" />
                  <h3 className="mt-4 text-xl font-black text-white">Necesitas una explicacion mas lenta?</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">
                    Abrimos una busqueda en YouTube con tecnica y tutoriales para este movimiento.
                  </p>

                  <Button
                    className="mt-6 h-14 w-full rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] hover:bg-[#5FE7B0]"
                    onClick={openYoutube}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> Ver explicacion completa
                  </Button>
                </div>
              ) : null}
            </div>
          </section>

          <section className="mt-4 rounded-[2rem] border border-white/5 bg-black/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Tu progreso</p>
                <h3 className="mt-2 text-lg font-black text-white">Ultimas sesiones</h3>
              </div>
            </div>

            {progressSnapshot.recent.length === 0 ? (
              <div className="mt-4 rounded-[1.5rem] border border-dashed border-white/5 bg-[#111722] px-4 py-6 text-center text-sm text-zinc-500">
                Cuando lo registres aqui veras mejor serie, reps y ritmo real.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {progressSnapshot.recent.map((entry) => (
                  <div key={entry.performedAt} className="flex items-center justify-between rounded-[1.5rem] bg-[#111722] px-4 py-4">
                    <div>
                      <p className="text-sm font-black text-white">
                        {new Date(entry.performedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                        {entry.totalReps} reps totales
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#6EE7B7]">{entry.bestReps} reps</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Mejor serie</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="absolute inset-x-0 bottom-0 shrink-0 border-t border-white/5 bg-[#121721]/95 px-4 py-4 backdrop-blur-xl">
          <Button
            className="h-14 w-full rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] hover:bg-[#5FE7B0]"
            onClick={() => {
              onAddWorkout(exercise);
              onOpenChange(false);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Anadir a rutina
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
