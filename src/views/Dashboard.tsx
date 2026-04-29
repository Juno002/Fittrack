import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { ArrowRight, Clock3, Moon, ScanHeart, Settings2, Sparkles, Utensils } from 'lucide-react';

import type { AppTab } from '@/components/Layout';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { useStoreData } from '@/hooks/useStoreData';
import { formatMuscleGroup } from '@/lib/display';
import { buildWorkoutLog } from '@/lib/workout';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { selectDashboardCards, selectRecommendedExercises } from '@/store/selectors';

interface DashboardProps {
  onOpenWorkout: () => void;
  onOpenProfile: () => void;
  onNavigate: (tab: AppTab) => void;
}

interface QuickLogDraft {
  soreness: number;
  energy: number;
  stress: number;
  notes: string;
}

interface ScoreFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  positive?: boolean;
}

interface ActionCardProps {
  label: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}

function ScoreField({ label, value, onChange, positive = false }: ScoreFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">{label}</p>
        <span className="text-sm font-black text-white">{value}/5</span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }, (_, index) => {
          const score = index + 1;
          const isActive = value === score;
          const activeClass = positive ? 'bg-[#6EE7B7] text-[#08111C]' : 'bg-[#F9B06E] text-[#08111C]';

          return (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score)}
              className={cn(
                'h-11 rounded-[1.25rem] border text-sm font-black transition-all',
                isActive
                  ? `${activeClass} border-transparent shadow-[0_12px_28px_rgba(110,231,183,0.16)]`
                  : 'border-white/8 bg-[#111827] text-zinc-500 hover:border-white/15 hover:text-white',
              )}
            >
              {score}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActionCard({ label, value, hint, icon: Icon, onClick }: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-panel-soft rounded-[2rem] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/12"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">{label}</p>
          <p className="mt-3 text-2xl font-black text-white">{value}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-[1.35rem] bg-white/5 text-[#6EE7B7]">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{hint}</p>
    </button>
  );
}

