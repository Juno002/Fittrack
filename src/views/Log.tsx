import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus2, Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStoreData } from '@/hooks/useStoreData';
import { formatClockLabel, formatDayHeading, formatDuration } from '@/lib/display';
import { createId } from '@/lib/workout';
import { cn } from '@/lib/utils';
import { useStore, type FoodEntry, type SleepLog, type WorkoutSession } from '@/store';
import { selectDaySummary, selectTimelineEntries, selectTodayDayKey } from '@/store/selectors';
import { getRecentDayKeys } from '@/lib/dates';

interface LogProps {
  onOpenWorkout: () => void;
}

interface FoodEntryDialogProps {
  open: boolean;
  dayKey: string;
  entry: FoodEntry | null;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: FoodEntry) => void;
}

function FoodEntryDialog({
  open,
  dayKey,
  entry,
  onOpenChange,
  onSave,
}: FoodEntryDialogProps) {
  const [draft, setDraft] = useState<FoodEntry>({
    id: createId('food'),
    dayKey,
    consumedAt: new Date().toISOString(),
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  useEffect(() => {
    if (open) {
      setDraft(entry ?? {
        id: createId('food'),
        dayKey,
        consumedAt: new Date().toISOString(),
        name: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });
    }
  }, [dayKey, entry, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[2.5rem] border-white/5 bg-[#121721] p-8 text-white">
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Nutrition</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              {entry ? 'Edit meal entry' : 'Add meal entry'}
            </h2>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Meal name</Label>
            <Input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className="h-14 rounded-2xl border-none bg-[#1A202C] text-lg font-black text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Calories</Label>
              <Input
                type="number"
                value={draft.calories}
                onChange={(event) => setDraft((current) => ({ ...current, calories: Number(event.target.value) }))}
                className="h-14 rounded-2xl border-none bg-[#1A202C] text-lg font-black text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Protein</Label>
              <Input
                type="number"
                value={draft.protein}
                onChange={(event) => setDraft((current) => ({ ...current, protein: Number(event.target.value) }))}
                className="h-14 rounded-2xl border-none bg-[#1A202C] text-lg font-black text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Carbs</Label>
              <Input
                type="number"
                value={draft.carbs}
                onChange={(event) => setDraft((current) => ({ ...current, carbs: Number(event.target.value) }))}
                className="h-14 rounded-2xl border-none bg-[#1A202C] text-lg font-black text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Fat</Label>
              <Input
                type="number"
                value={draft.fat}
                onChange={(event) => setDraft((current) => ({ ...current, fat: Number(event.target.value) }))}
                className="h-14 rounded-2xl border-none bg-[#1A202C] text-lg font-black text-white"
              />
            </div>
          </div>

          <Button
            className="h-14 w-full rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] hover:bg-[#5FE7B0]"
            disabled={!draft.name.trim()}
            onClick={() => {
              onSave({
                ...draft,
                dayKey,
              });
              onOpenChange(false);
            }}
          >
            Save meal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SleepLogDialogProps {
  open: boolean;
  dayKey: string;
  entry: SleepLog | null;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: SleepLog) => void;
}

function SleepLogDialog({
  open,
  dayKey,
  entry,
  onOpenChange,
  onSave,
}: SleepLogDialogProps) {
  const [draft, setDraft] = useState<SleepLog>({
    id: createId('sleep'),
    dayKey,
    loggedAt: new Date().toISOString(),
    durationHours: 8,
    qualityScore: 80,
  });

  useEffect(() => {
    if (open) {
      setDraft(entry ?? {
        id: createId('sleep'),
        dayKey,
        loggedAt: new Date().toISOString(),
        durationHours: 8,
        qualityScore: 80,
      });
    }
  }, [dayKey, entry, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[2.5rem] border-white/5 bg-[#121721] p-8 text-white">
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Recovery</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              {entry ? 'Edit sleep log' : 'Add sleep log'}
            </h2>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Duration (hours)</Label>
            <Input
              type="number"
              min={0}
              step="0.5"
              value={draft.durationHours}
              onChange={(event) => setDraft((current) => ({ ...current, durationHours: Number(event.target.value) }))}
              className="h-14 rounded-2xl border-none bg-[#1A202C] text-lg font-black text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Quality score</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={draft.qualityScore}
              onChange={(event) => setDraft((current) => ({ ...current, qualityScore: Number(event.target.value) }))}
              className="h-14 rounded-2xl border-none bg-[#1A202C] text-lg font-black text-white"
            />
          </div>

          <Button
            className="h-14 w-full rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] hover:bg-[#5FE7B0]"
            onClick={() => {
              onSave({
                ...draft,
                dayKey,
              });
              onOpenChange(false);
            }}
          >
            Save sleep log
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WorkoutTimelineCard({
  session,
  expanded,
  onToggle,
  onDelete,
}: {
  key?: string;
  session: WorkoutSession;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-[2.5rem] border border-white/5 bg-[#121721] p-5">
      <div className="flex items-start justify-between gap-4">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onToggle}>
          <p className="text-sm font-black text-white">{session.name}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
            {formatClockLabel(session.performedAt)} • {formatDuration(session.durationSeconds)} • Effort {session.effort}/5
          </p>
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-2xl text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {session.logs.map((log) => (
          <span key={log.id} className="rounded-2xl bg-black/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
            {log.exerciseName}
          </span>
        ))}
      </div>

      {expanded ? (
        <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
          {session.logs.map((log) => (
            <div key={log.id} className="rounded-[1.75rem] border border-white/5 bg-black/10 p-4">
              <p className="font-black text-white">{log.exerciseName}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">{log.muscleGroup}</p>
              <div className="mt-3 space-y-2">
                {log.sets.map((set, index) => (
                  <div key={`${log.id}-${index}`} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-3 text-sm text-zinc-300">
                    <span>Set {index + 1}</span>
                    <span>
                      {log.isBodyweight ? '' : `${set.weight}kg • `}{set.reps} reps
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function Log({ onOpenWorkout }: LogProps) {
  const storeData = useStoreData();
  const draftSession = useStore((state) => state.draftSession);
  const startDraftSession = useStore((state) => state.startDraftSession);
  const deleteSession = useStore((state) => state.deleteSession);
  const saveFoodEntry = useStore((state) => state.saveFoodEntry);
  const deleteFoodEntry = useStore((state) => state.deleteFoodEntry);
  const saveSleepLog = useStore((state) => state.saveSleepLog);
  const deleteSleepLog = useStore((state) => state.deleteSleepLog);
  const dayKeysWithData = useMemo(() => new Set([
    ...storeData.sessions.map((session) => session.dayKey),
    ...storeData.foods.map((food) => food.dayKey),
    ...storeData.sleepLogs.map((sleepLog) => sleepLog.dayKey),
  ]), [storeData.sessions, storeData.foods, storeData.sleepLogs]);
  const [selectedDayKey, setSelectedDayKey] = useState(selectTodayDayKey());
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [foodDialogEntry, setFoodDialogEntry] = useState<FoodEntry | null>(null);
  const [sleepDialogEntry, setSleepDialogEntry] = useState<SleepLog | null>(null);
  const [isFoodDialogOpen, setIsFoodDialogOpen] = useState(false);
  const [isSleepDialogOpen, setIsSleepDialogOpen] = useState(false);
  const daySummary = useMemo(() => selectDaySummary(storeData, selectedDayKey), [storeData, selectedDayKey]);
  const timelineEntries = useMemo(() => selectTimelineEntries(storeData, selectedDayKey), [storeData, selectedDayKey]);
  const recentDayKeys = useMemo(() => getRecentDayKeys(7), []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080B11]">
      <header className="px-6 pt-10 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Timeline</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Real daily log</h1>
        <p className="mt-2 text-sm text-zinc-400">{formatDayHeading(selectedDayKey)}</p>
      </header>

      <div className="flex gap-2 overflow-x-auto px-6 pb-4 no-scrollbar">
        {recentDayKeys.map((dayKey) => {
          const isSelected = dayKey === selectedDayKey;
          const hasData = dayKeysWithData.has(dayKey);

          return (
            <button
              key={dayKey}
              type="button"
              className={cn(
                'flex min-w-[68px] shrink-0 flex-col items-center rounded-[2rem] border px-3 py-4 transition-all',
                isSelected
                  ? 'border-[#6EE7B7] bg-[#6EE7B7] text-[#080B11]'
                  : 'border-transparent bg-white/5 text-zinc-500 hover:border-white/10',
              )}
              onClick={() => setSelectedDayKey(dayKey)}
            >
              <span className="text-[9px] font-bold uppercase tracking-[0.25em]">
                {dayKey === selectTodayDayKey() ? 'TODAY' : dayKey.slice(8)}
              </span>
              <span className="mt-2 text-xs font-black tracking-[0.2em]">
                {formatDayHeading(dayKey).slice(0, 3)}
              </span>
              <span className={cn('mt-2 text-[8px] font-black', hasData ? 'opacity-100' : 'opacity-0')}>•</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 pb-4">
        <div className="rounded-[2rem] border border-white/5 bg-[#121721] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Sessions</p>
          <p className="mt-2 text-2xl font-black text-white">{daySummary.sessions.length}</p>
        </div>
        <div className="rounded-[2rem] border border-white/5 bg-[#121721] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Calories</p>
          <p className="mt-2 text-2xl font-black text-white">{daySummary.calories}</p>
        </div>
        <div className="rounded-[2rem] border border-white/5 bg-[#121721] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Sleep</p>
          <p className="mt-2 text-2xl font-black text-white">
            {daySummary.sleepLog ? `${daySummary.sleepLog.durationHours}h` : '--'}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-32">
        {timelineEntries.length === 0 ? (
          <div className="flex h-[40vh] flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-white/5 bg-[#121721] px-8 text-center">
            <CalendarPlus2 className="size-10 text-zinc-700" />
            <h2 className="mt-4 text-2xl font-black tracking-tight text-white">Aún no hay registros</h2>
            <p className="mt-3 text-sm text-zinc-400">
              Usa el botón inferior para registrar tu primer entrenamiento, comida o descanso.
            </p>
            <Button 
              className="mt-6 rounded-[1.5rem] px-6 py-6 bg-white/5 text-white hover:bg-white/10"
              onClick={() => setIsAddMenuOpen(true)}
            >
              <Plus className="mr-2 size-5 text-[#6EE7B7]" />
              Agregar Registro
            </Button>
          </div>
        ) : (
          timelineEntries.map((entry) => {
            if (entry.type === 'session') {
              return (
                <WorkoutTimelineCard
                  key={entry.id}
                  session={entry.session}
                  expanded={expandedSessions[entry.session.id] ?? false}
                  onToggle={() => setExpandedSessions((current) => ({ ...current, [entry.session.id]: !current[entry.session.id] }))}
                  onDelete={() => deleteSession(entry.session.id)}
                />
              );
            }

            if (entry.type === 'food') {
              return (
                <article key={entry.id} className="rounded-[2.5rem] border border-white/5 bg-[#121721] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-white">{entry.food.name}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                        {formatClockLabel(entry.food.consumedAt)} • {entry.food.calories} kcal
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-2xl text-zinc-500 hover:bg-white/5 hover:text-white"
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
                        className="rounded-2xl text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                        onClick={() => deleteFoodEntry(entry.food.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {[
                      `${entry.food.protein}P`,
                      `${entry.food.carbs}C`,
                      `${entry.food.fat}F`,
                    ].map((label) => (
                      <span key={label} className="rounded-2xl bg-black/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                        {label}
                      </span>
                    ))}
                  </div>
                </article>
              );
            }

            return (
              <article key={entry.id} className="rounded-[2.5rem] border border-white/5 bg-[#121721] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-white">Sleep block</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                      {entry.sleepLog.durationHours}h • quality {entry.sleepLog.qualityScore}/100
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-2xl text-zinc-500 hover:bg-white/5 hover:text-white"
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
                      className="rounded-2xl text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => deleteSleepLog(entry.sleepLog.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-md justify-end px-6 pb-8">
        <Button
          className="size-14 rounded-full bg-[#6EE7B7] p-0 text-[#080B11] shadow-2xl hover:bg-[#5FE7B0]"
          onClick={() => setIsAddMenuOpen(true)}
        >
          <Plus className="size-6" />
        </Button>
      </div>

      <Dialog open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
        <DialogContent className="max-w-sm rounded-[2.75rem] border-white/5 bg-[#121721] p-8 text-white">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Add real data</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Choose the entry type</h2>
            </div>

            <div className="grid gap-3">
              <Button
                className="h-14 rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] hover:bg-[#5FE7B0]"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  if (draftSession) {
                    onOpenWorkout();
                    return;
                  }
                  startDraftSession({ name: 'Training Session' });
                  onOpenWorkout();
                }}
              >
                Workout
              </Button>
              <Button
                variant="ghost"
                className="h-14 rounded-[1.75rem] bg-white/5 text-[10px] font-bold uppercase tracking-[0.25em] text-white hover:bg-white/10"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  setFoodDialogEntry(null);
                  setIsFoodDialogOpen(true);
                }}
              >
                Meal
              </Button>
              <Button
                variant="ghost"
                className="h-14 rounded-[1.75rem] bg-white/5 text-[10px] font-bold uppercase tracking-[0.25em] text-white hover:bg-white/10"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  setSleepDialogEntry(null);
                  setIsSleepDialogOpen(true);
                }}
              >
                Sleep
              </Button>
            </div>
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
    </div>
  );
}
