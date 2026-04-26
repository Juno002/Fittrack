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

  return (
    <div className="flex h-full flex-col justify-between bg-[#080B11] p-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Finish session</p>
          <h2 className="text-4xl font-black tracking-tight text-white">How hard was it?</h2>
          <p className="mx-auto max-w-sm text-sm text-zinc-400">
            Rate the effort so the prototype can keep a real recovery history instead of fake numbers.
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
                {effort <= 2 ? 'Light' : effort === 3 ? 'Solid' : 'Hard'}
              </p>
            </button>
          ))}
        </div>

        <div className="grid w-full max-w-sm grid-cols-2 gap-4">
          <div className="rounded-[2rem] border border-white/5 bg-[#121721] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Duration</p>
            <p className="mt-2 text-2xl font-black text-white">{formatDuration(elapsedSeconds)}</p>
          </div>
          <div className="rounded-[2rem] border border-white/5 bg-[#121721] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Sets</p>
            <p className="mt-2 text-2xl font-black text-white">{totalSets}</p>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        className="mt-8 h-14 rounded-[1.75rem] text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 hover:bg-white/5 hover:text-white"
        onClick={onBack}
      >
        Back to session
      </Button>
    </div>
  );
}
