import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { BellRing, CalendarDays, ChevronLeft, Download, ScanHeart, Target, Upload } from 'lucide-react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStoreData } from '@/hooks/useStoreData';
import {
  clampRestDuration,
  DEFAULT_REST_DURATION_SECONDS,
  getSuggestedNutritionTargets,
} from '@/lib/recoveryModel';
import {
  formatPreferredTrainingTime,
  formatTrainingDay,
} from '@/lib/display';
import {
  getDisplayWeight,
  getStorageWeight,
} from '@/lib/units';
import {
  getWeightRange,
  hasProfileFieldErrors,
  validateProfileFields,
} from '@/lib/profileValidation';
import { migratePersistedState, useStore, type AppStoreData } from '@/store';
import type {
  AppSettings,
  ConnectedSignals,
  MacroGoal,
  PreferredTrainingTime,
  TrainingDay,
  UserProfile,
} from '@/store/types';

interface ProfileProps {
  onBack: () => void;
}

const DAY_OPTIONS: TrainingDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TIME_OPTIONS: PreferredTrainingTime[] = ['morning', 'afternoon', 'evening'];

function copySettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    connectedSignals: { ...settings.connectedSignals },
    trainingSchedule: {
      ...settings.trainingSchedule,
      days: [...settings.trainingSchedule.days],
    },
    reminders: { ...settings.reminders },
  };
}

function ProfileSnapshotTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="app-metric-tile rounded-[1.8rem] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-black leading-none text-white">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500">{detail}</p>
    </div>
  );
}

