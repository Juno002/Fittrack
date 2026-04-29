import { useMemo } from 'react';
import { ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

import { MuscleMap } from '@/components/MuscleMap';
import { Button } from '@/components/ui/button';
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { useStoreData } from '@/hooks/useStoreData';
import { formatMuscleGroup } from '@/lib/display';
import { buildWorkoutLog } from '@/lib/workout';
import { useStore } from '@/store';
import { selectMapFocus, selectReadinessSummary, selectRecommendedExercises } from '@/store/selectors';
import type { MuscleGroup } from '@/store/types';

interface MapProps {
  onOpenWorkout: () => void;
}

export function Map({ onOpenWorkout }: MapProps) {
  const data = useStoreData();
  const { exercises } = useExerciseCatalog();
  const startDraftSession = useStore((state) => state.startDraftSession);
  const readiness = useMemo(() => selectReadinessSummary(data), [data]);
  const mapFocus = useMemo(() => selectMapFocus(data), [data]);
  const recommendedExercises = useMemo(() => selectRecommendedExercises(data, exercises), [data, exercises]);
  const fatigueEntries = useMemo(
    () => (Object.entries(readiness.fatigue) as [MuscleGroup, number][]).sort((left, right) => right[1] - left[1]),
    [readiness.fatigue],
  );

  const handleStartFocusedSession = () => {
    startDraftSession({
      name: mapFocus.title,
      logs: recommendedExercises.slice(0, 2).map((exercise) => buildWorkoutLog(exercise)),
    });
    onOpenWorkout();
  };

  return (
    <div className="app-screen flex h-full flex-col overflow-hidden">
      <header className="px-6 pt-10 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#6EE7B7]">Mapa de recuperación</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Mapa corporal</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {mapFocus.body}
        </p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-32">
        <section className="app-panel rounded-[2.5rem] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Foco actual</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{mapFocus.title}</h2>
            </div>
            <div className="rounded-[1.5rem] border border-[#6EE7B7]/15 bg-[#6EE7B7]/8 px-4 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6EE7B7]">Score</p>
              <p className="mt-2 text-2xl font-black text-white">{readiness.readiness}%</p>
            </div>
          </div>

          <div className="mt-5 h-[330px] overflow-hidden rounded-[2rem] border border-white/6 bg-[#0b1320] px-3 py-4">
            <MuscleMap fatigue={readiness.fatigue} />
          </div>

          <Button
            className="mt-5 h-14 w-full rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#08111C] hover:bg-[#62e6b0]"
            onClick={handleStartFocusedSession}
          >
            Empezar sesión enfocada
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </section>

        <section className="app-panel rounded-[2.5rem] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Lectura muscular</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Nivel de fatiga</h2>
            </div>
            <Sparkles className="size-5 text-[#6EE7B7]" />
          </div>

          <div className="mt-5 space-y-3">
            {fatigueEntries.map(([muscleGroup, value]) => (
              <div key={muscleGroup} className="rounded-[1.8rem] border border-white/6 bg-[#0b1320] px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-white">{formatMuscleGroup(muscleGroup)}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                      {value >= 70 ? 'Recupera primero' : value >= 45 ? 'Carga moderada' : 'Listo para usar'}
                    </p>
                  </div>
                  <span className={`text-xl font-black ${value >= 70 ? 'text-[#F97373]' : value >= 45 ? 'text-[#F9B06E]' : 'text-[#6EE7B7]'}`}>
                    {Math.round(value)}%
                  </span>
                </div>

                <div className="mt-3 h-2 rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${value >= 70 ? 'bg-[#F97373]' : value >= 45 ? 'bg-[#F9B06E]' : 'bg-[#6EE7B7]'}`}
                    style={{ width: `${Math.max(6, value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-[#F9B06E]/18 bg-[#F9B06E]/7 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-[1.4rem] bg-[#0b1320] text-[#F9B06E]">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#F9B06E]">Precaución principal</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white">{formatMuscleGroup(mapFocus.highestFatigueMuscle)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                Mantén baja la carga sobre este grupo mientras completas el plan de hoy.
              </p>
            </div>
          </div>
        </section>

        <div className="h-4" />
      </div>
    </div>
  );
}
