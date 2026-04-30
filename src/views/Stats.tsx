import { useMemo } from 'react';
import { Moon, Settings2, Sparkles, TrendingUp, Trophy } from 'lucide-react';

import { HeaderActionButton } from '@/components/HeaderActionButton';
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
  selectPrimaryWeeklyVolume,
  selectProgressMilestones,
  selectRecoveryConsistencyStreak,
  selectSleepChartData,
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

export function Stats({ onOpenProfile }: { onOpenProfile: () => void }) {
  const storeData = useStoreData();
  const { exercises } = useExerciseCatalog();
  const streak = useMemo(() => selectRecoveryConsistencyStreak(storeData), [storeData]);
  const weeklyVolume = useMemo(() => selectPrimaryWeeklyVolume(storeData), [storeData]);
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

  const currentWeekValue = weeklyVolume.current;
  const previousWeekValue = weeklyVolume.previous;
  const maxWeekValue = Math.max(...weeklyVolume.byDay.map((day) => day.value), 1);
  const maxSleepScore = Math.max(...sleepChartData.map((day) => day.score ?? 0), 1);
  const maxMuscleLoad = Math.max(...muscleGroupStats.map((stat) => stat.totalLoad), 1);
  const completedMilestones = milestones.filter((milestone) => milestone.complete).length;
  const averageSleepHours = sleepChartData.filter((day) => day.durationHours !== null);
  const sleepAverage = averageSleepHours.length > 0
    ? (averageSleepHours.reduce((total, day) => total + (day.durationHours ?? 0), 0) / averageSleepHours.length).toFixed(1)
    : '--';
  const featuredInsight = insights[0];
  const pendingMilestones = milestones.filter((milestone) => !milestone.complete);
  const completedMilestoneEntries = milestones.filter((milestone) => milestone.complete);
  const formatWeeklyValue = (value: number) => (
    weeklyVolume.metricMode === 'load'
      ? formatWeight(value, storeData.settings.unitSystem)
      : `${value}`
  );

  return (
    <div className="app-screen flex h-full flex-col overflow-hidden">
      <header className="px-6 pt-10 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#6EE7B7]">Tendencias de la semana</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Tu progreso</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Tu consistencia, el sueño y la carga semanal puestos en contexto para decidir mejor la siguiente sesion.
            </p>
          </div>

          <HeaderActionButton onClick={onOpenProfile} ariaLabel="Abrir ajustes">
            <Settings2 className="size-5" />
          </HeaderActionButton>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-32">
        <section className="app-panel rounded-[2.7rem] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Resumen semanal</p>
              <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-white">
                {streak > 0 ? `${streak} dia${streak === 1 ? '' : 's'} de constancia` : 'Empieza a construir tu constancia'}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
                {featuredInsight?.body ?? 'Cada registro nuevo mejora cómo entendemos tu tolerancia y recuperación.'}
              </p>
            </div>
            <div className="rounded-[1.7rem] border border-[#6EE7B7]/18 bg-[#6EE7B7]/10 px-4 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6EE7B7]">Semana actual</p>
              <p className="mt-2 text-3xl font-black text-white">{formatWeeklyValue(currentWeekValue)}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                {weeklyVolume.metricMode === 'load' ? 'carga total' : 'reps'}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <MetricTile
              label="Constancia"
              value={String(streak)}
              detail="Se mantiene si entrenas o registras recuperacion."
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
              <p className="mt-2 text-2xl font-black text-white">{formatWeeklyValue(previousWeekValue)}</p>
            </div>
          </div>

          <div className="mt-6 flex h-[180px] items-end justify-between gap-3">
            {weeklyVolume.byDay.map((day) => (
              <div key={day.dayKey} className="flex flex-1 flex-col items-center gap-3">
                <div
                  role="progressbar"
                  aria-label={`Volumen ${day.label}`}
                  aria-valuemin={0}
                  aria-valuemax={maxWeekValue}
                  aria-valuenow={day.isFuture ? 0 : day.value}
                  className="flex h-36 w-full items-end rounded-full bg-[#0b1320] p-1"
                >
                  <div
                    className={cn(
                      'w-full rounded-full transition-all duration-700',
                      day.isToday ? 'bg-[#6EE7B7]' : 'bg-[#6EE7B7]/35',
                    )}
                    style={{ height: `${day.isFuture ? 0 : Math.max(8, (day.value / maxWeekValue) * 100)}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className={cn('text-[10px] font-bold uppercase tracking-[0.25em]', day.isToday ? 'text-[#6EE7B7]' : 'text-zinc-500')}>
                    {day.label}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-600">{weeklyVolume.metricMode === 'load' ? Math.round(day.value) : day.value}</p>
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
                <div
                  role="progressbar"
                  aria-label={`Sueno ${day.name}`}
                  aria-valuemin={0}
                  aria-valuemax={maxSleepScore}
                  aria-valuenow={day.score ?? 0}
                  className="flex h-32 w-full items-end rounded-full bg-[#0b1320] p-1"
                >
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
                <div
                  role="progressbar"
                  aria-label={`Carga ${formatMuscleGroup(stat.muscleGroup)}`}
                  aria-valuemin={0}
                  aria-valuemax={maxMuscleLoad}
                  aria-valuenow={stat.totalLoad}
                  className="h-2 rounded-full bg-[#0b1320]"
                >
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

          <div className="mt-6 space-y-5">
            <div className="space-y-3">
              <div className="px-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">En progreso</p>
              </div>
              {pendingMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="rounded-[1.8rem] border border-white/6 bg-[#0b1320] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-white">{milestone.label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-400">{milestone.description}</p>
                    </div>
                    <span className="rounded-full bg-white/6 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                      Pendiente
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="px-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Completados</p>
              </div>
              {completedMilestoneEntries.map((milestone) => (
                <div
                  key={milestone.id}
                  className="rounded-[1.8rem] border border-[#6EE7B7]/16 bg-[#6EE7B7]/8 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-white">{milestone.label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-400">{milestone.description}</p>
                    </div>
                    <span className="rounded-full bg-[#6EE7B7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#08111C]">
                      Hecho
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
