import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createId } from '@/lib/workout';
import { cn } from '@/lib/utils';
import type { FoodEntry, RecoveryCheckIn, SleepLog } from '@/store';

interface FoodEntryDialogProps {
  open: boolean;
  dayKey: string;
  entry: FoodEntry | null;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: FoodEntry) => void;
}

interface SleepLogDialogProps {
  open: boolean;
  dayKey: string;
  entry: SleepLog | null;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: SleepLog) => void;
}

interface RecoveryDialogProps {
  open: boolean;
  dayKey: string;
  entry: RecoveryCheckIn | null;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: RecoveryCheckIn) => void;
}

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}

interface ScoreFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  positive?: boolean;
}

function SliderField({ label, value, min, max, step, suffix = '', onChange }: SliderFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">{label}</Label>
        <span className="text-sm font-black text-white">
          {value}
          {suffix}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#6EE7B7]"
      />

      <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
        <span>
          {min}
          {suffix}
        </span>
        <span>
          {max}
          {suffix}
        </span>
      </div>
    </div>
  );
}

function ScoreField({ label, value, onChange, positive = false }: ScoreFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">{label}</Label>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }, (_, index) => {
          const score = index + 1;
          const isActive = value === score;
          return (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score)}
              aria-label={`${label}: ${score} de 5`}
              className={cn(
                'h-11 rounded-[1.2rem] border text-sm font-black transition-all',
                isActive
                  ? positive
                    ? 'border-transparent bg-[#6EE7B7] text-[#08111C]'
                    : 'border-transparent bg-[#F9B06E] text-[#08111C]'
                  : 'border-white/8 bg-[#0b1320] text-zinc-500 hover:text-white',
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

export function FoodEntryDialog({ open, dayKey, entry, onOpenChange, onSave }: FoodEntryDialogProps) {
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
      <DialogContent className="max-w-md rounded-[2.5rem] border-white/6 bg-[#101827] p-6 text-white">
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Nutricion</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              {entry ? 'Editar comida' : 'Registrar comida'}
            </h2>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Nombre</Label>
            <Input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className="h-14 rounded-[1.5rem] border-none bg-[#0b1320] px-4 text-lg font-black text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {([
              ['calories', 'Calorias'],
              ['protein', 'Proteina'],
              ['carbs', 'Carbs'],
              ['fat', 'Grasas'],
            ] as Array<[keyof Pick<FoodEntry, 'calories' | 'protein' | 'carbs' | 'fat'>, string]>).map(([field, label]) => (
              <div key={field} className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">{label}</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={draft[field]}
                  onChange={(event) => setDraft((current) => ({ ...current, [field]: Number(event.target.value) }))}
                  className="h-14 rounded-[1.5rem] border-none bg-[#0b1320] px-4 text-lg font-black text-white"
                />
              </div>
            ))}
          </div>

          <Button
            className="h-14 w-full rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#08111C] hover:bg-[#62e6b0]"
            disabled={!draft.name.trim()}
            onClick={() => {
              onSave({ ...draft, dayKey });
              onOpenChange(false);
            }}
          >
            Guardar comida
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SleepLogDialog({ open, dayKey, entry, onOpenChange, onSave }: SleepLogDialogProps) {
  const [draft, setDraft] = useState<SleepLog>({
    id: createId('sleep'),
    dayKey,
    loggedAt: new Date().toISOString(),
    durationHours: 8,
    qualityScore: 80,
  });

  const durationLabel = useMemo(
    () => `${Number(draft.durationHours).toFixed(draft.durationHours % 1 === 0 ? 0 : 1)}h`,
    [draft.durationHours],
  );

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
      <DialogContent className="max-w-md rounded-[2.5rem] border-white/6 bg-[#101827] p-6 text-white">
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Descanso</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              {entry ? 'Editar sueno' : 'Registrar sueno'}
            </h2>
          </div>

          <SliderField
            label="Duracion"
            value={draft.durationHours}
            min={0}
            max={14}
            step={0.5}
            suffix="h"
            onChange={(value) => setDraft((current) => ({ ...current, durationHours: value }))}
          />

          <div className="rounded-[1.7rem] border border-white/8 bg-[#0b1320] px-4 py-3 text-sm text-zinc-300">
            Sueño actual: <span className="font-black text-white">{durationLabel}</span>
          </div>

          <SliderField
            label="Calidad"
            value={draft.qualityScore}
            min={0}
            max={100}
            step={5}
            onChange={(value) => setDraft((current) => ({ ...current, qualityScore: value }))}
          />

          <Button
            className="h-14 w-full rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#08111C] hover:bg-[#62e6b0]"
            onClick={() => {
              onSave({ ...draft, dayKey });
              onOpenChange(false);
            }}
          >
            Guardar sueno
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RecoveryDialog({ open, dayKey, entry, onOpenChange, onSave }: RecoveryDialogProps) {
  const [draft, setDraft] = useState<RecoveryCheckIn>({
    id: createId('recovery'),
    dayKey,
    loggedAt: new Date().toISOString(),
    soreness: 2,
    energy: 4,
    stress: 2,
    notes: '',
  });

  useEffect(() => {
    if (open) {
      setDraft(entry ?? {
        id: createId('recovery'),
        dayKey,
        loggedAt: new Date().toISOString(),
        soreness: 2,
        energy: 4,
        stress: 2,
        notes: '',
      });
    }
  }, [dayKey, entry, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[2.5rem] border-white/6 bg-[#101827] p-6 text-white">
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Log de recuperacion</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              {entry ? 'Editar quick log' : 'Nuevo quick log'}
            </h2>
          </div>

          <ScoreField
            label="Carga muscular"
            value={draft.soreness}
            onChange={(value) => setDraft((current) => ({ ...current, soreness: value }))}
          />
          <ScoreField
            label="Energia"
            value={draft.energy}
            positive
            onChange={(value) => setDraft((current) => ({ ...current, energy: value }))}
          />
          <ScoreField
            label="Estres"
            value={draft.stress}
            onChange={(value) => setDraft((current) => ({ ...current, stress: value }))}
          />

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Notas</Label>
            <Textarea
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              className="min-h-24 rounded-[1.5rem] border-white/8 bg-[#0b1320] px-4 py-3 text-sm text-white placeholder:text-zinc-600"
            />
          </div>

          <Button
            className="h-14 w-full rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#08111C] hover:bg-[#62e6b0]"
            onClick={() => {
              onSave({ ...draft, dayKey });
              onOpenChange(false);
            }}
          >
            Guardar quick log
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