export function Profile({ onBack }: ProfileProps) {
  const data = useStoreData();
  const updateProfile = useStore((state) => state.updateProfile);
  const updateSettings = useStore((state) => state.updateSettings);
  const setCalorieGoal = useStore((state) => state.setCalorieGoal);
  const setMacrosGoal = useStore((state) => state.setMacrosGoal);
  const logBodyWeight = useStore((state) => state.logBodyWeight);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileDraft, setProfileDraft] = useState<UserProfile>(data.profile);
  const [settingsDraft, setSettingsDraft] = useState<AppSettings>(copySettings(data.settings));
  const [calorieDraft, setCalorieDraft] = useState(data.calorieGoal);
  const [macroDraft, setMacroDraft] = useState<MacroGoal>(data.macrosGoal);
  const [displayWeightDraft, setDisplayWeightDraft] = useState(
    getDisplayWeight(data.profile.weight, data.settings.unitSystem),
  );
  const [pendingImportData, setPendingImportData] = useState<AppStoreData | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ tone: 'good' | 'danger'; message: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setProfileDraft(data.profile);
    setSettingsDraft(copySettings(data.settings));
    setCalorieDraft(data.calorieGoal);
    setMacroDraft(data.macrosGoal);
    setDisplayWeightDraft(getDisplayWeight(data.profile.weight, data.settings.unitSystem));
  }, [data]);

  useEffect(() => {
    if (!isSaved) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsSaved(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isSaved]);

  const activeSignalsCount = Object.values(settingsDraft.connectedSignals).filter(Boolean).length;
  const scheduleDaysLabel = settingsDraft.trainingSchedule.days.length > 0
    ? settingsDraft.trainingSchedule.days.map((day) => formatTrainingDay(day)).join(' · ')
    : 'Sin días definidos';
  const reminderLabel = settingsDraft.reminders.enabled ? settingsDraft.reminders.time : 'Off';
  const weightLabel = `${displayWeightDraft} ${settingsDraft.unitSystem === 'metric' ? 'kg' : 'lb'}`;
  const profileWeightKg = getStorageWeight(displayWeightDraft, settingsDraft.unitSystem);
  const suggestedTargets = useMemo(
    () => getSuggestedNutritionTargets(
      { ...profileDraft, weight: profileWeightKg },
      settingsDraft.trainingSchedule,
    ),
    [profileDraft, profileWeightKg, settingsDraft.trainingSchedule],
  );
  const profileFieldErrors = useMemo(
    () => validateProfileFields(profileDraft, displayWeightDraft, settingsDraft.unitSystem),
    [displayWeightDraft, profileDraft, settingsDraft.unitSystem],
  );
  const weightRange = useMemo(
    () => getWeightRange(settingsDraft.unitSystem),
    [settingsDraft.unitSystem],
  );
  const hasInvalidProfileFields = hasProfileFieldErrors(profileFieldErrors);

  const handleSave = () => {
    if (hasInvalidProfileFields) {
      return;
    }

    const finalWeightKg = getStorageWeight(displayWeightDraft, settingsDraft.unitSystem);
    updateProfile({ ...profileDraft, name: profileDraft.name.trim(), weight: finalWeightKg });
    updateSettings(settingsDraft);
    if (finalWeightKg !== data.profile.weight) {
      logBodyWeight(finalWeightKg);
    }
    setCalorieGoal(calorieDraft);
    setMacrosGoal(macroDraft);
    setIsSaved(true);
  };

  const handleExportData = () => {
    const state = useStore.getState();
    const exportData = {
      customExercises: state.customExercises,
      sessions: state.sessions,
      templates: state.templates,
      foods: state.foods,
      sleepLogs: state.sleepLogs,
      weightLogs: state.weightLogs,
      recoveryCheckins: state.recoveryCheckins,
      settings: state.settings,
      calorieGoal: state.calorieGoal,
      macrosGoal: state.macrosGoal,
      profile: state.profile,
      draftSession: state.draftSession,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `fittrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const raw = JSON.parse(loadEvent.target?.result as string);
        const imported = migratePersistedState(raw.state ?? raw);
        setPendingImportData(imported);
        setImportFeedback(null);
        setIsImportDialogOpen(true);
      } catch (error) {
        console.error('Import error', error);
        setImportFeedback({
          tone: 'danger',
          message: 'No pudimos leer ese archivo. Asegúrate de que sea un backup válido de HomeFit Recovery.',
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  const toggleSignal = (signal: keyof ConnectedSignals) => {
    setSettingsDraft((current) => ({
      ...current,
      connectedSignals: {
        ...current.connectedSignals,
        [signal]: !current.connectedSignals[signal],
      },
    }));
  };

  const toggleTrainingDay = (day: TrainingDay) => {
    setSettingsDraft((current) => {
      const currentDays = current.trainingSchedule.days;
      const nextDays = currentDays.includes(day)
        ? currentDays.filter((entry) => entry !== day)
        : [...currentDays, day];

      return {
        ...current,
        trainingSchedule: {
          ...current.trainingSchedule,
          days: nextDays,
        },
      };
    });
  };

  return (
    <div className="app-screen relative flex h-full flex-col overflow-hidden text-white">
      <header className="px-6 pt-10 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="flex size-12 items-center justify-center rounded-[1.5rem] border border-white/6 bg-[#101827] text-zinc-300 transition-all hover:border-white/12 hover:text-white"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#6EE7B7]">Perfil local</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Ajustes y objetivos</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-32">
        <section className="app-panel rounded-[2.7rem] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Snapshot</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Tu baseline personal</h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">
                Aquí vive la base que usa el sistema para sugerir horarios, rutina y nivel de recuperación.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-[#6EE7B7]/16 bg-[#6EE7B7]/10 px-4 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6EE7B7]">Señales activas</p>
              <p className="mt-2 text-3xl font-black text-white">{activeSignalsCount}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <ProfileSnapshotTile label="Perfil" value={profileDraft.name.trim() || 'Sin nombre'} detail="Nombre local guardado solo en este dispositivo." />
            <ProfileSnapshotTile label="Peso actual" value={weightLabel} detail="Se usa para tu perfil local y evolución." />
            <ProfileSnapshotTile label="Prote sugerida" value={`${suggestedTargets.macros.protein} g`} detail="Objetivo base para recuperar y sostener progreso." />
            <ProfileSnapshotTile label="Energia sugerida" value={`${suggestedTargets.calories} kcal`} detail="Estimacion inicial segun tu perfil y frecuencia." />
            <ProfileSnapshotTile label="Días activos" value={String(settingsDraft.trainingSchedule.days.length)} detail={scheduleDaysLabel} />
            <ProfileSnapshotTile label="Reminder" value={reminderLabel} detail="Preferencia local para recordarte entrenar." />
          </div>
        </section>

        <section className="app-panel rounded-[2.5rem] p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-[1.35rem] bg-[#6EE7B7]/10 text-[#6EE7B7]">
              <Target className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Perfil</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Tu baseline personal</h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Nombre</Label>
              <Input
                aria-label="Nombre"
                value={profileDraft.name}
                onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))}
                className="h-14 rounded-[1.5rem] border-none bg-[#0b1320] px-4 text-lg font-black text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Edad</Label>
              <Input
                type="number"
                min={10}
                max={100}
                step={1}
                aria-label="Edad"
                aria-invalid={profileFieldErrors.age ? true : undefined}
                value={profileDraft.age}
                onChange={(event) => setProfileDraft((current) => ({ ...current, age: Number(event.target.value) }))}
                className="h-14 rounded-[1.5rem] border-none bg-[#0b1320] px-4 text-lg font-black text-white"
              />
              {profileFieldErrors.age ? (
                <p className="text-xs text-[#F9B06E]">{profileFieldErrors.age}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Género</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['male', 'female', 'other'] as const).map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setProfileDraft((current) => ({ ...current, gender }))}
                    className={`h-14 rounded-[1.35rem] border text-[10px] font-black uppercase tracking-[0.25em] transition-all ${
                      profileDraft.gender === gender
                        ? 'border-transparent bg-[#6EE7B7] text-[#08111C]'
                        : 'border-white/8 bg-[#0b1320] text-zinc-500 hover:text-white'
                    }`}
                  >
                    {gender === 'male' ? 'Hombre' : gender === 'female' ? 'Mujer' : 'Otro'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                  Peso ({settingsDraft.unitSystem === 'metric' ? 'kg' : 'lb'})
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    const nextSystem = settingsDraft.unitSystem === 'metric' ? 'imperial' : 'metric';
                    const rawKg = getStorageWeight(displayWeightDraft, settingsDraft.unitSystem);
                    setSettingsDraft((current) => ({ ...current, unitSystem: nextSystem }));
                    setDisplayWeightDraft(getDisplayWeight(rawKg, nextSystem));
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6EE7B7]"
                >
                  Cambiar
                </button>
              </div>
              <Input
                type="number"
                min={weightRange.min}
                max={weightRange.max}
                step={1}
                aria-invalid={profileFieldErrors.weight ? true : undefined}
                value={displayWeightDraft}
                onChange={(event) => setDisplayWeightDraft(Number(event.target.value))}
                className="h-14 rounded-[1.5rem] border-none bg-[#0b1320] px-4 text-lg font-black text-white"
              />
              {profileFieldErrors.weight ? (
                <p className="text-xs text-[#F9B06E]">{profileFieldErrors.weight}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Altura (cm)</Label>
              <Input
                type="number"
                min={100}
                max={250}
                step={1}
                aria-invalid={profileFieldErrors.height ? true : undefined}
                value={profileDraft.height}
                onChange={(event) => setProfileDraft((current) => ({ ...current, height: Number(event.target.value) }))}
                className="h-14 rounded-[1.5rem] border-none bg-[#0b1320] px-4 text-lg font-black text-white"
              />
              {profileFieldErrors.height ? (
                <p className="text-xs text-[#F9B06E]">{profileFieldErrors.height}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="app-panel rounded-[2.5rem] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Objetivos</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Nutrición y descanso</h2>

          <div className="mt-5 space-y-4">
            <div className="rounded-[1.7rem] border border-[#6EE7B7]/16 bg-[#6EE7B7]/8 px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6EE7B7]">Sugerencia actual</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                {suggestedTargets.calories} kcal · {suggestedTargets.macros.protein} g proteina · {suggestedTargets.macros.carbs} g carbs · {suggestedTargets.macros.fat} g grasa
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Calorías diarias</Label>
              <Input
                type="number"
                value={calorieDraft}
                onChange={(event) => setCalorieDraft(Number(event.target.value))}
                className="h-14 rounded-[1.5rem] border-none bg-[#0b1320] px-4 text-lg font-black text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['protein', 'carbs', 'fat'] as const).map((macro) => (
                <div key={macro} className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    {macro === 'protein' ? 'Prote' : macro === 'carbs' ? 'Carbs' : 'Grasas'}
                  </Label>
                  <Input
                    type="number"
                    value={macroDraft[macro]}
                    onChange={(event) => setMacroDraft((current) => ({ ...current, [macro]: Number(event.target.value) }))}
                    className="h-14 rounded-[1.5rem] border-none bg-[#0b1320] px-4 text-lg font-black text-white"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Descanso por defecto</Label>
              <Input
                type="number"
                min={45}
                max={180}
                value={settingsDraft.defaultRestDuration ?? DEFAULT_REST_DURATION_SECONDS}
                onChange={(event) => setSettingsDraft((current) => ({
                  ...current,
                  defaultRestDuration: clampRestDuration(Number(event.target.value)),
                }))}
                className="h-14 rounded-[1.5rem] border-none bg-[#0b1320] px-4 text-lg font-black text-white"
              />
            </div>
          </div>
        </section>

        <section className="app-panel rounded-[2.5rem] p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-[1.35rem] bg-[#6EE7B7]/10 text-[#6EE7B7]">
              <ScanHeart className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Señales conectadas</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Qué quieres registrar</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {([
              ['sleep', 'Sueño'],
              ['food', 'Comida'],
              ['recovery', 'Quick log'],
            ] as Array<[keyof ConnectedSignals, string]>).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="switch"
                aria-checked={settingsDraft.connectedSignals[key]}
                onClick={() => toggleSignal(key)}
                className={`flex items-center justify-between rounded-[1.7rem] border px-4 py-4 text-left transition-all ${
                  settingsDraft.connectedSignals[key]
                    ? 'border-transparent bg-[#6EE7B7]/12 text-white'
                    : 'border-white/8 bg-[#0b1320] text-zinc-400'
                }`}
              >
                <span className="font-bold">{label}</span>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${
                  settingsDraft.connectedSignals[key] ? 'bg-[#6EE7B7] text-[#08111C]' : 'bg-white/6 text-zinc-500'
                }`}>
                  {settingsDraft.connectedSignals[key] ? 'Activo' : 'Off'}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="app-panel rounded-[2.5rem] p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-[1.35rem] bg-[#6EE7B7]/10 text-[#6EE7B7]">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Días de entrenamiento</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Tu ritmo semanal</h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {DAY_OPTIONS.map((day) => {
              const isActive = settingsDraft.trainingSchedule.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  role="checkbox"
                  aria-checked={isActive}
                  onClick={() => toggleTrainingDay(day)}
                  className={`h-12 rounded-[1.25rem] border text-[10px] font-black uppercase tracking-[0.25em] transition-all ${
                    isActive
                      ? 'border-transparent bg-[#6EE7B7] text-[#08111C]'
                      : 'border-white/8 bg-[#0b1320] text-zinc-500 hover:text-white'
                  }`}
                >
                  {formatTrainingDay(day)}
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {TIME_OPTIONS.map((timeOption) => (
              <button
                key={timeOption}
                type="button"
                onClick={() => setSettingsDraft((current) => ({
                  ...current,
                  trainingSchedule: { ...current.trainingSchedule, preferredTime: timeOption },
                }))}
                className={`h-14 rounded-[1.35rem] border px-3 text-[10px] font-black uppercase tracking-[0.25em] transition-all ${
                  settingsDraft.trainingSchedule.preferredTime === timeOption
                    ? 'border-transparent bg-white text-[#08111C]'
                    : 'border-white/8 bg-[#0b1320] text-zinc-500 hover:text-white'
                }`}
              >
                {formatPreferredTrainingTime(timeOption)}
              </button>
            ))}
          </div>
        </section>

        <section className="app-panel rounded-[2.5rem] p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-[1.35rem] bg-[#6EE7B7]/10 text-[#6EE7B7]">
              <BellRing className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Reminders</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Recordatorios locales</h2>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-[1.7rem] border border-white/8 bg-[#0b1320] px-4 py-4">
            <div>
              <p className="font-bold text-white">Recordatorio de entrenamiento</p>
              <p className="mt-1 text-sm text-zinc-500">Solo se guarda como preferencia local por ahora.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settingsDraft.reminders.enabled}
              onClick={() => setSettingsDraft((current) => ({
                ...current,
                reminders: { ...current.reminders, enabled: !current.reminders.enabled },
              }))}
              className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.25em] ${
                settingsDraft.reminders.enabled ? 'bg-[#6EE7B7] text-[#08111C]' : 'bg-white/8 text-zinc-500'
              }`}
            >
              {settingsDraft.reminders.enabled ? 'Activo' : 'Off'}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Hora</Label>
            <Input
              type="time"
              value={settingsDraft.reminders.time}
              onChange={(event) => setSettingsDraft((current) => ({
                ...current,
                reminders: { ...current.reminders, time: event.target.value },
              }))}
              className="h-14 rounded-[1.5rem] border-none bg-[#0b1320] px-4 text-lg font-black text-white"
            />
          </div>
        </section>

        <section className="app-panel rounded-[2.5rem] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Backup</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Tus datos</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Exporta o importa un backup local con entrenamientos, quick logs, sueño, comida, perfil y preferencias.
          </p>

          {importFeedback ? (
            <div className={`mt-4 rounded-[1.7rem] border px-4 py-3 text-sm font-bold ${
              importFeedback.tone === 'good'
                ? 'border-[#6EE7B7]/18 bg-[#6EE7B7]/10 text-white'
                : 'border-red-500/18 bg-red-500/10 text-red-100'
            }`}>
              {importFeedback.message}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3">
            <Button
              variant="outline"
              className="h-14 rounded-[1.6rem] border-white/10 bg-transparent text-[10px] font-black uppercase tracking-[0.25em] text-white hover:bg-white/6"
              onClick={handleExportData}
            >
              <Download className="mr-2 size-4" />
              Exportar backup
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />

            <Button
              variant="outline"
              className="h-14 rounded-[1.6rem] border-white/10 bg-transparent text-[10px] font-black uppercase tracking-[0.25em] text-white hover:bg-white/6"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 size-4" />
              Importar backup
            </Button>
          </div>
        </section>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-24 mx-auto w-full max-w-md px-4 pb-6">
        <Button
          disabled={hasInvalidProfileFields}
          className="pointer-events-auto h-16 w-full rounded-[2rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#08111C] hover:bg-[#62e6b0]"
          onClick={handleSave}
        >
          <span aria-live="polite">{isSaved ? 'Guardado ✓' : 'Guardar cambios'}</span>
        </Button>
      </div>

      <ConfirmDialog
        open={isImportDialogOpen}
        onOpenChange={(open) => {
          setIsImportDialogOpen(open);
          if (!open) {
            setPendingImportData(null);
          }
        }}
        title="Importar backup local"
        description="Esto reemplazará los datos actuales del dispositivo por el contenido del backup seleccionado."
        confirmLabel="Importar backup"
        tone="danger"
        onConfirm={() => {
          if (!pendingImportData) {
            return;
          }

          useStore.getState().hydrateAppStoreData(pendingImportData);
          setPendingImportData(null);
          setIsImportDialogOpen(false);
          setImportFeedback({
            tone: 'good',
            message: 'Backup importado correctamente. La app ya está usando los datos nuevos sin recargar.',
          });
        }}
      />
    </div>
  );
}
