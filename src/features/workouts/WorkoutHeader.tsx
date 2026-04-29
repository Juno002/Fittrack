import { Timer, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDuration } from '@/lib/display';

interface WorkoutHeaderProps {
  sessionName: string;
  elapsedSeconds: number;
  restSeconds: number;
  restDurationSeconds: number;
  onSessionNameChange: (value: string) => void;
  onExit: () => void;
  onSkipRest: () => void;
  onRestDurationChange: (seconds: number) => void;
  hideRestTimer?: boolean;
}

const REST_PRESETS = [45, 60, 90];

export function WorkoutHeader({
  sessionName,
  elapsedSeconds,
  restSeconds,
  restDurationSeconds,
  onSessionNameChange,
  onExit,
  onSkipRest,
  onRestDurationChange,
  hideRestTimer,
}: WorkoutHeaderProps) {
  return (
    <header className="space-y-4 px-6 pt-8 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 rounded-2xl bg-white/5 text-zinc-400 hover:text-white"
            onClick={onExit}
          >
            <X className="size-5" />
          </Button>

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Sesión activa</p>
            <Input
              value={sessionName}
              onChange={(event) => onSessionNameChange(event.target.value)}
              placeholder="Nombra tu entrenamiento"
              className="h-auto border-none bg-transparent px-0 text-2xl font-black tracking-tight text-white placeholder:text-zinc-700 focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="app-metric-tile rounded-[2rem] px-4 py-3 text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Transcurrido</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-[#6EE7B7]">{formatDuration(elapsedSeconds)}</p>
        </div>
      </div>

      {!hideRestTimer && restSeconds > 0 && (
        <div className="flex items-center justify-between rounded-[2rem] bg-[#6EE7B7] px-5 py-4 text-[#080B11] shadow-lg shadow-emerald-500/20">
          <div className="flex items-center gap-3">
            <Timer className="size-5 animate-pulse" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Descanso</p>
              <p className="text-sm font-semibold">Siguiente serie en {restSeconds}s</p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="rounded-2xl px-4 text-[11px] font-black uppercase tracking-[0.25em] text-[#080B11] hover:bg-black/5"
            onClick={onSkipRest}
          >
            Saltar
          </Button>
        </div>
      )}

      <div className="app-panel-soft flex items-center gap-2 overflow-x-auto rounded-[2rem] px-4 py-3 no-scrollbar">
        <span className="pr-2 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Timer</span>
        {REST_PRESETS.map((seconds) => {
          const isActive = restDurationSeconds === seconds;

          return (
            <button
              key={seconds}
              type="button"
              className={[
                'rounded-2xl border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] transition-all',
                isActive
                  ? 'border-[#6EE7B7] bg-[#6EE7B7]/15 text-[#6EE7B7]'
                  : 'border-white/5 bg-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300',
              ].join(' ')}
              onClick={() => onRestDurationChange(seconds)}
            >
              {seconds}s
            </button>
          );
        })}
      </div>
    </header>
  );
}
