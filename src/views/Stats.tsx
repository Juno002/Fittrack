import { useMemo } from 'react';
import { Flame, Moon, TrendingUp } from 'lucide-react';

import { formatDayHeading } from '@/lib/display';
import { cn } from '@/lib/utils';
import { useStoreData } from '@/hooks/useStoreData';
import {
  selectCoachInsights,
  selectPersonalRecords,
  selectPreviousWeekVolume,
  selectSleepChartData,
  selectTrainingStreak,
  selectWeeklyTrainingData,
} from '@/store/selectors';
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { formatWeight } from '@/lib/units';
import { HeatmapCalendar } from '@/components/HeatmapCalendar';

export function Stats() {
  const storeData = useStoreData();

  const streak = useMemo(() => selectTrainingStreak(storeData), [storeData]);
  const weeklyData = useMemo(() => selectWeeklyTrainingData(storeData), [storeData]);
  const previousWeekVolume = useMemo(() => selectPreviousWeekVolume(storeData), [storeData]);
  const sleepChartData = useMemo(() => selectSleepChartData(storeData), [storeData]);
  const insights = useMemo(() => selectCoachInsights(storeData), [storeData]);
  const personalRecords = useMemo(() => selectPersonalRecords(storeData), [storeData]);
  const { exercises } = useExerciseCatalog();
  const currentWeekVolume = weeklyData.reduce((total, day) => total + day.totalReps, 0);
  const maxReps = Math.max(...weeklyData.map((day) => day.totalReps), 1);
  const maxSleepScore = Math.max(...sleepChartData.map((day) => day.score ?? 0), 1);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080B11]">
      <header className="px-6 pt-10 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Progreso</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Análisis de Desempeño</h1>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-32">
        <HeatmapCalendar />
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[2.5rem] border border-white/5 bg-[#121721] p-6">
            <TrendingUp className="size-5 text-[#6EE7B7]" />
            <p className="mt-4 text-4xl font-black leading-none text-white">{streak}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
              Racha de días
            </p>
          </div>

          <div className="rounded-[2.5rem] border border-white/5 bg-[#121721] p-6">
            <Flame className="size-5 text-orange-400" />
            <p className="mt-4 text-4xl font-black leading-none text-white">{currentWeekVolume}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
              Reps esta semana
            </p>
          </div>
        </div>

        <section className="rounded-[2.5rem] border border-white/5 bg-[#121721] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Volumen</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white">Esta semana vs. Anterior</h2>
            </div>
            <span className="rounded-2xl bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
              Ant. {previousWeekVolume}
            </span>
          </div>

          <div className="mt-8 flex h-[180px] items-end justify-between gap-3">
            {weeklyData.map((day) => (
              <div key={day.dayKey} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-36 w-full items-end rounded-full bg-white/5 p-1">
                  <div
                    className={cn(
                      'w-full rounded-full transition-all duration-700',
                      day.isToday ? 'bg-[#6EE7B7]' : 'bg-[#6EE7B7]/35',
                    )}
                    style={{ height: `${day.isFuture ? 0 : Math.max(8, (day.totalReps / maxReps) * 100)}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className={cn('text-[10px] font-bold uppercase tracking-[0.25em]', day.isToday ? 'text-[#6EE7B7]' : 'text-zinc-500')}>
                    {day.label}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-600">{day.totalReps}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-white/5 bg-[#121721] p-6">
          <div className="flex items-center gap-3">
            <Moon className="size-5 text-[#63B3ED]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Descanso</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white">Calidad de Sueño</h2>
            </div>
          </div>

          <div className="mt-8 flex h-[160px] items-end justify-between gap-3">
            {sleepChartData.map((day) => (
              <div key={day.dayKey} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-32 w-full items-end rounded-full bg-white/5 p-1">
                  <div
                    className="w-full rounded-full bg-[#63B3ED]/80 transition-all duration-700"
                    style={{ height: `${day.score === null ? 10 : Math.max(10, (day.score / maxSleepScore) * 100)}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">{day.name.slice(0, 1)}</p>
                  <p className="mt-1 text-[10px] text-zinc-600">{day.score ?? '--'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {storeData.weightLogs.length > 0 && (
          <section className="space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Body</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white">Weight Trend</h2>
            </div>
            
            <div className="rounded-[2.5rem] border border-white/5 bg-[#121721] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-bold text-white">Current</p>
                  <p className="text-2xl font-black text-[#6EE7B7]">{formatWeight(storeData.profile.weight, storeData.settings.unitSystem)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">Entries</p>
                  <p className="text-xl font-black text-zinc-400">{storeData.weightLogs.length}</p>
                </div>
              </div>
              
              <div className="flex h-[120px] items-end gap-1">
                {(() => {
                  const logs = [...storeData.weightLogs].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt)).slice(-10);
                  const maxWeight = Math.max(...logs.map(l => l.weight), storeData.profile.weight);
                  const minWeight = Math.min(...logs.map(l => l.weight), storeData.profile.weight) * 0.9;
                  const range = maxWeight - minWeight;

                  return logs.map((log) => {
                    const heightPct = range === 0 ? 50 : Math.max(10, ((log.weight - minWeight) / range) * 100);
                    return (
                      <div key={log.id} className="flex flex-1 flex-col items-center gap-2 group relative">
                        <div className="absolute -top-8 hidden whitespace-nowrap rounded-lg bg-black px-2 py-1 text-xs font-bold text-white group-hover:block z-10">
                          {formatWeight(log.weight, storeData.settings.unitSystem)}
                        </div>
                        <div className="flex h-24 w-full items-end justify-center rounded-t-sm bg-white/5 transition-all hover:bg-white/10">
                          <div
                            className="w-full rounded-t-sm bg-white/80 transition-all duration-500"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </section>
        )}

        <section className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Insights</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-white">What the data is saying</h2>
          </div>

          {insights.map((insight) => (
            <article
              key={insight.id}
              className={cn(
                'rounded-[2.5rem] border p-5',
                insight.tone === 'warn'
                  ? 'border-orange-400/20 bg-orange-400/5'
                  : insight.tone === 'danger'
                    ? 'border-red-400/20 bg-red-400/5'
                    : 'border-[#6EE7B7]/20 bg-[#6EE7B7]/5',
              )}
            >
              <p className="text-sm font-black text-white">{insight.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{insight.body}</p>
            </article>
          ))}
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Hitos</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-white">Récords Personales</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-4">
            {Object.keys(personalRecords).length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-white/5 bg-black/10 px-5 py-8 text-center text-sm text-zinc-500">
                Sigue entrenando para ver tus récords aquí.
              </div>
            ) : (
              Object.entries(personalRecords)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([exerciseId, maxWeight]) => {
                  const exercise = exercises.find((e) => e.id === exerciseId);
                  return (
                    <div key={exerciseId} className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/10 px-4 py-3">
                      <span className="text-sm font-bold text-white">
                        {exercise ? exercise.name : 'Unknown Exercise'}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6EE7B7]">
                        {formatWeight(maxWeight as number, storeData.settings.unitSystem)}
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-white/5 bg-[#121721] p-6 text-sm text-zinc-400">
          <p className="font-semibold text-white">Current week anchor</p>
          <p className="mt-2">{formatDayHeading(weeklyData[0]?.dayKey ?? '')}</p>
        </section>
      </div>
    </div>
  );
}
