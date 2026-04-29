import { useMemo } from 'react';
import { Moon, Sparkles, TrendingUp, Trophy } from 'lucide-react';

import { HeatmapCalendar } from '@/components/HeatmapCalendar';
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { useStoreData } from '@/hooks/useStoreData';
import { formatMuscleGroup } from '@/lib/display';
import { formatWeight } from '@/lib/units';
import { cn } from '@/lib/utils';
import {
  selectCoachInsights,
  selectCurrentWeekLabel,
  selectMuscleGroupStats,
  selectPersonalRecords,
  selectPreviousWeekVolume,
  selectProgressMilestones,
  selectSleepChartData,
  selectTrainingStreak,
  selectWeeklyTrainingData,
} from '@/store/selectors';

function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof TrendingUp;
  iconClass: string;
}) {
  return (
    <div className="app-metric-tile rounded-[2rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">{label}</p>
          <p className="mt-4 text-4xl font-black leading-none text-white">{value}</p>
        </div>
        <div className={cn('flex size-11 items-center justify-center rounded-[1.25rem] bg-white/5', iconClass)}>
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-zinc-500">{detail}</p>
    </div>
  );
}

export function Stats() {
  const storeData = useStoreData();
  const { exercises } = useExerciseCatalog();
  const streak = useMemo(() => selectTrainingStreak(storeData), [storeData]);
  const weeklyData = useMemo(() => selectWeeklyTrainingData(storeData), [storeData]);
  const previousWeekVolume = useMemo(() => selectPreviousWeekVolume(storeData), [storeData]);
  const sleepChartData = useMemo(() => selectSleepChartData(storeData), [storeData]);
  const insights = useMemo(() => selectCoachInsights(storeData), [storeData]);
  const personalRecords = useMemo(() => selectPersonalRecords(storeData), [storeData]);
  const muscleGroupStats = useMemo(() => selectMuscleGroupStats(storeData), [storeData]);
  const milestones = useMemo(() => selectProgressMilestones(storeData), [storeData]);
  const currentWeekLabel = useMemo(() => selectCurrentWeekLabel(), []);
  const personalRecordEntries = useMemo(
    () => (Object.entries(personalRecords) as Array<[string, number]>)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 5),
    [personalRecords],
  );

  const currentWeekVolume = weeklyData.reduce((total, day) => total + day.totalReps, 0);
  const maxReps = Math.max(...weeklyData.map((day) => day.totalReps), 1);
  const maxSleepScore = Math.max(...sleepChartData.map((day) => day.score ?? 0), 1);
  const maxMuscleLoad = Math.max(...muscleGroupStats.map((stat) => stat.totalLoad), 1);
  const completedMilestones = milestones.filter((milestone) => milestone.complete).length;
  const averageSleepHours = sleepChartData.filter((day) => day.durationHours !== null);
  const sleepAverage = averageSleepHours.length > 0
    ? (averageSleepHours.reduce((total, day) => total + (day.durationHours ?? 0), 0) / averageSleepHours.length).toFixed(1)
    : '--';
  const featuredInsight = insights[0];

  return (
    <div className="app-screen flex h-full flex-col overflow-hidden">
      <header className="px-6 pt-10 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#6EE7B7]">Progreso</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Progreso</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Tu consistencia, el sueño y la carga semanal puestos en contexto para decidir mejor la siguiente sesión.
        </p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-32">
        <section className="app-panel rounded-[2.7rem] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Resumen semanal</p>
              <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-white">
                {streak > 0 ? `${streak} día${streak === 1 ? '' : 's'} en ritmo` : 'Empieza a construir tu racha'}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
                {featuredInsight?.body ?? 'Cada registro nuevo mejora cómo entendemos tu tolerancia y recuperación.'}
              </p>
            </div>
            <div className="rounded-[1.7rem] border border-[#6EE7B7]/18 bg-[#6EE7B7]/10 px-4 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6EE7B7]">Semana actual</p>
              <p className="mt-2 text-3xl font-black text-white">{currentWeekVolume}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">reps</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <MetricTile
              label="Racha"
              value={String(streak)}
              detail="Entrenar seguido importa más que una sola sesión perfecta."
              icon={TrendingUp}
              iconClass="text-[#6EE7B7]"
            />
            <MetricTile
              label="Sueño prom."
              value={sleepAverage === '--' ? '--' : `${sleepAverage}h`}
              detail="Promedio visible de las últimas noches registradas."
              icon={Moon}
              iconClass="text-[#7AB9FF]"
            />
            <MetricTile
              label="Hitos"
              value={String(completedMilestones)}
              detail="Hitos completados dentro del sistema de progreso."
              icon={Sparkles}
              iconClass="text-[#F9B06E]"
            />
            <MetricTile
              label="Récords"
              value={String(personalRecordEntries.length)}
              detail="Ejercicios con mejor marca desbloqueada hasta ahora."
              icon={Trophy}
              iconClass="text-[#C4B5FD]"
            />
          </div>
        </section>

        <HeatmapCalendar />

        <section className="app-panel rounded-[2.4rem] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Volumen</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Semana actual</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Arranca desde {currentWeekLabel}. La comparación con la semana anterior te ayuda a decidir si subir o sostener.
              </p>
            </div>
            <div className="app-metric-tile rounded-[1.5rem] px-4 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Previo</p>
              <p className="mt-2 text-2xl font-black text-white">{previousWeekVolume}</p>
            </div>
          </div>

          <div className="mt-6 flex h-[180px] items-end justify-between gap-3">
            {weeklyData.map((day) => (
              <div key={day.dayKey} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-36 w-full items-end rounded-full bg-[#0b1320] p-1">
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

        <section className="app-panel rounded-[2.4rem] p-5">
          <div className="flex items-start gap-3">
            <Moon className="size-5 text-[#7AB9FF]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Descanso</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Calidad de sueño</h2>
            </div>
          </div>

          <div className="mt-6 flex h-[160px] items-end justify-between gap-3">
            {sleepChartData.map((day) => (
              <div key={day.dayKey} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-32 w-full items-end rounded-full bg-[#0b1320] p-1">
                  <div
                    className="w-full rounded-full bg-[#7AB9FF]/80 transition-all duration-700"
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

        <section className="app-panel rounded-[2.4rem] p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Distribución</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Carga por grupo muscular</h2>
          </div>

          <div className="mt-6 space-y-4">
            {muscleGroupStats.sort((left, right) => right.totalLoad - left.totalLoad).map((stat) => (
              <div key={stat.muscleGroup}>
                <div className="mb-2 flex items-end justify-between gap-4">
                  <p className="text-sm font-black text-white">{formatMuscleGroup(stat.muscleGroup)}</p>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#6EE7B7]">{stat.totalReps} reps</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                      {formatWeight(stat.totalLoad, storeData.settings.unitSystem)}
                    </p>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-[#0b1320]">
                  <div
                    className="h-full rounded-full bg-[#6EE7B7]"
                    style={{ width: `${Math.max(4, (stat.totalLoad / maxMuscleLoad) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="px-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Insights</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Qué dicen tus datos</h2>
          </div>

          {insights.map((insight) => (
            <article
              key={insight.id}
              className={cn(
                'rounded-[2rem] border p-4 shadow-[0_18px_40px_rgba(0,0,0,0.16)]',
                insight.tone === 'danger'
                  ? 'border-[#F97373]/20 bg-[#F97373]/8'
                  : insight.tone === 'warn'
                    ? 'border-[#F9B06E]/20 bg-[#F9B06E]/8'
                    : 'border-[#6EE7B7]/18 bg-[#6EE7B7]/8',
              )}
            >
              <p className="font-black text-white">{insight.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{insight.body}</p>
            </article>
          ))}
        </section>

        <section className="app-panel rounded-[2.4rem] p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Milestones</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Hitos del sistema</h2>
          </div>

          <div className="mt-6 space-y-3">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={cn(
                  'rounded-[1.8rem] border px-4 py-4',
                  milestone.complete
                    ? 'border-[#6EE7B7]/16 bg-[#6EE7B7]/8'
                    : 'border-white/6 bg-[#0b1320]',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-black text-white">{milestone.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">{milestone.description}</p>
                  </div>
                  <span className={cn(
                    'rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]',
                    milestone.complete ? 'bg-[#6EE7B7] text-[#08111C]' : 'bg-white/6 text-zinc-500',
                  )}>
                    {milestone.complete ? 'Hecho' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="app-panel rounded-[2.4rem] p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Récords</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Mejores marcas</h2>
          </div>

          <div className="mt-6 space-y-3">
            {personalRecordEntries.length === 0 ? (
              <div className="rounded-[1.8rem] border border-dashed border-white/8 bg-[#0b1320] px-4 py-8 text-center text-sm text-zinc-500">
                Sigue entrenando para desbloquear récords personales.
              </div>
            ) : (
              personalRecordEntries.map(([exerciseId, maxWeight]) => {
                const exercise = exercises.find((entry) => entry.id === exerciseId);
                return (
                  <div key={exerciseId} className="app-panel-soft flex items-center justify-between rounded-[1.7rem] px-4 py-4">
                    <span className="font-bold text-white">{exercise ? exercise.name : 'Ejercicio'}</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6EE7B7]">
                      {formatWeight(maxWeight, storeData.settings.unitSystem)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <div className="h-4" />
      </div>
    </div>
  );
}
