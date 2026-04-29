import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/display';
import type { WorkoutLog } from '@/store/types';

interface WorkoutFinishViewProps {
  logs: WorkoutLog[];
  elapsedSeconds: number;
  onBack: () => void;
  onFinish: (effort: number) => void;
}

export function WorkoutFinishView({
  logs,
  elapsedSeconds,
  onBack,
  onFinish,
}: WorkoutFinishViewProps) {
  const totalSets = logs.reduce((total, log) => total + log.sets.length, 0);
  const completedSets = logs.reduce((total, log) => total + log.sets.filter((set) => set.completed).length, 0);

  return (
    <div className="app-screen flex h-full flex-col justify-between p-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Finalizar sesión</p>
          <h2 className="text-4xl font-black tracking-tight text-white">¿Cómo de duro fue?</h2>
          <p className="mx-auto max-w-sm text-sm text-zinc-400">
            Valora el esfuerzo para que el modelo de recuperación pueda registrar datos reales.
          </p>
        </div>

        <div className="grid w-full max-w-xl gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((effort) => (
            <button
              key={effort}
              type="button"
              className="rounded-[2rem] border border-white/5 bg-[#121721] px-6 py-6 text-white transition-all hover:border-[#6EE7B7]/50 hover:bg-[#6EE7B7]/10"
              onClick={() => onFinish(effort)}
            >
              <p className="text-3xl font-black">{effort}</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                {effort <= 2 ? 'Ligero' : effort === 3 ? 'Sólido' : 'Duro'}
              </p>
            </button>
          ))}
        </div>

        <div className="grid w-full max-w-md grid-cols-3 gap-4">
          <div className="app-metric-tile rounded-[2rem] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Duración</p>
            <p className="mt-2 text-2xl font-black text-white">{formatDuration(elapsedSeconds)}</p>
          </div>
          <div className="app-metric-tile rounded-[2rem] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Series</p>
            <p className="mt-2 text-2xl font-black text-white">{totalSets}</p>
          </div>
          <div className="app-metric-tile rounded-[2rem] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Hechas</p>
            <p className="mt-2 text-2xl font-black text-white">{completedSets}</p>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        className="mt-8 h-14 rounded-[1.75rem] text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 hover:bg-white/5 hover:text-white"
        onClick={onBack}
      >
        Volver a la sesión
      </Button>
    </div>
  );
}