function ReadinessRing({ readiness }: { readiness: number }) {
  const progress = Math.max(0, Math.min(100, readiness));
  const fillDegrees = Math.round((progress / 100) * 360);

  return (
    <div
      className="relative flex size-40 items-center justify-center rounded-full p-[10px] shadow-[0_24px_60px_rgba(0,0,0,0.3)]"
      style={{
        background: `conic-gradient(#6EE7B7 0deg ${fillDegrees}deg, rgba(255,255,255,0.08) ${fillDegrees}deg 360deg)`,
      }}
    >
      <div className="absolute inset-[18px] rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(8,17,28,0.98)_70%)]" />
      <div className="relative text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Readiness</p>
        <div className="mt-3 flex items-end justify-center gap-1">
          <span className="text-5xl font-black leading-none tracking-tighter text-white">{progress}</span>
          <span className="pb-1 text-base font-black text-zinc-500">%</span>
        </div>
        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#6EE7B7]">Ready to train</p>
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-metric-tile rounded-[1.7rem] px-4 py-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function getPlanToneStyles(tone: 'good' | 'warn' | 'danger') {
  if (tone === 'danger') {
    return 'border-[#F97373]/18 bg-[#F97373]/10 text-[#F9B06E]';
  }

  if (tone === 'warn') {
    return 'border-[#F9B06E]/18 bg-[#F9B06E]/10 text-[#F9B06E]';
  }

  return 'border-[#6EE7B7]/18 bg-[#6EE7B7]/10 text-[#6EE7B7]';
}

export function Dashboard({ onOpenWorkout, onOpenProfile, onNavigate }: DashboardProps) {
  const data = useStoreData();
  const cards = useMemo(() => selectDashboardCards(data), [data]);
  const { exercises } = useExerciseCatalog();
  const startDraftSession = useStore((state) => state.startDraftSession);
  const saveRecoveryCheckIn = useStore((state) => state.saveRecoveryCheckIn);

  const recommendedExercises = useMemo(
    () => selectRecommendedExercises(data, exercises),
    [data, exercises],
  );

  const [quickLog, setQuickLog] = useState<QuickLogDraft>({
    soreness: 2,
    energy: 4,
    stress: 2,
    notes: '',
  });

  useEffect(() => {
    const todayCheckIn = cards.todaySummary.recoveryCheckIn;
    setQuickLog({
      soreness: todayCheckIn?.soreness ?? 2,
      energy: todayCheckIn?.energy ?? 4,
      stress: todayCheckIn?.stress ?? 2,
      notes: todayCheckIn?.notes ?? '',
    });
  }, [cards.todaySummary.recoveryCheckIn]);

  const focusLabel = cards.readiness.recommendedMuscles.map((muscle) => formatMuscleGroup(muscle)).join(' + ');
  const sleepLabel = cards.todaySummary.sleepLog ? `${cards.todaySummary.sleepLog.durationHours}h` : '--';
  const caloriesLabel = cards.todaySummary.calories > 0 ? cards.todaySummary.calories.toString() : '--';
  const quickLogSummary = cards.todaySummary.recoveryCheckIn
    ? `Energía ${cards.todaySummary.recoveryCheckIn.energy}/5`
    : 'Pendiente';
  const sessionDurationLabel = cards.todaySummary.totalDurationSeconds > 0
    ? `${Math.round(cards.todaySummary.totalDurationSeconds / 60)} min`
    : `${cards.readiness.suggestedDurationMinutes} min`;

  const handleStartSession = () => {
    if (data.draftSession) {
      onOpenWorkout();
      return;
    }

    startDraftSession({
      name: cards.todayPlan.title,
      logs: recommendedExercises.slice(0, 2).map((exercise) => buildWorkoutLog(exercise)),
    });
    onOpenWorkout();
  };

  const handleSaveQuickLog = () => {
    saveRecoveryCheckIn({
      id: cards.todaySummary.recoveryCheckIn?.id ?? crypto.randomUUID(),
      dayKey: cards.todayKey,
      soreness: quickLog.soreness,
      energy: quickLog.energy,
      stress: quickLog.stress,
      notes: quickLog.notes.trim(),
    });
  };

  return (
    <div className="app-screen flex h-full flex-col overflow-hidden">
      <header className="px-6 pt-10 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#6EE7B7]">HomeFit Recovery</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Hoy</h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">
              Todo lo importante de recuperación, foco y plan del día en una sola vista.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="Abrir ajustes"
            className="flex size-12 items-center justify-center rounded-[1.5rem] border border-white/6 bg-[#111827]/88 text-zinc-300 transition-all hover:border-white/12 hover:text-white"
          >
            <Settings2 className="size-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-32">
        <section className="app-panel overflow-hidden rounded-[2.8rem] p-6">
          <div className="grid gap-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <ReadinessRing readiness={cards.readiness.readiness} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]', getPlanToneStyles(cards.todayPlan.tone))}>
                    {cards.todayPlan.tone === 'good' ? 'Listo para empujar' : cards.todayPlan.tone === 'warn' ? 'Controla el ritmo' : 'Recupera primero'}
                  </span>
                  <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-300">
                    {cards.trainingScheduleLabel}
                  </span>
                </div>

                <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white">
                  {cards.todayPlan.title}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                  {cards.readiness.coachBody}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <MetricPill label="Duración" value={sessionDurationLabel} />
                  <MetricPill label="Horario" value={cards.preferredTimeLabel} />
                  <MetricPill label="Foco" value={focusLabel || 'General'} />
                </div>
              </div>
            </div>

            <div className="app-metric-tile flex items-center justify-between rounded-[2rem] px-4 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Plan activo</p>
                <p className="mt-1 text-sm font-bold text-white">{cards.todayPlan.subtitle}</p>
              </div>
              <Sparkles className="size-5 text-[#6EE7B7]" />
            </div>

            <Button
              className="h-16 w-full rounded-[2rem] bg-[#6EE7B7] text-[11px] font-black uppercase tracking-[0.32em] text-[#08111C] shadow-[0_20px_40px_rgba(110,231,183,0.25)] hover:bg-[#62e6b0]"
              onClick={handleStartSession}
            >
              {data.draftSession ? 'Continuar sesión' : cards.todayPlan.ctaLabel}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <ActionCard
            label="Sueño"
            value={sleepLabel}
            hint="Actualiza tu descanso para afinar el score."
            icon={Moon}
            onClick={() => onNavigate('log')}
          />
          <ActionCard
            label="Comida"
            value={caloriesLabel}
            hint="Tus calorías y macros también recuperan."
            icon={Utensils}
            onClick={() => onNavigate('log')}
          />
          <div className="col-span-2">
            <ActionCard
              label="Quick log"
              value={quickLogSummary}
              hint="Registra cómo llegas hoy a la sesión."
              icon={ScanHeart}
              onClick={() => onNavigate('log')}
            />
          </div>
        </div>

        <section className="app-panel rounded-[2.5rem] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Plan de hoy</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{cards.todayPlan.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{cards.todayPlan.subtitle}</p>
            </div>
            <div className="app-metric-tile rounded-[1.6rem] px-4 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Sesiones</p>
              <p className="mt-2 text-2xl font-black text-white">{cards.todaySummary.sessions.length}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {cards.todayPlan.steps.map((step, index) => (
              <div key={step.id} className="app-panel-soft flex items-center justify-between rounded-[1.8rem] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-[1rem] bg-white/5 text-[10px] font-black uppercase tracking-[0.25em] text-[#6EE7B7]">
                    0{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{step.label}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                      Paso guiado
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
                  <Clock3 className="size-3.5" />
                  {step.minutes} min
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="app-panel rounded-[2.5rem] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Quick log</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Cómo te sientes hoy</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Este check-in refina el plan del día y deja contexto para el siguiente entrenamiento.
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-[1.35rem] bg-[#6EE7B7]/10 text-[#6EE7B7]">
              <ScanHeart className="size-5" />
            </div>
          </div>

          <div className="mt-5 grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-5">
                <ScoreField
                  label="Carga muscular"
                  value={quickLog.soreness}
                  onChange={(value) => setQuickLog((current) => ({ ...current, soreness: value }))}
                />
                <ScoreField
                  label="Energía"
                  value={quickLog.energy}
                  positive
                  onChange={(value) => setQuickLog((current) => ({ ...current, energy: value }))}
                />
                <ScoreField
                  label="Estrés"
                  value={quickLog.stress}
                  onChange={(value) => setQuickLog((current) => ({ ...current, stress: value }))}
                />
              </div>

              <div className="space-y-4">
                <div className="app-metric-tile rounded-[2rem] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Lectura rápida</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <MetricPill label="Carga" value={`${quickLog.soreness}/5`} />
                    <MetricPill label="Energía" value={`${quickLog.energy}/5`} />
                    <MetricPill label="Estrés" value={`${quickLog.stress}/5`} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Notas</p>
                  <Textarea
                    value={quickLog.notes}
                    onChange={(event) => setQuickLog((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Dormiste bien, vienes cargado, o prefieres una sesión suave..."
                    className="min-h-32 rounded-[1.7rem] border-white/8 bg-[#0b1320] px-4 py-3 text-sm text-white placeholder:text-zinc-600"
                  />
                </div>
              </div>
            </div>

            <Button
              className="h-14 w-full rounded-[1.75rem] bg-white text-[10px] font-black uppercase tracking-[0.3em] text-[#08111C] hover:bg-zinc-100"
              onClick={handleSaveQuickLog}
            >
              Guardar quick log
            </Button>
          </div>
        </section>

        <section className="app-panel rounded-[2.5rem] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Alternativas</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Movimientos recomendados</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('map')}
              className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6EE7B7]"
            >
              Ver mapa
            </button>
          </div>

          {recommendedExercises.length === 0 ? (
            <div className="mt-5 rounded-[1.8rem] border border-dashed border-white/8 bg-[#0b1320] px-4 py-8 text-center text-sm text-zinc-500">
              Registra entrenamientos para que podamos proponerte opciones más finas.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {recommendedExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => {
                    startDraftSession({
                      name: `Foco: ${exercise.name}`,
                      logs: [buildWorkoutLog(exercise)],
                    });
                    onOpenWorkout();
                  }}
                  className="app-panel-soft flex w-full items-center justify-between gap-4 rounded-[1.9rem] px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/12"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-[1.25rem] bg-white/5 text-[#6EE7B7]">
                      <ExerciseIcon name={exercise.iconName} className="size-6" />
                    </div>
                    <div>
                      <p className="font-black text-white">{exercise.name}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                        {formatMuscleGroup(exercise.muscleGroup)}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-zinc-500" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[2.5rem] border border-[#6EE7B7]/14 bg-[linear-gradient(180deg,rgba(110,231,183,0.14)_0%,rgba(10,18,29,0.82)_100%)] p-5 shadow-[0_24px_48px_rgba(0,0,0,0.18)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6EE7B7]">Foco del mapa</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{cards.mapFocus.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-200">{cards.mapFocus.body}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="app-metric-tile rounded-[1.7rem] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Mayor carga</p>
              <p className="mt-2 text-sm font-black text-white">{formatMuscleGroup(cards.mapFocus.highestFatigueMuscle)}</p>
            </div>
            <div className="app-metric-tile rounded-[1.7rem] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Fatiga</p>
              <p className="mt-2 text-2xl font-black text-[#F9B06E]">{Math.round(cards.mapFocus.highestFatigueValue)}%</p>
            </div>
          </div>
        </section>

        <div className="h-4" />
      </div>
    </div>
  );
}
