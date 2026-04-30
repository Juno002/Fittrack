import { useMemo, useState, type ComponentType } from 'react';
import { CalendarPlus2, Dumbbell, Moon, Pencil, Plus, ScanHeart, Settings2, Trash2, Utensils } from 'lucide-react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { HeaderActionButton } from '@/components/HeaderActionButton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FoodEntryDialog, RecoveryDialog, SleepLogDialog } from '@/features/log/EntryDialogs';
import { useStoreData } from '@/hooks/useStoreData';
import { formatClockLabel, formatDayHeading, formatDuration } from '@/lib/display';
import { cn } from '@/lib/utils';
import {
  useStore,
  type FoodEntry,
  type RecoveryCheckIn,
  type SleepLog,
  type WorkoutSession,
} from '@/store';
import { selectDaySummary, selectTimelineEntries, selectTodayDayKey } from '@/store/selectors';
import { getRecentDayKeys } from '@/lib/dates';

interface LogProps {
  onOpenWorkout: () => void;
  onOpenProfile: () => void;
}

function WorkoutTimelineCard({
  session,
  expanded,
  onToggle,
  onDelete,
}: {
  session: WorkoutSession;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-[2rem] border border-white/6 bg-[#0b1320] p-4">
      <div className="flex items-start justify-between gap-4">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onToggle}>
          <p className="text-sm font-black text-white">{session.name}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
            {formatClockLabel(session.performedAt)} · {formatDuration(session.durationSeconds)} · Esfuerzo {session.effort}/5
          </p>
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-[1.3rem] text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {session.logs.map((log) => (
          <span key={log.id} className="rounded-full border border-white/6 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
            {log.exerciseName}
          </span>
        ))}
      </div>

      {expanded ? (
        <div className="mt-4 space-y-3 border-t border-white/6 pt-4">
          {session.logs.map((log) => (
            <div key={log.id} className="rounded-[1.6rem] border border-white/6 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black text-white">{log.exerciseName}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">{log.muscleGroup}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                  {log.sets.length} series
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function DaySummaryTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="app-metric-tile rounded-[1.9rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">{label}</p>
          <p className="mt-3 text-3xl font-black leading-none text-white">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-[1rem] bg-white/5 text-[#6EE7B7]">
          <Icon className="size-[18px]" />
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-zinc-500">{detail}</p>
    </div>
  );
}

function QuickActionCard({
  label,
  hint,
  icon: Icon,
  onClick,
  accentClass = 'text-[#6EE7B7]',
}: {
  label: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  accentClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-panel-soft rounded-[1.9rem] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/12"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">{label}</p>
          <p className="mt-3 text-sm font-black leading-relaxed text-white">{hint}</p>
        </div>
        <div className={cn('flex size-10 items-center justify-center rounded-[1rem] bg-white/5', accentClass)}>
          <Icon className="size-[18px]" />
        </div>
      </div>
    </button>
  );
}

export function Log({ onOpenWorkout, onOpenProfile }: LogProps) {
  const storeData = useStoreData();
  const draftSession = useStore((state) => state.draftSession);
  const startDraftSession = useStore((state) => state.startDraftSession);
  const deleteSession = useStore((state) => state.deleteSession);
  const saveFoodEntry = useStore((state) => state.saveFoodEntry);
  const deleteFoodEntry = useStore((state) => state.deleteFoodEntry);
  const saveSleepLog = useStore((state) => state.saveSleepLog);
  const deleteSleepLog = useStore((state) => state.deleteSleepLog);
  const saveRecoveryCheckIn = useStore((state) => state.saveRecoveryCheckIn);
  const deleteRecoveryCheckIn = useStore((state) => state.deleteRecoveryCheckIn);

  const dayKeysWithData = useMemo(
    () => new Set([
      ...storeData.sessions.map((session) => session.dayKey),
      ...storeData.foods.map((food) => food.dayKey),
      ...storeData.sleepLogs.map((sleepLog) => sleepLog.dayKey),
      ...storeData.recoveryCheckins.map((checkIn) => checkIn.dayKey),
    ]),
    [storeData.sessions, storeData.foods, storeData.sleepLogs, storeData.recoveryCheckins],
  );

  const [selectedDayKey, setSelectedDayKey] = useState(selectTodayDayKey());
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [foodDialogEntry, setFoodDialogEntry] = useState<FoodEntry | null>(null);
  const [sleepDialogEntry, setSleepDialogEntry] = useState<SleepLog | null>(null);
  const [recoveryDialogEntry, setRecoveryDialogEntry] = useState<RecoveryCheckIn | null>(null);
  const [isFoodDialogOpen, setIsFoodDialogOpen] = useState(false);
  const [isSleepDialogOpen, setIsSleepDialogOpen] = useState(false);
  const [isRecoveryDialogOpen, setIsRecoveryDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const daySummary = useMemo(() => selectDaySummary(storeData, selectedDayKey), [storeData, selectedDayKey]);
  const timelineEntries = useMemo(() => selectTimelineEntries(storeData, selectedDayKey), [storeData, selectedDayKey]);
  const recentDayKeys = useMemo(() => getRecentDayKeys(30), []);
  const todayDayKey = useMemo(() => selectTodayDayKey(), []);

  const handleStartWorkoutLog = () => {
    if (draftSession) {
      onOpenWorkout();
      return;
    }

    startDraftSession({ name: 'Entrenamiento' });
    onOpenWorkout();
  };

  const handleOpenFoodDialog = () => {
    setFoodDialogEntry(null);
    setIsFoodDialogOpen(true);
  };

  const handleOpenSleepDialog = () => {
    setSleepDialogEntry(null);
    setIsSleepDialogOpen(true);
  };

  const handleOpenRecoveryDialog = () => {
    setRecoveryDialogEntry(daySummary.recoveryCheckIn);
    setIsRecoveryDialogOpen(true);
  };

  const openDeleteDialog = (
    title: string,
    description: string,
    confirmLabel: string,
    onConfirm: () => void,
  ) => {
    setPendingDelete({
      title,
      description,
      confirmLabel,
      onConfirm,
    });
  };

  return (
    <div className="app-screen flex h-full flex-col overflow-hidden">
      <header className="px-6 pt-10 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#6EE7B7]">Registro diario</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Log</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {selectedDayKey === todayDayKey ? 'Todo lo que hiciste hoy, con accesos rapidos para seguir sumando senales.' : formatDayHeading(selectedDayKey)}
            </p>
          </div>

          <HeaderActionButton onClick={onOpenProfile} ariaLabel="Abrir ajustes">
            <Settings2 className="size-5" />
          </HeaderActionButton>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto px-4 pb-4 no-scrollbar">
        {recentDayKeys.map((dayKey) => {
          const isSelected = dayKey === selectedDayKey;
          const hasData = dayKeysWithData.has(dayKey);

          return (
            <button
              key={dayKey}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedDayKey(dayKey)}
              className={cn(
                'flex min-w-[72px] shrink-0 flex-col items-center rounded-[1.7rem] border px-3 py-4 transition-all',
                isSelected
                  ? 'border-transparent bg-[#6EE7B7] text-[#08111C]'
                  : 'border-white/8 bg-[#101827] text-zinc-500 hover:text-white',
              )}
            >
              <span className="text-[9px] font-bold uppercase tracking-[0.25em]">
                {dayKey === todayDayKey ? 'HOY' : dayKey.slice(8)}
              </span>
              <span className="mt-2 text-xs font-black">
                {formatDayHeading(dayKey).slice(0, 3)}
              </span>
              <span className={cn('mt-2 text-[8px] font-black', hasData ? 'opacity-100' : 'opacity-0')}>•</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-32">
        <section className="app-panel rounded-[2.6rem] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Resumen del día</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{formatDayHeading(selectedDayKey)}</h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">
                {daySummary.sessions.length > 0 || daySummary.foods.length > 0 || daySummary.sleepLog || daySummary.recoveryCheckIn
                  ? 'Entrenamiento, descanso y nutrición reunidos para ver tu contexto completo.'
                  : 'Todavía no registras nada en este día. Empieza con un quick log, sueño o tu próxima sesión.'}
              </p>
            </div>
            <Button
              variant="outline"
              className="h-11 rounded-[1.4rem] border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-white/10"
              onClick={() => setIsAddMenuOpen(true)}
            >
              <Plus className="mr-1 size-4" />
              Nuevo
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <DaySummaryTile
              label="Sesiones"
              value={String(daySummary.sessions.length)}
              detail={daySummary.totalDurationSeconds > 0 ? `${formatDuration(daySummary.totalDurationSeconds)} acumulados` : 'Sin entrenamiento aún'}
              icon={Dumbbell}
            />
            <DaySummaryTile
              label="Calorías"
              value={daySummary.calories > 0 ? String(daySummary.calories) : '--'}
              detail={daySummary.protein > 0 ? `${daySummary.protein} g de proteína` : 'Nutrición pendiente'}
              icon={Utensils}
            />
            <DaySummaryTile
              label="Sueño"
              value={daySummary.sleepLog ? `${daySummary.sleepLog.durationHours}h` : '--'}
              detail={daySummary.sleepLog ? `Calidad ${daySummary.sleepLog.qualityScore}/100` : 'Todavía no registras sueño'}
              icon={Moon}
            />
            <DaySummaryTile
              label="Quick log"
              value={daySummary.recoveryCheckIn ? `${daySummary.recoveryCheckIn.energy}/5` : '--'}
              detail={daySummary.recoveryCheckIn ? 'Energía actual' : 'Cómo te sentiste hoy'}
              icon={ScanHeart}
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4 px-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Alta rápida</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Añadir sin fricción</h2>
            </div>
            <span className="rounded-full border border-[#6EE7B7]/18 bg-[#6EE7B7]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#6EE7B7]">
              4 accesos
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <QuickActionCard
              label="Entrenamiento"
              hint={draftSession ? 'Tienes una sesión en curso. Reanúdala aquí.' : 'Empieza una sesión guiada o continúa editando tu rutina.'}
              icon={Dumbbell}
              onClick={handleStartWorkoutLog}
            />
            <QuickActionCard
              label="Quick log"
              hint="Guarda energía, estrés y carga muscular para afinar el plan."
              icon={ScanHeart}
              onClick={handleOpenRecoveryDialog}
              accentClass="text-[#F9B06E]"
            />
            <QuickActionCard
              label="Sueño"
              hint="Registra cuántas horas dormiste y la calidad percibida."
              icon={Moon}
              onClick={handleOpenSleepDialog}
              accentClass="text-[#7AB9FF]"
            />
            <QuickActionCard
              label="Comida"
              hint="Añade calorías y macros del día sin cambiar de pantalla."
              icon={Utensils}
              onClick={handleOpenFoodDialog}
              accentClass="text-[#6EE7B7]"
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4 px-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Timeline</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Lo que pasó hoy</h2>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
              {timelineEntries.length} registro{timelineEntries.length === 1 ? '' : 's'}
            </span>
          </div>

        {timelineEntries.length === 0 ? (
            <div className="flex h-[40vh] flex-col items-center justify-center rounded-[2.3rem] border border-dashed border-white/8 bg-[#101827] px-8 text-center">
            <CalendarPlus2 className="size-10 text-zinc-700" />
            <h2 className="mt-4 text-2xl font-black tracking-tight text-white">Aún no hay registros</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Usa el botón inferior para guardar un entrenamiento, comida, sueño o quick log.
            </p>
            <Button
              className="mt-6 rounded-[1.5rem] bg-white text-[#08111C] hover:bg-zinc-100"
              onClick={() => setIsAddMenuOpen(true)}
            >
              <Plus className="mr-2 size-4" />
              Agregar registro
            </Button>
            </div>
        ) : (
            <div className="space-y-3">
              {timelineEntries.map((entry) => {
                if (entry.type === 'session') {
                  return (
                    <div key={entry.id}>
                      <WorkoutTimelineCard
                        session={entry.session}
                        expanded={expandedSessions[entry.session.id] ?? false}
                        onToggle={() => setExpandedSessions((current) => ({ ...current, [entry.session.id]: !current[entry.session.id] }))}
                        onDelete={() => openDeleteDialog(
                          'Eliminar sesion',
                          `Se eliminara "${entry.session.name}" del historial y no podras recuperarla.`,
                          'Eliminar sesion',
                          () => deleteSession(entry.session.id),
                        )}
                      />
                    </div>
                  );
                }

                if (entry.type === 'food') {
                  return (
                    <article key={entry.id} className="app-panel-soft rounded-[2rem] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex size-11 items-center justify-center rounded-[1.35rem] bg-white/5 text-[#6EE7B7]">
                            <Utensils className="size-5" />
                          </div>
                          <div>
                            <p className="font-black text-white">{entry.food.name}</p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                              {formatClockLabel(entry.food.consumedAt)} · {entry.food.calories} kcal
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-[1.2rem] text-zinc-500 hover:bg-white/5 hover:text-white"
                            onClick={() => {
                              setFoodDialogEntry(entry.food);
                              setIsFoodDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-[1.2rem] text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                            onClick={() => openDeleteDialog(
                              'Eliminar comida',
                              `Se eliminara "${entry.food.name}" del registro del dia.`,
                              'Eliminar comida',
                              () => deleteFoodEntry(entry.food.id),
                            )}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                }

                if (entry.type === 'sleep') {
                  return (
                    <article key={entry.id} className="app-panel-soft rounded-[2rem] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex size-11 items-center justify-center rounded-[1.35rem] bg-white/5 text-[#7AB9FF]">
                            <Moon className="size-5" />
                          </div>
                          <div>
                            <p className="font-black text-white">Sueño</p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                              {entry.sleepLog.durationHours}h · calidad {entry.sleepLog.qualityScore}/100
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-[1.2rem] text-zinc-500 hover:bg-white/5 hover:text-white"
                            onClick={() => {
                              setSleepDialogEntry(entry.sleepLog);
                              setIsSleepDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-[1.2rem] text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                            onClick={() => openDeleteDialog(
                              'Eliminar sueno',
                              'Se eliminara este registro de sueno del dia seleccionado.',
                              'Eliminar sueno',
                              () => deleteSleepLog(entry.sleepLog.id),
                            )}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                }

                return (
                  <article key={entry.id} className="app-panel-soft rounded-[2rem] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-11 items-center justify-center rounded-[1.35rem] bg-white/5 text-[#F9B06E]">
                          <ScanHeart className="size-5" />
                        </div>
                        <div>
                          <p className="font-black text-white">Quick log</p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                            Carga muscular {entry.recoveryCheckIn.soreness}/5 · Energía {entry.recoveryCheckIn.energy}/5 · Estrés {entry.recoveryCheckIn.stress}/5
                          </p>
                          {entry.recoveryCheckIn.notes ? (
                            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{entry.recoveryCheckIn.notes}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-[1.2rem] text-zinc-500 hover:bg-white/5 hover:text-white"
                          onClick={() => {
                            setRecoveryDialogEntry(entry.recoveryCheckIn);
                            setIsRecoveryDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-[1.2rem] text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => openDeleteDialog(
                            'Eliminar quick log',
                            'Se eliminara este quick log y su contexto de recuperacion del dia.',
                            'Eliminar quick log',
                            () => deleteRecoveryCheckIn(entry.recoveryCheckIn.id),
                          )}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
        )}
        </section>
      </div>

      <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-md justify-end px-4 pb-8">
        <Button
          className="size-14 rounded-full bg-[#6EE7B7] p-0 text-[#08111C] shadow-[0_18px_40px_rgba(110,231,183,0.18)] hover:bg-[#62e6b0]"
          onClick={() => setIsAddMenuOpen(true)}
        >
          <Plus className="size-6" />
        </Button>
      </div>

      <Dialog open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
        <DialogContent className="max-w-sm rounded-[2.5rem] border-white/6 bg-[#101827] p-6 text-white">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Alta rápida</p>
            <h2 className="text-2xl font-black tracking-tight text-white">Añadir registro</h2>

            <Button
              className="h-14 rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#08111C] hover:bg-[#62e6b0]"
              onClick={() => {
                setIsAddMenuOpen(false);
                handleStartWorkoutLog();
              }}
            >
              Entrenamiento
            </Button>
            <Button
              variant="ghost"
              className="h-14 rounded-[1.75rem] bg-white/6 text-[10px] font-black uppercase tracking-[0.25em] text-white hover:bg-white/10"
              onClick={() => {
                setIsAddMenuOpen(false);
                handleOpenFoodDialog();
              }}
            >
              Comida
            </Button>
            <Button
              variant="ghost"
              className="h-14 rounded-[1.75rem] bg-white/6 text-[10px] font-black uppercase tracking-[0.25em] text-white hover:bg-white/10"
              onClick={() => {
                setIsAddMenuOpen(false);
                handleOpenSleepDialog();
              }}
            >
              Sueño
            </Button>
            <Button
              variant="ghost"
              className="h-14 rounded-[1.75rem] bg-white/6 text-[10px] font-black uppercase tracking-[0.25em] text-white hover:bg-white/10"
              onClick={() => {
                setIsAddMenuOpen(false);
                handleOpenRecoveryDialog();
              }}
            >
              Quick log
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <FoodEntryDialog
        open={isFoodDialogOpen}
        dayKey={selectedDayKey}
        entry={foodDialogEntry}
        onOpenChange={setIsFoodDialogOpen}
        onSave={saveFoodEntry}
      />
      <SleepLogDialog
        open={isSleepDialogOpen}
        dayKey={selectedDayKey}
        entry={sleepDialogEntry}
        onOpenChange={setIsSleepDialogOpen}
        onSave={saveSleepLog}
      />
      <RecoveryDialog
        open={isRecoveryDialogOpen}
        dayKey={selectedDayKey}
        entry={recoveryDialogEntry}
        onOpenChange={setIsRecoveryDialogOpen}
        onSave={saveRecoveryCheckIn}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        title={pendingDelete?.title ?? 'Confirmar eliminacion'}
        description={pendingDelete?.description ?? 'Esta accion no se puede deshacer.'}
        confirmLabel={pendingDelete?.confirmLabel ?? 'Eliminar'}
        tone="danger"
        onConfirm={() => {
          pendingDelete?.onConfirm();
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
